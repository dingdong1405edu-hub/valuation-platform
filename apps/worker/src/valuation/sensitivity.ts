import { dcfCompute } from "./dcf.js";
import type { Currency, SensitivityGrid } from "@vp/shared";

export type SensitivityInput = {
  fcf: number[];
  netDebt: number;
  sharesOutstanding: number | null;
  baseWacc: number;
  baseTerminalGrowth: number;
  waccDelta: number;
  growthDelta: number;
  steps: number;
  metric: "equityValue" | "fairValuePerShare" | "enterpriseValue";
  currency: Currency;
};

function range(center: number, delta: number, steps: number): number[] {
  if (steps < 1) return [center];
  const half = Math.floor(steps / 2);
  const step = delta / half;
  const out: number[] = [];
  for (let i = -half; i <= half; i += 1) {
    out.push(center + i * step);
  }
  return out;
}

export function computeSensitivity(input: SensitivityInput): SensitivityGrid {
  const xValues = range(input.baseWacc, input.waccDelta, input.steps);
  const yValues = range(input.baseTerminalGrowth, input.growthDelta, input.steps);

  const cells: number[][] = [];
  for (let yi = 0; yi < yValues.length; yi += 1) {
    const row: number[] = [];
    for (let xi = 0; xi < xValues.length; xi += 1) {
      const wacc = xValues[xi];
      const g = yValues[yi];
      if (wacc === undefined || g === undefined) {
        row.push(0);
        continue;
      }
      if (g >= wacc) {
        row.push(NaN);
        continue;
      }
      try {
        const r = dcfCompute({
          fcf: input.fcf,
          wacc,
          terminalGrowth: g,
          netDebt: input.netDebt,
          sharesOutstanding: input.sharesOutstanding,
        });
        const value =
          input.metric === "fairValuePerShare"
            ? (r.fairValuePerShare ?? 0)
            : input.metric === "enterpriseValue"
              ? (r.enterpriseValue - 0)
              : r.equityValue;
        row.push(value);
      } catch {
        row.push(NaN);
      }
    }
    cells.push(row);
  }

  return {
    axisX: { label: "WACC", values: xValues },
    axisY: { label: "Terminal Growth", values: yValues },
    cells,
    centerCell: { x: Math.floor(xValues.length / 2), y: Math.floor(yValues.length / 2) },
    currency: input.currency,
    metric: input.metric,
  };
}
