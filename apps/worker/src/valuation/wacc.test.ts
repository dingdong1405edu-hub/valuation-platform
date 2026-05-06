import { describe, expect, it } from "vitest";
import { waccCompute } from "./wacc.js";

describe("waccCompute", () => {
  it("matches CAPM + after-tax cost of debt", () => {
    const r = waccCompute({
      riskFreeRate: 0.04,
      beta: 1.2,
      marketRiskPremium: 0.085,
      costOfDebt: 0.08,
      taxRate: 0.2,
      debtRatio: 0.3,
    });
    // Re = 0.04 + 1.2 * 0.085 = 0.142
    // Rd_after_tax = 0.08 * 0.8 = 0.064
    // WACC = 0.7 * 0.142 + 0.3 * 0.064 = 0.0994 + 0.0192 = 0.1186
    expect(r.costOfEquity).toBeCloseTo(0.142, 6);
    expect(r.afterTaxCostOfDebt).toBeCloseTo(0.064, 6);
    expect(r.wacc).toBeCloseTo(0.1186, 6);
    expect(r.equityRatio).toBeCloseTo(0.7, 6);
  });

  it("includes size and country premia in cost of equity", () => {
    const r = waccCompute({
      riskFreeRate: 0.04,
      beta: 1,
      marketRiskPremium: 0.06,
      costOfDebt: 0.1,
      taxRate: 0.25,
      debtRatio: 0.4,
      sizePremium: 0.02,
      countryRiskPremium: 0.03,
    });
    expect(r.costOfEquity).toBeCloseTo(0.04 + 0.06 + 0.02 + 0.03, 6);
  });
});
