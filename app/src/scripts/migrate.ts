/**
 * Applies pending Drizzle migrations (app/drizzle/) to the database.
 * Run with: npx tsx src/scripts/migrate.ts
 */
import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });
  await migrate(db, { migrationsFolder: path.join(__dirname, "..", "..", "drizzle") });
  console.log("Migrations applied");
}

main();
