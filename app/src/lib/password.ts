import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return { hash: derived.toString("hex"), salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(derived, stored);
}
