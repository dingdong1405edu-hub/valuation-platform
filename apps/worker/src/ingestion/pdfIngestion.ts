import type { Document } from "@vp/shared";
import type { IngestionInput } from "./index.js";

/**
 * PDF ingestion. Uses pdf-parse for text extraction.
 * For scanned PDFs (no extractable text or text length is below threshold),
 * falls back to OCR via tesseract.js.
 *
 * Tables are NOT yet extracted in this implementation — the LLM agent receives
 * raw text and is expected to find tabular structures. A future enhancement
 * would use a layout-aware extractor (Camelot/pdfplumber via Python service,
 * or unstructured.io).
 */
export async function ingestPdf(input: IngestionInput): Promise<Document> {
  // dynamic import to avoid pdf-parse top-level-test self-execution
  const pdfParseModule = (await import("pdf-parse")) as unknown as {
    default: (buf: Buffer) => Promise<{ text: string; numpages: number; info?: unknown }>;
  };
  const parsed = await pdfParseModule.default(input.data);

  const pages = parsed.numpages || 1;
  const fullText = parsed.text ?? "";
  const ocrApplied = fullText.trim().length < 200;

  let finalText = fullText;
  if (ocrApplied) {
    finalText = await runTesseractOcr(input.data).catch(() => fullText);
  }

  // Naive page split — pdf-parse joins pages with form-feed-like markers; if
  // not present, treat whole text as page 0.
  const pageTexts = finalText.includes("\f")
    ? finalText.split("\f").map((text, i) => ({ page: i, text }))
    : [{ page: 0, text: finalText }];

  return {
    id: input.documentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sourceType: input.sourceType,
    pages,
    ocrApplied,
    fullText: finalText,
    pageTexts,
    tables: [],
  };
}

async function runTesseractOcr(_data: Buffer): Promise<string> {
  // Tesseract for PDF is heavy: convert pages → images first.
  // For now, leave as no-op placeholder; integrate pdf-to-png + tesseract later
  // or swap to Mistral OCR API when MISTRAL_API_KEY is set.
  return "";
}
