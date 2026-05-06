import { extname } from "node:path";
import type { Document } from "@vp/shared";
import { ingestPdf } from "./pdfIngestion.js";
import { ingestDocx } from "./docIngestion.js";
import { ingestExcel } from "./excelIngestion.js";
import { ingestImage } from "./imageIngestion.js";

export type IngestionInput = {
  documentId: string;
  filename: string;
  mimeType: string;
  data: Buffer;
  sourceType: Document["sourceType"];
};

export async function ingest(input: IngestionInput): Promise<Document> {
  const ext = extname(input.filename).toLowerCase();
  const mt = input.mimeType.toLowerCase();
  if (mt.includes("pdf") || ext === ".pdf") return ingestPdf(input);
  if (mt.includes("wordprocessingml") || ext === ".docx") return ingestDocx(input);
  if (
    mt.includes("spreadsheetml") ||
    mt.includes("excel") ||
    ext === ".xlsx" ||
    ext === ".xls" ||
    ext === ".csv"
  )
    return ingestExcel(input);
  if (mt.startsWith("image/") || [".png", ".jpg", ".jpeg"].includes(ext))
    return ingestImage(input);
  throw new Error(`Unsupported file type: ${input.mimeType} (${input.filename})`);
}

export * from "./pdfIngestion.js";
export * from "./docIngestion.js";
export * from "./excelIngestion.js";
export * from "./imageIngestion.js";
