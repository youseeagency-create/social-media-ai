import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminOverview } from "@/lib/db";

// Admin-only aggregate for the dashboard. Also gated by proxy.ts, but we check
// here too so the data layer never trusts the middleware alone.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getAdminOverview());
}
