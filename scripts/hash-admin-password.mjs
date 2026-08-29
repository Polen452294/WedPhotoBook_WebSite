import { pbkdf2Sync, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

const passwordFile = process.argv[2];
if (!passwordFile) {
  process.stderr.write("Usage: node scripts/hash-admin-password.mjs /secure/path/password.txt\n");
  process.exitCode = 1;
} else {
  const password = (await readFile(passwordFile, "utf8")).replace(/[\r\n]+$/u, "");
  if (password.length < 12) {
    process.stderr.write("Password must contain at least 12 characters.\n");
    process.exitCode = 1;
  } else if (password.length > 1024) {
    process.stderr.write("Password is too long.\n");
    process.exitCode = 1;
  } else {
    const iterations = 210_000;
    const salt = randomBytes(16);
    const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
    const base64url = (value) => value.toString("base64url");
    process.stdout.write(`pbkdf2-sha256$${iterations}$${base64url(salt)}$${base64url(hash)}\n`);
  }
}
