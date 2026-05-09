declare module "mammoth" {
  type Buffer = import("buffer").Buffer;

  export function extractRawText(options: { buffer: Buffer }): Promise<{
    value: string;
  }>;
}
