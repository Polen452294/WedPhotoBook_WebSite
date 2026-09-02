const EMAIL_ATTEMPTS = 2;
const EMAIL_RETRY_DELAY_MS = 250;

export type ContactEmailInput = {
  apiKey?: string;
  localMailerUrl?: string;
  localMailerToken?: string;
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  text: string;
};

type Fetcher = typeof fetch;
type Sleeper = (milliseconds: number) => Promise<void>;

export function isLoopbackMailerUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:"
      && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      && url.pathname === "/send"
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function compactError(value: unknown): string {
  return String(value ?? "Unknown email error").replace(/[<>]/g, "").trim().slice(0, 500);
}

export async function sendContactEmail(
  input: ContactEmailInput,
  fetcher: Fetcher = fetch,
  sleep: Sleeper = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastError = "Unknown email error";
  const useLocalMailer = isLoopbackMailerUrl(input.localMailerUrl) && (input.localMailerToken?.length ?? 0) >= 32;
  if (!useLocalMailer && !input.apiKey) return { ok: false, error: "Email transport is not configured" };

  const url = useLocalMailer ? input.localMailerUrl! : "https://api.resend.com/emails";
  const transport = useLocalMailer ? "Local mailer" : "Resend";
  const payload = JSON.stringify(useLocalMailer ? {
    id: input.id,
    from: input.sender,
    to: input.recipient,
    subject: input.subject,
    text: input.text,
  } : {
    from: input.sender,
    to: [input.recipient],
    subject: input.subject,
    text: input.text,
  });

  for (let attempt = 0; attempt < EMAIL_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${useLocalMailer ? input.localMailerToken : input.apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `contact-notification/${input.id}`,
        },
        body: payload,
      });
      if (response.ok) return { ok: true };

      lastError = `${transport} ${response.status}: ${compactError(await response.text())}`;
      const retryable = response.status === 409 || response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
      if (!retryable) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown email error";
    }

    if (attempt + 1 < EMAIL_ATTEMPTS) await sleep(EMAIL_RETRY_DELAY_MS);
  }

  return { ok: false, error: compactError(lastError) };
}
