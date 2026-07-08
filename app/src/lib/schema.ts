import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, unique, uniqueIndex, check } from "drizzle-orm/pg-core";

// `mode: "string"` so createdAt is a string in both server reads and over the
// fetch().json() boundary — a Drizzle `Date` would be an ISO string at runtime
// once JSON-serialized, making the inferred `Date` type unsound in client code.
const createdAt = timestamp("created_at", { mode: "string" }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: ["admin", "client"] }).notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    createdAt,
  },
  (t) => [
    // Case-insensitive uniqueness enforced at the DB, so a future write path that
    // forgets to lowercase can't create a case-variant duplicate identity that
    // getUserByEmail (which always lowercases) could never find.
    uniqueIndex("users_email_lower_unique").on(sql`lower(${t.email})`),
    // The `enum` option above is TypeScript-only; this keeps invalid roles out at
    // the DB layer too, so `role !== "admin"` checks can't be fooled by junk data.
    check("users_role_check", sql`${t.role} in ('admin', 'client')`),
  ]
);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt,
});

export const workspaceClients = pgTable(
  "workspace_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [unique().on(t.workspaceId, t.userId)]
);

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceClient = typeof workspaceClients.$inferSelect;
