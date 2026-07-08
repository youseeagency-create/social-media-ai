import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";

// Mints short-lived client-upload tokens for voice-note audio. Authorization
// happens in onBeforeGenerateToken (the completion webhook has no session and
// doesn't fire locally, so the note record is created client-side afterward).
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
          allowedContentTypes: [
            "audio/webm",
            "audio/mp4",
            "audio/mpeg",
            "audio/ogg",
            "audio/wav",
          ],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the note row is persisted by the client after upload() resolves.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
