import type { Recommendation } from "@vp/shared";
import { formatBillionVnd, formatPct } from "@vp/shared";

export function Section11Recommendation({ data }: { data: Recommendation }): JSX.Element {
  return (
    <section className="section">
      <h1>11. Kết luận & Khuyến nghị</h1>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Giá trị hợp lý</div>
          <div className="kpi-value">{formatBillionVnd(data.fairValue.point)}</div>
          <div className="muted">
            {formatBillionVnd(data.fairValue.low)} – {formatBillionVnd(data.fairValue.high)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Upside / Downside</div>
          <div className="kpi-value">
            {data.upsideDownsidePct !== null ? formatPct(data.upsideDownsidePct) : "—"}
          </div>
        </div>
        {data.entryPrice !== undefined && (
          <div className="kpi">
            <div className="kpi-label">Giá vào gợi ý</div>
            <div className="kpi-value">{formatBillionVnd(data.entryPrice)}</div>
          </div>
        )}
      </div>
      <p>{data.narrative}</p>
      {data.dealStructure && (
        <>
          <h3>Cấu trúc deal gợi ý</h3>
          <p>{data.dealStructure}</p>
        </>
      )}
      <h3>Điều kiện</h3>
      <ul>
        {data.conditions.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </section>
  );
}
