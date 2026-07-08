/**
 * Bootstraps the admin account in Postgres. Safe to re-run: only ever adds
 * an admin account if one with the same email doesn't already exist.
 * Run with: npx tsx src/scripts/seed-auth.ts
 */
import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { hashPassword } from "../lib/password";
import { getUserByEmail, createUser } from "../lib/db";

async function main() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.log("Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env before running this script.");
    return;
  }

  const existing = await getUserByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log(`User ${ADMIN_EMAIL} already exists, skipping.`);
  } else {
    const { hash, salt } = await hashPassword(ADMIN_PASSWORD);
    await createUser({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      passwordHash: hash,
      passwordSalt: salt,
    });
    console.log(`Created admin account: ${ADMIN_EMAIL}`);
  }

  console.log("Auth seed complete!");
}

main();
