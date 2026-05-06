import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold mb-3">Valuation Platform</h1>
      <p className="text-slate-700 mb-6">
        Tải BCTC, hồ sơ năng lực, kế hoạch kinh doanh — hệ thống multi-agent sẽ phân tích, tra cứu thị trường,
        và xuất ra báo cáo định giá doanh nghiệp 12 phần.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard/upload" className="rounded bg-slate-900 text-white px-5 py-2.5 font-medium">
          Bắt đầu định giá
        </Link>
        <Link href="/dashboard/jobs" className="rounded border border-slate-300 bg-white px-5 py-2.5 font-medium">
          Xem báo cáo
        </Link>
      </div>
    </main>
  );
}
