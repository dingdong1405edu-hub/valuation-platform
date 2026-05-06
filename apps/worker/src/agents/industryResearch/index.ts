import type { AgentDefinition } from "@vp/ai";
import { fetchUrlTool, webSearchTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { IndustryResearchInput, IndustryResearchOutput } from "./schema.js";

export const industryResearchAgent: AgentDefinition<
  typeof IndustryResearchInput,
  typeof IndustryResearchOutput
> = {
  name: "industryResearch",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: IndustryResearchInput,
  outputSchema: IndustryResearchOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [webSearchTool, fetchUrlTool],
  cache: true,
  maxRetries: 2,
  maxTokens: 8000,
};
