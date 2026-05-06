import { z } from "zod";
import { hashInput } from "@vp/shared";
import type { ToolImpl } from "../types.js";
import { logger } from "../logger.js";

const SearchInput = z.object({
  query: z.string().min(2).max(400),
  maxResults: z.number().int().min(1).max(10).default(5),
});

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

type CacheLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
};

let cache: CacheLike | null = null;
export function setSearchCache(c: CacheLike | null): void {
  cache = c;
}

export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

async function tavilySearch(
  query: string,
  maxResults: number,
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    logger.warn({ tool: "web_search" }, "TAVILY_API_KEY missing — returning empty results");
    return [];
  }
  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> };
  return (data.results ?? []).map((r) => ({ title: r.title, url: r.url, content: r.content }));
}

export const webSearchTool: ToolImpl = {
  definition: {
    name: "web_search",
    description:
      "Search the web for recent information. Returns up to N results with title, url, and content snippet. Use for industry data, comparable companies, market research, news.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query, in any language. Be specific." },
        maxResults: { type: "integer", default: 5, minimum: 1, maximum: 10 },
      },
      required: ["query"],
    },
  },
  async execute(input) {
    const { query, maxResults } = SearchInput.parse(input);
    const cacheKey = `web_search:${hashInput({ query, maxResults })}`;
    if (cache) {
      const hit = await cache.get(cacheKey);
      if (hit) return JSON.parse(hit) as WebSearchResult[];
    }
    const results = await tavilySearch(query, maxResults);
    if (cache) {
      await cache.set(cacheKey, JSON.stringify(results), 7 * 24 * 60 * 60);
    }
    return results;
  },
};
