import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import {
  manualOverrideSchema,
} from "@/lib/applications/validators";
import { updateApplicationManualOverrides } from "@/lib/applications/service";

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

  const parsed = manualOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid manual override input." },
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
    const overrides = await updateApplicationManualOverrides({
      applicationId: params.id,
      recruiterId: session.sub,
      overrides: parsed.data,
    });
    return NextResponse.json({ overrides }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to save manual overrides." },
      { status: 500 }
    );
  }
}
