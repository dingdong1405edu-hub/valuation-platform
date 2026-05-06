import type { AgentDefinition } from "@vp/ai";
import { computeTool, webSearchTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { BusinessAnalysisInput, BusinessAnalysisOutput } from "./schema.js";

export const businessAnalysisAgent: AgentDefinition<
  typeof BusinessAnalysisInput,
  typeof BusinessAnalysisOutput
> = {
  name: "businessAnalysis",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: BusinessAnalysisInput,
  outputSchema: BusinessAnalysisOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [computeTool, webSearchTool],
  cache: true,
  maxRetries: 2,
  maxTokens: 8000,
};
