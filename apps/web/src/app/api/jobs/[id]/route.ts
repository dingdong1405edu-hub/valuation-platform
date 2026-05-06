import { NextResponse } from "next/server";
import { prisma } from "@vp/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, select: { status: true, progress: true, currentAgent: true, error: true } });
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}
