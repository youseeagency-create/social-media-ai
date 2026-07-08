import { getAnalysisById, updateAnalysis } from "./db";
import { uploadVideo, analyzeVideo } from "./gemini";
import { generateContentIdeas } from "./claude";

// Runs the full analysis chain for one record: download the video → Gemini
// (upload + analyze) → Claude (content ideas) → mark completed. Any failure
// marks the record failed with a readable message. Intended to run in a
// background task (Next `after()`), so it never throws to the caller.
export async function runAnalysis(id: string): Promise<void> {
  const record = await getAnalysisById(id);
  if (!record) return;

  try {
    const res = await fetch(record.videoUrl);
    if (!res.ok) throw new Error(`Could not fetch the video (${res.status})`);
    const contentType = res.headers.get("content-type") || "video/mp4";
    const buffer = Buffer.from(await res.arrayBuffer());

    const { uri, mimeType } = await uploadVideo(buffer, contentType);
    const analysisText = await analyzeVideo(uri, mimeType, record.analysisPrompt);
    if (!analysisText.trim()) throw new Error("Gemini returned an empty analysis");

    const ideasText = await generateContentIdeas(analysisText, record.brandContext);

    await updateAnalysis(id, { status: "completed", analysisText, ideasText, error: null });
  } catch (err) {
    await updateAnalysis(id, { status: "failed", error: (err as Error).message });
  }
}
