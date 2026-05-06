import type { Appendix } from "@vp/shared";

export function Section12Appendix({ data }: { data: Appendix }): JSX.Element {
  return (
    <section className="section">
      <h1>12. Phụ lục</h1>

      <h2>12.1. Audit nguồn dữ liệu đầu vào</h2>
      <p>
        Chất lượng đầu vào: <strong>{data.inputManifest.qualityScore}/100</strong>
      </p>

      <h3>Nguồn đã cung cấp</h3>
      <table>
        <thead>
          <tr>
            <th>Loại nguồn</th>
            <th>Số tài liệu</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {data.inputManifest.provided.map((p, i) => (
            <tr key={i}>
              <td>{p.sourceType}</td>
              <td>{p.documentIds.length}</td>
              <td>{p.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.inputManifest.missing.length > 0 && (
        <>
          <h3>Nguồn còn thiếu & chiến lược thay thế</h3>
          <table>
            <thead>
              <tr>
                <th>Nguồn</th>
                <th>Severity</th>
                <th>Field bị ảnh hưởng</th>
                <th>Fallback</th>
              </tr>
            </thead>
            <tbody>
              {data.inputManifest.missing.map((m, i) => (
                <tr key={i}>
                  <td>{m.sourceType}</td>
                  <td>
                    <span className={`tag tag-${m.severity === "blocking" ? "assumed" : m.severity === "major" ? "web" : "computed"}`}>
                      {m.severity}
                    </span>
                  </td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {m.impactedFields.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                  </td>
                  <td>{m.fallbackStrategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {data.inputManifest.warnings.length > 0 && (
        <div className="callout callout-warning">
          <strong>Cảnh báo:</strong>
          <ul>
            {data.inputManifest.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <h2>12.2. Bảng giả định (Assumptions)</h2>
      {data.allAssumptions.length === 0 ? (
        <p className="muted">Không có giả định nào — toàn bộ số liệu xuất phát từ dữ liệu thực hoặc tính toán.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Giá trị</th>
              <th>Đơn vị</th>
              <th>Cơ sở</th>
              <th>Lý do</th>
              <th>Bởi</th>
              <th>Ảnh hưởng §</th>
            </tr>
          </thead>
          <tbody>
            {data.allAssumptions.map((a) => (
              <tr key={a.id}>
                <td>{a.field}</td>
                <td>{String(a.value)}</td>
                <td>{a.unit ?? "—"}</td>
                <td>{a.basis}</td>
                <td>{a.reason}</td>
                <td>{a.emittedBy}</td>
                <td>{a.affectsSection.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>12.3. Đầu vào mô hình định giá</h2>
      <table>
        <thead>
          <tr>
            <th>Tham số</th>
            <th>Giá trị</th>
            <th>Đơn vị</th>
            <th>Source</th>
            <th>Confidence</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {data.modelInputsTable.map((m, i) => (
            <tr key={i}>
              <td>{m.label}</td>
              <td>{String(m.value)}</td>
              <td>{m.unit ?? "—"}</td>
              <td>
                <span className={`tag tag-${m.source}`}>{m.source}</span>
              </td>
              <td>{m.confidence}</td>
              <td>{m.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>12.4. Comparable companies</h2>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Tên</th>
            <th>Quốc gia</th>
            <th>EV/EBITDA</th>
            <th>P/E</th>
            <th>P/B</th>
          </tr>
        </thead>
        <tbody>
          {data.comparablesUsed.map((c, i) => (
            <tr key={i}>
              <td>{c.ticker}</td>
              <td>{c.name}</td>
              <td>{c.country}</td>
              <td>{c.evEbitda?.toFixed(2) ?? "—"}</td>
              <td>{c.pe?.toFixed(2) ?? "—"}</td>
              <td>{c.pb?.toFixed(2) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>12.5. Thuật ngữ</h2>
      <table>
        <thead>
          <tr>
            <th>Thuật ngữ</th>
            <th>Định nghĩa</th>
          </tr>
        </thead>
        <tbody>
          {data.glossary.map((g, i) => (
            <tr key={i}>
              <td>{g.term}</td>
              <td>{g.definition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
