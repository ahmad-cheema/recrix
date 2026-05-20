import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionPayload } from "@/lib/auth/session";
import { saveJob, unsaveJob } from "@/lib/jobs/saved";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionPayload();

    if (!session || session.role !== "candidate") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: string };

    if (!body.jobId) {
      return NextResponse.json(
        { error: "Job ID is required." },
        { status: 400 }
      );
    }

    await saveJob(session.sub, body.jobId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionPayload();

    if (!session || session.role !== "candidate") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required." },
        { status: 400 }
      );
    }

    await unsaveJob(session.sub, jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unsave job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
