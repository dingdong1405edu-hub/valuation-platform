import { z } from "zod";
import { CompanyMeta, DcfResult, Forecast } from "@vp/shared";

export const ValuationDcfInput = z.object({
  companyMeta: CompanyMeta,
  forecast: Forecast,
  netDebt: z.number().default(0),
  sharesOutstanding: z.number().positive().nullable().default(null),
  industryHints: z
    .object({
      typicalBeta: z.number().optional(),
      typicalDebtRatio: z.number().optional(),
    })
    .optional(),
});
export type ValuationDcfInput = z.infer<typeof ValuationDcfInput>;

export const ValuationDcfOutput = DcfResult;
export type ValuationDcfOutput = z.infer<typeof ValuationDcfOutput>;
