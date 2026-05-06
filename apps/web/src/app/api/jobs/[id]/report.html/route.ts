import { prisma } from "@vp/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, include: { report: true } });
  if (!job?.report) return new Response("Not found", { status: 404 });
  return new Response(job.report.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
