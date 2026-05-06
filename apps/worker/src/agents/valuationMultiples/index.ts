import type { AgentDefinition } from "@vp/ai";
import {
  comparableSearchTool,
  computeTool,
  webSearchTool,
} from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { ValuationMultiplesInput, ValuationMultiplesOutput } from "./schema.js";

export const valuationMultiplesAgent: AgentDefinition<
  typeof ValuationMultiplesInput,
  typeof ValuationMultiplesOutput
> = {
  name: "valuationMultiples",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: ValuationMultiplesInput,
  outputSchema: ValuationMultiplesOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [comparableSearchTool, webSearchTool, computeTool],
  cache: true,
  maxRetries: 2,
  maxTokens: 8000,
};
