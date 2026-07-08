import { NextResponse } from "next/server";

// Only proxy images from the Instagram/Facebook CDNs the pipeline actually
// uses (mirrors next.config remotePatterns). This closes SSRF: an arbitrary
// or internal URL (cloud metadata, localhost, private IPs) can never be fetched.
function isAllowedImageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "cdninstagram.com" ||
    h.endsWith(".cdninstagram.com") ||
    h === "fbcdn.net" ||
    h.endsWith(".fbcdn.net")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedImageHost(target.hostname)) {
    return NextResponse.json({ error: "url not allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return new Response(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
