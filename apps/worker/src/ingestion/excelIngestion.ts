import * as XLSX from "xlsx";
import type { Document, ExtractedTable } from "@vp/shared";
import type { IngestionInput } from "./index.js";

export async function ingestExcel(input: IngestionInput): Promise<Document> {
  const wb = XLSX.read(input.data, { type: "buffer" });
  const tables: ExtractedTable[] = [];
  const textChunks: string[] = [];

  wb.SheetNames.forEach((sheetName, idx) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    const rowsRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });
    const rows = rowsRaw.map((row) => {
      const arr = row as unknown as unknown[];
      return arr.map((c) => (c === null || c === undefined ? "" : String(c)));
    });

    tables.push({
      id: `sheet_${idx}_${sheetName}`,
      caption: sheetName,
      rows,
    });
    textChunks.push(`=== ${sheetName} ===\n${rows.map((r) => r.join("\t")).join("\n")}`);
  });

  const fullText = textChunks.join("\n\n");

  return {
    id: input.documentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sourceType: input.sourceType,
    pages: tables.length || 1,
    ocrApplied: false,
    fullText,
    pageTexts: [{ page: 0, text: fullText }],
    tables,
  };
}
