import { z } from "zod";
import { CompanyMeta, InputManifest, InputSourceTag } from "@vp/shared";

export const InputAuditorInput = z.object({
  companyMeta: CompanyMeta,
  documents: z.array(
    z.object({
      id: z.string(),
      filename: z.string(),
      sourceType: InputSourceTag,
      pages: z.number().int().nonnegative(),
      excerpt: z.string().max(2000),
    }),
  ),
  hasFinancialPlan: z.boolean(),
  hasCrm: z.boolean(),
  hasErp: z.boolean(),
  hasAccounting: z.boolean(),
});
export type InputAuditorInput = z.infer<typeof InputAuditorInput>;

export const InputAuditorOutput = InputManifest;
export type InputAuditorOutput = z.infer<typeof InputAuditorOutput>;
