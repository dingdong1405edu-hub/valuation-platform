import { z } from "zod";
import { BusinessPlan } from "@vp/shared";

export const BusinessPlanExtractionInput = z.object({
  documents: z.array(
    z.object({ id: z.string(), filename: z.string(), text: z.string() }),
  ),
});

export const BusinessPlanExtractionOutput = BusinessPlan;
