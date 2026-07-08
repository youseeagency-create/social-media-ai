import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import { users, workspaces, workspaceClients, inspirationItems, notes } from "./schema";
import type { User, Workspace, WorkspaceClient, UserRole, InspirationItem, Note } from "./types";

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
    .select({ id: workspaces.id, name: workspaces.name, createdAt: workspaces.createdAt })
    .from(workspaceClients)
    .innerJoin(workspaces, eq(workspaceClients.workspaceId, workspaces.id))
    .where(eq(workspaceClients.userId, userId));
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
