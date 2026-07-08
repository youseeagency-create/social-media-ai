import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { users, workspaces, workspaceClients } from "./schema";
import type { User, Workspace, WorkspaceClient, UserRole } from "./types";

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

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
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
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const rows = await db.insert(workspaces).values({ name }).returning();
  return rows[0];
}

export async function updateWorkspace(id: string, data: { name: string }): Promise<Workspace | null> {
  const rows = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await db.delete(workspaces).where(eq(workspaces.id, id));
}

// Workspace-Client assignments
export async function listWorkspaceClients(): Promise<WorkspaceClient[]> {
  return db.select().from(workspaceClients);
}

export async function getWorkspaceClientByPair(workspaceId: string, userId: string): Promise<WorkspaceClient | null> {
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
  await db.delete(workspaceClients).where(eq(workspaceClients.id, id));
}

export async function deleteWorkspaceClientByPair(workspaceId: string, userId: string): Promise<void> {
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
