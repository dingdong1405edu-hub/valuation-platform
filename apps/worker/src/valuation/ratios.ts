import type { FinancialStatement, RatioAnalysis } from "@vp/shared";

function pairwiseGrowth(series: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1];
    const cur = series[i];
    if (prev === undefined || cur === undefined || prev === 0) {
      out.push(0);
      continue;
    }
    out.push((cur - prev) / Math.abs(prev));
  }
  return out;
}

function cagr(series: number[]): number | null {
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  if (first === undefined || last === undefined) return null;
  if (first <= 0 || last <= 0) return null;
  const periods = series.length - 1;
  return Math.pow(last / first, 1 / periods) - 1;
}

function safeDiv(a: number | undefined, b: number | undefined): number {
  if (a === undefined || b === undefined || b === 0) return 0;
  return a / b;
}

function safeDivNullable(a: number | undefined, b: number | undefined): number | null {
  if (a === undefined || b === undefined || b === 0) return null;
  return a / b;
}

/**
 * Pure TS ratio computation. Used by `ratioAnalysis` agent (which is itself non-LLM).
 * Every value here is `source: computed` provenance-wise.
 */
export function computeRatios(statement: FinancialStatement): RatioAnalysis {
  const {
    fiscalYears,
    incomeStatement: is,
    balanceSheet: bs,
  } = statement;

  const revenueYoY = pairwiseGrowth(is.revenue);
  const netIncomeYoY = pairwiseGrowth(is.netIncome);

  const grossMargin = is.revenue.map((r, i) =>
    safeDiv(is.grossProfit[i], r),
  );
  const ebitdaMargin = is.revenue.map((r, i) => safeDiv(is.ebitda[i], r));
  const netMargin = is.revenue.map((r, i) => safeDiv(is.netIncome[i], r));

  const roe = is.netIncome.map((ni, i) => safeDiv(ni, bs.equity[i]));
  const roa = is.netIncome.map((ni, i) => safeDiv(ni, bs.totalAssets[i]));
  const roic = is.ebit.map((ebit, i) => {
    const eq = bs.equity[i];
    const debt = bs.longTermDebt[i];
    if (eq === undefined || debt === undefined) return null;
    const ic = eq + debt;
    if (ic === 0) return null;
    const tax = is.tax[i] ?? 0;
    const pretax = is.netIncome[i];
    const taxRate = pretax !== undefined && pretax + tax !== 0 ? tax / (pretax + tax) : 0.2;
    return (ebit * (1 - taxRate)) / ic;
  });

  const debtToEquity = bs.totalLiabilities.map((tl, i) => safeDiv(tl, bs.equity[i]));
  const debtToEbitda = bs.longTermDebt.map((d, i) => safeDiv(d, is.ebitda[i]));
  const interestCoverage = is.ebit.map((ebit, i) =>
    safeDivNullable(ebit, is.interestExpense[i]),
  );

  const currentRatio = bs.currentAssets.map((ca, i) =>
    safeDiv(ca, bs.currentLiabilities[i]),
  );
  const quickRatio = bs.currentAssets.map((ca, i) => {
    const inv = bs.inventory[i] ?? 0;
    return safeDiv(ca - inv, bs.currentLiabilities[i]);
  });

  const assetTurnover = is.revenue.map((r, i) => safeDiv(r, bs.totalAssets[i]));
  const inventoryDays = bs.inventory.map((inv, i) => {
    const cogs = is.cogs[i];
    if (inv === undefined || cogs === undefined || cogs === 0) return null;
    return (inv / cogs) * 365;
  });
  const receivableDays = bs.receivables.map((rc, i) => {
    const r = is.revenue[i];
    if (rc === undefined || r === undefined || r === 0) return null;
    return (rc / r) * 365;
  });

  return {
    fiscalYears,
    growth: {
      revenueYoY,
      revenueCagr: cagr(is.revenue),
      netIncomeYoY,
      netIncomeCagr: cagr(is.netIncome),
    },
    profitability: { grossMargin, ebitdaMargin, netMargin, roe, roa, roic },
    leverage: { debtToEquity, debtToEbitda, interestCoverage },
    liquidity: { currentRatio, quickRatio },
    efficiency: { assetTurnover, inventoryDays, receivableDays },
    assumptions: [],
  };
}
