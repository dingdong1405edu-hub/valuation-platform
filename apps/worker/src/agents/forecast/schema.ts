import { z } from "zod";
import {
  CompanyMeta,
  FinancialStatement,
  Forecast,
  IndustryAnalysis,
  RatioAnalysis,
} from "@vp/shared";

export const ForecastInput = z.object({
  companyMeta: CompanyMeta,
  financials: FinancialStatement,
  ratios: RatioAnalysis,
  industry: IndustryAnalysis,
  businessPlanSummary: z.string().optional(),
  forecastYears: z.number().int().min(3).max(10).default(5),
});

export const ForecastOutput = Forecast;
