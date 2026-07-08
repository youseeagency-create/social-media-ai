import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readUsers, writeUsers } from "@/lib/csv";
import { hashPassword } from "@/lib/password";
import type { User, PublicUser } from "@/lib/types";

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
  const role = searchParams.get("role");
  let users = readUsers();
  if (role) users = users.filter((u) => u.role === role);
  return NextResponse.json(users.map(toPublic));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "email, password, and name are required" }, { status: 400 });
  }

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === String(body.email).toLowerCase())) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(body.password);
  const newUser: User = {
    id: uuid(),
    email: body.email,
    name: body.name,
    role: body.role === "admin" ? "admin" : "client",
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  return NextResponse.json(toPublic(newUser), { status: 201 });
}
