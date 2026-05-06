import type { InvestmentThesis } from "@vp/shared";

export function Section02Thesis({ data }: { data: InvestmentThesis }): JSX.Element {
  return (
    <section className="section">
      <h1>2. Luận điểm đầu tư (Investment Thesis)</h1>
      <p>{data.narrative}</p>
      <h2>2.1. Luận điểm chính</h2>
      {data.thesisPoints.map((p, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <h3>
            #{i + 1}. {p.title} <span className="muted">[{p.category}]</span>
          </h3>
          <p>{p.detail}</p>
          {p.evidence.length > 0 && (
            <>
              <strong>Dẫn chứng:</strong>
              <ul>
                {p.evidence.map((e, j) => (
                  <li key={j}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
      <h2>2.2. Catalyst</h2>
      <table>
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Loại</th>
            <th>Thời điểm</th>
            <th>Tác động kỳ vọng</th>
          </tr>
        </thead>
        <tbody>
          {data.catalysts.map((c, i) => (
            <tr key={i}>
              <td>{c.title}</td>
              <td>{c.type}</td>
              <td>{c.timing}</td>
              <td>{c.expectedImpact}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>2.3. Rủi ro tóm tắt</h2>
      <ul>
        {data.risks.map((r, i) => (
          <li key={i}>
            <strong>[{r.severity.toUpperCase()}] {r.title}</strong> ({r.category}) — {r.description}
            {r.mitigation && (
              <>
                <br />
                <em>Giảm thiểu: {r.mitigation}</em>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
