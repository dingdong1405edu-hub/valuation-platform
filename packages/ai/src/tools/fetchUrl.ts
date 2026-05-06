import { z } from "zod";
import { hashInput } from "@vp/shared";
import type { ToolImpl } from "../types.js";

const FetchInput = z.object({
  url: z.string().url(),
  maxChars: z.number().int().min(500).max(50_000).default(10_000),
});

type CacheLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
};

let cache: CacheLike | null = null;
export function setFetchCache(c: CacheLike | null): void {
  cache = c;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const fetchUrlTool: ToolImpl = {
  definition: {
    name: "fetch_url",
    description:
      "Fetch a URL and return readable text (HTML stripped). Use sparingly; prefer web_search first. Cached 24h.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        maxChars: { type: "integer", default: 10_000 },
      },
      required: ["url"],
    },
  },
  async execute(input) {
    const { url, maxChars } = FetchInput.parse(input);
    const cacheKey = `fetch_url:${hashInput({ url })}`;
    if (cache) {
      const hit = await cache.get(cacheKey);
      if (hit) return { url, text: hit.slice(0, maxChars), cached: true };
    }
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; ValuationPlatformBot/0.1; +https://github.com/anthropics)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return { url, error: `HTTP ${res.status}`, text: "" };
    }
    const raw = await res.text();
    const text = stripHtml(raw);
    if (cache) await cache.set(cacheKey, text, 24 * 60 * 60);
    return { url, text: text.slice(0, maxChars), cached: false };
  },
};
