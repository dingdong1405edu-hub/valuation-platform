import type Anthropic from "@anthropic-ai/sdk";
import { z, ZodError } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getAnthropic } from "./client.js";
import { logger } from "./logger.js";
import type { AgentDefinition, AgentRunResult, ToolImpl } from "./types.js";

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_MAX_RETRIES = 2;

function jsonSchemaForOutput<O extends z.ZodTypeAny>(schema: O): Record<string, unknown> {
  const generated = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete generated["$schema"];
  return generated;
}

function buildSubmitTool<O extends z.ZodTypeAny>(
  agentName: string,
  outputSchema: O,
  description: string,
): Anthropic.Tool {
  const schema = jsonSchemaForOutput(outputSchema);
  // Anthropic expects an object schema at top level for tool input_schema.
  const inputSchema =
    (schema as { type?: string }).type === "object"
      ? schema
      : { type: "object", properties: { value: schema }, required: ["value"] };
  return {
    name: `submit_${agentName}`,
    description,
    input_schema: inputSchema as unknown as Anthropic.Tool["input_schema"],
  };
}

function findSubmitToolUse(
  message: Anthropic.Message,
  toolName: string,
): Anthropic.ToolUseBlock | undefined {
  for (const block of message.content) {
    if (block.type === "tool_use" && block.name === toolName) return block;
  }
  return undefined;
}

function findToolUses(message: Anthropic.Message): Anthropic.ToolUseBlock[] {
  return message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
}

async function executeToolCall(
  block: Anthropic.ToolUseBlock,
  tools: ToolImpl[],
): Promise<Anthropic.ToolResultBlockParam> {
  const tool = tools.find((t) => t.definition.name === block.name);
  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: block.id,
      is_error: true,
      content: `Tool ${block.name} not found.`,
    };
  }
  try {
    const result = await tool.execute(block.input);
    return {
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(result).slice(0, 50_000),
    };
  } catch (err) {
    return {
      type: "tool_result",
      tool_use_id: block.id,
      is_error: true,
      content: err instanceof Error ? err.message : "tool error",
    };
  }
}

export async function runAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  agent: AgentDefinition<I, O>,
  rawInput: z.input<I>,
): Promise<AgentRunResult<z.infer<O>>> {
  const startedAt = Date.now();
  const validatedInput = agent.inputSchema.parse(rawInput);
  const submitToolName = `submit_${agent.name}`;
  const submitTool = buildSubmitTool(
    agent.name,
    agent.outputSchema,
    agent.outputDescription ??
      `Submit the final ${agent.name} result. MUST conform to schema; this is the only acceptable way to return your answer.`,
  );

  const userTools: Anthropic.Tool[] = (agent.tools ?? []).map((t) => t.definition);
  const allTools: Anthropic.Tool[] = [...userTools, submitTool];

  const userPrompt = JSON.stringify(validatedInput, null, 2);

  const anthropic = getAnthropic();
  const maxRetries = agent.maxRetries ?? DEFAULT_MAX_RETRIES;
  let attempt = 0;
  let totalIn = 0;
  let totalOut = 0;
  let lastError: Error | undefined;

  while (attempt <= maxRetries) {
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Agent: ${agent.name} v${agent.version}\n` +
              `Task: process the JSON input below and submit your final answer by calling the tool \`${submitToolName}\`.\n` +
              `When ready, you MUST call \`${submitToolName}\` exactly once. Do not return free-form prose as final answer.\n\n` +
              `INPUT JSON:\n\`\`\`json\n${userPrompt}\n\`\`\`` +
              (lastError
                ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastError.message}\nFix the issues and resubmit.`
                : ""),
          },
        ],
      },
    ];

    let loopGuard = 0;
    while (loopGuard < 8) {
      loopGuard += 1;
      const params: Anthropic.MessageCreateParams = {
        model: agent.model,
        max_tokens: agent.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: [
          {
            type: "text",
            text: agent.systemPrompt,
            cache_control: agent.cache !== false ? { type: "ephemeral" } : undefined,
          },
        ] as unknown as Anthropic.MessageCreateParams["system"],
        tools: allTools,
        messages,
      };
      // tool_choice forced only on first turn; allow free choice once a tool result has been returned
      if (loopGuard === 1) {
        params.tool_choice = { type: "any" };
      }
      if (agent.thinking) {
        (params as Anthropic.MessageCreateParams & {
          thinking?: { type: "enabled"; budget_tokens: number };
        }).thinking = { type: "enabled", budget_tokens: agent.thinking.budget_tokens };
      }

      const response = await anthropic.messages.create(params);
      totalIn += response.usage.input_tokens;
      totalOut += response.usage.output_tokens;

      const submit = findSubmitToolUse(response, submitToolName);
      if (submit) {
        const parsed = agent.outputSchema.safeParse(submit.input);
        if (parsed.success) {
          return {
            output: parsed.data,
            modelUsed: agent.model,
            tokensIn: totalIn,
            tokensOut: totalOut,
            durationMs: Date.now() - startedAt,
            retries: attempt,
          };
        }
        lastError = new ZodError(parsed.error.issues);
        logger.warn(
          { agent: agent.name, attempt, issues: parsed.error.issues },
          "agent output failed Zod validation",
        );
        break; // break inner loop, retry whole turn
      }

      const toolUses = findToolUses(response);
      if (toolUses.length === 0) {
        // model returned text without calling tool — treat as protocol violation, retry
        lastError = new Error(
          "Model did not call submit tool. Must call submit_<agent> exactly once.",
        );
        break;
      }

      // Append assistant message + tool results, continue loop
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUses) {
        if (block.name === submitToolName) {
          // submit was found above; defensive
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: "submit accepted",
          });
        } else {
          const r = await executeToolCall(block, agent.tools ?? []);
          results.push(r);
        }
      }
      messages.push({ role: "user", content: results });
    }

    attempt += 1;
  }

  throw new Error(
    `Agent ${agent.name} failed after ${maxRetries + 1} attempts: ${
      lastError?.message ?? "unknown"
    }`,
  );
}
