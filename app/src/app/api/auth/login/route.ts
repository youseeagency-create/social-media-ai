import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = await getUserByEmail(String(email));
  // Always run scrypt (against a dummy when the user is missing) so response
  // time doesn't reveal whether an email is registered.
  const ok = user
    ? await verifyPassword(password, user.passwordHash, user.passwordSalt)
    : await verifyPassword(password, DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT);
  if (!user || !ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await setSessionCookie({ userId: user.id, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
