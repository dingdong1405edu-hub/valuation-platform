import { z } from "zod";
import { Assumption, TracedNumber, InputManifest } from "./provenance.js";
import { FinancialStatement } from "./financials.js";
import { ComparableCompany } from "./valuation.js";

export const KeyDriver = z.object({
  label: z.string(),
  detail: z.string(),
});

export const ExecutiveSummary = z.object({
  companyName: z.string(),
  industry: z.string(),
  size: z.object({
    revenueLatest: TracedNumber,
    ebitdaLatest: TracedNumber,
    netIncomeLatest: TracedNumber,
  }),
  valuationRange: z.object({
    low: z.number(),
    mid: z.number(),
    high: z.number(),
    currency: z.string(),
  }),
  recommendation: z.object({
    fairValue: z.number(),
    upsideDownsidePct: z.number().nullable(),
    keyDrivers: z.array(KeyDriver).min(1).max(5),
    headline: z.string(),
  }),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type ExecutiveSummary = z.infer<typeof ExecutiveSummary>;

export const ThesisPoint = z.object({
  title: z.string(),
  category: z.enum([
    "growth",
    "competitive_advantage",
    "market_size",
    "margin",
    "scale",
    "other",
  ]),
  detail: z.string(),
  evidence: z.array(z.string()),
});

export const Catalyst = z.object({
  title: z.string(),
  type: z.enum([
    "market_expansion",
    "fundraising",
    "ipo",
    "ma",
    "product_launch",
    "regulatory",
    "other",
  ]),
  timing: z.string(),
  expectedImpact: z.string(),
});

export const RiskItem = z.object({
  title: z.string(),
  category: z.enum(["financial", "market", "legal", "operational", "tech", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  likelihood: z.enum(["low", "medium", "high"]),
  description: z.string(),
  mitigation: z.string().optional(),
});

export const InvestmentThesis = z.object({
  thesisPoints: z.array(ThesisPoint).min(3).max(5),
  catalysts: z.array(Catalyst),
  risks: z.array(RiskItem),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type InvestmentThesis = z.infer<typeof InvestmentThesis>;

export const Shareholder = z.object({
  name: z.string(),
  ownershipPct: z.number().nullable(),
  type: z.enum(["founder", "institutional", "retail", "strategic", "other"]).optional(),
});

export const LeaderProfile = z.object({
  name: z.string(),
  role: z.string(),
  background: z.string(),
  yearsExperience: z.number().int().nullable(),
  education: z.string().optional(),
});
export type LeaderProfile = z.infer<typeof LeaderProfile>;

export const Leadership = z.object({
  founders: z.array(LeaderProfile),
  executives: z.array(LeaderProfile),
  board: z.array(LeaderProfile),
  emittedAssumptions: z.array(Assumption),
});
export type Leadership = z.infer<typeof Leadership>;

export const ProductItem = z.object({
  name: z.string(),
  category: z.string().optional(),
  description: z.string(),
  pricePoint: z.string().optional(),
  targetSegment: z.string().optional(),
});

export const ProductCatalog = z.object({
  products: z.array(ProductItem),
  services: z.array(ProductItem),
  emittedAssumptions: z.array(Assumption),
});
export type ProductCatalog = z.infer<typeof ProductCatalog>;

export const WebProfile = z.object({
  positioning: z.string(),
  channels: z.array(z.string()),
  customerReviews: z
    .array(z.object({ source: z.string(), summary: z.string(), score: z.number().optional() }))
    .default([]),
  brandStrength: z.enum(["weak", "moderate", "strong", "unknown"]).default("unknown"),
  emittedAssumptions: z.array(Assumption),
});
export type WebProfile = z.infer<typeof WebProfile>;

export const BusinessPlan = z.object({
  horizonYears: z.number().int(),
  revenueTargets: z.array(
    z.object({ year: z.number().int(), value: z.number(), unit: z.string() }),
  ),
  strategy: z.string(),
  capexPlan: z.array(z.object({ year: z.number().int(), value: z.number() })).optional(),
  fundraisingPlan: z.string().optional(),
  emittedAssumptions: z.array(Assumption),
});
export type BusinessPlan = z.infer<typeof BusinessPlan>;

export const CompanyOverview = z.object({
  history: z.string(),
  shareholders: z.array(Shareholder),
  leadership: Leadership.optional(),
  businessModel: z.object({
    productsServices: z.string(),
    revenueModel: z.string(),
    unitEconomics: z.string().optional(),
  }),
  valueChain: z.object({
    input: z.string(),
    production: z.string(),
    distribution: z.string(),
    customer: z.string(),
  }),
  emittedAssumptions: z.array(Assumption),
});
export type CompanyOverview = z.infer<typeof CompanyOverview>;

export const Competitor = z.object({
  name: z.string(),
  marketSharePct: z.number().nullable(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  sourceUrl: z.string().url().optional(),
});

export const IndustryAnalysis = z.object({
  industryName: z.string(),
  country: z.string(),
  tam: TracedNumber,
  sam: TracedNumber,
  som: TracedNumber.optional(),
  cagr: TracedNumber,
  trends: z.array(z.string()),
  competitors: z.array(Competitor),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type IndustryAnalysis = z.infer<typeof IndustryAnalysis>;

export const RevenueBreakdown = z.object({
  byProduct: z.array(z.object({ label: z.string(), value: z.number(), pct: z.number() })),
  byChannel: z.array(z.object({ label: z.string(), value: z.number(), pct: z.number() })),
  byRegion: z.array(z.object({ label: z.string(), value: z.number(), pct: z.number() })),
});

export const BusinessAnalysis = z.object({
  fiscalYear: z.number().int(),
  revenueBreakdown: RevenueBreakdown,
  drivers: z.object({
    volume: z.string(),
    price: z.string(),
    mix: z.string(),
  }),
  margins: z.object({
    grossMargin: z.number(),
    ebitdaMargin: z.number(),
  }),
  customerInsight: z
    .object({
      topCustomerConcentrationPct: z.number().nullable(),
      churnPct: z.number().nullable(),
      ltvCacRatio: z.number().nullable(),
    })
    .optional(),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type BusinessAnalysis = z.infer<typeof BusinessAnalysis>;

export const FinancialAnalysis = z.object({
  statement: FinancialStatement,
  highlights: z.array(z.object({ label: z.string(), value: z.string(), comment: z.string() })),
  narrative: z.string(),
});
export type FinancialAnalysis = z.infer<typeof FinancialAnalysis>;

export const Recommendation = z.object({
  fairValue: z.object({
    point: z.number(),
    low: z.number(),
    high: z.number(),
    currency: z.string(),
    perShare: z.number().nullable(),
  }),
  upsideDownsidePct: z.number().nullable(),
  entryPrice: z.number().optional(),
  dealStructure: z.string().optional(),
  conditions: z.array(z.string()),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type Recommendation = z.infer<typeof Recommendation>;

export const RiskAssessment = z.object({
  risks: z.array(RiskItem).min(1),
  overallRisk: z.enum(["low", "medium", "high", "critical"]),
  narrative: z.string(),
  emittedAssumptions: z.array(Assumption),
});
export type RiskAssessment = z.infer<typeof RiskAssessment>;

export const Appendix = z.object({
  inputManifest: InputManifest,
  allAssumptions: z.array(Assumption),
  comparablesUsed: z.array(ComparableCompany),
  modelInputsTable: z.array(
    z.object({
      label: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: z.string().optional(),
      source: z.string(),
      confidence: z.string(),
      note: z.string(),
    }),
  ),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })),
});
export type Appendix = z.infer<typeof Appendix>;
