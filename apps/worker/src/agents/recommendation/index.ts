import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { RecommendationInput, RecommendationOutput } from "./schema.js";

export const recommendationAgent: AgentDefinition<
  typeof RecommendationInput,
  typeof RecommendationOutput
> = {
  name: "recommendation",
  version: "0.1.0",
  model: "claude-opus-4-7",
  inputSchema: RecommendationInput,
  outputSchema: RecommendationOutput,
  systemPrompt: loadPrompt(import.meta.url),
  cache: true,
  maxRetries: 2,
  maxTokens: 6000,
};
