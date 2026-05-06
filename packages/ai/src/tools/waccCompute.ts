import { z } from "zod";
import type { ToolImpl } from "../types.js";

const WaccInput = z.object({
  riskFreeRate: z.number().min(0).max(0.5),
  beta: z.number().min(-2).max(5),
  marketRiskPremium: z.number().min(0).max(0.3),
  costOfDebt: z.number().min(0).max(0.5),
  taxRate: z.number().min(0).max(0.5),
  debtRatio: z.number().min(0).max(1),
  sizePremium: z.number().min(0).max(0.1).default(0),
  countryRiskPremium: z.number().min(0).max(0.2).default(0),
});

export type WaccComputeOutput = {
  costOfEquity: number;
  afterTaxCostOfDebt: number;
  wacc: number;
  equityRatio: number;
};

export function waccCompute(input: z.infer<typeof WaccInput>): WaccComputeOutput {
  const v = WaccInput.parse(input);
  const costOfEquity =
    v.riskFreeRate + v.beta * v.marketRiskPremium + v.sizePremium + v.countryRiskPremium;
  const afterTaxCostOfDebt = v.costOfDebt * (1 - v.taxRate);
  const equityRatio = 1 - v.debtRatio;
  const wacc = equityRatio * costOfEquity + v.debtRatio * afterTaxCostOfDebt;
  return { costOfEquity, afterTaxCostOfDebt, wacc, equityRatio };
}

export const waccComputeTool: ToolImpl = {
  definition: {
    name: "wacc_compute",
    description:
      "Compute WACC via CAPM + after-tax cost of debt. Inputs: riskFreeRate, beta, marketRiskPremium, costOfDebt, taxRate, debtRatio (0-1), optional sizePremium, countryRiskPremium. Returns wacc, costOfEquity, afterTaxCostOfDebt.",
    input_schema: {
      type: "object",
      properties: {
        riskFreeRate: { type: "number" },
        beta: { type: "number" },
        marketRiskPremium: { type: "number" },
        costOfDebt: { type: "number" },
        taxRate: { type: "number" },
        debtRatio: { type: "number" },
        sizePremium: { type: "number", default: 0 },
        countryRiskPremium: { type: "number", default: 0 },
      },
      required: [
        "riskFreeRate",
        "beta",
        "marketRiskPremium",
        "costOfDebt",
        "taxRate",
        "debtRatio",
      ],
    },
  },
  async execute(input) {
    return waccCompute(input as z.infer<typeof WaccInput>);
  },
};
