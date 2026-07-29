import { randomBytes, createHash } from "node:crypto";

const KEY_PREFIX = "dm_";
const PREFIX_DISPLAY_LENGTH = 10;

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function apiKeyDisplayPrefix(key: string): string {
  return key.slice(0, PREFIX_DISPLAY_LENGTH);
}

export function maskApiKey(prefix: string): string {
  return `${prefix}${"•".repeat(24)}`;
}
