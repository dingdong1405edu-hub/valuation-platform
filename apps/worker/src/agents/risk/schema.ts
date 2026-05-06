import { z } from "zod";
import {
  BusinessAnalysis,
  CompanyMeta,
  FinancialStatement,
  IndustryAnalysis,
  RatioAnalysis,
  RiskAssessment,
} from "@vp/shared";

export const RiskInput = z.object({
  companyMeta: CompanyMeta,
  financials: FinancialStatement,
  ratios: RatioAnalysis,
  industry: IndustryAnalysis,
  business: BusinessAnalysis,
});

export const RiskOutput = RiskAssessment;
