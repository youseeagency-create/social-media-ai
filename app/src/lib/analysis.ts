// Shared, dependency-free analysis constants (importable client + server).

export const ANALYSIS_MAX_BYTES = 500 * 1024 * 1024; // 500 MB per video

// Default prompt for the Gemini video breakdown. Shown pre-filled in the UI and
// editable per run. Structured so the markdown renders into clear sections.
export const DEFAULT_ANALYSIS_PROMPT = `Analyze this short-form video in detail. Structure your answer in markdown with these sections:

# CONCEPT
The core idea in 1-3 sentences: what belief it challenges, what promise it makes, or what outcome it shows.

# HOOK
Break down the first 3 seconds — what is seen (visual), any on-screen text, and the first spoken words. Explain precisely why it stops the scroll.

# RETENTION MECHANISMS
How it keeps the viewer watching: open loops, delayed payoff, pattern interrupts, pacing/cuts, escalation. Be specific with timestamps where useful.

# PACING & EDITING
Cut frequency, energy, transitions, captions, sound design, and how they serve retention.

# REWARD
What the viewer gets by the end (education, entertainment, or inspiration) and whether it feels worth the watch.

# SCRIPT
A clean transcription/beat-by-beat of the spoken and on-screen script.

Keep it sharp and concrete. Prefer clarity over length.`;
