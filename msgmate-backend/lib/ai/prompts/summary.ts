// ── Public API: Summary prompt builder ───────────────────────────────────────

/**
 * Builds the user-message prompt for chat summarization.
 * Instructs the AI to produce 3-5 bullet points covering key decisions,
 * action items, and sentiment.
 */
export function buildSummaryPrompt(conversation: string): string {
  return `Summarize in 3-5 bullet points. Key decisions, action items, sentiment.

${conversation}`;
}
