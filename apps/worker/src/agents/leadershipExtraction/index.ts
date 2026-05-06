import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { LeadershipExtractionInput, LeadershipExtractionOutput } from "./schema.js";

export const leadershipExtractionAgent: AgentDefinition<
  typeof LeadershipExtractionInput,
  typeof LeadershipExtractionOutput
> = {
  name: "leadershipExtraction",
  version: "0.1.0",
  model: "claude-haiku-4-5-20251001",
  inputSchema: LeadershipExtractionInput,
  outputSchema: LeadershipExtractionOutput,
  systemPrompt: loadPrompt(import.meta.url),
  cache: true,
  maxRetries: 2,
  maxTokens: 6000,
};
