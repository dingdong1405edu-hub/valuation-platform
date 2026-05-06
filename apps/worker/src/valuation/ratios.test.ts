import { describe, expect, it } from "vitest";
import { computeRatios } from "./ratios.js";
import type { FinancialStatement } from "@vp/shared";

const baseStatement: FinancialStatement = {
  currency: "VND",
  unit: "billion",
  fiscalYears: [2022, 2023, 2024],
  incomeStatement: {
    revenue: [100, 120, 150],
    cogs: [60, 70, 80],
    grossProfit: [40, 50, 70],
    opex: [20, 22, 30],
    ebitda: [25, 32, 45],
    ebit: [20, 28, 40],
    interestExpense: [2, 2, 3],
    tax: [3, 5, 7],
    netIncome: [15, 21, 30],
  },
  balanceSheet: {
    totalAssets: [200, 230, 280],
    currentAssets: [80, 100, 120],
    cash: [10, 15, 20],
    inventory: [30, 35, 40],
    receivables: [25, 30, 35],
    totalLiabilities: [120, 130, 150],
    currentLiabilities: [50, 55, 60],
    longTermDebt: [50, 50, 60],
    equity: [80, 100, 130],
  },
  cashFlow: {
    cfo: [20, 25, 35],
    cfi: [-15, -18, -25],
    cff: [-2, -5, -8],
    capex: [10, 12, 15],
    fcf: [10, 13, 20],
  },
  cellProvenance: {},
  assumptions: [],
};

describe("computeRatios", () => {
  it("computes ROE = NetIncome / Equity per year", () => {
    const r = computeRatios(baseStatement);
    expect(r.profitability.roe[0]).toBeCloseTo(15 / 80, 6);
    expect(r.profitability.roe[1]).toBeCloseTo(21 / 100, 6);
    expect(r.profitability.roe[2]).toBeCloseTo(30 / 130, 6);
  });

  it("computes revenue CAGR", () => {
    const r = computeRatios(baseStatement);
    // (150/100)^(1/2) - 1
    expect(r.growth.revenueCagr).toBeCloseTo(Math.pow(150 / 100, 1 / 2) - 1, 6);
  });

  it("computes year-over-year growth", () => {
    const r = computeRatios(baseStatement);
    expect(r.growth.revenueYoY).toEqual([0.2, 0.25]);
  });

  it("computes ebitda margin", () => {
    const r = computeRatios(baseStatement);
    expect(r.profitability.ebitdaMargin[0]).toBeCloseTo(25 / 100, 6);
    expect(r.profitability.ebitdaMargin[2]).toBeCloseTo(45 / 150, 6);
  });

  it("computes debt-to-equity", () => {
    const r = computeRatios(baseStatement);
    expect(r.leverage.debtToEquity[0]).toBeCloseTo(120 / 80, 6);
  });

  it("computes inventory days", () => {
    const r = computeRatios(baseStatement);
    expect(r.efficiency.inventoryDays[0]).toBeCloseTo((30 / 60) * 365, 6);
  });
});
