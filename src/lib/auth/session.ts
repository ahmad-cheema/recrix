import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./cookies";
import { verifyAuthToken } from "./jwt";
import type { AuthTokenPayload } from "./types";

export async function getSessionPayload(): Promise<AuthTokenPayload | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
