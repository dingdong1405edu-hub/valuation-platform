import { z } from "zod";
import type { Document } from "@vp/shared";
import type { ToolImpl } from "../types.js";

const ReadInput = z.object({
  documentId: z.string(),
  pageStart: z.number().int().min(0).optional(),
  pageEnd: z.number().int().min(0).optional(),
  maxChars: z.number().int().min(500).max(80_000).default(20_000),
});

type DocResolver = (id: string) => Promise<Document | null>;
let resolver: DocResolver | null = null;

export function setDocumentResolver(r: DocResolver | null): void {
  resolver = r;
}

export const readDocumentTool: ToolImpl = {
  definition: {
    name: "read_document",
    description:
      "Read text content of a previously ingested document by id. Optional pageStart/pageEnd to focus. Returns text and table summaries.",
    input_schema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        pageStart: { type: "integer" },
        pageEnd: { type: "integer" },
        maxChars: { type: "integer", default: 20_000 },
      },
      required: ["documentId"],
    },
  },
  async execute(input) {
    const args = ReadInput.parse(input);
    if (!resolver) throw new Error("Document resolver not registered");
    const doc = await resolver(args.documentId);
    if (!doc) return { error: `document ${args.documentId} not found` };
    let text: string;
    if (args.pageStart !== undefined || args.pageEnd !== undefined) {
      const start = args.pageStart ?? 0;
      const end = args.pageEnd ?? doc.pages;
      text = doc.pageTexts
        .filter((p) => p.page >= start && p.page < end)
        .map((p) => `--- page ${p.page} ---\n${p.text}`)
        .join("\n\n");
    } else {
      text = doc.fullText;
    }
    return {
      documentId: doc.id,
      filename: doc.filename,
      sourceType: doc.sourceType,
      pages: doc.pages,
      text: text.slice(0, args.maxChars),
      tables: doc.tables.map((t) => ({
        id: t.id,
        page: t.page,
        caption: t.caption,
        preview: t.rows.slice(0, 3),
        rowCount: t.rows.length,
      })),
    };
  },
};
