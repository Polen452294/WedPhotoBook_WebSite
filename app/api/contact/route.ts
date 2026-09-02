import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { enquiries, submissionAttempts } from "@/db/schema";
import { isLoopbackMailerUrl, sendContactEmail } from "@/lib/contact-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_MIN_AGE_MS = 1000;
const FORM_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_REQUEST_BYTES = 32 * 1024;

type SubmissionKind = "callback" | "message";

class RequestBodyError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function clean(value: unknown, max = 2000): string {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new RequestBodyError(415, "Ожидаются данные в формате JSON.");

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RequestBodyError(413, "Слишком большой запрос.");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400, "Некорректные данные");
  const decoder = new TextDecoder();
  let total = 0;
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestBodyError(413, "Слишком большой запрос.");
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid shape");
    return parsed as Record<string, unknown>;
  } catch {
    throw new RequestBodyError(400, "Некорректные данные");
  }
}

function hasConsent(value: unknown): boolean {
  return value === true || value === "on" || value === "1";
}

function normalizePhone(value: unknown): string | null {
  let digits = clean(value, 80).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11 || !digits.startsWith("7")) return null;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function extractMailbox(value: string): string {
  return value.match(/<([^<>]+)>/)?.[1]?.trim() || value.trim();
}

function getClientAddress(request: Request): string {
  return clean(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown",
    100,
  );
}

async function hashClientAddress(address: string): Promise<string> {
  const salt = process.env.RATE_LIMIT_SALT || "wedfotobook-rate-limit-v1";
  const bytes = new TextEncoder().encode(`${salt}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function isRateLimited(request: Request, now: Date): Promise<boolean> {
  const db = await getDb();
  const clientHash = await hashClientAddress(getClientAddress(request));
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const retentionStart = new Date(now.getTime() - RATE_LIMIT_RETENTION_MS);

  await db.delete(submissionAttempts).where(lt(submissionAttempts.createdAt, retentionStart)).run();
  const [result] = await db
    .select({ total: count() })
    .from(submissionAttempts)
    .where(and(eq(submissionAttempts.clientHash, clientHash), gt(submissionAttempts.createdAt, windowStart)));

  if ((result?.total ?? 0) >= RATE_LIMIT_MAX) return true;
  await db.insert(submissionAttempts).values({ clientHash, createdAt: now }).run();
  return false;
}

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const form = new FormData();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp !== "unknown") form.set("remoteip", remoteIp);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

async function updateNotification(
  id: string,
  status: "sent" | "failed" | "not_configured",
  error: string | null = null,
) {
  try {
    const db = await getDb();
    await db
      .update(enquiries)
      .set({ notificationStatus: status, notificationError: error })
      .where(eq(enquiries.id, id))
      .run();
  } catch (updateError) {
    // The enquiry itself is already durable; a status update must not make the client retry it.
    console.error("Contact notification status update error", updateError);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  // Honeypot submissions are silently accepted so bots cannot tune around it.
  if (clean(body.address)) return Response.json({ ok: true });

  const now = new Date();
  const formStartedAt = Number(body.formStartedAt);
  const formAge = now.getTime() - formStartedAt;
  if (!Number.isFinite(formStartedAt) || formAge < FORM_MIN_AGE_MS || formAge > FORM_MAX_AGE_MS) {
    return Response.json({ error: "Не удалось подтвердить отправку формы." }, { status: 429 });
  }
  if (!hasConsent(body.consent)) {
    return Response.json({ error: "Подтвердите согласие на обработку персональных данных." }, { status: 422 });
  }

  const kind: SubmissionKind = body.kind === "message" ? "message" : "callback";
  const name = clean(body.name, 120);
  const phone = normalizePhone(body.phone);
  const email = clean(body.email, 254).toLowerCase();
  const message = clean(body.message, 5000);
  const sourcePathRaw = clean(body.sourcePath, 300);
  const sourcePath = sourcePathRaw.startsWith("/") ? sourcePathRaw : "/";

  if (!name) return Response.json({ error: "Укажите ваше имя." }, { status: 422 });
  if (kind === "callback" && !phone) {
    return Response.json({ error: "Укажите корректный российский номер телефона." }, { status: 422 });
  }
  if (kind === "message" && (!EMAIL_PATTERN.test(email) || message.length < 3)) {
    return Response.json({ error: "Укажите корректную почту и текст сообщения." }, { status: 422 });
  }

  const remoteIp = getClientAddress(request);
  if (!(await verifyTurnstile(clean(body.turnstileToken, 2048), remoteIp))) {
    return Response.json({ error: "Не удалось пройти антиспам-проверку. Обновите страницу и попробуйте снова." }, { status: 422 });
  }

  try {
    if (await isRateLimited(request, now)) {
      return Response.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
    }
  } catch (error) {
    console.error("Contact rate-limit storage error", error);
    return Response.json({ error: "Сервис заявок временно недоступен. Позвоните нам по телефону 8 (985) 434-23-67." }, { status: 503 });
  }

  const id = crypto.randomUUID();
  try {
    await (await getDb())
      .insert(enquiries)
      .values({
        id,
        kind,
        name,
        phone: kind === "callback" ? phone : null,
        email: kind === "message" ? email : null,
        message: message || null,
        sourcePath,
        createdAt: now,
      })
      .run();
  } catch (error) {
    console.error("Contact submission storage error", error);
    return Response.json({ error: "Не удалось сохранить заявку. Позвоните нам по телефону 8 (985) 434-23-67." }, { status: 503 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const localMailerUrl = process.env.CONTACT_MAILER_URL?.trim();
  const localMailerToken = process.env.CONTACT_MAILER_TOKEN?.trim();
  const localMailerConfigured = isLoopbackMailerUrl(localMailerUrl) && (localMailerToken?.length ?? 0) >= 32;
  const recipient = process.env.CONTACT_TO_EMAIL?.trim() || "79854342367@yandex.ru";
  const sender = process.env.CONTACT_FROM_EMAIL?.trim() || "";
  const senderMailbox = extractMailbox(sender).toLowerCase();
  if (
    (!localMailerConfigured && !apiKey) ||
    !EMAIL_PATTERN.test(recipient) ||
    !EMAIL_PATTERN.test(senderMailbox) ||
    senderMailbox.endsWith("@your-verified-domain.ru")
  ) {
    await updateNotification(id, "not_configured", "Email notification is not configured");
    return Response.json({ ok: true, saved: true, notified: false, id }, { status: 202 });
  }

  const details = kind === "callback"
    ? `Имя: ${name}\nТелефон: ${phone}${message ? `\nДополнительная информация:\n${message}` : ""}`
    : `Имя: ${name}\nПочта: ${email}\nСообщение:\n${message}`;

  const notification = await sendContactEmail({
    apiKey,
    localMailerUrl: localMailerConfigured ? localMailerUrl : undefined,
    localMailerToken: localMailerConfigured ? localMailerToken : undefined,
    id,
    sender,
    recipient,
    subject: `${kind === "callback" ? "Новая заявка на звонок" : "Новое сообщение"} — ${name}`,
    text: `${details}\nСтраница: ${sourcePath}\nНомер заявки: ${id}`,
  });
  if (!notification.ok) {
    await updateNotification(id, "failed", notification.error);
    return Response.json({ ok: true, saved: true, notified: false, id }, { status: 202 });
  }
  await updateNotification(id, "sent");
  return Response.json({ ok: true, saved: true, notified: true, id });
}
