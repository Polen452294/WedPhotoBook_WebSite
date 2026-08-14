const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_MIN_AGE_MS = 1000;
const FORM_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 6;
const recentRequests = new Map<string, number[]>();

function clean(value: unknown, max = 2000): string {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

function clientKey(request: Request): string {
  return clean(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown",
    100,
  );
}

function isRateLimited(request: Request, now: number): boolean {
  const key = clientKey(request);
  const active = (recentRequests.get(key) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (active.length >= RATE_LIMIT_MAX) {
    recentRequests.set(key, active);
    return true;
  }
  active.push(now);
  recentRequests.set(key, active);
  return false;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  if (clean(body.address)) return Response.json({ ok: true });
  const now = Date.now();
  if (isRateLimited(request, now)) return Response.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
  const formStartedAt = Number(body.formStartedAt);
  const formAge = now - formStartedAt;
  if (!Number.isFinite(formStartedAt) || formAge < FORM_MIN_AGE_MS || formAge > FORM_MAX_AGE_MS) {
    return Response.json({ error: "Не удалось подтвердить отправку формы." }, { status: 429 });
  }
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 80);
  const phoneDigits = phone.replace(/\D/g, "");
  if (!name || phoneDigits.length < 11 || !body.consent) return Response.json({ error: "Заполните обязательные поля" }, { status: 422 });

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_TO_EMAIL || "79854342367@yandex.ru";
  const sender = process.env.CONTACT_FROM_EMAIL || "Wedfotobook <onboarding@resend.dev>";
  if (!apiKey || !EMAIL_PATTERN.test(recipient)) return Response.json({ error: "Отправка пока не настроена" }, { status: 503 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: `Новая заявка на фотокнигу — ${name}`,
      text: `Имя: ${name}\nТелефон: ${phone}`,
    }),
  });
  if (!response.ok) return Response.json({ error: "Ошибка почтового сервиса" }, { status: 502 });
  return Response.json({ ok: true });
}
