import "server-only";

import mammoth from "mammoth";
import { AppError } from "@/lib/auth/errors";

export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  const mimeType = file.type;

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pdfModule = await import("pdf-parse");
    const pdfParse =
      (pdfModule as { default?: (data: Buffer) => Promise<{ text: string }> })
        .default ??
      (pdfModule as unknown as (data: Buffer) => Promise<{ text: string }>);
    const result = await pdfParse(buffer);
    const text = result.text.trim();
    if (!text) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Resume text could not be extracted.",
        400
      );
    }
    return text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    if (!text) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Resume text could not be extracted.",
        400
      );
    }
    return text;
  }

  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    const text = buffer.toString("utf8").trim();
    if (!text) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Resume text could not be extracted.",
        400
      );
    }
    return text;
  }

  throw new AppError("VALIDATION_ERROR", "Unsupported resume file.", 400);
}
