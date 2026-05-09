import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { createApplicationWithResume } from "@/lib/applications/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.role !== "candidate") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const jobId = formData.get("jobId");
  const file = formData.get("file");

  if (typeof jobId !== "string" || !jobId) {
    return NextResponse.json({ error: "Missing job ID." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing resume file." }, { status: 400 });
  }

  try {
    const application = await createApplicationWithResume({
      jobId,
      candidateId: session.sub,
      file,
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Application creation failed." },
      { status: 500 }
    );
  }
}
