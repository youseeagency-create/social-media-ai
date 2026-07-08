import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, bigint, timestamp, date, unique, uniqueIndex, check } from "drizzle-orm/pg-core";

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
  // When set, the workspace is archived (deactivated): hidden from the admin's
  // active list and from clients entirely, but its data is preserved.
  archivedAt: timestamp("archived_at", { mode: "string" }),
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

export const inspirationItems = pgTable(
  "inspiration_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    platform: text("platform", { enum: ["instagram", "tiktok", "youtube", "other"] }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    // pending = queued for scraping, ready = has a usable thumbnail (or none needed),
    // failed = scrape attempted and gave up, none = platform has no thumbnail concept.
    thumbnailStatus: text("thumbnail_status", { enum: ["pending", "ready", "failed", "none"] })
      .notNull()
      .default("none"),
    // Size of the stored thumbnail blob, for the admin storage dashboard.
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [
    check("inspiration_platform_check", sql`${t.platform} in ('instagram', 'tiktok', 'youtube', 'other')`),
    check(
      "inspiration_thumbnail_status_check",
      sql`${t.thumbnailStatus} in ('pending', 'ready', 'failed', 'none')`
    ),
  ]
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["text", "voice"] }).notNull(),
    title: text("title"),
    body: text("body"),
    audioUrl: text("audio_url"),
    audioDurationSeconds: integer("audio_duration_seconds"),
    // Size of the stored voice-note audio blob, for the admin storage dashboard.
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [check("notes_kind_check", sql`${t.kind} in ('text', 'voice')`)]
);

export const footage = pgTable(
  "footage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    kind: text("kind", { enum: ["video", "image", "audio"] }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [check("footage_kind_check", sql`${t.kind} in ('video', 'image', 'audio')`)]
);

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    videoUrl: text("video_url").notNull(),
    videoName: text("video_name").notNull(),
    status: text("status", { enum: ["processing", "completed", "failed"] }).notNull(),
    analysisPrompt: text("analysis_prompt").notNull(),
    brandContext: text("brand_context"),
    analysisText: text("analysis_text"),
    ideasText: text("ideas_text"),
    error: text("error"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [check("analyses_status_check", sql`${t.status} in ('processing', 'completed', 'failed')`)]
);

export const calendarItems = pgTable(
  "calendar_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    status: text("status", { enum: ["planned", "filming", "posted"] }).notNull().default("planned"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [check("calendar_status_check", sql`${t.status} in ('planned', 'filming', 'posted')`)]
);

// Per-workspace chat: one shared thread per workspace, visible to the admin and
// every client assigned to that workspace.
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt,
});

// Admin-only private notes about a client/workspace. Never exposed to clients.
export const adminNotes = pgTable("admin_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt,
});

// Per-user, per-workspace, per-section "last seen" marker driving the unseen
// activity badges. section ∈ inspiration | notes | footage | calendar | chat.
export const notificationReads = pgTable(
  "notification_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.workspaceId, t.section)]
);

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceClient = typeof workspaceClients.$inferSelect;
export type InspirationItem = typeof inspirationItems.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Footage = typeof footage.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type CalendarItem = typeof calendarItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AdminNote = typeof adminNotes.$inferSelect;
export type NotificationRead = typeof notificationReads.$inferSelect;
