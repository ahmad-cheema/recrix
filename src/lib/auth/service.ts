import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "./errors";
import type { AuthUser } from "./types";
import type { LoginInput, RegisterInput } from "./validators";
import { hashPassword, verifyPassword } from "./password";
import { issueAuthToken, verifyAuthToken } from "./jwt";

export async function registerUser(
  input: RegisterInput
): Promise<{ token: string; user: AuthUser }> {
  try {
    const client = createAdminClient();
    const email = input.email.trim().toLowerCase();

    const { data: existing, error: existingError } = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw new AppError("INTERNAL_ERROR", "Registration failed.", 500);
    }

    if (existing) {
      throw new AppError("CONFLICT", "Email already in use.", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const { data: user, error } = await client
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        role: input.role,
      })
      .select("id, email, role")
      .single();

    if (error || !user) {
      throw new AppError("INTERNAL_ERROR", "Registration failed.", 500);
    }

    const token = await issueAuthToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Registration failed.", 500);
  }
}

export async function loginUser(
  input: LoginInput
): Promise<{ token: string; user: AuthUser }> {
  try {
    const client = createAdminClient();
    const email = input.email.trim().toLowerCase();

    const { data: user, error } = await client
      .from("users")
      .select("id, email, role, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Login failed.", 500);
    }

    if (!user) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials.", 401);
    }

    const passwordValid = await verifyPassword(
      input.password,
      user.password_hash
    );

    if (!passwordValid) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials.", 401);
    }

    const token = await issueAuthToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user: { id: user.id, email: user.email, role: user.role } };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("INTERNAL_ERROR", "Login failed.", 500);
  }
}

export async function getUserFromToken(token: string): Promise<AuthUser> {
  try {
    const payload = await verifyAuthToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("UNAUTHORIZED", "Invalid token.", 401);
  }
}
