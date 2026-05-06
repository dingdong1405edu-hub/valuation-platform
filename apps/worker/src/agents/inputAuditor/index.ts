import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import { InputAuditorInput, InputAuditorOutput } from "./schema.js";

export const inputAuditorAgent: AgentDefinition<
  typeof InputAuditorInput,
  typeof InputAuditorOutput
> = {
  name: "inputAuditor",
  version: "0.1.0",
  model: "claude-sonnet-4-6",
  inputSchema: InputAuditorInput,
  outputSchema: InputAuditorOutput,
  systemPrompt: loadPrompt(import.meta.url),
  outputDescription: "Submit the InputManifest with provided/missing/qualityScore.",
  cache: true,
  maxRetries: 2,
};
