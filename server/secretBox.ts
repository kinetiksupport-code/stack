import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

const key = createHash("sha256").update(ENV.cookieSecret || "stack-development-secret").digest();

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function secretHint(value: string) {
  return value.length > 4 ? `•••• ${value.slice(-4)}` : "••••";
}
