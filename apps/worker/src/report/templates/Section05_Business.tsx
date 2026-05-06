import type { BusinessAnalysis } from "@vp/shared";
import { formatPct } from "@vp/shared";

export function Section05Business({ data }: { data: BusinessAnalysis }): JSX.Element {
  return (
    <section className="section">
      <h1>5. Phân tích hoạt động kinh doanh</h1>
      <p>{data.narrative}</p>
      <h2>5.1. Cơ cấu doanh thu (FY{data.fiscalYear})</h2>
      <BreakdownTable title="Theo sản phẩm" rows={data.revenueBreakdown.byProduct} />
      <BreakdownTable title="Theo kênh" rows={data.revenueBreakdown.byChannel} />
      <BreakdownTable title="Theo khu vực" rows={data.revenueBreakdown.byRegion} />
      <h2>5.2. Driver chính</h2>
      <table>
        <tbody>
          <tr><th>Volume</th><td>{data.drivers.volume}</td></tr>
          <tr><th>Price</th><td>{data.drivers.price}</td></tr>
          <tr><th>Mix</th><td>{data.drivers.mix}</td></tr>
        </tbody>
      </table>
      <h2>5.3. Biên lợi nhuận</h2>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Gross margin</div>
          <div className="kpi-value">{formatPct(data.margins.grossMargin)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">EBITDA margin</div>
          <div className="kpi-value">{formatPct(data.margins.ebitdaMargin)}</div>
        </div>
      </div>
      {data.customerInsight && (
        <>
          <h2>5.4. Customer Insight</h2>
          <table>
            <tbody>
              <tr><th>Top customer concentration</th><td>{data.customerInsight.topCustomerConcentrationPct !== null ? formatPct(data.customerInsight.topCustomerConcentrationPct) : "—"}</td></tr>
              <tr><th>Churn</th><td>{data.customerInsight.churnPct !== null ? formatPct(data.customerInsight.churnPct) : "—"}</td></tr>
              <tr><th>LTV/CAC</th><td>{data.customerInsight.ltvCacRatio ?? "—"}</td></tr>
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: { label: string; value: number; pct: number }[] }): JSX.Element | null {
  if (rows.length === 0) return null;
  return (
    <>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr><th>Nhóm</th><th>Giá trị</th><th>%</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.label}</td>
              <td>{r.value.toLocaleString("vi-VN")}</td>
              <td>{(r.pct * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
