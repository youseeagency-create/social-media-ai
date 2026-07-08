import type { SessionPayload } from "./types";

export type { SessionPayload };

export const SESSION_COOKIE_NAME = "session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  payload: Pick<SessionPayload, "userId" | "role">,
  ttlMs: number = SESSION_TTL_MS
): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + ttlMs };
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(full)));
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
