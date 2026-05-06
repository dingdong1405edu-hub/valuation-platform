import type { ComparableCompany, MultiplesResult, Currency } from "@vp/shared";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1];
    const b = sorted[mid];
    if (a === undefined || b === undefined) return 0;
    return (a + b) / 2;
  }
  return sorted[mid] ?? 0;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[idx] ?? 0;
}

export type MultiplesInput = {
  comparables: ComparableCompany[];
  targetEbitda: number;
  targetNetIncome: number;
  targetBookValue: number;
  netDebt: number;
  currency: Currency;
};

export function computeMultiples(input: MultiplesInput): MultiplesResult {
  const evEbitdas = input.comparables
    .map((c) => c.evEbitda)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const pes = input.comparables
    .map((c) => c.pe)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const pbs = input.comparables
    .map((c) => c.pb)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const evEbitdaMedian = median(evEbitdas);
  const peMedian = median(pes);
  const pbMedian = median(pbs);

  const enterpriseFromEvEbitda = evEbitdaMedian * input.targetEbitda;
  const fromEvEbitda = enterpriseFromEvEbitda - input.netDebt;
  const fromPe = peMedian * input.targetNetIncome;
  const fromPb = pbMedian * input.targetBookValue;

  return {
    comparables: input.comparables,
    appliedMultiples: {
      evEbitdaMedian,
      peMedian,
      pbMedian,
      evEbitdaP25: evEbitdas.length ? percentile(evEbitdas, 0.25) : 0,
      evEbitdaP75: evEbitdas.length ? percentile(evEbitdas, 0.75) : 0,
    },
    targetMetrics: {
      ebitda: input.targetEbitda,
      netIncome: input.targetNetIncome,
      bookValue: input.targetBookValue,
    },
    impliedEquityValue: { fromEvEbitda, fromPe, fromPb },
    netDebt: input.netDebt,
    currency: input.currency,
    emittedAssumptions: [],
  };
}
