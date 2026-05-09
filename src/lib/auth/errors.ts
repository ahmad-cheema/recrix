export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;

  constructor(code: AppErrorCode, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function asAppError(
  error: unknown,
  fallbackMessage = "Something went wrong."
): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return new AppError("INTERNAL_ERROR", fallbackMessage, 500);
}
