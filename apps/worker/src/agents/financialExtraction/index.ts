import type { AgentDefinition } from "@vp/ai";
import { computeTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { FinancialExtractionInput, FinancialExtractionOutput } from "./schema.js";

export const financialExtractionAgent: AgentDefinition<
  typeof FinancialExtractionInput,
  typeof FinancialExtractionOutput
> = {
  name: "financialExtraction",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: FinancialExtractionInput,
  outputSchema: FinancialExtractionOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [computeTool],
  outputDescription: "Submit FinancialStatement with 3 reports + cellProvenance + assumptions.",
  cache: true,
  maxRetries: 2,
  maxTokens: 12_000,
};
