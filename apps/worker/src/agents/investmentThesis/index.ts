import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { InvestmentThesisInput, InvestmentThesisOutput } from "./schema.js";

export const investmentThesisAgent: AgentDefinition<
  typeof InvestmentThesisInput,
  typeof InvestmentThesisOutput
> = {
  name: "investmentThesis",
  version: "0.1.0",
  model: "claude-opus-4-7",
  inputSchema: InvestmentThesisInput,
  outputSchema: InvestmentThesisOutput,
  systemPrompt: loadPrompt(import.meta.url),
  thinking: { budget_tokens: 8000 },
  cache: true,
  maxRetries: 2,
  maxTokens: 16_000,
};
