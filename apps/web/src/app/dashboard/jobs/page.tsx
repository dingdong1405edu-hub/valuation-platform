import Link from "next/link";
import { prisma } from "@vp/db";

export const dynamic = "force-dynamic";

export default async function JobsListPage(): Promise<JSX.Element> {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { documents: { include: { document: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch sử báo cáo</h1>
      {jobs.length === 0 ? (
        <p className="text-slate-600">
          Chưa có job nào. <Link href="/dashboard/upload" className="text-blue-600 underline">Tạo mới</Link>.
        </p>
      ) : (
        <table className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Doanh nghiệp</th>
              <th className="text-left p-3">Ngành</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Tiến độ</th>
              <th className="text-left p-3">Thời gian</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const meta = job.companyMeta as { name?: string; industry?: string };
              return (
                <tr key={job.id} className="border-t border-slate-200">
                  <td className="p-3 font-medium">{meta?.name ?? "—"}</td>
                  <td className="p-3 text-slate-600">{meta?.industry ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        job.status === "done"
                          ? "bg-green-100 text-green-800"
                          : job.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3">{job.progress}% {job.currentAgent && <span className="text-xs text-slate-500">({job.currentAgent})</span>}</td>
                  <td className="p-3 text-sm text-slate-600">{new Date(job.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="p-3 text-right">
                    <Link href={`/dashboard/jobs/${job.id}`} className="text-blue-600 hover:underline">
                      Xem
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
