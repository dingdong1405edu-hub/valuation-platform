import type { AgentDefinition } from "@vp/ai";
import { computeTool } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { ForecastInput, ForecastOutput } from "./schema.js";

export const forecastAgent: AgentDefinition<typeof ForecastInput, typeof ForecastOutput> = {
  name: "forecast",
  version: "0.1.0",
  model: "claude-opus-4-7",
  inputSchema: ForecastInput,
  outputSchema: ForecastOutput,
  systemPrompt: loadPrompt(import.meta.url),
  tools: [computeTool],
  thinking: { budget_tokens: 6000 },
  cache: true,
  maxRetries: 2,
  maxTokens: 16_000,
};
