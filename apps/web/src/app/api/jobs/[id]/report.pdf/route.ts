import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@vp/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, include: { report: true } });
  if (!job?.report?.pdfStorageKey) return new Response("Not found", { status: 404 });
  const storageRoot = path.resolve(process.env.STORAGE_PATH ?? "./storage");
  const pdfPath = path.join(storageRoot, job.report.pdfStorageKey);
  const data = await readFile(pdfPath);
  // ArrayBuffer cast needed for fetch Response compatibility
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return new Response(arrayBuffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="report-${id}.pdf"`,
    },
  });
}
