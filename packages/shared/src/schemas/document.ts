import { z } from "zod";
import { InputSourceTag } from "./provenance.js";

export const TableCell = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  text: z.string(),
});

export const ExtractedTable = z.object({
  id: z.string(),
  page: z.number().int().nonnegative().optional(),
  caption: z.string().optional(),
  rows: z.array(z.array(z.string())),
});
export type ExtractedTable = z.infer<typeof ExtractedTable>;

export const DocumentPage = z.object({
  page: z.number().int().nonnegative(),
  text: z.string(),
});

export const Document = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sourceType: InputSourceTag,
  pages: z.number().int().nonnegative(),
  ocrApplied: z.boolean(),
  fullText: z.string(),
  pageTexts: z.array(DocumentPage),
  tables: z.array(ExtractedTable),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Document = z.infer<typeof Document>;

export const CrmExport = z.object({
  documentId: z.string(),
  contacts: z.array(z.record(z.string(), z.unknown())).default([]),
  deals: z.array(z.record(z.string(), z.unknown())).default([]),
  pipeline: z.array(z.record(z.string(), z.unknown())).default([]),
  summary: z.object({
    totalContacts: z.number().int(),
    totalDeals: z.number().int(),
    totalPipelineValue: z.number().nullable(),
    currency: z.string().default("VND"),
  }),
});
export type CrmExport = z.infer<typeof CrmExport>;

export const AccountingExport = z.object({
  documentId: z.string(),
  software: z.string().optional(),
  fiscalPeriods: z.array(z.string()),
  glAccounts: z.array(z.record(z.string(), z.unknown())).default([]),
  monthlyPL: z.array(
    z.object({
      period: z.string(),
      revenue: z.number(),
      cogs: z.number().optional(),
      opex: z.number().optional(),
      netIncome: z.number().optional(),
    }),
  ).default([]),
  notes: z.string().optional(),
});
export type AccountingExport = z.infer<typeof AccountingExport>;

export const ErpExport = z.object({
  documentId: z.string(),
  system: z.string().optional(),
  skuVolume: z.array(
    z.object({
      sku: z.string(),
      name: z.string().optional(),
      period: z.string(),
      volume: z.number(),
      revenue: z.number().optional(),
    }),
  ).default([]),
  inventory: z.array(z.record(z.string(), z.unknown())).default([]),
  payables: z.array(z.record(z.string(), z.unknown())).default([]),
  receivables: z.array(z.record(z.string(), z.unknown())).default([]),
});
export type ErpExport = z.infer<typeof ErpExport>;
