import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const ADMIN_ONLY_PAGE_PREFIXES = ["/videos", "/run", "/configs", "/creators", "/admin"];
const ADMIN_ONLY_API_PREFIXES = [
  "/api/configs",
  "/api/creators",
  "/api/videos",
  "/api/pipeline",
  "/api/workspaces",
  "/api/users",
  "/api/workspace-clients",
  "/api/admin",
];

function isAdminOnlyPage(pathname: string): boolean {
  return ADMIN_ONLY_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function isAdminOnlyApi(pathname: string): boolean {
  return ADMIN_ONLY_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const needsAdmin = isApi ? isAdminOnlyApi(pathname) : isAdminOnlyPage(pathname);
  if (needsAdmin && session.role !== "admin") {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/videos/:path*",
    "/run/:path*",
    "/configs/:path*",
    "/creators/:path*",
    "/admin/:path*",
    "/workspace/:path*",
    "/api/configs/:path*",
    "/api/creators/:path*",
    "/api/videos/:path*",
    "/api/pipeline/:path*",
    "/api/workspaces/:path*",
    "/api/users/:path*",
    "/api/workspace-clients/:path*",
    "/api/admin/:path*",
  ],
};
