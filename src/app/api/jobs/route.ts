import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { createJobSchema } from "@/lib/jobs/validators";
import { createJob, listActiveJobs } from "@/lib/jobs/service";

export async function GET() {
  try {
    const jobs = await listActiveJobs();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to load jobs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = createJobSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const job = await createJob(result.data, session.sub);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Job creation failed." },
      { status: 500 }
    );
  }
}
