import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-3 flex justify-between items-center">
          <Link href="/" className="font-semibold">
            Valuation Platform
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard/upload" className="hover:underline">
              Tạo báo cáo
            </Link>
            <Link href="/dashboard/jobs" className="hover:underline">
              Lịch sử
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
