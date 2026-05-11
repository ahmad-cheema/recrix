import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { createInterviewSchema } from "@/lib/interviews/validators";
import { createInterviewSession } from "@/lib/interviews/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const result = createInterviewSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const sessionData = await createInterviewSession(
      result.data.applicationId,
      session.sub
    );
    return NextResponse.json({ session: sessionData }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to start interview." },
      { status: 500 }
    );
  }
}
