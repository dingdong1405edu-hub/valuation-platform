import { z } from "zod";
import { CompanyMeta, Recommendation } from "@vp/shared";
import { DcfResult, MultiplesResult, Valuation } from "@vp/shared";

export const RecommendationInput = z.object({
  companyMeta: CompanyMeta,
  valuation: Valuation,
  marketPrice: z.number().positive().nullable().default(null),
});

export const RecommendationOutput = Recommendation;
