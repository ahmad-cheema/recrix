import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/validators";
import { loginUser } from "@/lib/auth/service";
import { setAuthCookie } from "@/lib/auth/cookies";
import { AppError } from "@/lib/auth/errors";

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);

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
    const { token, user } = await loginUser(result.data);
    const response = NextResponse.json({ token, user }, { status: 200 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
