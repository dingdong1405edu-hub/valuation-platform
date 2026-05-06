import type { RatioAnalysis } from "@vp/shared";
import { formatPct } from "@vp/shared";

export function Section07Ratios({ data }: { data: RatioAnalysis }): JSX.Element {
  const years = data.fiscalYears;
  return (
    <section className="section">
      <h1>7. Phân tích chỉ số tài chính</h1>
      <RatioTable
        title="7.1. Tăng trưởng"
        years={years}
        rows={[
          { label: "Revenue YoY", values: data.growth.revenueYoY, fmt: formatPct, padFront: true },
          { label: "Net Income YoY", values: data.growth.netIncomeYoY, fmt: formatPct, padFront: true },
          {
            label: "Revenue CAGR",
            values: years.map((_, i) => (i === years.length - 1 ? data.growth.revenueCagr ?? 0 : null)),
            fmt: (v) => (v === null ? "—" : formatPct(v)),
          },
        ]}
      />
      <RatioTable
        title="7.2. Hiệu quả & Sinh lời"
        years={years}
        rows={[
          { label: "Gross margin", values: data.profitability.grossMargin, fmt: formatPct },
          { label: "EBITDA margin", values: data.profitability.ebitdaMargin, fmt: formatPct },
          { label: "Net margin", values: data.profitability.netMargin, fmt: formatPct },
          { label: "ROE", values: data.profitability.roe, fmt: formatPct },
          { label: "ROA", values: data.profitability.roa, fmt: formatPct },
          { label: "ROIC", values: data.profitability.roic, fmt: (v) => (v === null ? "—" : formatPct(v)) },
        ]}
      />
      <RatioTable
        title="7.3. Đòn bẩy & Thanh khoản"
        years={years}
        rows={[
          { label: "D/E", values: data.leverage.debtToEquity, fmt: (v) => v.toFixed(2) },
          { label: "Debt/EBITDA", values: data.leverage.debtToEbitda, fmt: (v) => v.toFixed(2) },
          { label: "Interest coverage", values: data.leverage.interestCoverage, fmt: (v) => (v === null ? "—" : v.toFixed(2)) },
          { label: "Current ratio", values: data.liquidity.currentRatio, fmt: (v) => v.toFixed(2) },
          { label: "Quick ratio", values: data.liquidity.quickRatio, fmt: (v) => v.toFixed(2) },
        ]}
      />
      <RatioTable
        title="7.4. Hiệu quả vận hành"
        years={years}
        rows={[
          { label: "Asset turnover", values: data.efficiency.assetTurnover, fmt: (v) => v.toFixed(2) },
          { label: "Inventory days", values: data.efficiency.inventoryDays, fmt: (v) => (v === null ? "—" : v.toFixed(0)) },
          { label: "Receivable days", values: data.efficiency.receivableDays, fmt: (v) => (v === null ? "—" : v.toFixed(0)) },
        ]}
      />
    </section>
  );
}

type RatioRow = {
  label: string;
  values: (number | null)[];
  fmt: (v: number) => string;
  padFront?: boolean;
};

function RatioTable({ title, years, rows }: { title: string; years: number[]; rows: RatioRow[] }): JSX.Element {
  return (
    <>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Chỉ số</th>
            {years.map((y) => (
              <th key={y}>FY{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const padded = r.padFront && r.values.length < years.length ? [null, ...r.values] : r.values;
            return (
              <tr key={i}>
                <td>{r.label}</td>
                {years.map((_, j) => {
                  const v = padded[j] ?? null;
                  return (
                    <td key={j} style={{ textAlign: "right" }}>
                      {v === null ? "—" : r.fmt(v)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
