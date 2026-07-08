import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { ALLOWED_FOOTAGE_CONTENT_TYPES, MAX_FOOTAGE_BYTES } from "@/lib/footage";

// Mints client-upload tokens for footage files. Auth happens in
// onBeforeGenerateToken (the completion webhook has no session and doesn't
// fire locally, so the footage row is created client-side after upload()).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let workspaceId: string | undefined;
        try {
          workspaceId = clientPayload ? JSON.parse(clientPayload).workspaceId : undefined;
        } catch {
          workspaceId = undefined;
        }
        if (!workspaceId) throw new Error("workspaceId required");

        const user = await requireWorkspaceAccess(workspaceId);
        if (!user) throw new Error("Forbidden");

        return {
          allowedContentTypes: ALLOWED_FOOTAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FOOTAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the footage row is persisted by the client after upload() resolves.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
