import type { IndustryAnalysis } from "@vp/shared";
import { formatPct } from "@vp/shared";

export function Section04Industry({ data }: { data: IndustryAnalysis }): JSX.Element {
  return (
    <section className="section">
      <h1>4. Phân tích ngành & thị trường</h1>
      <p>{data.narrative}</p>
      <h3>Quy mô thị trường</h3>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">TAM</div>
          <div className="kpi-value">
            {data.tam.value.toLocaleString("vi-VN")} {data.tam.unit}
          </div>
          <div className="muted">{data.tam.note}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SAM</div>
          <div className="kpi-value">
            {data.sam.value.toLocaleString("vi-VN")} {data.sam.unit}
          </div>
          <div className="muted">{data.sam.note}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">CAGR ngành</div>
          <div className="kpi-value">{formatPct(data.cagr.value)}</div>
          <div className="muted">{data.cagr.note}</div>
        </div>
      </div>
      <h3>Xu hướng</h3>
      <ul>
        {data.trends.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <h3>Đối thủ cạnh tranh</h3>
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Thị phần</th>
            <th>Điểm mạnh</th>
            <th>Điểm yếu</th>
          </tr>
        </thead>
        <tbody>
          {data.competitors.map((c, i) => (
            <tr key={i}>
              <td>{c.name}</td>
              <td>{c.marketSharePct !== null ? formatPct(c.marketSharePct) : "—"}</td>
              <td>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {c.strengths.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </td>
              <td>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {c.weaknesses.map((w, j) => (
                    <li key={j}>{w}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
