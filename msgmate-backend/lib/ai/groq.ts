import { env } from "@/lib/env";
import {EmptyResponseError,GroqRequestError,GroqRateLimitError,GroqUnauthorizedError,InvalidReplyCountError,InvalidJsonError} from "./aierror"
import { SYSTEM_PROMPT, buildReplyPrompt, buildSummaryPrompt, buildImportantPrompt, buildClassifyPrompt } from "./prompts";
import type { GenerateRepliesInput, DetectMessage, ClassifyMessageInput, ClassifyMessageResult } from "./prompts";

type GroqChatResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message: string;
  };
};

// ── Private: Internal helpers ─────────────────────────────────────────────────

/** @internal Raw HTTP call to Groq API — must never be exported. Contains the API key. */
async function _callGroq(prompt: string, maxTokens: number) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.4,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = (await response.json()) as GroqChatResponse;

  if (response.status === 401) {
  throw new GroqUnauthorizedError();
}

if (response.status === 429) {
  throw new GroqRateLimitError();
}

if (!response.ok || data.error) {
  throw new GroqRequestError(
    data.error?.message,
    response.status,
  );
}



  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new EmptyResponseError();
  }

  return {
    text,
    usage: data.usage
  };
}

/** @internal Parse JSON from LLM response text with fallback extraction. */
function _parseJsonObject(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new InvalidJsonError();
    }

    return JSON.parse(match[0]);
  }
}

// ── Public API: Called by backend route handlers & MessageService ─────────────────

/**
 * Low-level AI chat — sends a raw prompt to Groq and returns the response text.
 * Used by MessageService for the Route → MessageService → Guardrails → AI workflow.
 *
 * @param prompt - The user message prompt
 * @param maxTokens - Maximum tokens to generate (default: 250)
 * @returns { text, usage } from the Groq API
 */
export async function chat(prompt: string, maxTokens: number = 250) {
  return _callGroq(prompt, maxTokens);
}

/**
 * Parse JSON from LLM response text with fallback extraction.
 * Exported so MessageService can parse AI output after validation.
 */
export function parseJson(text: string) {
  return _parseJsonObject(text);
}

export async function generateReplies(input: GenerateRepliesInput) {
  const prompt = buildReplyPrompt(input);

  const result = await _callGroq(prompt, 250);
  const parsed = _parseJsonObject(result.text) as {
    replies?: string[] };

  if (!Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
    throw new InvalidReplyCountError();
  }

  return {
  replies: parsed.replies,
  usage: {
    input_tokens: result.usage?.prompt_tokens,
    output_tokens: result.usage?.completion_tokens
  }
}
}

export async function summarizeChat(input: { conversation: string }) {
  const prompt = buildSummaryPrompt(input.conversation);

  const result = await _callGroq(prompt, 200);

  return {
    summary: result.text.trim(),
    usage: {
      input_tokens: result.usage?.prompt_tokens,
      output_tokens: result.usage?.completion_tokens
    }
  };
}

export async function detectImportant(input: {
  platform: string;
  messages: DetectMessage[];
}) {
  const recent = input.messages.slice(-20);
  if (recent.length === 0) return { messages: [], usage: { input_tokens: 0, output_tokens: 0 } };

  const prompt = buildImportantPrompt(recent, input.platform);

  const result = await _callGroq(prompt, 400);
  const parsed = _parseJsonObject(result.text) as {
    messages?: { text: string; senderName?: string; urgency?: string; reason?: string }[];
  };

  return {
    messages: parsed.messages || [],
    usage: {
      input_tokens: result.usage?.prompt_tokens,
      output_tokens: result.usage?.completion_tokens
    }
  };
}

export async function classifyMessage(input: ClassifyMessageInput) {
  const prompt = buildClassifyPrompt(input);

  const result = await _callGroq(prompt, 200);
  const parsed = _parseJsonObject(result.text) as ClassifyMessageResult;

  return {
    classification: parsed,
    usage: {
      input_tokens: result.usage?.prompt_tokens,
      output_tokens: result.usage?.completion_tokens
    }
  };
}
