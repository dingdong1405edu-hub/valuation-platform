import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

export type ModelId =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

export type ToolImpl = {
  definition: Anthropic.Tool;
  execute: (input: unknown) => Promise<unknown>;
};

export type AgentDefinition<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
  name: string;
  version: string;
  model: ModelId;
  inputSchema: I;
  outputSchema: O;
  systemPrompt: string;
  tools?: ToolImpl[];
  thinking?: { budget_tokens: number };
  maxTokens?: number;
  cache?: boolean;
  maxRetries?: number;
  /** Friendly description used as `submit_<agent>` tool description. */
  outputDescription?: string;
};

export type AgentRunResult<O> = {
  output: O;
  modelUsed: ModelId;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  retries: number;
};
