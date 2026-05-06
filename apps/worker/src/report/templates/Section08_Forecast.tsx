import type { Forecast } from "@vp/shared";
import { formatPct } from "@vp/shared";

export function Section08Forecast({ data }: { data: Forecast }): JSX.Element {
  return (
    <section className="section">
      <h1>8. Dự phóng tài chính {data.forecastYears.length} năm</h1>
      <p>{data.rationale}</p>
      <table>
        <thead>
          <tr>
            <th>Năm</th>
            <th>Doanh thu</th>
            <th>EBITDA</th>
            <th>EBIT</th>
            <th>CAPEX</th>
            <th>FCF</th>
          </tr>
        </thead>
        <tbody>
          {data.forecastYears.map((y, i) => (
            <tr key={i}>
              <td>{y.year}</td>
              <td style={{ textAlign: "right" }}>{y.revenue.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}</td>
              <td style={{ textAlign: "right" }}>{y.ebitda.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}</td>
              <td style={{ textAlign: "right" }}>{y.ebit.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}</td>
              <td style={{ textAlign: "right" }}>{y.capex.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}</td>
              <td style={{ textAlign: "right" }}>{y.fcf.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Drivers giả định</h3>
      <table>
        <thead>
          <tr>
            <th>Năm</th>
            <th>Revenue growth</th>
            <th>Gross margin</th>
            <th>EBITDA margin</th>
            <th>Capex %</th>
            <th>WC %</th>
          </tr>
        </thead>
        <tbody>
          {data.forecastYears.map((y, i) => (
            <tr key={i}>
              <td>{y.year}</td>
              <td>{formatPct(data.drivers.revenueGrowth[i] ?? 0)}</td>
              <td>{formatPct(data.drivers.grossMargin[i] ?? 0)}</td>
              <td>{formatPct(data.drivers.ebitdaMargin[i] ?? 0)}</td>
              <td>{formatPct(data.drivers.capexPctRevenue[i] ?? 0)}</td>
              <td>{formatPct(data.drivers.workingCapitalPctRevenue[i] ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
