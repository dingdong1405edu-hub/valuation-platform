import type { AgentDefinition } from "@vp/ai";
import {
  computeTool,
  dcfComputeTool,
  waccComputeTool,
  webSearchTool,
} from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { ValuationDcfInput, ValuationDcfOutput } from "./schema.js";

export const valuationDcfAgent: AgentDefinition<
  typeof ValuationDcfInput,
  typeof ValuationDcfOutput
> = {
  name: "valuationDcf",
  version: "0.1.0",
  model: "claude-opus-4-7",
  inputSchema: ValuationDcfInput,
  outputSchema: ValuationDcfOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [waccComputeTool, dcfComputeTool, computeTool, webSearchTool],
  thinking: { budget_tokens: 8000 },
  outputDescription: "Submit DcfResult with TracedNumber assumptions and computed values.",
  cache: true,
  maxRetries: 2,
  maxTokens: 16_000,
};
