import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { STREAM_FEEDBACK_PROMPT } from "@/lib/ai/prompts/stream-feedback";
import { answerInterviewSchema } from "@/lib/interviews/validators";
import { appendInterviewAnswer } from "@/lib/interviews/service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.role !== "candidate") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = answerInterviewSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { question, answer, questionIndex } = result.data;

  try {
    const response = await streamText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system: STREAM_FEEDBACK_PROMPT,
      messages: [
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}`,
        },
      ],
      temperature: 0.2,
      onFinish: async ({ text }) => {
        await appendInterviewAnswer({
          sessionId: params.id,
          candidateId: session.sub,
          questionIndex,
          question,
          answer,
          feedback: text.trim(),
        });
      },
    });

    return response.toTextStreamResponse();
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Feedback failed." },
      { status: 500 }
    );
  }
}
