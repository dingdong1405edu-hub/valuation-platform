import type { SensitivityGrid } from "@vp/shared";
import { formatBillionVnd, formatPct } from "@vp/shared";

export function Section10Sensitivity({ data }: { data: SensitivityGrid }): JSX.Element {
  const minValue = Math.min(...data.cells.flat().filter((v) => Number.isFinite(v)));
  const maxValue = Math.max(...data.cells.flat().filter((v) => Number.isFinite(v)));

  function colorFor(v: number): string {
    if (!Number.isFinite(v)) return "#fee2e2";
    const pct = (v - minValue) / (maxValue - minValue || 1);
    const r = Math.round(254 - pct * 100);
    const g = Math.round(226 - pct * 30);
    const b = Math.round(143 - pct * 30);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <section className="section">
      <h1>10. Phân tích nhạy cảm (Sensitivity)</h1>
      <p>
        Bảng giá trị {data.metric} biến thiên theo {data.axisX.label} (cột) và {data.axisY.label} (hàng).
      </p>
      <table className="heatmap">
        <thead>
          <tr>
            <th>{data.axisY.label} ↓ / {data.axisX.label} →</th>
            {data.axisX.values.map((x, i) => (
              <th key={i}>{formatPct(x)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.cells.map((row, yi) => (
            <tr key={yi}>
              <th>{formatPct(data.axisY.values[yi] ?? 0)}</th>
              {row.map((v, xi) => (
                <td key={xi} style={{ background: colorFor(v) }}>
                  {Number.isFinite(v) ? formatBillionVnd(v) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
