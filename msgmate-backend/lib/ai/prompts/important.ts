// ── Public Types ─────────────────────────────────────────────────────────────

export type DetectMessage = {
  sender: string;
  text: string;
};

// ── Public API: Important detection prompt builder ───────────────────────────

/**
 * Builds the user-message prompt for important message detection.
 *
 * Scans the last 20 messages and asks the AI to flag messages that are:
 * - URGENT: needs immediate reply
 * - TIME-SENSITIVE: has a deadline
 * - ACTIONABLE: user needs to do something
 *
 * Returns structured JSON with text, sender name, urgency level, and reason.
 */
export function buildImportantPrompt(messages: DetectMessage[], platform: string): string {
  const recent = _takeLastN(messages, 20);
  if (recent.length === 0) return "";

  const formatted = _formatForDetection(recent);

  return `Scan this conversation for important messages that need the user's attention.
Only flag messages that are URGENT (needs immediate reply), TIME-SENSITIVE (has deadline), or ACTIONABLE (user needs to do something).

Conversation:
${formatted}

Return only messages that are important. For each, include: exact text, sender name, urgency level (URGENT/HIGH/MEDIUM/LOW), and a short reason.
Format: {"messages":[{"text":"...","senderName":"...","urgency":"HIGH","reason":"..."}]}

If nothing is important, return {"messages":[]}.`;
}

// ── Private: Formatting helpers ─────────────────────────────────────────────

/** @internal Returns the last N messages from the array. */
function _takeLastN(messages: DetectMessage[], n: number): DetectMessage[] {
  return messages.slice(-n);
}

/** @internal Formats messages with THEM:/YOU: prefixes for the AI prompt. */
function _formatForDetection(messages: DetectMessage[]): string {
  return messages
    .map((m) => `${m.sender === "them" ? "THEM" : "YOU"}: ${m.text}`)
    .join("\n");
}
