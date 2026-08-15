// ── Public Types ─────────────────────────────────────────────────────────────

export type ClassifyMessageInput = {
  sender: string;
  text: string;
};

export type ClassifyMessageResult = {
  isTask: boolean;
  isImportant: boolean;
  summary: string;
  priority: number;
  deadline: string | null;
};

// ── Public API: Message classifier prompt ────────────────────────────────────

/**
 * Builds the classification prompt that routes a message to the correct panel tab.
 *
 * - isTask = true → goes into the Tasks tab (user needs to do something)
 * - isImportant = true → goes into the Important tab (unread email requiring attention)
 * - A message can be both a task AND important.
 *
 * Returns structured JSON with urgency priority and deadline detection.
 */
export function buildClassifyPrompt(input: ClassifyMessageInput): string {
  return `Classify this message to determine which tab it belongs in:
- If it's about the user needing to DO something → isTask = true (goes into Tasks tab)
- If it's an unread email requiring the user's attention → isImportant = true (goes into Important tab)
- A message can be both a task AND important.

Return JSON only.

{
  "isTask": boolean,
  "isImportant": boolean,
  "summary": string,
  "priority": 0-100,
  "deadline": string | null
}

Message:
"${input.text}"

Sender: ${input.sender}`;
}
