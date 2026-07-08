import Anthropic from "@anthropic-ai/sdk";
import type { ReportData } from "./reports";

export async function generateNewConcepts(
  videoAnalysis: string,
  newConceptsPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `# ROLE
You're an expert in creating viral Reels on Instagram.

# OBJECTIVE
Take as input viral video from my competitor and based on it generate new concepts for me. Adapt this reference for me.

# REFERENCE VIDEO DESCRIPTION
------
${videoAnalysis}
------

# MY INSTRUCTIONS FOR NEW CONCEPTS
------
${newConceptsPrompt}
------

# BEGIN YOUR WORK`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// Given an analysis of the user's OWN video, generates concrete script/content
// ideas for their future videos, optionally tailored to a brand/context.
export async function generateContentIdeas(
  videoAnalysis: string,
  brandContext?: string | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });

  const contextBlock = brandContext?.trim()
    ? `\n\n# BRAND / CONTEXT\nTailor the ideas to this brand and its goals:\n------\n${brandContext.trim()}\n------`
    : "";

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `# ROLE
You're an expert short-form video strategist (Instagram Reels, TikTok, YouTube Shorts).

# OBJECTIVE
Below is a breakdown of a video the creator made. Based on what worked (and what could be sharper), produce concrete, ready-to-shoot ideas for their FUTURE videos.

# VIDEO ANALYSIS
------
${videoAnalysis}
------${contextBlock}

# OUTPUT (markdown)
1. A short "# WHAT'S WORKING" section: the 2-4 strengths worth repeating.
2. A "# CONTENT IDEAS" section with 3-5 concrete next-video ideas. For each: a bold title, a scroll-stopping HOOK (first line + visual), and a brief SCRIPT/beat outline.
Keep hooks specific and punchy. No fluff.

# BEGIN`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// Writes a short, client-facing executive summary of a workspace report.
export async function generateReportSummary(report: ReportData): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });

  const period =
    report.from || report.to
      ? `${report.from || "the beginning"} to ${report.to || "today"}`
      : "all time";

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Write a short, warm, professional executive summary (2-4 sentences, no headings, first person plural "we") for a content-agency client report. It will be read by the client. Summarize the work done for "${report.workspaceName}" over the period ${period} based on these figures. Be encouraging and concrete; do not invent numbers or facts beyond what's given. If activity is light, frame it as groundwork.

DATA (JSON):
${JSON.stringify(
  {
    inspirationSaved: report.inspiration.total,
    inspirationByPlatform: report.inspiration.byPlatform,
    notes: report.notes,
    footageUploaded: report.footage.total,
    footageByKind: report.footage.byKind,
    videosAnalyzed: report.analyses.completed,
    calendarItems: report.calendar.total,
    calendarByStatus: report.calendar.byStatus,
    upcomingCount: report.calendar.upcoming.length,
  },
  null,
  2
)}

Return only the summary prose.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}
