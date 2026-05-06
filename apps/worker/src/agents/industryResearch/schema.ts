import { z } from "zod";
import { CompanyMeta, IndustryAnalysis, InputManifest } from "@vp/shared";

export const IndustryResearchInput = z.object({
  companyMeta: CompanyMeta,
  inputManifest: InputManifest,
  webProfileSummary: z.string().optional(),
});
export type IndustryResearchInput = z.infer<typeof IndustryResearchInput>;

export const IndustryResearchOutput = IndustryAnalysis;
