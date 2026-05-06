import mammoth from "mammoth";
import type { Document } from "@vp/shared";
import type { IngestionInput } from "./index.js";

export async function ingestDocx(input: IngestionInput): Promise<Document> {
  const result = await mammoth.extractRawText({ buffer: input.data });
  const text = result.value ?? "";
  return {
    id: input.documentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sourceType: input.sourceType,
    pages: 1,
    ocrApplied: false,
    fullText: text,
    pageTexts: [{ page: 0, text }],
    tables: [],
  };
}
