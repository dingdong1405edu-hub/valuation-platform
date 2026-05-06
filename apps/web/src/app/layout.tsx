import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Valuation Platform",
  description: "AI-powered financial valuation reports",
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
