import { getAnalysisById, updateAnalysis } from "./db";
import { uploadVideo, analyzeVideo } from "./gemini";
import { generateContentIdeas } from "./claude";

// Turns raw provider errors (often huge JSON blobs) into a short, actionable
// message for the UI.
function toFriendlyError(raw: string): string {
  const m = raw?.trim() || "Analysis failed.";
  const lower = m.toLowerCase();
  const quota =
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit");

  if (quota) {
    if (lower.includes("generativelanguage") || lower.includes("gemini")) {
      return "Gemini API quota exceeded. Enable billing on the Google AI project for your GEMINI_API_KEY (the free tier is limited), then retry.";
    }
    if (lower.includes("anthropic") || lower.includes("rate_limit")) {
      return "Claude API rate limit reached. Wait a moment and retry.";
    }
    return "AI provider quota/rate limit exceeded. Please retry shortly.";
  }
  if (lower.includes("did not become active") || lower.includes("file processing failed")) {
    return "Gemini couldn't process this video (it may be too long or an unsupported format). Try a shorter clip.";
  }
  if (lower.includes("could not fetch the video") || lower.includes("empty analysis")) {
    return m; // already clear
  }
  // Unknown error: first line only, capped, so we never store a giant blob.
  return m.split("\n")[0].slice(0, 200);
}

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
    await updateAnalysis(id, { status: "failed", error: toFriendlyError((err as Error).message) });
  }
}
