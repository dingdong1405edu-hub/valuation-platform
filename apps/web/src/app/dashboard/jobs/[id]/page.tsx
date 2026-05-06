import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@vp/db";
import { JobStatus } from "./JobStatus.js";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      documents: { include: { document: true } },
      report: true,
      outputs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job) notFound();

  const meta = job.companyMeta as { name?: string; industry?: string };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/jobs" className="text-sm text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold mt-2">{meta?.name ?? "Báo cáo"}</h1>
        <p className="text-slate-600">Ngành: {meta?.industry ?? "—"} · Job ID: <code>{job.id}</code></p>
      </div>

      <JobStatus jobId={job.id} initialStatus={job.status} initialProgress={job.progress} initialCurrentAgent={job.currentAgent} />

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="font-semibold mb-3">Tài liệu đã tải</h2>
        <ul className="text-sm space-y-1">
          {job.documents.map((d) => (
            <li key={d.documentId}>
              <code>{d.document.sourceType}</code> · {d.document.filename} · {d.document.pages ?? "?"} trang
            </li>
          ))}
        </ul>
      </section>

      {job.outputs.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Lịch sử agent</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Model</th>
                <th className="text-right p-2">Tokens</th>
                <th className="text-right p-2">Thời lượng</th>
              </tr>
            </thead>
            <tbody>
              {job.outputs.map((o) => (
                <tr key={o.id} className="border-t border-slate-200">
                  <td className="p-2">{o.agentName} <span className="text-slate-500">v{o.agentVersion}</span></td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2 text-slate-600">{o.modelUsed ?? "—"}</td>
                  <td className="p-2 text-right">{(o.tokensIn + o.tokensOut).toLocaleString("vi-VN")}</td>
                  <td className="p-2 text-right">{(o.durationMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {job.report && (
        <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold">Báo cáo</h2>
          <p className="text-sm text-slate-600">
            Quality score: <strong>{job.report.qualityScore}/100</strong>
          </p>
          <div className="flex gap-3">
            <a
              href={`/api/jobs/${job.id}/report.html`}
              target="_blank"
              className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium"
            >
              Xem HTML
            </a>
            {job.report.pdfStorageKey && (
              <a
                href={`/api/jobs/${job.id}/report.pdf`}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium"
              >
                Tải PDF
              </a>
            )}
          </div>
        </section>
      )}

      {job.error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Lỗi:</strong> {job.error}
        </div>
      )}
    </div>
  );
}
