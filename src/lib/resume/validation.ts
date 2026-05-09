import {
  MAX_RESUME_FILE_SIZE,
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_ALLOWED_MIME_TYPES,
} from "./constants";

export type ResumeValidationResult =
  | { ok: true; extension: string; mimeType: string }
  | { ok: false; error: string };

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index === -1) {
    return "";
  }
  return fileName.slice(index).toLowerCase();
}

export function validateResumeFile(file: {
  name: string;
  size: number;
  type?: string;
}): ResumeValidationResult {
  if (!file.size) {
    return { ok: false, error: "The selected file is empty." };
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return { ok: false, error: "File exceeds the 5 MB limit." };
  }

  const extension = getFileExtension(file.name);
  const mimeType = file.type ?? "";
  const extensionAllowed = RESUME_ALLOWED_EXTENSIONS.includes(extension);
  const mimeAllowed = mimeType
    ? RESUME_ALLOWED_MIME_TYPES.includes(mimeType)
    : false;

  if (!extensionAllowed && !mimeAllowed) {
    return {
      ok: false,
      error: "Only PDF, DOCX, or TXT files are supported.",
    };
  }

  return { ok: true, extension, mimeType };
}
