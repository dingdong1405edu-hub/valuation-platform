import type { AgentDefinition } from "@vp/ai";
import { loadPrompt } from "../_base.js";
import {
  ProductCatalogExtractionInput,
  ProductCatalogExtractionOutput,
} from "./schema.js";

export const productCatalogExtractionAgent: AgentDefinition<
  typeof ProductCatalogExtractionInput,
  typeof ProductCatalogExtractionOutput
> = {
  name: "productCatalogExtraction",
  version: "0.1.0",
  model: "claude-haiku-4-5-20251001",
  inputSchema: ProductCatalogExtractionInput,
  outputSchema: ProductCatalogExtractionOutput,
  systemPrompt: loadPrompt(import.meta.url),
  cache: true,
  maxRetries: 2,
  maxTokens: 6000,
};
