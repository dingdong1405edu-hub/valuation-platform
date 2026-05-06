import { z } from "zod";
import { Leadership } from "@vp/shared";

export const LeadershipExtractionInput = z.object({
  documents: z.array(
    z.object({ id: z.string(), filename: z.string(), text: z.string() }),
  ),
});

export const LeadershipExtractionOutput = Leadership;
