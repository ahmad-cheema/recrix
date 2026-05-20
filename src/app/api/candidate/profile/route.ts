import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import {
  getCandidateProfile,
  updateCandidateProfile,
} from "@/lib/users/service";

export async function GET() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const profile = await getCandidateProfile(session.sub);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const input = (body ?? {}) as {
    fullName?: string | null;
    currentTitle?: string | null;
    location?: string | null;
    portfolioUrl?: string | null;
    summary?: string | null;
  };

  try {
    const profile = await updateCandidateProfile(session.sub, input);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
