import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { ANALYSIS_MAX_BYTES } from "@/lib/analysis";

// Mints client-upload tokens for videos submitted for analysis (video only).
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
          allowedContentTypes: ["video/*"],
          maximumSizeInBytes: ANALYSIS_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the analysis row is created client-side after upload() resolves.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
