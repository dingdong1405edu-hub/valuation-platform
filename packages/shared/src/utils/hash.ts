import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Stable JSON stringify for cache keys: sort object keys recursively.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) => JSON.stringify(k) + ":" + stableStringify((value as Record<string, unknown>)[k]),
  );
  return "{" + entries.join(",") + "}";
}

export function hashInput(value: unknown): string {
  return sha256(stableStringify(value));
}
