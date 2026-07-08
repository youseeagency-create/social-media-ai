import { NextResponse } from "next/server";
import { getUserByEmail, listUsers, createUser } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { User, PublicUser, UserRole } from "@/lib/types";

function toPublic(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as UserRole | null;
  const users = await listUsers(role ?? undefined);
  return NextResponse.json(users.map(toPublic));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "email, password, and name are required" }, { status: 400 });
  }

  const existing = await getUserByEmail(String(body.email));
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(body.password);
  const newUser = await createUser({
    email: body.email,
    name: body.name,
    role: body.role === "admin" ? "admin" : "client",
    passwordHash: hash,
    passwordSalt: salt,
  });
  return NextResponse.json(toPublic(newUser), { status: 201 });
}
