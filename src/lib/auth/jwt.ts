import { SignJWT, jwtVerify } from "jose";
import { AppError } from "./errors";
import type { AuthTokenPayload } from "./types";

const JWT_ISSUER = "recrix";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("INTERNAL_ERROR", "Missing JWT secret.", 500);
  }
  return new TextEncoder().encode(secret);
}

export async function issueAuthToken(
  payload: AuthTokenPayload
): Promise<string> {
  try {
    const secret = getJwtSecret();
    return await new SignJWT({ role: payload.role, email: payload.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setSubject(payload.sub)
      .setExpirationTime("24h")
      .sign(secret);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Failed to issue token.", 500);
  }
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.email !== "string"
    ) {
      throw new AppError("UNAUTHORIZED", "Invalid token.", 401);
    }

    if (payload.role !== "recruiter" && payload.role !== "candidate") {
      throw new AppError("UNAUTHORIZED", "Invalid token.", 401);
    }

    return {
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("UNAUTHORIZED", "Invalid token.", 401);
  }
}
