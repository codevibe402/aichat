import { env } from "@/lib/env";
import {EmptyResponseError,GroqRequestError,GroqRateLimitError,GroqUnauthorizedError,InvalidReplyCountError,InvalidJsonError} from "./aierror"
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

async function callGroq(prompt: string, maxTokens: number) {
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
          content: "Valid JSON only. Concise, polite replies."
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
type ChatMessage = {
  sender: "me" | "them";
  text: string;
};

export async function generateReplies(input: {
  platform?: string;
  tone: string;
  messages: ChatMessage[];
  replyToMessageId?: string;
  userGoal?: string;
}) {
 
const prompt = `Generate 3 ${input.tone} replies as the user.
Platform: ${input.platform ?? "unknown"}
Goal: ${input.userGoal ?? "not specified"}
Messages: ${JSON.stringify(input.messages)}
Latest from "them" → type "reply"; from "me" → type "follow_up".
Return {"type":"reply"|"follow_up","replies":["...","...","..."]}`;


  const result = await callGroq(prompt, 250);
  const parsed = parseJsonObject(result.text) as {
    type ?:"reply"|"follow_up",
    replies?: string[] };

  if (!Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
    throw new InvalidReplyCountError();
  }

  return {
  type: parsed.type,
  replies: parsed.replies,
  usage: {
    input_tokens: result.usage?.prompt_tokens,
    output_tokens: result.usage?.completion_tokens
  }
};
}

function parseJsonObject(text: string) {
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

export async function summarizeChat(input: { conversation: string }) {
  const prompt = `Summarize in 3-5 bullet points. Key decisions, action items, sentiment.

${input.conversation}`;

  const result = await callGroq(prompt, 200);

  return {
    summary: result.text.trim(),
    usage: {
      input_tokens: result.usage?.prompt_tokens,
      output_tokens: result.usage?.completion_tokens
    }
  };
}
