import type { AgentDefinition } from "@vp/ai";
import { webSearchTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { CompanyProfileInput, CompanyProfileOutput } from "./schema.js";

export const companyProfileAgent: AgentDefinition<
  typeof CompanyProfileInput,
  typeof CompanyProfileOutput
> = {
  name: "companyProfile",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: CompanyProfileInput,
  outputSchema: CompanyProfileOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [webSearchTool],
  outputDescription: "Submit CompanyOverview JSON.",
  cache: true,
  maxRetries: 2,
  maxTokens: 8000,
};
