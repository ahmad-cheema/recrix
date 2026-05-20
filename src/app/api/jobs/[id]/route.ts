import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { updateJobSchema } from "@/lib/jobs/validators";
import { deleteJob, getJobById, updateJob } from "@/lib/jobs/service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);

    if (job.status === "active") {
      return NextResponse.json({ job }, { status: 200 });
    }

    const session = await getSessionPayload();
    if (session && session.role === "recruiter") {
      if (session.sub === job.recruiter_id) {
        return NextResponse.json({ job }, { status: 200 });
      }
    }

    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to load job." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = updateJobSchema.safeParse(body);

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
    const job = await updateJob(params.id, session.sub, result.data);
    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Job update failed." }, { status: 500 });
  }
}

export async function DELETE(
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
    await deleteJob(params.id, session.sub);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Job delete failed." }, { status: 500 });
  }
}
