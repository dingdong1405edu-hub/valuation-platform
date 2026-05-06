import type { FinancialAnalysis } from "@vp/shared";

export function Section06Financials({ data }: { data: FinancialAnalysis }): JSX.Element {
  const { statement } = data;
  const years = statement.fiscalYears;

  return (
    <section className="section">
      <h1>6. Phân tích tài chính</h1>
      {data.narrative && <p>{data.narrative}</p>}
      <h2>6.1. Báo cáo Kết quả Kinh doanh</h2>
      <FinancialTable
        years={years}
        rows={[
          { label: "Doanh thu", values: statement.incomeStatement.revenue },
          { label: "Giá vốn hàng bán", values: statement.incomeStatement.cogs },
          { label: "Lợi nhuận gộp", values: statement.incomeStatement.grossProfit },
          { label: "Chi phí hoạt động", values: statement.incomeStatement.opex },
          { label: "EBITDA", values: statement.incomeStatement.ebitda },
          { label: "EBIT", values: statement.incomeStatement.ebit },
          { label: "Chi phí lãi vay", values: statement.incomeStatement.interestExpense },
          { label: "Thuế", values: statement.incomeStatement.tax },
          { label: "Lợi nhuận sau thuế", values: statement.incomeStatement.netIncome, bold: true },
        ]}
      />
      <h2>6.2. Bảng cân đối kế toán</h2>
      <FinancialTable
        years={years}
        rows={[
          { label: "Tổng tài sản", values: statement.balanceSheet.totalAssets, bold: true },
          { label: "Tài sản ngắn hạn", values: statement.balanceSheet.currentAssets },
          { label: "Tiền & tương đương", values: statement.balanceSheet.cash },
          { label: "Hàng tồn kho", values: statement.balanceSheet.inventory },
          { label: "Phải thu", values: statement.balanceSheet.receivables },
          { label: "Tổng nợ phải trả", values: statement.balanceSheet.totalLiabilities },
          { label: "Nợ ngắn hạn", values: statement.balanceSheet.currentLiabilities },
          { label: "Nợ dài hạn", values: statement.balanceSheet.longTermDebt },
          { label: "Vốn chủ sở hữu", values: statement.balanceSheet.equity, bold: true },
        ]}
      />
      <h2>6.3. Lưu chuyển tiền tệ</h2>
      <FinancialTable
        years={years}
        rows={[
          { label: "CFO", values: statement.cashFlow.cfo },
          { label: "CFI", values: statement.cashFlow.cfi },
          { label: "CFF", values: statement.cashFlow.cff },
          { label: "CAPEX", values: statement.cashFlow.capex },
          { label: "FCF", values: statement.cashFlow.fcf, bold: true },
        ]}
      />
      <p className="muted">
        Đơn vị: {statement.unit} {statement.currency}. Số có nguồn gốc từ tài liệu, công thức, hoặc giả định
        — xem §12 Phụ lục để kiểm tra provenance từng cell.
      </p>
    </section>
  );
}

function FinancialTable({
  years,
  rows,
}: {
  years: number[];
  rows: { label: string; values: number[]; bold?: boolean }[];
}): JSX.Element {
  return (
    <table>
      <thead>
        <tr>
          <th>Khoản mục</th>
          {years.map((y) => (
            <th key={y}>FY{y}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={r.bold ? { fontWeight: 700 } : undefined}>
            <td>{r.label}</td>
            {r.values.map((v, j) => (
              <td key={j} style={{ textAlign: "right" }}>
                {v.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
