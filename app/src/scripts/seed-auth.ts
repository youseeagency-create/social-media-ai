/**
 * Bootstraps the auth/workspace data files. Safe to re-run: only ever adds
 * an admin account if one with the same email doesn't already exist, and
 * never touches configs.csv / creators.csv / videos.csv.
 * Run with: npx tsx src/scripts/seed-auth.ts
 */
import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { v4 as uuid } from "uuid";
import { hashPassword } from "../lib/password";
import {
  readUsers,
  writeUsers,
  readWorkspaces,
  writeWorkspaces,
  readWorkspaceClients,
  writeWorkspaceClients,
} from "../lib/csv";

async function main() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.log("Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env before running this script.");
    return;
  }

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
    console.log(`User ${ADMIN_EMAIL} already exists, skipping.`);
  } else {
    const { hash, salt } = await hashPassword(ADMIN_PASSWORD);
    users.push({
      id: uuid(),
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    });
    writeUsers(users);
    console.log(`Created admin account: ${ADMIN_EMAIL}`);
  }

  // Ensure workspaces.csv / workspace_clients.csv exist (created header-only if missing).
  writeWorkspaces(readWorkspaces());
  writeWorkspaceClients(readWorkspaceClients());

  console.log("Auth seed complete!");
}

main();
