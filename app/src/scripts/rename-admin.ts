/**
 * One-off: rename an existing admin account's email.
 * Idempotent — safe to re-run.
 *
 * Renames FROM_EMAIL -> ADMIN_EMAIL (from .env). Defaults the old address to
 * admin@example.com if FROM_EMAIL isn't set.
 *
 * Run from app/:  npx tsx src/scripts/rename-admin.ts
 */
import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/schema";

async function main() {
  const fromEmail = process.env.FROM_EMAIL || "admin@example.com";
  const toEmail = process.env.ADMIN_EMAIL;

  if (!toEmail) {
    console.log("Set ADMIN_EMAIL in .env (the new address) before running this script.");
    return;
  }
  if (fromEmail === toEmail) {
    console.log(`FROM_EMAIL and ADMIN_EMAIL are both ${toEmail}; nothing to do.`);
    return;
  }

  const existingNew = await db.select().from(users).where(eq(users.email, toEmail)).limit(1);
  if (existingNew.length > 0) {
    console.log(`An account with ${toEmail} already exists (role: ${existingNew[0].role}); leaving it untouched.`);
    return;
  }

  const old = await db.select().from(users).where(eq(users.email, fromEmail)).limit(1);
  if (old.length === 0) {
    console.log(`No account found with ${fromEmail}; nothing to rename.`);
    return;
  }

  await db.update(users).set({ email: toEmail }).where(eq(users.id, old[0].id));
  console.log(`Renamed admin account: ${fromEmail} -> ${toEmail}`);
}

main();
