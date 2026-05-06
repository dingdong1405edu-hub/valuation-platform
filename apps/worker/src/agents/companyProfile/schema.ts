import { z } from "zod";
import { CompanyMeta, CompanyOverview, InputManifest } from "@vp/shared";

export const CompanyProfileInput = z.object({
  companyMeta: CompanyMeta,
  inputManifest: InputManifest,
  documents: z.array(
    z.object({
      id: z.string(),
      filename: z.string(),
      sourceType: z.string(),
      text: z.string(),
    }),
  ),
});
export type CompanyProfileInput = z.infer<typeof CompanyProfileInput>;

export const CompanyProfileOutput = CompanyOverview;
