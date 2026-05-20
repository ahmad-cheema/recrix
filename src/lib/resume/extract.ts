import "server-only";

import { spawn } from "node:child_process";
import mammoth from "mammoth";
import { AppError } from "@/lib/auth/errors";
import { getFileExtension } from "@/lib/resume/validation";

function inferMimeFromExtension(fileName: string): string {
  const extension = getFileExtension(fileName);
  if (extension === ".pdf") {
    return "application/pdf";
  }
  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === ".txt") {
    return "text/plain";
  }
  return "application/octet-stream";
}

function decodePdfEscapes(input: string): string {
  return input
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) =>
      String.fromCharCode(parseInt(octal, 8))
    )
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractPdfTextHeuristic(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];

  const singleTextMatches = raw.match(/\((?:\\.|[^\\()])*\)\s*Tj/g) ?? [];
  for (const match of singleTextMatches) {
    const textMatch = match.match(/\((.*)\)\s*Tj$/);
    if (textMatch?.[1]) {
      chunks.push(decodePdfEscapes(textMatch[1]));
    }
  }

  const arrayTextMatches = raw.match(/\[[\s\S]*?\]\s*TJ/g) ?? [];
  for (const match of arrayTextMatches) {
    const inner = match.replace(/\]\s*TJ$/, "");
    const parts = inner.match(/\((?:\\.|[^\\()])*\)/g) ?? [];
    for (const part of parts) {
      chunks.push(decodePdfEscapes(part.slice(1, -1)));
    }
  }

  if (!chunks.length) {
    const longPrintable =
      raw.match(/[A-Za-z][A-Za-z0-9 ,.;:@\/()_+\-&]{24,}/g) ?? [];
    chunks.push(...longPrintable);
  }

  const merged = chunks
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 1);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const text of merged) {
    if (seen.has(text)) {
      continue;
    }
    seen.add(text);
    unique.push(text);
  }

  return unique.join("\n").trim();
}

async function extractPdfTextWithPython(buffer: Buffer): Promise<string> {
  const pythonScript = [
    "import base64, io, sys",
    "try:",
    "    from pypdf import PdfReader",
    "except Exception:",
    "    from PyPDF2 import PdfReader",
    "encoded = sys.stdin.buffer.read()",
    "if not encoded:",
    "    raise RuntimeError('No PDF bytes provided')",
    "raw = base64.b64decode(encoded)",
    "reader = PdfReader(io.BytesIO(raw))",
    "pages = []",
    "for page in reader.pages:",
    "    txt = ''",
    "    try:",
    "        txt = page.extract_text() or ''",
    "    except Exception:",
    "        txt = ''",
    "    txt = ' '.join(txt.split())",
    "    if txt:",
    "        pages.append(txt)",
    "sys.stdout.write('\\n\\n'.join(pages))",
  ].join("\n");

  return await new Promise<string>((resolve, reject) => {
    const child = spawn("python", ["-c", pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Python PDF extraction timed out."));
    }, 20000);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr.trim() || `Python exited with code ${code}`));
    });

    child.stdin.end(buffer.toString("base64"));
  });
}

async function extractPdfTextWithOpenAIFile(buffer: Buffer, fileName: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError("INTERNAL_ERROR", "Missing OpenAI API key.", 500);
  }

  const content = [
    {
      type: "text",
      text: "Extract every readable resume text from this PDF in natural reading order. Return plain text only, with no markdown and no commentary.",
    },
    {
      type: "file",
      file: {
        filename: fileName,
        file_data: `data:application/pdf;base64,${buffer.toString("base64")}`,
      },
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AppError(
      "INTERNAL_ERROR",
      `AI PDF fallback failed. ${detail}`.trim(),
      500
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type?: string;
              text?: string;
            }>
          | null;
      };
    }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  let text = "";
  if (typeof rawContent === "string") {
    text = rawContent;
  } else if (Array.isArray(rawContent)) {
    text = rawContent
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n");
  }

  text = text.trim();
  if (!text) {
    throw new AppError("VALIDATION_ERROR", "AI PDF fallback returned empty text.", 400);
  }

  return text;
}

export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  const mimeType = file.type || inferMimeFromExtension(file.name);

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pythonText = await extractPdfTextWithPython(buffer).catch((error) => {
      console.error("resume_python_pdf_parse_failed", {
        fileName: file.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return "";
    });
    if (pythonText.trim()) {
      return pythonText.trim();
    }

    const aiText = await extractPdfTextWithOpenAIFile(buffer, file.name).catch((error) => {
      console.error("resume_openai_pdf_fallback_failed", {
        fileName: file.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return "";
    });
    if (aiText.trim()) {
      return aiText.trim();
    }

    const heuristicText = extractPdfTextHeuristic(buffer);
    if (heuristicText.trim()) {
      return heuristicText.trim();
    }

    throw new AppError("VALIDATION_ERROR", "Resume text could not be extracted from PDF.", 400);
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
        "Resume text could not be extracted from DOCX.",
        400
      );
    }
    return text;
  }

  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    const text = buffer.toString("utf8").trim();
    if (!text) {
      throw new AppError("VALIDATION_ERROR", "Resume text could not be extracted.", 400);
    }
    return text;
  }

  throw new AppError("VALIDATION_ERROR", "Unsupported resume file.", 400);
}
