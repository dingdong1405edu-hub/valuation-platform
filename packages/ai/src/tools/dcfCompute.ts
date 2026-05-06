import { z } from "zod";
import type { ToolImpl } from "../types.js";

const DcfInput = z.object({
  fcf: z.array(z.number()).min(3).max(10),
  wacc: z.number().positive().max(1),
  terminalGrowth: z.number().min(-0.05).max(0.1),
  netDebt: z.number().default(0),
  sharesOutstanding: z.number().positive().nullable().optional(),
});

export type DcfComputeOutput = {
  pvFcf: number[];
  terminalValue: number;
  pvTerminal: number;
  enterpriseValue: number;
  equityValue: number;
  fairValuePerShare: number | null;
};

/**
 * Pure DCF computation. Used by both `valuationDcf` agent (via tool) and
 * directly by tests to lock in math correctness.
 */
export function dcfCompute(input: z.infer<typeof DcfInput>): DcfComputeOutput {
  const { fcf, wacc, terminalGrowth, netDebt, sharesOutstanding } = DcfInput.parse(input);

  if (terminalGrowth >= wacc) {
    throw new Error(
      `terminalGrowth (${terminalGrowth}) must be strictly less than WACC (${wacc})`,
    );
  }

  const pvFcf: number[] = [];
  for (let t = 0; t < fcf.length; t += 1) {
    const year = t + 1;
    const value = fcf[t];
    if (value === undefined) throw new Error(`fcf[${t}] is undefined`);
    pvFcf.push(value / Math.pow(1 + wacc, year));
  }

  const lastFcf = fcf[fcf.length - 1] ?? 0;
  const terminalValue = (lastFcf * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, fcf.length);

  const enterpriseValue = pvFcf.reduce((a, b) => a + b, 0) + pvTerminal;
  const equityValue = enterpriseValue - netDebt;
  const fairValuePerShare =
    sharesOutstanding && sharesOutstanding > 0 ? equityValue / sharesOutstanding : null;

  return { pvFcf, terminalValue, pvTerminal, enterpriseValue, equityValue, fairValuePerShare };
}

export const dcfComputeTool: ToolImpl = {
  definition: {
    name: "dcf_compute",
    description:
      "Run a deterministic DCF valuation. Provide forecast FCF (array), WACC, terminal growth, optional netDebt and sharesOutstanding. Returns PV of FCF, terminal value, EV, equity value, fair value per share.",
    input_schema: {
      type: "object",
      properties: {
        fcf: {
          type: "array",
          items: { type: "number" },
          description: "Free cash flow projections, ordered by year (3-10 entries).",
          minItems: 3,
          maxItems: 10,
        },
        wacc: {
          type: "number",
          description: "Weighted average cost of capital, e.g. 0.12 for 12%.",
        },
        terminalGrowth: {
          type: "number",
          description: "Terminal growth rate, e.g. 0.03 for 3%. Must be < WACC.",
        },
        netDebt: { type: "number", default: 0 },
        sharesOutstanding: { type: ["number", "null"] },
      },
      required: ["fcf", "wacc", "terminalGrowth"],
    },
  },
  async execute(input) {
    return dcfCompute(input as z.infer<typeof DcfInput>);
  },
};
