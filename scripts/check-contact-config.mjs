import { readFile } from "node:fs/promises";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const filePath = process.argv[2] || ".env.local";

function parseEnv(source) {
  const values = new Map();
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function extractMailbox(value) {
  return value.match(/<([^<>]+)>/)?.[1]?.trim() || value.trim();
}

let source;
try {
  source = await readFile(filePath, "utf8");
} catch {
  console.error(`Contact configuration file is missing: ${filePath}`);
  process.exit(1);
}

const values = parseEnv(source);
const apiKey = values.get("RESEND_API_KEY")?.trim() || "";
const recipient = values.get("CONTACT_TO_EMAIL")?.trim() || "";
const sender = values.get("CONTACT_FROM_EMAIL")?.trim() || "";
const turnstileSiteKey = values.get("NEXT_PUBLIC_TURNSTILE_SITE_KEY")?.trim() || "";
const turnstileSecret = values.get("TURNSTILE_SECRET_KEY")?.trim() || "";
const senderMailbox = extractMailbox(sender).toLowerCase();
const errors = [];

if (!apiKey) errors.push("RESEND_API_KEY is missing");
if (!EMAIL_PATTERN.test(recipient)) errors.push("CONTACT_TO_EMAIL must contain a valid recipient address");
if (!EMAIL_PATTERN.test(senderMailbox) || senderMailbox.endsWith("@your-verified-domain.ru")) {
  errors.push("CONTACT_FROM_EMAIL must use a sender address from a verified Resend domain");
}
if (!turnstileSiteKey) errors.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing");
if (!turnstileSecret) errors.push("TURNSTILE_SECRET_KEY is missing");

if (errors.length) {
  console.error("Contact email notifications are not configured:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Contact email notification configuration is present.");
