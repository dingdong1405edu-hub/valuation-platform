import { z } from "zod";
import { DcfResult, SensitivityGrid } from "@vp/shared";
import { computeSensitivity } from "../../valuation/sensitivity.js";

const Input = z.object({
  dcf: DcfResult,
  waccDelta: z.number().default(0.02),
  growthDelta: z.number().default(0.02),
  steps: z.number().int().min(2).max(10).default(4),
  metric: z.enum(["equityValue", "fairValuePerShare", "enterpriseValue"]).default("equityValue"),
});

export type SensitivityAgentInput = z.infer<typeof Input>;

export const sensitivityAgent = {
  name: "sensitivity",
  version: "0.1.0",
  pure: true as const,
  inputSchema: Input,
  outputSchema: SensitivityGrid,
  run(input: SensitivityAgentInput): SensitivityGrid {
    const fcf = input.dcf.fcfForecast.map((f) => f.fcf);
    return computeSensitivity({
      fcf,
      netDebt: input.dcf.netDebt.value,
      sharesOutstanding: input.dcf.sharesOutstanding,
      baseWacc: input.dcf.assumptions.wacc.value,
      baseTerminalGrowth: input.dcf.assumptions.terminalGrowth.value,
      waccDelta: input.waccDelta,
      growthDelta: input.growthDelta,
      steps: input.steps,
      metric: input.metric,
      currency: input.dcf.currency,
    });
  },
};
