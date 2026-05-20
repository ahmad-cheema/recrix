import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { runApplicationEvaluation } from "@/lib/applications/service";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const evaluation = await runApplicationEvaluation({
      applicationId: params.id,
      recruiterId: session.sub,
    });
    return NextResponse.json({ evaluation }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to run AI evaluation." },
      { status: 500 }
    );
  }
}
