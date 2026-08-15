/**
 * MessageService — Orchestration layer for AI message processing.
 *
 * Workflow: Route → MessageService → Guardrails → AI Provider (Groq)
 *
 * This service sits between API route handlers and the AI/Guardrails/prompts
 * layers. It:
 *   1. Builds the AI prompt from user input
 *   2. Sanitizes the prompt via SecurityGuardrails (PII, injection, spam)
 *   3. Sends the sanitized prompt to the AI provider
 *   4. Validates and parses the AI response via Guardrails
 *
 * @internal — only the `messageService` singleton should be imported by routes.
 */

import { buildReplyPrompt } from "@/lib/ai/prompts/replies";
import { guardrails } from "@/services/guardrails";
import { chat, parseJson } from "@/lib/ai/groq";
import type { GenerateRepliesInput } from "@/lib/ai/prompts/replies";

// ── Types ─────────────────────────────────────────────────────────────────────

/** AI token usage stats returned by the provider. */
type AIUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

/**
 * Request for generating AI replies.
 * Maps to the same shape as `GenerateRepliesInput` from the prompts module.
 */
export type ReplyRequest = GenerateRepliesInput;

/**
 * Response from reply generation.
 */
export interface ReplyResponse {
  replies: string[];
  usage: AIUsage;
  threats: string[];
}

// ── Logger ───────────────────────────────────────────────────────────────────

const logger = {
  info: (msg: string, ...args: unknown[]) => console.info('[messages]', msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error('[messages]', msg, ...args),
};

// ── Public API: MessageService ────────────────────────────────────────────────

class MessageService {
  /**
   * Generate AI reply suggestions for a chat conversation.
   *
   * Follows the workflow:
   *   1. Build the reply prompt from input (platform, tone, messages)
   *   2. Sanitize the prompt with Guardrails to strip PII/injection/spam
   *   3. Send the sanitized prompt to the AI provider (Groq)
   *   4. Validate the raw AI response with Guardrails
   *   5. Parse the JSON into structured reply suggestions
   *
   * @param input - The reply request containing platform, tone, and messages
   * @returns Reply suggestions with usage stats and any detected threats
   */
  async generateReply(input: ReplyRequest): Promise<ReplyResponse> {
    const prompt = buildReplyPrompt(input);

    const sanitized = guardrails.sanitize(prompt, { strict: true });
    if (sanitized.modified) {
      logger.info('Threats detected during prompt sanitization', sanitized.threats);
    }

    const raw = await chat(sanitized.sanitized, 250);

    const validation = guardrails.validate(raw.text, { strict: false });
    if (!validation.isValid) {
      logger.error('AI output failed guardrails validation', validation.message);
      throw new Error(validation.message || 'AI output failed security validation');
    }

    const parsed = parseJson(raw.text) as { replies?: string[] };

    if (!Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
      throw new Error('AI response did not contain exactly 3 replies');
    }

    return {
      replies: parsed.replies,
      usage: {
        input_tokens: raw.usage?.prompt_tokens,
        output_tokens: raw.usage?.completion_tokens,
      },
      threats: [...sanitized.threats],
    };
  }
}

// ── Default singleton ─────────────────────────────────────────────────────────

export const messageService = new MessageService();
