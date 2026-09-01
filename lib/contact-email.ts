const EMAIL_ATTEMPTS = 2;
const EMAIL_RETRY_DELAY_MS = 250;

export type ContactEmailInput = {
  apiKey: string;
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  text: string;
};

type Fetcher = typeof fetch;
type Sleeper = (milliseconds: number) => Promise<void>;

function compactError(value: unknown): string {
  return String(value ?? "Unknown email error").replace(/[<>]/g, "").trim().slice(0, 500);
}

export async function sendContactEmail(
  input: ContactEmailInput,
  fetcher: Fetcher = fetch,
  sleep: Sleeper = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastError = "Unknown email error";
  const payload = JSON.stringify({
    from: input.sender,
    to: [input.recipient],
    subject: input.subject,
    text: input.text,
  });

  for (let attempt = 0; attempt < EMAIL_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `contact-notification/${input.id}`,
        },
        body: payload,
      });
      if (response.ok) return { ok: true };

      lastError = `Resend ${response.status}: ${compactError(await response.text())}`;
      const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
      if (!retryable) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown email error";
    }

    if (attempt + 1 < EMAIL_ATTEMPTS) await sleep(EMAIL_RETRY_DELAY_MS);
  }

  return { ok: false, error: compactError(lastError) };
}
