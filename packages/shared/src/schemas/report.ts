import { z } from "zod";
import {
  Appendix,
  BusinessAnalysis,
  CompanyOverview,
  ExecutiveSummary,
  FinancialAnalysis,
  IndustryAnalysis,
  InvestmentThesis,
  Recommendation,
  RiskAssessment,
} from "./sections.js";
import { Forecast, RatioAnalysis } from "./financials.js";
import { SensitivityGrid, Valuation } from "./valuation.js";

export const ReportMeta = z.object({
  companyName: z.string(),
  industry: z.string(),
  reportDate: z.string(),
  analystVersion: z.string(),
  currency: z.string(),
  qualityScore: z.number().min(0).max(100),
  disclaimers: z.array(z.string()),
});
export type ReportMeta = z.infer<typeof ReportMeta>;

export const FullReport = z.object({
  meta: ReportMeta,
  section1_executiveSummary: ExecutiveSummary,
  section2_investmentThesis: InvestmentThesis,
  section3_companyOverview: CompanyOverview,
  section4_industry: IndustryAnalysis,
  section5_business: BusinessAnalysis,
  section6_financials: FinancialAnalysis,
  section7_ratios: RatioAnalysis,
  section8_forecast: Forecast,
  section9_valuation: Valuation,
  section10_sensitivity: SensitivityGrid,
  section11_recommendation: Recommendation,
  section12_appendix: Appendix,
  section_risk: RiskAssessment,
});
export type FullReport = z.infer<typeof FullReport>;
