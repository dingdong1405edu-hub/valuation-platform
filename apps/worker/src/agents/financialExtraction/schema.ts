import { z } from "zod";
import { CompanyMeta, FinancialStatement } from "@vp/shared";

export const FinancialExtractionInput = z.object({
  companyMeta: CompanyMeta,
  documents: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        sourceType: z.string(),
        text: z.string(),
        tables: z.array(
          z.object({
            id: z.string(),
            page: z.number().int().nonnegative().optional(),
            caption: z.string().optional(),
            rows: z.array(z.array(z.string())),
          }),
        ),
      }),
    )
    .min(1),
});
export type FinancialExtractionInput = z.infer<typeof FinancialExtractionInput>;

export const FinancialExtractionOutput = FinancialStatement;
export type FinancialExtractionOutput = z.infer<typeof FinancialExtractionOutput>;
