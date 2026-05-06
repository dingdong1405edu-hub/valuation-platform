import type { AgentDefinition } from "@vp/ai";
import { computeTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import {
  BusinessPlanExtractionInput,
  BusinessPlanExtractionOutput,
} from "./schema.js";

export const businessPlanExtractionAgent: AgentDefinition<
  typeof BusinessPlanExtractionInput,
  typeof BusinessPlanExtractionOutput
> = {
  name: "businessPlanExtraction",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: BusinessPlanExtractionInput,
  outputSchema: BusinessPlanExtractionOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [computeTool],
  cache: true,
  maxRetries: 2,
  maxTokens: 8000,
};
