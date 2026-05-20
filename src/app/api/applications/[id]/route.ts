import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { updateApplicationStatusSchema } from "@/lib/applications/validators";
import { updateApplicationStatus } from "@/lib/applications/service";

export const runtime = "nodejs";

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

  const result = updateApplicationStatusSchema.safeParse(body);

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
    const application = await updateApplicationStatus({
      applicationId: params.id,
      recruiterId: session.sub,
      status: result.data.status,
    });
    return NextResponse.json({ application }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Application update failed." },
      { status: 500 }
    );
  }
}
