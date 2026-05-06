/**
 * CLI: chạy 1 agent với 1 file JSON input → ghi output ra file.
 *
 * Usage:
 *   pnpm agent inputAuditor --input fixtures/auditor.json --output out.json
 */
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runAgent } from "../packages/ai/src/runAgent.js";
import { llmAgents, pureAgents } from "../apps/worker/src/agents/registry.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return undefined;
}

async function main(): Promise<void> {
  const agentName = process.argv[2];
  if (!agentName) {
    console.error("Usage: pnpm agent <agentName> --input <file> [--output <file>]");
    process.exit(1);
  }
  const inputPath = arg("input");
  if (!inputPath) {
    console.error("--input <file.json> required");
    process.exit(1);
  }
  const outputPath = arg("output") ?? `out.${agentName}.json`;
  const inputJson = JSON.parse(await readFile(path.resolve(inputPath), "utf8"));

  const pure = (pureAgents as Record<string, { run: (i: unknown) => unknown } | undefined>)[agentName];
  if (pure) {
    const out = pure.run(inputJson);
    await writeFile(path.resolve(outputPath), JSON.stringify(out, null, 2), "utf8");
    console.log(`OK pure agent ${agentName} → ${outputPath}`);
    return;
  }
  const llm = (llmAgents as Record<string, unknown>)[agentName];
  if (!llm) {
    console.error(`Unknown agent: ${agentName}`);
    process.exit(1);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await runAgent(llm as any, inputJson);
  await writeFile(path.resolve(outputPath), JSON.stringify(result.output, null, 2), "utf8");
  console.log(
    `OK ${agentName} → ${outputPath} (model=${result.modelUsed}, in=${result.tokensIn}, out=${result.tokensOut}, retries=${result.retries})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
