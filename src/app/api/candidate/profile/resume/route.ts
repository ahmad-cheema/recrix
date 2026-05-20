import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { uploadCandidateResume } from "@/lib/users/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  try {
    const resume = await uploadCandidateResume(session.sub, file);
    return NextResponse.json({ resume }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Resume upload failed." }, { status: 500 });
  }
}
