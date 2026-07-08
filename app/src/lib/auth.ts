import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "./session";
import { getUserById, isUserAssignedToWorkspace } from "./db";
import type { User, UserRole, SessionPayload } from "./types";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return getUserById(session.userId);
}

// Returns the current user if they may access the workspace (admins bypass,
// otherwise they must be assigned to it), else null. Mirrors the membership
// check in the workspace layout so API routes can authorize the same way.
export async function requireWorkspaceAccess(workspaceId: string): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "admin") return user;
  return (await isUserAssignedToWorkspace(workspaceId, user.id)) ? user : null;
}

export async function setSessionCookie(payload: { userId: string; role: UserRole }): Promise<void> {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
