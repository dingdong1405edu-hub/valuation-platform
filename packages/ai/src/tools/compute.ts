import { create, all } from "mathjs";
import { z } from "zod";
import type { ToolImpl } from "../types.js";

const math = create(all, { number: "number" });
// Limit allowed scope so the LLM can't escape into Node globals.
const limitedEval = math.evaluate.bind(math);

const ComputeInput = z.object({
  expression: z.string().min(1).max(500),
  variables: z.record(z.string(), z.number()).optional(),
});

export const computeTool: ToolImpl = {
  definition: {
    name: "compute",
    description:
      "Evaluate a deterministic mathematical expression. Use this when you need exact numeric calculation. Input: expression (mathjs syntax), optional variables. Returns the numeric result.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "A mathjs expression. Supports + - * / ^ %, parentheses, and named variables passed in `variables`.",
        },
        variables: {
          type: "object",
          description: "Optional named variables used in the expression.",
          additionalProperties: { type: "number" },
        },
      },
      required: ["expression"],
    },
  },
  async execute(input) {
    const parsed = ComputeInput.parse(input);
    const result = limitedEval(parsed.expression, parsed.variables ?? {});
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return { ok: false, error: "Result is not a finite number" };
    }
    return { ok: true, value: result };
  },
};
