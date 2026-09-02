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
const localMailerUrl = values.get("CONTACT_MAILER_URL")?.trim() || "";
const localMailerToken = values.get("CONTACT_MAILER_TOKEN")?.trim() || "";
const recipient = values.get("CONTACT_TO_EMAIL")?.trim() || "";
const sender = values.get("CONTACT_FROM_EMAIL")?.trim() || "";
const senderMailbox = extractMailbox(sender).toLowerCase();
const errors = [];

function isLoopbackMailerUrl(value) {
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

const localMailerRequested = Boolean(localMailerUrl || localMailerToken);
const localMailerConfigured = isLoopbackMailerUrl(localMailerUrl) && localMailerToken.length >= 32;

if (localMailerRequested && !isLoopbackMailerUrl(localMailerUrl)) {
  errors.push("CONTACT_MAILER_URL must be an HTTP loopback /send endpoint");
}
if (localMailerRequested && localMailerToken.length < 32) {
  errors.push("CONTACT_MAILER_TOKEN must contain at least 32 characters");
}
if (!localMailerConfigured) errors.push("the local VPS mailer must be configured");
if (!EMAIL_PATTERN.test(recipient)) errors.push("CONTACT_TO_EMAIL must contain a valid recipient address");
if (!EMAIL_PATTERN.test(senderMailbox) || senderMailbox.endsWith("@your-verified-domain.ru")) {
  errors.push("CONTACT_FROM_EMAIL must contain a valid sender address");
}

if (errors.length) {
  console.error("Contact email notifications are not configured:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Contact email notification configuration is present (local VPS mailer).");
