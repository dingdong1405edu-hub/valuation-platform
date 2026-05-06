import { z } from "zod";
import {
  BusinessAnalysis,
  CompanyMeta,
  CompanyOverview,
  FinancialStatement,
  Forecast,
  IndustryAnalysis,
  InvestmentThesis,
  RatioAnalysis,
  RiskAssessment,
} from "@vp/shared";
import { DcfResult, MultiplesResult } from "@vp/shared";

export const InvestmentThesisInput = z.object({
  companyMeta: CompanyMeta,
  companyOverview: CompanyOverview,
  industry: IndustryAnalysis,
  business: BusinessAnalysis,
  financials: FinancialStatement,
  ratios: RatioAnalysis,
  forecast: Forecast,
  dcf: DcfResult,
  multiples: MultiplesResult,
  risk: RiskAssessment,
});

export const InvestmentThesisOutput = InvestmentThesis;
