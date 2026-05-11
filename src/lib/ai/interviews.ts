import "server-only";

import { AppError } from "@/lib/auth/errors";
import { requestOpenAiJsonArray } from "@/lib/ai/openai";
import { GENERATE_QUESTIONS_PROMPT } from "@/lib/ai/prompts/generate-questions";

export async function generateInterviewQuestions({
  jobTitle,
  jobDescription,
  count,
}: {
  jobTitle: string;
  jobDescription: string;
  count: number;
}): Promise<string[]> {
  const prompt = GENERATE_QUESTIONS_PROMPT.replace("{count}", String(count)).replace(
    "{jobTitle}",
    jobTitle
  );

  const messages = [
    { role: "system" as const, content: prompt },
    { role: "user" as const, content: jobDescription },
  ];

  const result = await requestOpenAiJsonArray<string[]>(messages);

  if (!Array.isArray(result) || result.length === 0) {
    throw new AppError("INTERNAL_ERROR", "Invalid interview questions.", 500);
  }

  return result.map((question) => String(question)).filter(Boolean);
}
