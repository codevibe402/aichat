// ── Public Types ─────────────────────────────────────────────────────────────

export type ChatMessage = {
  sender: "me" | "them";
  text: string;
};

export type GenerateRepliesInput = {
  platform?: string;
  tone: string;
  messages: ChatMessage[];
  replyToMessageId?: string;
  userGoal?: string;
};

// ── Public API: Reply prompt builder ──────────────────────────────────────────

/**
 * Builds the user-message prompt for AI reply generation.
 *
 * Filters to only include "them" messages in the response section,
 * while passing the full conversation for context. The AI is instructed
 * to write exactly 3 replies in the specified tone.
 */
export function buildReplyPrompt(input: GenerateRepliesInput): string {
  const themMessages = _filterTheirMessages(input.messages);
  const conversationFormatted = _formatConversation(input.messages);

  return `You are the user. Write 3 ${input.tone} replies to the other person's message.

Only the person marked THEM needs a reply. Ignore YOUR own messages.

THEM said:
${themMessages.join("\n")}

Full conversation for context:
${conversationFormatted}

Platform: ${input.platform ?? "unknown"}
Goal: ${input.userGoal ?? "not specified"}

Return {"replies":["...","...","..."]}`;
}

// ── Private: Message formatting helpers ─────────────────────────────────────

/** @internal Extracts only "them" messages for the AI to reply to. */
function _filterTheirMessages(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => m.sender === "them")
    .map((m) => m.text);
}

/** @internal Formats the full conversation with THEM:/YOU: prefixes. */
function _formatConversation(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.sender === "them" ? "THEM:" : "YOU:"} ${m.text}`)
    .join("\n");
}
