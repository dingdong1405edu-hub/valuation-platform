import { z } from "zod";
import { ProductCatalog } from "@vp/shared";

export const ProductCatalogExtractionInput = z.object({
  documents: z.array(
    z.object({ id: z.string(), filename: z.string(), text: z.string() }),
  ),
});

export const ProductCatalogExtractionOutput = ProductCatalog;
