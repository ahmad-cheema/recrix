import bcrypt from "bcryptjs";
import { AppError } from "./errors";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new AppError("INTERNAL_ERROR", "Password hashing failed.", 500);
  }
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch (error) {
    throw new AppError("INTERNAL_ERROR", "Password verification failed.", 500);
  }
}
