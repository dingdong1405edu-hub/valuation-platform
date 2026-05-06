import type { Valuation } from "@vp/shared";
import { formatBillionVnd, formatPct } from "@vp/shared";

export function Section09Valuation({ data }: { data: Valuation }): JSX.Element {
  return (
    <section className="section">
      <h1>9. Định giá doanh nghiệp</h1>
      <h2>9.1. DCF (FCFF)</h2>
      <table>
        <tbody>
          <tr><th>WACC</th><td>{formatPct(data.dcf.assumptions.wacc.value)} <span className={`tag tag-${data.dcf.assumptions.wacc.source}`}>{data.dcf.assumptions.wacc.source}</span></td></tr>
          <tr><th>Terminal growth</th><td>{formatPct(data.dcf.assumptions.terminalGrowth.value)} <span className={`tag tag-${data.dcf.assumptions.terminalGrowth.source}`}>{data.dcf.assumptions.terminalGrowth.source}</span></td></tr>
          <tr><th>Tax rate</th><td>{formatPct(data.dcf.assumptions.taxRate.value)}</td></tr>
          <tr><th>Số năm dự phóng</th><td>{data.dcf.assumptions.forecastYears}</td></tr>
          <tr><th>Enterprise Value</th><td>{formatBillionVnd(data.dcf.enterpriseValue)}</td></tr>
          <tr><th>Net Debt</th><td>{formatBillionVnd(data.dcf.netDebt.value)}</td></tr>
          <tr><th>Equity Value</th><td><strong>{formatBillionVnd(data.dcf.equityValue)}</strong></td></tr>
        </tbody>
      </table>
      <h2>9.2. Multiples</h2>
      <table>
        <thead>
          <tr><th>Phương pháp</th><th>Median multiple</th><th>Implied Equity</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>EV/EBITDA</td>
            <td>{data.multiples.appliedMultiples.evEbitdaMedian.toFixed(2)}x</td>
            <td>{formatBillionVnd(data.multiples.impliedEquityValue.fromEvEbitda)}</td>
          </tr>
          <tr>
            <td>P/E</td>
            <td>{data.multiples.appliedMultiples.peMedian.toFixed(2)}x</td>
            <td>{formatBillionVnd(data.multiples.impliedEquityValue.fromPe)}</td>
          </tr>
          <tr>
            <td>P/B</td>
            <td>{data.multiples.appliedMultiples.pbMedian.toFixed(2)}x</td>
            <td>{formatBillionVnd(data.multiples.impliedEquityValue.fromPb)}</td>
          </tr>
        </tbody>
      </table>
      <h2>9.3. Football Field</h2>
      <table>
        <thead>
          <tr><th>Phương pháp</th><th>Thấp</th><th>Trung bình</th><th>Cao</th></tr>
        </thead>
        <tbody>
          {data.footballField.methods.map((m, i) => (
            <tr key={i}>
              <td>{m.label}</td>
              <td>{formatBillionVnd(m.low)}</td>
              <td>{formatBillionVnd(m.mid)}</td>
              <td>{formatBillionVnd(m.high)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td>Tổng hợp</td>
            <td>{formatBillionVnd(data.footballField.finalRange.low)}</td>
            <td>{formatBillionVnd(data.footballField.finalRange.mid)}</td>
            <td>{formatBillionVnd(data.footballField.finalRange.high)}</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        <strong>Cơ sở tổng hợp:</strong> {data.recommendedFairValue.rationale}
      </p>
    </section>
  );
}
