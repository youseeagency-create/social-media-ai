import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { eq, and, or, desc, sql, ilike, inArray, isNull, ne, gt, type AnyColumn } from "drizzle-orm";
import {
  users,
  workspaces,
  workspaceClients,
  inspirationItems,
  notes,
  footage,
  analyses,
  calendarItems,
  messages,
  adminNotes,
  notificationReads,
} from "./schema";
import type {
  User,
  Workspace,
  WorkspaceClient,
  UserRole,
  InspirationItem,
  Note,
  Footage,
  Analysis,
  CalendarItem,
  Message,
  ChatMessage,
  AdminNote,
} from "./types";

// Lazily constructed so DATABASE_URL only needs to be set by the time a query
// actually runs, not at module-import time (import statements are hoisted
// above other top-level code, so scripts that call dotenv's config() after
// their imports would otherwise see an empty process.env here).
let cached: NeonHttpDatabase | undefined;

function getDb(): NeonHttpDatabase {
  if (!cached) {
    const sql = neon(process.env.DATABASE_URL!);
    cached = drizzle({ client: sql });
  }
  return cached;
}

export const db = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Untrusted ids (route params, query strings, request bodies) reach the uuid
// columns directly; Postgres throws "invalid input syntax for type uuid" on a
// malformed value, so we treat anything that isn't a well-formed UUID as
// "not found" rather than letting it surface as a 500.
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// True for the Postgres unique_violation SQLSTATE (23505). Drizzle wraps the
// Neon driver's error, so the `code` lives on the underlying cause rather than
// the top-level error — walk the cause chain. Lets a lost check-then-insert
// race return a clean 409 instead of a 500.
export function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  while (current !== null && typeof current === "object") {
    if ((current as { code?: string }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listUsers(role?: UserRole): Promise<User[]> {
  if (role) return db.select().from(users).where(eq(users.role, role));
  return db.select().from(users);
}

export async function createUser(data: {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
}): Promise<User> {
  const rows = await db
    .insert(users)
    .values({ ...data, email: data.email.toLowerCase() })
    .returning();
  return rows[0];
}

// Workspaces
export async function getWorkspaces(): Promise<Workspace[]> {
  return db.select().from(workspaces);
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const rows = await db.insert(workspaces).values({ name }).returning();
  return rows[0];
}

export async function updateWorkspace(id: string, data: { name: string }): Promise<Workspace | null> {
  if (!isUuid(id)) return null;
  const rows = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteWorkspace(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(workspaces).where(eq(workspaces.id, id));
}

// Archive = soft-deactivate: preserves all data but hides the workspace from the
// admin's active list and blocks clients entirely (see the workspace layout).
export async function setWorkspaceArchived(id: string, archived: boolean): Promise<Workspace | null> {
  if (!isUuid(id)) return null;
  const rows = await db
    .update(workspaces)
    .set({ archivedAt: archived ? sql`now()` : null })
    .where(eq(workspaces.id, id))
    .returning();
  return rows[0] ?? null;
}

// Workspace-Client assignments
export async function listWorkspaceClients(): Promise<WorkspaceClient[]> {
  return db.select().from(workspaceClients);
}

export async function getWorkspaceClientByPair(workspaceId: string, userId: string): Promise<WorkspaceClient | null> {
  if (!isUuid(workspaceId) || !isUuid(userId)) return null;
  const rows = await db
    .select()
    .from(workspaceClients)
    .where(and(eq(workspaceClients.workspaceId, workspaceId), eq(workspaceClients.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWorkspaceClient(workspaceId: string, userId: string): Promise<WorkspaceClient> {
  const rows = await db.insert(workspaceClients).values({ workspaceId, userId }).returning();
  return rows[0];
}

export async function deleteWorkspaceClientById(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(workspaceClients).where(eq(workspaceClients.id, id));
}

export async function deleteWorkspaceClientByPair(workspaceId: string, userId: string): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(userId)) return;
  await db
    .delete(workspaceClients)
    .where(and(eq(workspaceClients.workspaceId, workspaceId), eq(workspaceClients.userId, userId)));
}

export async function listWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      archivedAt: workspaces.archivedAt,
      createdAt: workspaces.createdAt,
    })
    .from(workspaceClients)
    .innerJoin(workspaces, eq(workspaceClients.workspaceId, workspaces.id))
    // Archived workspaces are deactivated for clients — never listed.
    .where(and(eq(workspaceClients.userId, userId), isNull(workspaces.archivedAt)));
  return rows;
}

export async function isUserAssignedToWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  const link = await getWorkspaceClientByPair(workspaceId, userId);
  return link !== null;
}

// Inspiration items
export async function listInspiration(workspaceId: string): Promise<InspirationItem[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select()
    .from(inspirationItems)
    .where(eq(inspirationItems.workspaceId, workspaceId))
    .orderBy(desc(inspirationItems.createdAt));
}

export async function createInspiration(data: {
  workspaceId: string;
  url: string;
  platform: InspirationItem["platform"];
  thumbnailUrl: string | null;
  thumbnailStatus: InspirationItem["thumbnailStatus"];
  createdBy: string;
}): Promise<InspirationItem> {
  const rows = await db.insert(inspirationItems).values(data).returning();
  return rows[0];
}

export async function updateInspirationThumbnail(
  id: string,
  data: { thumbnailUrl?: string | null; thumbnailStatus: InspirationItem["thumbnailStatus"] }
): Promise<InspirationItem | null> {
  if (!isUuid(id)) return null;
  const rows = await db.update(inspirationItems).set(data).where(eq(inspirationItems.id, id)).returning();
  return rows[0] ?? null;
}

export async function getInspirationById(id: string): Promise<InspirationItem | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(inspirationItems).where(eq(inspirationItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteInspiration(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(inspirationItems).where(eq(inspirationItems.id, id));
}

// Notes
export async function listNotes(workspaceId: string): Promise<Note[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select()
    .from(notes)
    .where(eq(notes.workspaceId, workspaceId))
    .orderBy(desc(notes.createdAt));
}

export async function createNote(data: {
  workspaceId: string;
  kind: Note["kind"];
  title: string | null;
  body: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  sizeBytes?: number | null;
  createdBy: string;
}): Promise<Note> {
  const rows = await db.insert(notes).values(data).returning();
  return rows[0];
}

export async function getNoteById(id: string): Promise<Note | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteNote(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(notes).where(eq(notes.id, id));
}

// Footage
export async function listFootage(workspaceId: string): Promise<Footage[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select()
    .from(footage)
    .where(eq(footage.workspaceId, workspaceId))
    .orderBy(desc(footage.createdAt));
}

export async function createFootage(data: {
  workspaceId: string;
  name: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  kind: Footage["kind"];
  createdBy: string;
}): Promise<Footage> {
  const rows = await db.insert(footage).values(data).returning();
  return rows[0];
}

export async function getFootageById(id: string): Promise<Footage | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(footage).where(eq(footage.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteFootage(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(footage).where(eq(footage.id, id));
}

// Analyses
export async function listAnalyses(workspaceId: string): Promise<Analysis[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.workspaceId, workspaceId))
    .orderBy(desc(analyses.createdAt));
}

export async function createAnalysis(data: {
  workspaceId: string;
  videoUrl: string;
  videoName: string;
  analysisPrompt: string;
  brandContext: string | null;
  createdBy: string;
}): Promise<Analysis> {
  const rows = await db
    .insert(analyses)
    .values({ ...data, status: "processing" })
    .returning();
  return rows[0];
}

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateAnalysis(
  id: string,
  data: Partial<Pick<Analysis, "status" | "analysisText" | "ideasText" | "error">>
): Promise<void> {
  if (!isUuid(id)) return;
  await db.update(analyses).set(data).where(eq(analyses.id, id));
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(analyses).where(eq(analyses.id, id));
}

// Durably marks any analysis whose background job died (running past the
// serverless budget) as failed, so it isn't reported as processing forever
// and clients stop polling it. 6 min > the route's maxDuration of 300s.
export async function failStaleAnalyses(workspaceId: string): Promise<void> {
  if (!isUuid(workspaceId)) return;
  await db
    .update(analyses)
    .set({ status: "failed", error: "Analysis timed out. Please retry." })
    .where(
      and(
        eq(analyses.workspaceId, workspaceId),
        eq(analyses.status, "processing"),
        sql`${analyses.createdAt} < now() - interval '6 minutes'`
      )
    );
}

// Calendar items
export async function listCalendarItems(workspaceId: string): Promise<CalendarItem[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select()
    .from(calendarItems)
    .where(eq(calendarItems.workspaceId, workspaceId))
    .orderBy(calendarItems.scheduledDate);
}

export async function createCalendarItem(data: {
  workspaceId: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  status: CalendarItem["status"];
  createdBy: string;
}): Promise<CalendarItem> {
  const rows = await db.insert(calendarItems).values(data).returning();
  return rows[0];
}

export async function getCalendarItemById(id: string): Promise<CalendarItem | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(calendarItems).where(eq(calendarItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateCalendarItem(
  id: string,
  data: Partial<Pick<CalendarItem, "title" | "description" | "scheduledDate" | "status">>
): Promise<CalendarItem | null> {
  if (!isUuid(id)) return null;
  const rows = await db.update(calendarItems).set(data).where(eq(calendarItems.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteCalendarItem(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(calendarItems).where(eq(calendarItems.id, id));
}

// Messages (per-workspace chat)
export async function listMessages(workspaceId: string): Promise<ChatMessage[]> {
  if (!isUuid(workspaceId)) return [];
  return db
    .select({
      id: messages.id,
      workspaceId: messages.workspaceId,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderRole: users.role,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.workspaceId, workspaceId))
    .orderBy(messages.createdAt);
}

export async function createMessage(data: {
  workspaceId: string;
  senderId: string;
  body: string;
}): Promise<Message> {
  const rows = await db.insert(messages).values(data).returning();
  return rows[0];
}

// ---- Activity feed (admin: all workspaces; client: one workspace) ----
export type ActivityType = "inspiration" | "note" | "footage" | "analysis" | "calendar" | "message";
export interface ActivityEntry {
  workspaceId: string;
  workspaceName: string;
  type: ActivityType;
  actorName: string | null;
  actorRole: UserRole | null;
  detail: string;
  createdAt: string;
}

function snippet(s: string, n = 60): string {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export async function listActivity(opts: { workspaceId?: string; limit?: number }): Promise<ActivityEntry[]> {
  const limit = opts.limit ?? 30;
  if (opts.workspaceId && !isUuid(opts.workspaceId)) return [];
  const ws = opts.workspaceId ?? null;
  const per = 40;
  const w = <T>(col: T, val: unknown) => (ws ? eq(col as never, val as never) : undefined);

  const [insp, nts, ftg, anl, cal, msg, wsRows] = await Promise.all([
    db.select({ id: inspirationItems.workspaceId, at: inspirationItems.createdAt, actorName: users.name, actorRole: users.role, platform: inspirationItems.platform })
      .from(inspirationItems).leftJoin(users, eq(inspirationItems.createdBy, users.id))
      .where(w(inspirationItems.workspaceId, ws)).orderBy(desc(inspirationItems.createdAt)).limit(per),
    db.select({ id: notes.workspaceId, at: notes.createdAt, actorName: users.name, actorRole: users.role, title: notes.title, kind: notes.kind })
      .from(notes).leftJoin(users, eq(notes.createdBy, users.id))
      .where(w(notes.workspaceId, ws)).orderBy(desc(notes.createdAt)).limit(per),
    db.select({ id: footage.workspaceId, at: footage.createdAt, actorName: users.name, actorRole: users.role, name: footage.name })
      .from(footage).leftJoin(users, eq(footage.createdBy, users.id))
      .where(w(footage.workspaceId, ws)).orderBy(desc(footage.createdAt)).limit(per),
    db.select({ id: analyses.workspaceId, at: analyses.createdAt, actorName: users.name, actorRole: users.role, name: analyses.videoName })
      .from(analyses).leftJoin(users, eq(analyses.createdBy, users.id))
      .where(w(analyses.workspaceId, ws)).orderBy(desc(analyses.createdAt)).limit(per),
    db.select({ id: calendarItems.workspaceId, at: calendarItems.createdAt, actorName: users.name, actorRole: users.role, title: calendarItems.title })
      .from(calendarItems).leftJoin(users, eq(calendarItems.createdBy, users.id))
      .where(w(calendarItems.workspaceId, ws)).orderBy(desc(calendarItems.createdAt)).limit(per),
    db.select({ id: messages.workspaceId, at: messages.createdAt, actorName: users.name, actorRole: users.role, body: messages.body })
      .from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(w(messages.workspaceId, ws)).orderBy(desc(messages.createdAt)).limit(per),
    db.select({ id: workspaces.id, name: workspaces.name }).from(workspaces),
  ]);

  const nameById = new Map(wsRows.map((r) => [r.id, r.name]));
  const entries: Omit<ActivityEntry, "workspaceName">[] = [
    ...insp.map((r) => ({ workspaceId: r.id, type: "inspiration" as const, actorName: r.actorName, actorRole: r.actorRole, detail: `a ${r.platform} link`, createdAt: r.at })),
    ...nts.map((r) => ({ workspaceId: r.id, type: "note" as const, actorName: r.actorName, actorRole: r.actorRole, detail: r.kind === "voice" ? "a voice note" : r.title ? `note “${snippet(r.title, 40)}”` : "a note", createdAt: r.at })),
    ...ftg.map((r) => ({ workspaceId: r.id, type: "footage" as const, actorName: r.actorName, actorRole: r.actorRole, detail: r.name, createdAt: r.at })),
    ...anl.map((r) => ({ workspaceId: r.id, type: "analysis" as const, actorName: r.actorName, actorRole: r.actorRole, detail: r.name, createdAt: r.at })),
    ...cal.map((r) => ({ workspaceId: r.id, type: "calendar" as const, actorName: r.actorName, actorRole: r.actorRole, detail: r.title, createdAt: r.at })),
    ...msg.map((r) => ({ workspaceId: r.id, type: "message" as const, actorName: r.actorName, actorRole: r.actorRole, detail: snippet(r.body), createdAt: r.at })),
  ];
  return entries
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit)
    .map((e) => ({ ...e, workspaceName: nameById.get(e.workspaceId) ?? "Unknown" }));
}

// ---- Admin dashboard overview: totals, per-workspace client count, last
// activity, and storage usage (footage + voice notes + thumbnails). ----
export interface AdminOverview {
  stats: { workspaceCount: number; archivedCount: number; clientCount: number; storageBytes: number };
  workspaces: {
    id: string;
    name: string;
    archivedAt: string | null;
    createdAt: string;
    clientCount: number;
    lastActivityAt: string | null;
    storageBytes: number;
  }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const bytes = (col: AnyColumn) => sql<number>`coalesce(sum(${col}), 0)::float8`;
  const [wsList, clientRows, linkRows, footBytes, noteBytes, inspBytes, insp, nts, ftg, anl, cal, msg] =
    await Promise.all([
      db.select().from(workspaces).orderBy(desc(workspaces.createdAt)),
      db.select({ id: users.id }).from(users).where(eq(users.role, "client")),
      db.select({ workspaceId: workspaceClients.workspaceId }).from(workspaceClients),
      db.select({ ws: footage.workspaceId, b: bytes(footage.sizeBytes) }).from(footage).groupBy(footage.workspaceId),
      db.select({ ws: notes.workspaceId, b: bytes(notes.sizeBytes) }).from(notes).groupBy(notes.workspaceId),
      db.select({ ws: inspirationItems.workspaceId, b: bytes(inspirationItems.sizeBytes) }).from(inspirationItems).groupBy(inspirationItems.workspaceId),
      db.select({ ws: inspirationItems.workspaceId, at: inspirationItems.createdAt }).from(inspirationItems).orderBy(desc(inspirationItems.createdAt)).limit(50),
      db.select({ ws: notes.workspaceId, at: notes.createdAt }).from(notes).orderBy(desc(notes.createdAt)).limit(50),
      db.select({ ws: footage.workspaceId, at: footage.createdAt }).from(footage).orderBy(desc(footage.createdAt)).limit(50),
      db.select({ ws: analyses.workspaceId, at: analyses.createdAt }).from(analyses).orderBy(desc(analyses.createdAt)).limit(50),
      db.select({ ws: calendarItems.workspaceId, at: calendarItems.createdAt }).from(calendarItems).orderBy(desc(calendarItems.createdAt)).limit(50),
      db.select({ ws: messages.workspaceId, at: messages.createdAt }).from(messages).orderBy(desc(messages.createdAt)).limit(50),
    ]);

  const storageByWorkspace: Record<string, number> = {};
  for (const r of [...footBytes, ...noteBytes, ...inspBytes]) {
    storageByWorkspace[r.ws] = (storageByWorkspace[r.ws] ?? 0) + Number(r.b);
  }

  const lastActivityByWorkspace: Record<string, string> = {};
  for (const e of [...insp, ...nts, ...ftg, ...anl, ...cal, ...msg]) {
    const cur = lastActivityByWorkspace[e.ws];
    if (!cur || e.at > cur) lastActivityByWorkspace[e.ws] = e.at;
  }

  const clientCountByWorkspace: Record<string, number> = {};
  for (const l of linkRows) clientCountByWorkspace[l.workspaceId] = (clientCountByWorkspace[l.workspaceId] ?? 0) + 1;

  const workspacesOut = wsList.map((wsp) => ({
    id: wsp.id,
    name: wsp.name,
    archivedAt: wsp.archivedAt,
    createdAt: wsp.createdAt,
    clientCount: clientCountByWorkspace[wsp.id] ?? 0,
    lastActivityAt: lastActivityByWorkspace[wsp.id] ?? null,
    storageBytes: storageByWorkspace[wsp.id] ?? 0,
  }));

  return {
    stats: {
      workspaceCount: wsList.filter((wsp) => !wsp.archivedAt).length,
      archivedCount: wsList.filter((wsp) => wsp.archivedAt).length,
      clientCount: clientRows.length,
      storageBytes: Object.values(storageByWorkspace).reduce((a, b) => a + b, 0),
    },
    workspaces: workspacesOut,
  };
}

// ---- Admin-only private notes ----
export async function listAdminNotes(workspaceId: string): Promise<AdminNote[]> {
  if (!isUuid(workspaceId)) return [];
  return db.select().from(adminNotes).where(eq(adminNotes.workspaceId, workspaceId)).orderBy(desc(adminNotes.createdAt));
}

export async function createAdminNote(data: { workspaceId: string; body: string; createdBy: string }): Promise<AdminNote> {
  const rows = await db.insert(adminNotes).values(data).returning();
  return rows[0];
}

export async function getAdminNoteById(id: string): Promise<AdminNote | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(adminNotes).where(eq(adminNotes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteAdminNote(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await db.delete(adminNotes).where(eq(adminNotes.id, id));
}

// ---- Notifications: unseen activity from the *other* party ----
export type NotifSection = "inspiration" | "notes" | "footage" | "calendar" | "chat";
interface NotifSource {
  section: NotifSection;
  // Loose typing: these are columns from different tables aggregated uniformly.
  table: unknown;
  ws: unknown;
  at: unknown;
  author: unknown;
}
const NOTIF_SECTIONS: NotifSource[] = [
  { section: "inspiration", table: inspirationItems, ws: inspirationItems.workspaceId, at: inspirationItems.createdAt, author: inspirationItems.createdBy },
  { section: "notes", table: notes, ws: notes.workspaceId, at: notes.createdAt, author: notes.createdBy },
  { section: "footage", table: footage, ws: footage.workspaceId, at: footage.createdAt, author: footage.createdBy },
  { section: "calendar", table: calendarItems, ws: calendarItems.workspaceId, at: calendarItems.createdAt, author: calendarItems.createdBy },
  { section: "chat", table: messages, ws: messages.workspaceId, at: messages.createdAt, author: messages.senderId },
];

export async function markSeen(userId: string, workspaceId: string, section: string): Promise<void> {
  if (!isUuid(workspaceId)) return;
  await db
    .insert(notificationReads)
    .values({ userId, workspaceId, section, lastSeenAt: sql`now()` })
    .onConflictDoUpdate({
      target: [notificationReads.userId, notificationReads.workspaceId, notificationReads.section],
      set: { lastSeenAt: sql`now()` },
    });
}

// Per-section unseen counts for one workspace (drives the tab badges). Only
// counts items authored by someone *other* than the viewer.
export async function getWorkspaceUnseen(userId: string, workspaceId: string): Promise<Record<NotifSection, number>> {
  const empty = { inspiration: 0, notes: 0, footage: 0, calendar: 0, chat: 0 };
  if (!isUuid(workspaceId)) return empty;
  const reads = await db
    .select()
    .from(notificationReads)
    .where(and(eq(notificationReads.userId, userId), eq(notificationReads.workspaceId, workspaceId)));
  const seen = new Map(reads.map((r) => [r.section, r.lastSeenAt]));

  const result = { ...empty };
  for (const s of NOTIF_SECTIONS) {
    const last = seen.get(s.section);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conds: any[] = [eq(s.ws as never, workspaceId), or(ne(s.author as never, userId), isNull(s.author as never))];
    if (last) conds.push(gt(s.at as never, last));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(s.table as any).where(and(...conds));
    result[s.section] = rows[0]?.n ?? 0;
  }
  return result;
}

// Which of the given workspaces have any unseen activity for this user (drives
// the aggregate dot in the picker / dashboard).
export async function getUnseenWorkspaceIds(userId: string, workspaceIds: string[]): Promise<string[]> {
  const ids = workspaceIds.filter(isUuid);
  if (ids.length === 0) return [];
  const reads = await db.select().from(notificationReads).where(eq(notificationReads.userId, userId));
  const seen = new Map(reads.map((r) => [`${r.workspaceId}|${r.section}`, r.lastSeenAt]));

  const unseen = new Set<string>();
  for (const s of NOTIF_SECTIONS) {
    const rows = await db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select({ ws: s.ws as any, max: sql<string>`max(${s.at as any})` })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(s.table as any)
      .where(and(inArray(s.ws as never, ids), or(ne(s.author as never, userId), isNull(s.author as never))))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .groupBy(s.ws as any);
    for (const row of rows as { ws: string; max: string | null }[]) {
      const last = seen.get(`${row.ws}|${s.section}`);
      if (row.max && (!last || row.max > last)) unseen.add(row.ws);
    }
  }
  return [...unseen];
}

// ---- Workspace search (inspiration, notes, footage, calendar, chat) ----
export interface SearchResults {
  inspiration: InspirationItem[];
  notes: Note[];
  footage: Footage[];
  calendar: CalendarItem[];
  chat: ChatMessage[];
}

export async function searchWorkspace(workspaceId: string, query: string): Promise<SearchResults> {
  const empty: SearchResults = { inspiration: [], notes: [], footage: [], calendar: [], chat: [] };
  const q = query.trim();
  if (!isUuid(workspaceId) || !q) return empty;
  const like = `%${q}%`;
  const [inspiration, noteRows, footageRows, calendar, chat] = await Promise.all([
    db.select().from(inspirationItems)
      .where(and(eq(inspirationItems.workspaceId, workspaceId), ilike(inspirationItems.url, like)))
      .orderBy(desc(inspirationItems.createdAt)).limit(15),
    db.select().from(notes)
      .where(and(eq(notes.workspaceId, workspaceId), or(ilike(notes.title, like), ilike(notes.body, like))))
      .orderBy(desc(notes.createdAt)).limit(15),
    db.select().from(footage)
      .where(and(eq(footage.workspaceId, workspaceId), ilike(footage.name, like)))
      .orderBy(desc(footage.createdAt)).limit(15),
    db.select().from(calendarItems)
      .where(and(eq(calendarItems.workspaceId, workspaceId), or(ilike(calendarItems.title, like), ilike(calendarItems.description, like))))
      .orderBy(desc(calendarItems.createdAt)).limit(15),
    db.select({
      id: messages.id, workspaceId: messages.workspaceId, senderId: messages.senderId,
      body: messages.body, createdAt: messages.createdAt, senderName: users.name, senderRole: users.role,
    }).from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.workspaceId, workspaceId), ilike(messages.body, like)))
      .orderBy(desc(messages.createdAt)).limit(15),
  ]);
  return { inspiration, notes: noteRows, footage: footageRows, calendar, chat };
}
