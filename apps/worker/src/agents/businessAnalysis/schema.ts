import { z } from "zod";
import { BusinessAnalysis, FinancialStatement, InputManifest } from "@vp/shared";

export const BusinessAnalysisInput = z.object({
  inputManifest: InputManifest,
  financials: FinancialStatement,
  productCatalogSummary: z.string().optional(),
  crmInsightSummary: z.string().optional(),
  erpMetricsSummary: z.string().optional(),
  documents: z.array(
    z.object({ id: z.string(), filename: z.string(), text: z.string() }),
  ),
});

export const BusinessAnalysisOutput = BusinessAnalysis;
