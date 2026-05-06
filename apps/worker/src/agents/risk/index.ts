import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { RiskInput, RiskOutput } from "./schema.js";

export const riskAgent: AgentDefinition<typeof RiskInput, typeof RiskOutput> = {
  name: "risk",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: RiskInput,
  outputSchema: RiskOutput,
  systemPrompt: loadPrompt(import.meta.url),
  cache: true,
  maxRetries: 2,
  maxTokens: 6000,
};
