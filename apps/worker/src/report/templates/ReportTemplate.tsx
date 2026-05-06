import type { FullReport } from "@vp/shared";
import { Section01ExecSummary } from "./Section01_ExecSummary.js";
import { Section02Thesis } from "./Section02_Thesis.js";
import { Section03Company } from "./Section03_Company.js";
import { Section04Industry } from "./Section04_Industry.js";
import { Section05Business } from "./Section05_Business.js";
import { Section06Financials } from "./Section06_Financials.js";
import { Section07Ratios } from "./Section07_Ratios.js";
import { Section08Forecast } from "./Section08_Forecast.js";
import { Section09Valuation } from "./Section09_Valuation.js";
import { Section10Sensitivity } from "./Section10_Sensitivity.js";
import { Section11Recommendation } from "./Section11_Recommendation.js";
import { Section12Appendix } from "./Section12_Appendix.js";

export function ReportTemplate({ data }: { data: FullReport }): JSX.Element {
  return (
    <>
      <Cover meta={data.meta} />
      {data.meta.disclaimers.length > 0 && (
        <div>
          {data.meta.disclaimers.map((d, i) => (
            <div className="disclaimer" key={i}>
              ⚠ {d}
            </div>
          ))}
        </div>
      )}
      <Section01ExecSummary data={data.section1_executiveSummary} />
      <Section02Thesis data={data.section2_investmentThesis} />
      <Section03Company data={data.section3_companyOverview} leadership={undefined} />
      <Section04Industry data={data.section4_industry} />
      <Section05Business data={data.section5_business} />
      <Section06Financials data={data.section6_financials} />
      <Section07Ratios data={data.section7_ratios} />
      <Section08Forecast data={data.section8_forecast} />
      <Section09Valuation data={data.section9_valuation} />
      <Section10Sensitivity data={data.section10_sensitivity} />
      <Section11Recommendation data={data.section11_recommendation} />
      <Section12Appendix data={data.section12_appendix} />
    </>
  );
}

function Cover({ meta }: { meta: FullReport["meta"] }): JSX.Element {
  return (
    <div className="section cover">
      <h1>BÁO CÁO ĐỊNH GIÁ DOANH NGHIỆP</h1>
      <div className="subtitle">{meta.companyName}</div>
      <div className="muted">Ngành: {meta.industry}</div>
      <div className="meta">
        Phát hành: {new Date(meta.reportDate).toLocaleDateString("vi-VN")}
        <br />
        Phiên bản phân tích: {meta.analystVersion}
        <br />
        Chất lượng dữ liệu đầu vào: {meta.qualityScore}/100
      </div>
    </div>
  );
}
