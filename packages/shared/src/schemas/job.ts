import { z } from "zod";
import { CompanyMeta } from "./provenance.js";

export const JobStatus = z.enum(["queued", "running", "done", "failed", "cancelled"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobCreationInput = z.object({
  companyMeta: CompanyMeta,
  documentIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});
export type JobCreationInput = z.infer<typeof JobCreationInput>;

export const AgentRunStatus = z.enum([
  "queued",
  "running",
  "done",
  "failed",
  "skipped",
  "cached",
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

export const JobProgressUpdate = z.object({
  jobId: z.string(),
  status: JobStatus,
  progress: z.number().min(0).max(100),
  currentAgent: z.string().nullable(),
  message: z.string().optional(),
});
export type JobProgressUpdate = z.infer<typeof JobProgressUpdate>;
