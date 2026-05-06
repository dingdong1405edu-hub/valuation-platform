import { renderToStaticMarkup } from "react-dom/server";
import { FullReport } from "@vp/shared";
import { ReportTemplate } from "./templates/ReportTemplate.js";

/**
 * Pure deterministic composer.
 * - Validates input via Zod (FullReport schema).
 * - Renders React components to static HTML.
 * - Throws if any required field is missing — never silently substitutes.
 */
export function composeReport(report: unknown): string {
  const validated = FullReport.parse(report);
  const body = renderToStaticMarkup(<ReportTemplate data={validated} />);
  return wrapWithDocument(body, validated.meta.companyName);
}

function wrapWithDocument(body: string, companyName: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Báo cáo định giá — ${escapeHtml(companyName)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

const REPORT_CSS = `
* { box-sizing: border-box; }
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #111827; line-height: 1.55; max-width: 960px; margin: 0 auto; padding: 32px; }
h1 { font-size: 28px; margin: 24px 0 8px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
h2 { font-size: 22px; margin: 32px 0 12px; color: #0f172a; }
h3 { font-size: 18px; margin: 20px 0 8px; color: #1f2937; }
p { margin: 8px 0; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f3f4f6; font-weight: 600; }
.section { page-break-after: always; padding-bottom: 24px; }
.section:last-child { page-break-after: auto; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
.kpi { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
.kpi-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
.kpi-value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.tag-extracted { background: #dcfce7; color: #14532d; }
.tag-computed { background: #dbeafe; color: #1e3a8a; }
.tag-web { background: #fef3c7; color: #78350f; }
.tag-assumed { background: #fee2e2; color: #7f1d1d; }
.tag-user_input { background: #ede9fe; color: #4c1d95; }
.callout { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
.callout-warning { background: #fef2f2; border-color: #ef4444; }
ul, ol { margin: 8px 0; padding-left: 24px; }
.muted { color: #6b7280; font-size: 13px; }
.heatmap { border-collapse: collapse; }
.heatmap td { width: 80px; text-align: center; font-variant-numeric: tabular-nums; }
.cover { text-align: center; padding: 80px 0; }
.cover h1 { font-size: 38px; border: none; }
.cover .subtitle { font-size: 18px; color: #475569; margin-top: 8px; }
.cover .meta { margin-top: 48px; font-size: 14px; color: #6b7280; }
.disclaimer { margin: 16px 0; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #7f1d1d; }
@page { size: A4; margin: 18mm; }
`;
