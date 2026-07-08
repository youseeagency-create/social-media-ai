import { NextResponse } from "next/server";
import { readUsers } from "@/lib/csv";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = readUsers().find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await setSessionCookie({ userId: user.id, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
