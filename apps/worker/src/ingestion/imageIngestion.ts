import type { Document } from "@vp/shared";
import type { IngestionInput } from "./index.js";

/**
 * Image OCR via tesseract.js. Vietnamese language data must be downloaded
 * by tesseract.js on first run — set TESSDATA_PATH or accept download.
 */
export async function ingestImage(input: IngestionInput): Promise<Document> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.default.recognize(input.data, "vie+eng", {
    logger: () => {},
  });
  const text = data.text ?? "";
  return {
    id: input.documentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sourceType: input.sourceType,
    pages: 1,
    ocrApplied: true,
    fullText: text,
    pageTexts: [{ page: 0, text }],
    tables: [],
  };
}
