import { z } from "zod";
import { Assumption, TracedNumber } from "./provenance.js";
import { Currency } from "./financials.js";

export const WaccComponents = z.object({
  riskFreeRate: TracedNumber,
  beta: TracedNumber,
  marketRiskPremium: TracedNumber,
  costOfDebt: TracedNumber,
  taxRate: TracedNumber,
  debtRatio: TracedNumber,
  sizePremium: TracedNumber.optional(),
  countryRiskPremium: TracedNumber.optional(),
});
export type WaccComponents = z.infer<typeof WaccComponents>;

export const DcfAssumptions = z.object({
  wacc: TracedNumber,
  terminalGrowth: TracedNumber,
  forecastYears: z.number().int().min(3).max(10),
  taxRate: TracedNumber,
  waccComponents: WaccComponents,
});
export type DcfAssumptions = z.infer<typeof DcfAssumptions>;

export const DcfResult = z.object({
  assumptions: DcfAssumptions,
  fcfForecast: z.array(z.object({ year: z.number().int(), fcf: z.number() })),
  pvFcf: z.array(z.number()),
  terminalValue: z.number(),
  pvTerminal: z.number(),
  enterpriseValue: z.number(),
  netDebt: TracedNumber,
  equityValue: z.number(),
  fairValuePerShare: z.number().nullable(),
  sharesOutstanding: z.number().nullable(),
  currency: Currency,
  emittedAssumptions: z.array(Assumption),
});
export type DcfResult = z.infer<typeof DcfResult>;

export const ComparableCompany = z.object({
  ticker: z.string(),
  name: z.string(),
  country: z.string(),
  evEbitda: z.number().nullable(),
  pe: z.number().nullable(),
  pb: z.number().nullable(),
  marketCap: z.number().nullable(),
  sourceUrl: z.string().url().optional(),
  source: z.enum(["seed", "web", "user"]).default("web"),
  asOfDate: z.string().optional(),
});
export type ComparableCompany = z.infer<typeof ComparableCompany>;

export const MultiplesResult = z.object({
  comparables: z.array(ComparableCompany),
  appliedMultiples: z.object({
    evEbitdaMedian: z.number(),
    peMedian: z.number(),
    pbMedian: z.number(),
    evEbitdaP25: z.number().optional(),
    evEbitdaP75: z.number().optional(),
  }),
  targetMetrics: z.object({
    ebitda: z.number(),
    netIncome: z.number(),
    bookValue: z.number(),
  }),
  impliedEquityValue: z.object({
    fromEvEbitda: z.number(),
    fromPe: z.number(),
    fromPb: z.number(),
  }),
  netDebt: z.number(),
  currency: Currency,
  emittedAssumptions: z.array(Assumption),
});
export type MultiplesResult = z.infer<typeof MultiplesResult>;

export const FootballField = z.object({
  methods: z.array(
    z.object({
      label: z.string(),
      low: z.number(),
      mid: z.number(),
      high: z.number(),
    }),
  ),
  finalRange: z.object({ low: z.number(), mid: z.number(), high: z.number() }),
  currency: Currency,
});
export type FootballField = z.infer<typeof FootballField>;

export const SensitivityGrid = z.object({
  axisX: z.object({
    label: z.string(),
    values: z.array(z.number()),
  }),
  axisY: z.object({
    label: z.string(),
    values: z.array(z.number()),
  }),
  cells: z.array(z.array(z.number())),
  centerCell: z.object({ x: z.number().int(), y: z.number().int() }),
  currency: Currency,
  metric: z.enum(["equityValue", "fairValuePerShare", "enterpriseValue"]),
});
export type SensitivityGrid = z.infer<typeof SensitivityGrid>;

export const Valuation = z.object({
  dcf: DcfResult,
  multiples: MultiplesResult,
  footballField: FootballField,
  recommendedFairValue: z.object({
    low: z.number(),
    mid: z.number(),
    high: z.number(),
    methodWeights: z.record(z.string(), z.number()),
    rationale: z.string(),
  }),
});
export type Valuation = z.infer<typeof Valuation>;
