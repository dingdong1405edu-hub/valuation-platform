import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { z } from "zod";
import type { AgentDefinition } from "@vp/ai";

export function loadPrompt(metaUrl: string, filename = "prompt.md"): string {
  const dir = path.dirname(fileURLToPath(metaUrl));
  return readFileSync(path.join(dir, filename), "utf8");
}

export type AnyAgent = AgentDefinition<z.ZodTypeAny, z.ZodTypeAny>;
