import type { CompanyOverview, Leadership } from "@vp/shared";

export function Section03Company({
  data,
  leadership,
}: {
  data: CompanyOverview;
  leadership?: Leadership;
}): JSX.Element {
  return (
    <section className="section">
      <h1>3. Tổng quan doanh nghiệp</h1>
      <h2>3.1. Lịch sử & cơ cấu</h2>
      <p>{data.history}</p>
      <h3>Cơ cấu cổ đông</h3>
      {data.shareholders.length === 0 ? (
        <p className="muted">Chưa có thông tin cơ cấu cổ đông trong dữ liệu cung cấp.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cổ đông</th>
              <th>Tỷ lệ</th>
              <th>Loại</th>
            </tr>
          </thead>
          <tbody>
            {data.shareholders.map((s, i) => (
              <tr key={i}>
                <td>{s.name}</td>
                <td>{s.ownershipPct !== null ? `${(s.ownershipPct * 100).toFixed(1)}%` : "—"}</td>
                <td>{s.type ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {leadership && (
        <>
          <h3>Ban lãnh đạo</h3>
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Vị trí</th>
                <th>Kinh nghiệm</th>
                <th>Bối cảnh</th>
              </tr>
            </thead>
            <tbody>
              {[...leadership.founders, ...leadership.executives, ...leadership.board].map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.role}</td>
                  <td>{p.yearsExperience !== null ? `${p.yearsExperience} năm` : "—"}</td>
                  <td>{p.background}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <h2>3.2. Mô hình kinh doanh</h2>
      <p>
        <strong>Sản phẩm/dịch vụ:</strong> {data.businessModel.productsServices}
      </p>
      <p>
        <strong>Mô hình doanh thu:</strong> {data.businessModel.revenueModel}
      </p>
      {data.businessModel.unitEconomics && (
        <p>
          <strong>Unit economics:</strong> {data.businessModel.unitEconomics}
        </p>
      )}
      <h2>3.3. Chuỗi giá trị</h2>
      <table>
        <tbody>
          <tr>
            <th>Input</th>
            <td>{data.valueChain.input}</td>
          </tr>
          <tr>
            <th>Sản xuất</th>
            <td>{data.valueChain.production}</td>
          </tr>
          <tr>
            <th>Phân phối</th>
            <td>{data.valueChain.distribution}</td>
          </tr>
          <tr>
            <th>Khách hàng</th>
            <td>{data.valueChain.customer}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
