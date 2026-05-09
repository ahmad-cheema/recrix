import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/validators";
import { registerUser } from "@/lib/auth/service";
import { setAuthCookie } from "@/lib/auth/cookies";
import { AppError } from "@/lib/auth/errors";

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const { token, user } = await registerUser(result.data);
    const response = NextResponse.json({ token, user }, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}
