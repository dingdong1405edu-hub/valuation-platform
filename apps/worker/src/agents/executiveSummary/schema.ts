import { z } from "zod";
import {
  CompanyMeta,
  ExecutiveSummary,
  FinancialStatement,
  InvestmentThesis,
} from "@vp/shared";
import { DcfResult, MultiplesResult, Valuation } from "@vp/shared";

export const ExecutiveSummaryInput = z.object({
  companyMeta: CompanyMeta,
  financials: FinancialStatement,
  thesis: InvestmentThesis,
  valuation: Valuation,
});

export const ExecutiveSummaryOutput = ExecutiveSummary;
