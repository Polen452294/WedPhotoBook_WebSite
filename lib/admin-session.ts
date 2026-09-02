import { headers } from "next/headers";

export const ADMIN_SESSION_COOKIE = "__Host-wfb_admin";

const SESSION_VERSION = 1;
const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const MIN_SECRET_BYTES = 32;
const PASSWORD_HASH_PREFIX = "pbkdf2-sha256";

type PasswordHash = {
  iterations: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

type SessionPayload = {
  v: number;
  iat: number;
  exp: number;
  nonce: string;
};

export type AdminUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  authMethod: "password";
};

export function adminPasswordIsConfigured(): boolean {
  return Boolean(parsePasswordHash(process.env.ADMIN_PASSWORD_HASH) && validSessionSecret());
}

export function passwordAdminUser(): AdminUser {
  const email = process.env.ADMIN_ACCOUNT_EMAIL?.trim().toLowerCase() || "admin@localhost";
  const displayName = process.env.ADMIN_DISPLAY_NAME?.trim() || "Администратор";
  return {
    userId: "single-password-admin",
    displayName,
    email,
    fullName: displayName,
    authMethod: "password",
  };
}

export async function getPasswordAdminUser(): Promise<AdminUser | null> {
  if (!adminPasswordIsConfigured()) return null;
  const requestHeaders = await headers();
  const token = readCookie(requestHeaders.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token || !(await verifySessionToken(token))) return null;
  return passwordAdminUser();
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const parsed = parsePasswordHash(process.env.ADMIN_PASSWORD_HASH);
  if (!parsed || !validSessionSecret()) return false;

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = new Uint8Array(await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: new Uint8Array(parsed.salt).buffer,
    iterations: parsed.iterations,
  }, passwordKey, parsed.hash.byteLength * 8));
  return constantTimeEqual(derived, parsed.hash);
}

export async function createAdminSessionToken(now = new Date()): Promise<string> {
  const secret = requiredSessionSecret();
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    iat: issuedAt,
    exp: issuedAt + SESSION_DURATION_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function adminSessionCookie(token: string): string {
  return [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Priority=High",
  ].join("; ");
}

export function clearedAdminSessionCookie(): string {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Priority=High",
  ].join("; ");
}

export function safeAdminReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/admin") || value.startsWith("//")) return "/admin/";
  try {
    const url = new URL(value, "https://admin.local");
    if (url.origin !== "https://admin.local" || url.pathname === "/admin/login" || url.pathname.startsWith("/admin/login/")) {
      return "/admin/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin/";
  }
}

async function verifySessionToken(token: string, now = new Date()): Promise<boolean> {
  const secret = validSessionSecret();
  if (!secret || token.length > 2048) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  let suppliedSignature: Uint8Array;
  let payload: SessionPayload;
  try {
    suppliedSignature = base64UrlDecode(parts[1]);
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0]))) as SessionPayload;
  } catch {
    return false;
  }

  const expectedSignature = await sign(parts[0], secret);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return false;

  const currentTime = Math.floor(now.getTime() / 1000);
  return payload.v === SESSION_VERSION
    && Number.isInteger(payload.iat)
    && Number.isInteger(payload.exp)
    && payload.iat <= currentTime + 60
    && payload.exp > currentTime
    && payload.exp - payload.iat === SESSION_DURATION_SECONDS
    && typeof payload.nonce === "string"
    && /^[0-9a-f-]{36}$/i.test(payload.nonce);
}

async function sign(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function parsePasswordHash(value: string | undefined): PasswordHash | null {
  const parts = value?.trim().split("$") ?? [];
  if (parts.length !== 4 || parts[0] !== PASSWORD_HASH_PREFIX) return null;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) return null;
  try {
    const salt = base64UrlDecode(parts[2]);
    const hash = base64UrlDecode(parts[3]);
    if (salt.byteLength < 16 || hash.byteLength !== 32) return null;
    return { iterations, salt, hash };
  } catch {
    return null;
  }
}

function validSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return new TextEncoder().encode(secret).byteLength >= MIN_SECRET_BYTES ? secret : null;
}

function requiredSessionSecret(): string {
  const secret = validSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured securely");
  return secret;
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim() || null;
  }
  return null;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("Invalid base64url");
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
