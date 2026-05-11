import "server-only";

import { AppError } from "@/lib/auth/errors";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const AI_TIMEOUT_MS = 30_000;

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError("INTERNAL_ERROR", "Missing OpenAI API key.", 500);
  }
  return apiKey;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const startCandidates = [firstBrace, firstBracket].filter((v) => v >= 0);
  const start = startCandidates.length ? Math.min(...startCandidates) : -1;
  const endBrace = trimmed.lastIndexOf("}");
  const endBracket = trimmed.lastIndexOf("]");
  const endCandidates = [endBrace, endBracket].filter((v) => v >= 0);
  const end = endCandidates.length ? Math.max(...endCandidates) : -1;

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

export async function requestOpenAiJson<T>(messages: ChatMessage[]): Promise<T> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AppError(
        "INTERNAL_ERROR",
        `OpenAI request failed. ${detail}`.trim(),
        500
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJson(content);

    try {
      return JSON.parse(jsonText) as T;
    } catch {
      throw new AppError("INTERNAL_ERROR", "Invalid AI JSON response.", 500);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "OpenAI request failed.", 500);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestOpenAiJsonArray<T>(
  messages: ChatMessage[]
): Promise<T> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AppError(
        "INTERNAL_ERROR",
        `OpenAI request failed. ${detail}`.trim(),
        500
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJson(content);

    try {
      return JSON.parse(jsonText) as T;
    } catch {
      throw new AppError("INTERNAL_ERROR", "Invalid AI JSON response.", 500);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "OpenAI request failed.", 500);
  } finally {
    clearTimeout(timeoutId);
  }
}
