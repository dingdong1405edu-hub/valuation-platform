import { z } from "zod";
import type { ToolImpl } from "../types.js";

const Input = z.object({
  industry: z.string(),
  country: z.string().default("VN"),
  limit: z.number().int().min(1).max(20).default(8),
});

export type ComparableLookup = {
  ticker: string;
  name: string;
  country: string;
  industry: string;
  marketCap: number | null;
  evEbitda: number | null;
  pe: number | null;
  pb: number | null;
  sourceUrl: string | null;
  source: "seed" | "web" | "user";
};

type Resolver = (args: z.infer<typeof Input>) => Promise<ComparableLookup[]>;
let resolver: Resolver | null = null;

export function setComparableResolver(r: Resolver | null): void {
  resolver = r;
}

export const comparableSearchTool: ToolImpl = {
  definition: {
    name: "comparable_search",
    description:
      "Look up comparable companies by industry and country. Returns up to N tickers with EV/EBITDA, P/E, P/B. Tries local seed DB first, then web fallback.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        country: { type: "string", default: "VN" },
        limit: { type: "integer", default: 8 },
      },
      required: ["industry"],
    },
  },
  async execute(input) {
    const args = Input.parse(input);
    if (!resolver) return [];
    return resolver(args);
  },
};
