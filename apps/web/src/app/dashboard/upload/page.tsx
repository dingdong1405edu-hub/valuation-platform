"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const SOURCE_OPTIONS = [
  { value: "financial_statements", label: "Báo cáo tài chính (BCTC)" },
  { value: "business_plan", label: "Kế hoạch kinh doanh" },
  { value: "company_profile", label: "Hồ sơ năng lực" },
  { value: "catalogue_brochure", label: "Catalogue / Brochure" },
  { value: "ceo_cv", label: "CV chủ DN / Ban lãnh đạo" },
  { value: "website", label: "Trang web (export PDF)" },
  { value: "fanpage", label: "Fanpage" },
  { value: "crm", label: "Export CRM (CSV/Excel)" },
  { value: "accounting_system", label: "Export phần mềm kế toán (CSV/Excel)" },
  { value: "erp", label: "Export ERP (CSV/Excel)" },
  { value: "other", label: "Khác" },
];

type FileEntry = { file: File; sourceType: string };

export default function UploadPage(): JSX.Element {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [industry, setIndustry] = useState("");
  const [sizeHint, setSizeHint] = useState<"micro" | "small" | "medium" | "large">("medium");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const incoming = Array.from(e.target.files ?? []);
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({ file, sourceType: "financial_statements" })),
    ]);
    e.target.value = "";
  }

  function setSourceType(idx: number, st: string): void {
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, sourceType: st } : f)),
    );
  }

  function removeFile(idx: number): void {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append(
        "companyMeta",
        JSON.stringify({
          name: companyName,
          taxId: taxId || undefined,
          industry,
          country: "VN",
          sizeHint,
        }),
      );
      files.forEach((f, i) => {
        fd.append(`file_${i}`, f.file);
        fd.append(`sourceType_${i}`, f.sourceType);
      });
      fd.append("fileCount", String(files.length));

      const res = await fetch("/api/jobs", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const { jobId } = (await res.json()) as { jobId: string };
      window.location.href = `/dashboard/jobs/${jobId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">Tạo báo cáo định giá mới</h1>

      <fieldset className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <legend className="font-medium px-2">Thông tin doanh nghiệp</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Tên doanh nghiệp *</span>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm">MST</span>
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm">Ngành *</span>
            <input
              required
              placeholder="vd: Bán lẻ thiết bị điện tử"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm">Quy mô ước tính</span>
            <select
              value={sizeHint}
              onChange={(e) => setSizeHint(e.target.value as typeof sizeHint)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            >
              <option value="micro">Siêu nhỏ ({"<"} 3 tỷ doanh thu)</option>
              <option value="small">Nhỏ (3-50 tỷ)</option>
              <option value="medium">Vừa (50-500 tỷ)</option>
              <option value="large">Lớn ({">"} 500 tỷ)</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <legend className="font-medium px-2">Tài liệu</legend>
        <p className="text-sm text-slate-600">
          Có thể upload nhiều file. Mỗi file phải gắn loại nguồn tương ứng để hệ thống xử lý đúng.
        </p>
        <input
          type="file"
          multiple
          onChange={onFileChange}
          accept=".pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
          className="block"
        />
        {files.length > 0 && (
          <table className="w-full border-collapse mt-3 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-2">Tên file</th>
                <th className="text-left p-2">Loại nguồn</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="p-2">{f.file.name} <span className="text-slate-500">({Math.round(f.file.size / 1024)} KB)</span></td>
                  <td className="p-2">
                    <select
                      value={f.sourceType}
                      onChange={(e) => setSourceType(i, e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1"
                    >
                      {SOURCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <button type="button" onClick={() => removeFile(i)} className="text-red-600 hover:underline">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </fieldset>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 text-white px-6 py-3 font-medium disabled:opacity-50"
      >
        {submitting ? "Đang tạo job..." : "Bắt đầu định giá"}
      </button>
    </form>
  );
}
