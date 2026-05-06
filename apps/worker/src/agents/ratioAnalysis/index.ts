import { FinancialStatement, RatioAnalysis } from "@vp/shared";
import { computeRatios } from "../../valuation/ratios.js";

/**
 * Pure TS agent. Not an LLM — never calls Anthropic.
 * Same shape as LLM agents (input/output validated) so the orchestrator
 * can run it through the same dispatcher.
 */
export const ratioAnalysisAgent = {
  name: "ratioAnalysis",
  version: "0.1.0",
  pure: true as const,
  inputSchema: FinancialStatement,
  outputSchema: RatioAnalysis,
  run(input: FinancialStatement): RatioAnalysis {
    return computeRatios(input);
  },
};
