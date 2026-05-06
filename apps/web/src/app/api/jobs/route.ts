import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { prisma } from "@vp/db";
import { CompanyMeta, newId } from "@vp/shared";
import { getQueue } from "@vp/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MVP: single-user mode → use a fixed dev user; upgrade to NextAuth session later.
async function getOrCreateUser(): Promise<{ id: string }> {
  const email = "dev@valuation.local";
  const u = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Dev User" },
    update: {},
    select: { id: true },
  });
  return u;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const fd = await req.formData();
    const companyMetaRaw = fd.get("companyMeta");
    if (!companyMetaRaw || typeof companyMetaRaw !== "string") {
      return NextResponse.json({ error: "companyMeta missing" }, { status: 400 });
    }
    const companyMeta = CompanyMeta.parse(JSON.parse(companyMetaRaw));
    const fileCount = Number(fd.get("fileCount") ?? "0");
    if (!Number.isFinite(fileCount) || fileCount < 1) {
      return NextResponse.json({ error: "Cần ít nhất 1 file" }, { status: 400 });
    }

    const user = await getOrCreateUser();
    const storageRoot = path.resolve(process.env.STORAGE_PATH ?? "./storage");
    if (!existsSync(storageRoot)) await mkdir(storageRoot, { recursive: true });

    const sourceTypeSchema = z.enum([
      "financial_statements",
      "website",
      "fanpage",
      "catalogue_brochure",
      "company_profile",
      "business_plan",
      "ceo_cv",
      "crm",
      "accounting_system",
      "erp",
      "manual_input",
      "other",
    ]);

    const documentIds: string[] = [];
    for (let i = 0; i < fileCount; i += 1) {
      const file = fd.get(`file_${i}`);
      const stRaw = fd.get(`sourceType_${i}`);
      if (!(file instanceof File) || typeof stRaw !== "string") continue;
      const sourceType = sourceTypeSchema.parse(stRaw);

      const docId = newId("doc");
      const ext = path.extname(file.name);
      const storageKey = `documents/${docId}${ext}`;
      const fullPath = path.join(storageRoot, storageKey);
      await mkdir(path.dirname(fullPath), { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);

      await prisma.document.create({
        data: {
          id: docId,
          userId: user.id,
          filename: file.name,
          storageKey,
          mimeType: file.type || "application/octet-stream",
          bytes: buffer.byteLength,
          sourceType,
          status: "uploaded",
        },
      });
      documentIds.push(docId);
    }

    if (documentIds.length === 0) {
      return NextResponse.json({ error: "Không có file hợp lệ" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        status: "queued",
        companyMeta: companyMeta as unknown as object,
        documents: {
          create: documentIds.map((id) => ({ documentId: id })),
        },
      },
    });

    try {
      const queue = getQueue();
      await queue.add("valuation", { jobId: job.id }, { removeOnComplete: 100, removeOnFail: 100 });
    } catch (err) {
      // Redis unavailable in dev — keep job as queued; user can re-trigger.
      console.warn("Queue enqueue failed:", err);
    }

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
