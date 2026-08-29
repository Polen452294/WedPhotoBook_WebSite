export class RequestSecurityError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly headers?: HeadersInit,
  ) {
    super(message);
  }
}

export function assertSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null" || origin !== effectiveRequestOrigin(request)) {
    throw new RequestSecurityError(403, "Запрос отклонён.");
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new RequestSecurityError(403, "Запрос отклонён.");
  }
}

function effectiveRequestOrigin(request: Request): string {
  const directOrigin = new URL(request.url).origin;
  if (process.env.TRUST_PROXY_ORIGIN !== "1") return directOrigin;

  const protocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();
  const host = (
    request.headers.get("x-forwarded-host")?.split(",", 1)[0]
    || request.headers.get("host")
    || ""
  ).trim();
  if ((protocol !== "http" && protocol !== "https") || !host || /[\s/\\]/.test(host)) return directOrigin;
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return directOrigin;
  }
}

export async function readJsonObject(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new RequestSecurityError(415, "Ожидаются данные в формате JSON.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestSecurityError(413, "Слишком большой запрос.");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new RequestSecurityError(400, "Некорректные данные.");
  const decoder = new TextDecoder();
  let total = 0;
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestSecurityError(413, "Слишком большой запрос.");
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid shape");
    return parsed as Record<string, unknown>;
  } catch {
    throw new RequestSecurityError(400, "Некорректные данные.");
  }
}

export function requestSecurityResponse(error: RequestSecurityError): Response {
  return Response.json({ error: error.message }, { status: error.status, headers: error.headers });
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

export function requestClientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",", 1)[0]
    || request.headers.get("x-real-ip")
    || "unknown"
  ).trim().slice(0, 100);
}
