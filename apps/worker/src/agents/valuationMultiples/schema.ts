import { z } from "zod";
import { CompanyMeta, FinancialStatement, MultiplesResult } from "@vp/shared";

export const ValuationMultiplesInput = z.object({
  companyMeta: CompanyMeta,
  financials: FinancialStatement,
  netDebt: z.number().default(0),
});

export const ValuationMultiplesOutput = MultiplesResult;
