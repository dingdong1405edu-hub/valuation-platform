import type { ExecutiveSummary } from "@vp/shared";
import { formatBillionVnd, formatCurrency, formatPct } from "@vp/shared";

export function Section01ExecSummary({ data }: { data: ExecutiveSummary }): JSX.Element {
  return (
    <section className="section">
      <h1>1. Tóm tắt điều hành (Executive Summary)</h1>
      <p>
        <strong>{data.companyName}</strong> — {data.industry}
      </p>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Doanh thu mới nhất</div>
          <div className="kpi-value">{formatCurrency(data.size.revenueLatest.value)}</div>
          <div className="muted">{data.size.revenueLatest.note}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">EBITDA</div>
          <div className="kpi-value">{formatCurrency(data.size.ebitdaLatest.value)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Lợi nhuận sau thuế</div>
          <div className="kpi-value">{formatCurrency(data.size.netIncomeLatest.value)}</div>
        </div>
      </div>
      <h3>Khoảng giá trị hợp lý</h3>
      <table>
        <thead>
          <tr>
            <th>Thấp</th>
            <th>Trung bình</th>
            <th>Cao</th>
            <th>Đơn vị</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatBillionVnd(data.valuationRange.low)}</td>
            <td>{formatBillionVnd(data.valuationRange.mid)}</td>
            <td>{formatBillionVnd(data.valuationRange.high)}</td>
            <td>{data.valuationRange.currency}</td>
          </tr>
        </tbody>
      </table>
      <h3>Khuyến nghị</h3>
      <p>
        <strong>{data.recommendation.headline}</strong>
      </p>
      <p>
        Giá trị hợp lý: {formatBillionVnd(data.recommendation.fairValue)} —{" "}
        {data.recommendation.upsideDownsidePct !== null
          ? `Upside ${formatPct(data.recommendation.upsideDownsidePct)}`
          : "không có giá tham chiếu để so sánh"}
      </p>
      <h3>Key drivers</h3>
      <ul>
        {data.recommendation.keyDrivers.map((d, i) => (
          <li key={i}>
            <strong>{d.label}:</strong> {d.detail}
          </li>
        ))}
      </ul>
      <h3>Tổng quan</h3>
      <p>{data.narrative}</p>
    </section>
  );
}
