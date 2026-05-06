import { z } from "zod";
import { Assumption, Confidence, SourceType } from "./provenance.js";

export const Currency = z.enum(["VND", "USD", "EUR"]);
export type Currency = z.infer<typeof Currency>;

export const Unit = z.enum(["raw", "thousand", "million", "billion"]);
export type Unit = z.infer<typeof Unit>;

export const CellProvenance = z.object({
  source: SourceType,
  confidence: Confidence,
  note: z.string().min(1),
  documentRef: z
    .object({
      documentId: z.string(),
      page: z.number().int().nonnegative().optional(),
      table: z.string().optional(),
    })
    .optional(),
  formula: z.string().optional(),
});
export type CellProvenance = z.infer<typeof CellProvenance>;

export const IncomeStatement = z.object({
  revenue: z.array(z.number()),
  cogs: z.array(z.number()),
  grossProfit: z.array(z.number()),
  opex: z.array(z.number()),
  ebitda: z.array(z.number()),
  ebit: z.array(z.number()),
  interestExpense: z.array(z.number()),
  tax: z.array(z.number()),
  netIncome: z.array(z.number()),
});
export type IncomeStatement = z.infer<typeof IncomeStatement>;

export const BalanceSheet = z.object({
  totalAssets: z.array(z.number()),
  currentAssets: z.array(z.number()),
  cash: z.array(z.number()),
  inventory: z.array(z.number()),
  receivables: z.array(z.number()),
  totalLiabilities: z.array(z.number()),
  currentLiabilities: z.array(z.number()),
  longTermDebt: z.array(z.number()),
  equity: z.array(z.number()),
});
export type BalanceSheet = z.infer<typeof BalanceSheet>;

export const CashFlowStatement = z.object({
  cfo: z.array(z.number()),
  cfi: z.array(z.number()),
  cff: z.array(z.number()),
  capex: z.array(z.number()),
  fcf: z.array(z.number()),
});
export type CashFlowStatement = z.infer<typeof CashFlowStatement>;

export const FinancialStatement = z.object({
  currency: Currency,
  unit: Unit,
  fiscalYears: z.array(z.number().int()).min(1),
  incomeStatement: IncomeStatement,
  balanceSheet: BalanceSheet,
  cashFlow: CashFlowStatement,
  cellProvenance: z.record(z.string(), CellProvenance),
  assumptions: z.array(Assumption),
});
export type FinancialStatement = z.infer<typeof FinancialStatement>;

export const RatioAnalysis = z.object({
  fiscalYears: z.array(z.number().int()),
  growth: z.object({
    revenueYoY: z.array(z.number()),
    revenueCagr: z.number().nullable(),
    netIncomeYoY: z.array(z.number()),
    netIncomeCagr: z.number().nullable(),
  }),
  profitability: z.object({
    grossMargin: z.array(z.number()),
    ebitdaMargin: z.array(z.number()),
    netMargin: z.array(z.number()),
    roe: z.array(z.number()),
    roa: z.array(z.number()),
    roic: z.array(z.number().nullable()),
  }),
  leverage: z.object({
    debtToEquity: z.array(z.number()),
    debtToEbitda: z.array(z.number()),
    interestCoverage: z.array(z.number().nullable()),
  }),
  liquidity: z.object({
    currentRatio: z.array(z.number()),
    quickRatio: z.array(z.number()),
  }),
  efficiency: z.object({
    assetTurnover: z.array(z.number()),
    inventoryDays: z.array(z.number().nullable()),
    receivableDays: z.array(z.number().nullable()),
  }),
  assumptions: z.array(Assumption),
});
export type RatioAnalysis = z.infer<typeof RatioAnalysis>;

export const ForecastYear = z.object({
  year: z.number().int(),
  revenue: z.number(),
  cogs: z.number(),
  opex: z.number(),
  ebitda: z.number(),
  ebit: z.number(),
  tax: z.number(),
  capex: z.number(),
  workingCapitalChange: z.number(),
  fcf: z.number(),
});
export type ForecastYear = z.infer<typeof ForecastYear>;

export const Forecast = z.object({
  currency: Currency,
  unit: Unit,
  basisYears: z.array(z.number().int()),
  forecastYears: z.array(ForecastYear).min(3).max(10),
  drivers: z.object({
    revenueGrowth: z.array(z.number()),
    grossMargin: z.array(z.number()),
    ebitdaMargin: z.array(z.number()),
    capexPctRevenue: z.array(z.number()),
    workingCapitalPctRevenue: z.array(z.number()),
  }),
  rationale: z.string(),
  assumptions: z.array(Assumption),
});
export type Forecast = z.infer<typeof Forecast>;
