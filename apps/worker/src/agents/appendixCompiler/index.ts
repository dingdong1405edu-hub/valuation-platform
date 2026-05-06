import { z } from "zod";
import {
  Appendix,
  Assumption,
  ComparableCompany,
  InputManifest,
} from "@vp/shared";

const Input = z.object({
  inputManifest: InputManifest,
  allAssumptions: z.array(Assumption),
  comparablesUsed: z.array(ComparableCompany),
  modelInputs: z.array(
    z.object({
      label: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: z.string().optional(),
      source: z.string(),
      confidence: z.string(),
      note: z.string(),
    }),
  ),
});

const VI_GLOSSARY = [
  { term: "DCF", definition: "Discounted Cash Flow — phương pháp chiết khấu dòng tiền tự do về hiện tại để định giá doanh nghiệp." },
  { term: "FCFF", definition: "Free Cash Flow to Firm — dòng tiền tự do của toàn bộ doanh nghiệp (trước thanh toán nợ)." },
  { term: "WACC", definition: "Weighted Average Cost of Capital — chi phí vốn bình quân gia quyền giữa vốn chủ và nợ." },
  { term: "Terminal Value", definition: "Giá trị cuối kỳ dự phóng, dùng công thức Gordon Growth." },
  { term: "EV", definition: "Enterprise Value — giá trị doanh nghiệp (vốn hoá + nợ ròng)." },
  { term: "EBITDA", definition: "Earnings Before Interest, Tax, Depreciation, Amortization." },
  { term: "EV/EBITDA", definition: "Multiple định giá — EV chia cho EBITDA của doanh nghiệp." },
  { term: "P/E", definition: "Price to Earnings — giá / lợi nhuận trên cổ phần." },
  { term: "P/B", definition: "Price to Book — giá thị trường / giá trị sổ sách của vốn chủ." },
  { term: "ROE", definition: "Return on Equity — lợi nhuận trên vốn chủ sở hữu." },
  { term: "ROIC", definition: "Return on Invested Capital — lợi nhuận trên vốn đầu tư." },
  { term: "CAGR", definition: "Compound Annual Growth Rate — tốc độ tăng trưởng kép hàng năm." },
  { term: "TAM/SAM/SOM", definition: "Total/Serviceable/Obtainable Addressable Market — quy mô thị trường tổng / có thể phục vụ / có thể chiếm." },
];

export const appendixCompilerAgent = {
  name: "appendixCompiler",
  version: "0.1.0",
  pure: true as const,
  inputSchema: Input,
  outputSchema: Appendix,
  run(input: z.infer<typeof Input>): z.infer<typeof Appendix> {
    return {
      inputManifest: input.inputManifest,
      allAssumptions: input.allAssumptions,
      comparablesUsed: input.comparablesUsed,
      modelInputsTable: input.modelInputs,
      glossary: VI_GLOSSARY,
    };
  },
};
