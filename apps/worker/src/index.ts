import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@vp/db";
import { logger } from "@vp/ai";
import { env } from "./env.js";
import { runJob } from "./pipeline/orchestrator.js";
import { composeReport } from "./report/compose.js";
import { renderPdfFromHtml } from "./report/pdf.js";
import { putObject } from "./storage/index.js";

const QUEUE_NAME = "valuation-jobs";

export type ValuationJobData = {
  jobId: string;
};

async function main(): Promise<void> {
  const e = env();
  if (!e.REDIS_URL) {
    logger.error("REDIS_URL missing — worker cannot start");
    process.exit(1);
  }
  const connection = new IORedis(e.REDIS_URL, { maxRetriesPerRequest: null });

  const worker = new Worker<ValuationJobData>(
    QUEUE_NAME,
    async (job) => {
      const { jobId } = job.data;
      logger.info({ jobId }, "starting job");
      const dbJob = await prisma.job.findUnique({
        where: { id: jobId },
        include: { documents: { include: { document: true } } },
      });
      if (!dbJob) throw new Error(`Job ${jobId} not found`);

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "running", startedAt: new Date(), progress: 0 },
      });

      const documentIds = dbJob.documents.map((d) => d.documentId);
      const companyMeta = dbJob.companyMeta as unknown as import("@vp/shared").CompanyMeta;

      const fullReport = await runJob({
        jobId,
        companyMeta,
        documentIds,
        marketPrice: null,
        forecastYears: 5,
        async onProgress(currentAgent, percent) {
          await prisma.job.update({
            where: { id: jobId },
            data: { currentAgent, progress: percent },
          });
        },
      });

      const html = composeReport(fullReport);
      const pdfBuffer = await renderPdfFromHtml(html);
      const pdfKey = `reports/${jobId}.pdf`;
      await putObject(pdfKey, pdfBuffer);

      const report = await prisma.report.create({
        data: {
          userId: dbJob.userId,
          jobId,
          fullReportJson: fullReport as unknown as object,
          html,
          pdfStorageKey: pdfKey,
          qualityScore: fullReport.meta.qualityScore,
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "done",
          progress: 100,
          finishedAt: new Date(),
          reportId: report.id,
          currentAgent: null,
        },
      });

      logger.info({ jobId, reportId: report.id }, "job done");
    },
    { connection, concurrency: 1, lockDuration: e.JOB_TIMEOUT_MS },
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    logger.error({ jobId: job.data.jobId, err: err.message }, "job failed");
    await prisma.job.update({
      where: { id: job.data.jobId },
      data: { status: "failed", error: err.message, finishedAt: new Date() },
    });
  });

  logger.info({ queue: QUEUE_NAME }, "worker started");
}

export function getQueue(): Queue<ValuationJobData> {
  const e = env();
  if (!e.REDIS_URL) throw new Error("REDIS_URL required");
  const connection = new IORedis(e.REDIS_URL, { maxRetriesPerRequest: null });
  return new Queue<ValuationJobData>(QUEUE_NAME, { connection });
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  main().catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : err }, "worker fatal");
    process.exit(1);
  });
}
