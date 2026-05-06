import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { ExecutiveSummaryInput, ExecutiveSummaryOutput } from "./schema.js";

export const executiveSummaryAgent: AgentDefinition<
  typeof ExecutiveSummaryInput,
  typeof ExecutiveSummaryOutput
> = {
  name: "executiveSummary",
  version: "0.1.0",
  model: "claude-opus-4-7",
  inputSchema: ExecutiveSummaryInput,
  outputSchema: ExecutiveSummaryOutput,
  systemPrompt: loadPrompt(import.meta.url),
  cache: true,
  maxRetries: 2,
  maxTokens: 6000,
};
