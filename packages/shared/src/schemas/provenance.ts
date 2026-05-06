import { z } from "zod";

export const SourceType = z.enum([
  "user_input",
  "extracted",
  "web",
  "computed",
  "assumed",
]);
export type SourceType = z.infer<typeof SourceType>;

export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

export const DocumentRef = z.object({
  documentId: z.string(),
  page: z.number().int().nonnegative().optional(),
  table: z.string().optional(),
  cell: z.string().optional(),
});
export type DocumentRef = z.infer<typeof DocumentRef>;

export const WebRef = z.object({
  url: z.string().url(),
  accessedAt: z.string(),
  snippet: z.string().optional(),
});
export type WebRef = z.infer<typeof WebRef>;

export const TracedNumber = z.object({
  value: z.number(),
  unit: z.string(),
  source: SourceType,
  confidence: Confidence,
  note: z.string().min(1),
  documentRef: DocumentRef.optional(),
  webRef: WebRef.optional(),
  formula: z.string().optional(),
});
export type TracedNumber = z.infer<typeof TracedNumber>;

export const TracedString = z.object({
  value: z.string(),
  source: SourceType,
  confidence: Confidence,
  note: z.string().min(1),
  documentRef: DocumentRef.optional(),
  webRef: WebRef.optional(),
});
export type TracedString = z.infer<typeof TracedString>;

export const Assumption = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
  basis: z.string().min(1),
  reason: z.string().min(1),
  alternatives: z
    .array(
      z.object({
        value: z.union([z.number(), z.string(), z.boolean()]),
        basis: z.string(),
      }),
    )
    .optional(),
  emittedBy: z.string().min(1),
  affectsSection: z.array(z.number().int().min(1).max(12)),
});
export type Assumption = z.infer<typeof Assumption>;

export const InputSourceTag = z.enum([
  "financial_statements",
  "website",
  "fanpage",
  "catalogue_brochure",
  "company_profile",
  "business_plan",
  "ceo_cv",
  "crm",
  "accounting_system",
  "erp",
  "manual_input",
]);
export type InputSourceTag = z.infer<typeof InputSourceTag>;

export const ProvidedSource = z.object({
  sourceType: InputSourceTag,
  documentIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type ProvidedSource = z.infer<typeof ProvidedSource>;

export const MissingSource = z.object({
  sourceType: z.string(),
  impactedFields: z.array(z.string()),
  fallbackStrategy: z.string(),
  severity: z.enum(["blocking", "major", "minor"]),
});
export type MissingSource = z.infer<typeof MissingSource>;

export const CompanyMeta = z.object({
  name: z.string().min(1),
  taxId: z.string().optional(),
  industry: z.string().min(1),
  country: z.string().default("VN"),
  sizeHint: z.enum(["micro", "small", "medium", "large"]).optional(),
  reportDate: z.string().optional(),
});
export type CompanyMeta = z.infer<typeof CompanyMeta>;

export const InputManifest = z.object({
  companyMeta: CompanyMeta,
  provided: z.array(ProvidedSource),
  missing: z.array(MissingSource),
  qualityScore: z.number().min(0).max(100),
  warnings: z.array(z.string()),
});
export type InputManifest = z.infer<typeof InputManifest>;
