# Project: AI Financial Valuation Platform

> Web full-stack: user upload PDF báo cáo tài chính / scan → **N agents độc lập** phân tích, mỗi agent **nhả JSON** theo schema chặt → **Composer deterministic** ráp các JSON thành báo cáo định giá 12 phần (PDF/HTML).

---

## 0. Triết lý kiến trúc (đọc trước mọi thứ khác)

Năm nguyên tắc bất di bất dịch:

### N1. Mỗi agent là **pure function** `JSON → JSON`
- Input: 1 JSON object đã validate Zod.
- Output: 1 JSON object đã validate Zod (nếu fail → retry tối đa 2 lần với feedback lỗi → fail job).
- Agent KHÔNG đọc state ngầm, KHÔNG ghi file, KHÔNG gọi nhau trực tiếp.
- Mọi tài nguyên ngoài (PDF text, web search, tính toán) đi qua **tools** được khai báo trong agent definition.

### N2. Agents **độc lập** và **mixable**
- Mỗi agent chạy được riêng lẻ với 1 file JSON input từ disk → ra 1 file JSON output. Không cần worker, queue, DB.
- Output JSON của agent A có thể là input của agent B (nếu schema tương thích) — agents là **lego blocks**.
- Có thể tái sử dụng cùng 1 agent ở nhiều job khác nhau, hoặc thay agent này bằng agent khác cùng output schema mà phần còn lại của hệ thống không biết.

### N3. JSON schema là **hợp đồng**, không phải gợi ý
- Mỗi agent định nghĩa `inputSchema` và `outputSchema` (Zod) — trong file `schema.ts` cùng folder agent.
- LLM trả response dùng **structured outputs** (Anthropic tool-use forced với `tool_choice` cố định, hoặc JSON mode + Zod parse).
- Output fail Zod → KHÔNG dùng. Retry với error message đính kèm.
- Số liệu (revenue, EBITDA, ratios, fair value …) là **kiểu number**, không phải string. Đơn vị (VND, USD, %) là field riêng. Không chấp nhận `"1.2 tỷ"`.

### N4. Composer **deterministic**, không LLM
- Composer KHÔNG phải LLM agent. Là pure TS function: `(sectionJson[12]) → ReportHtml`.
- Composer chỉ **ráp** các JSON đã validate vào template (React Email / MDX / Handlebars). Không paraphrase, không sáng tạo, không "polish".
- LLM chỉ làm việc ở các agent phía trên. Nếu cần text dài (executive summary narrative), agent tương ứng tự sinh đoạn text đó và đặt vào field `narrative: string` trong JSON output. Composer chỉ render `{{narrative}}`.
- Hệ quả: nếu rerun cùng bộ JSON → ra PDF byte-identical (trừ timestamp). Test được bằng snapshot.

### N5. **Provenance** — không có giá trị nào không có nguồn
- Mọi số/fact quan trọng (revenue, ratios, WACC, beta, comparables, fair value, …) **bắt buộc** có metadata nguồn: `source ∈ { user_input | extracted | web | computed | assumed }`, `confidence ∈ { high | medium | low }`, `note: string` (luôn bắt buộc).
- Khi user **không cung cấp** một loại tài liệu/dữ liệu (xem §1.5), agent phải **tự assume** giá trị hợp lý dựa trên benchmark (ngành, quy mô, công ty tương đương) — và **note rõ** nguồn `assumed` + `basis` (cơ sở giả định) + `note` (lý do). KHÔNG được im lặng dùng số bịa.
- Tất cả `Assumption` và `MissingInput` được aggregate vào `appendixCompiler` → §12 Phụ lục báo cáo có **bảng đầy đủ assumption + nguồn**. User đọc báo cáo phải biết được: số nào từ data thật, số nào do AI giả định.
- Số `assumed` không được trộn vào số `extracted` ở cùng field — phải tách bạch trong schema (xem `TracedNumber` ở §5).

---

## 1. Mục tiêu sản phẩm

**Input:** xem §1.5 — 9 nguồn dữ liệu khả dĩ, không bắt buộc đầy đủ.

**Output:** Báo cáo định giá PDF/HTML 12 phần:
1. Executive Summary
2. Investment Thesis (luận điểm + catalyst + risk) — **30% trọng số chất lượng**
3. Tổng quan doanh nghiệp (lịch sử, cổ đông, ban lãnh đạo, mô hình KD, chuỗi giá trị)
4. Phân tích ngành & thị trường (TAM/SAM/SOM, CAGR, đối thủ)
5. Phân tích hoạt động kinh doanh (doanh thu theo SP/kênh/khu vực, biên LN)
6. Phân tích tài chính (KQKD, BCĐKT, dòng tiền — 3–5 năm)
7. Phân tích chỉ số (CAGR, ROE/ROA, đòn bẩy)
8. Dự phóng tài chính 3–5 năm
9. Định giá: DCF (FCFF) + Multiples (EV/EBITDA, P/E, P/B) — **30% trọng số chất lượng**
10. Sensitivity analysis
11. Kết luận & khuyến nghị (fair value, deal structure, entry price)
12. Phụ lục (assumptions, model, comparables, **input audit** — nguồn nào có / nguồn nào missing → fallback gì)

---

## 1.5. Catalog các nguồn input

User có thể cung cấp **bất kỳ tổ hợp nào** của 9 nguồn dưới đây. Hệ thống không bắt buộc cái nào (trừ ít nhất 1 nguồn để xác định DN). Mỗi nguồn map vào một loại `IngestionAdapter` riêng → output JSON chuẩn hóa → các agent downstream tiêu thụ.

| # | Nguồn | Loại | Ingestion adapter | Đóng góp chính cho section | Bắt buộc? |
|---|---|---|---|---|---|
| 1 | **Bộ báo cáo tài chính** (BCTC, BCTC kiểm toán, báo cáo thuế) | PDF / Excel / scan | `pdfIngestion` + OCR + `tableExtractor` → `Document` | §6, §7 (mọi số tài chính lịch sử) | Khuyến nghị mạnh — không có thì §6/7 toàn bộ là `assumed` (báo cáo chất lượng thấp, có cảnh báo) |
| 2 | **Website / fanpage** | URL | `webIngestion` (Playwright crawl + readability + screenshot) | §3 (mô hình KD), §4 (định vị), §5 (sản phẩm/kênh) | Không |
| 3 | **Catalogue / Brochure** | PDF / image | `pdfIngestion` + image OCR + product extractor | §3.2 (sản phẩm/dịch vụ), §5 (mix doanh thu theo SP) | Không |
| 4 | **Hồ sơ năng lực** (capability profile) | PDF / DOCX | `docIngestion` (mammoth/pdf-parse) | §3 (lịch sử, năng lực, dự án tiêu biểu) | Không |
| 5 | **Kế hoạch kinh doanh 1–3 năm** | PDF / DOCX / Excel | `docIngestion` + `businessPlanExtraction` agent | §8 (forecast — số do user, không cần assume), §2 (catalyst) | Không (nếu có → forecast chất lượng cao hơn nhiều) |
| 6 | **CV của Chủ DN / Ban lãnh đạo** | PDF / DOCX / image | `docIngestion` + `leadershipExtraction` agent | §3.1 (ban lãnh đạo, kinh nghiệm) | Không |
| 7 | **CRM** (HubSpot / Salesforce / Bitrix / Misa CRM / custom export) | API connector hoặc CSV/Excel export | `crmIngestion` adapter | §5 (pipeline, customer concentration, churn, LTV/CAC nếu có) | Không |
| 8 | **Phần mềm kế toán** (MISA, Fast, Bravo, AMIS, 3TSoft, …) | CSV/Excel export hoặc API | `accountingIngestion` adapter | §6 (số tài chính chi tiết, breakdown doanh thu/chi phí) | Không (nếu có → §6 chi tiết hơn BCTC năm) |
| 9 | **ERP** (SAP, Oracle, Odoo, Microsoft Dynamics, Bravo ERP, …) | API hoặc DB export | `erpIngestion` adapter | §5 (volume, mix), §6 (cost structure), §7 (working capital, inventory turnover) | Không |

### Mức ưu tiên adapter cho MVP

- **Phase 1 (MVP):** Chỉ adapter file (PDF/DOCX/Excel/image). Tức nguồn 1, 3, 4, 5, 6 + CSV/Excel export của 7/8/9. Web crawl (nguồn 2) đứng ở Phase 1 nếu Playwright Railway dễ deploy; nếu khó, đẩy Phase 2.
- **Phase 2:** Connector API cho CRM (HubSpot, Salesforce) và phần mềm kế toán phổ biến VN (MISA AMIS, Fast Online).
- **Phase 3:** ERP connector (Odoo dễ nhất vì REST mở, SAP/Oracle phức tạp).

### Pattern xử lý nguồn missing — `inputAuditor` agent

Trước mọi agent phân tích, chạy **`inputAuditor`** (LLM, sonnet-4-6):

**Input:** danh sách nguồn user cung cấp + metadata DN (tên, ngành, quy mô doanh thu nếu biết).

**Output:** `InputManifest` JSON gồm:
- `provided[]`: nguồn nào đã có, từ document nào.
- `missing[]`: nguồn nào thiếu, mỗi entry kèm `impactedFields[]` (field nào trong báo cáo sẽ bị ảnh hưởng) và `fallbackStrategy` (cách giả định: "dùng industry benchmark từ web", "dùng comparable median", "dùng default conservative", …).
- `qualityScore`: tổng điểm 0–100 dựa trên độ phủ nguồn (BCTC = 40, KH KD = 20, web = 10, các nguồn khác cộng dồn). Điểm < 30 → báo cáo có disclaimer to ở §1.

`InputManifest` này được mọi agent downstream **đọc** để biết phải `extract` từ đâu, hay phải `assume` field nào → từ đó emit `Assumption` đúng cách.

### Default values (khi missing toàn bộ một category)

Khi user chỉ có duy nhất tên DN + ngành (best-effort mode), hệ thống tự assume:

| Field | Fallback strategy | Default cụ thể |
|---|---|---|
| Revenue history | Web search báo chí / cafef / vietstock theo tên DN; nếu không có → estimate từ industry size + market share giả định (low confidence) | `assumed`, confidence=`low` |
| EBITDA margin | Industry benchmark từ web (Damodaran, BMI, hoặc query Tavily) | Median ngành VN, confidence=`medium` |
| Revenue growth | Industry CAGR ± 0% (nếu là leader thì +20% relative; follower thì baseline) | Median ngành, confidence=`medium` |
| WACC | Damodaran VN + size premium | rf=10y VGB yield, beta=industry, MRP=8.5%, confidence=`medium` |
| Beta | Damodaran industry beta (web fetch) | Industry beta, confidence=`medium` |
| Terminal growth | min(GDP growth VN, 4%) | 3.5%, confidence=`high` (conservative anchor) |
| Comparables | Top 5 mã sàn HOSE/HNX cùng ngành | DB seed hoặc web search, confidence=`medium` |
| Cost structure | Industry breakdown (cogs/opex/payroll/marketing %) | confidence=`low` |
| Capex | % of revenue theo ngành (asset-heavy 8–12%, asset-light 2–4%) | confidence=`medium` |

**Mọi default phải đi qua `appendixCompiler` để hiện trong báo cáo.** User đọc xong phải hiểu rõ "đây là giả định, không phải data thật".

---

## 2. Tech Stack

| Layer | Chọn | Ghi chú |
|---|---|---|
| Frontend | **Next.js 14** App Router + TypeScript | |
| UI | Tailwind + shadcn/ui + Recharts | |
| HTTP API | Next.js API routes | upload, job, auth |
| Worker | Node.js + **BullMQ** | chạy pipeline agents nền |
| DB | **PostgreSQL** (Railway) + Prisma | |
| Cache/Queue | **Redis** (Railway) | BullMQ + web search cache |
| Storage | Cloudflare R2 (S3-compat) hoặc Railway volume | PDF gốc + report PDF |
| AI SDK | **`@anthropic-ai/sdk`** | structured outputs qua tool-use |
| Models | `claude-opus-4-7` (orchestrator + valuation + thesis), `claude-sonnet-4-6` (sub-agents), `claude-haiku-4-5-20251001` (extraction) | |
| OCR | Mistral OCR API hoặc Google Document AI | test trước với PDF scan tiếng Việt |
| Web search | Tavily API | wrapper có Redis cache 7 ngày |
| Web crawl | Playwright (headless) + readability + screenshot | cho website / fanpage; cache HTML 24h |
| DOCX | `mammoth` | hồ sơ năng lực, kế hoạch KD |
| Excel/CSV | `xlsx` (sheetjs) | financial export, CRM/ERP export |
| Image OCR | Tesseract Vietnamese hoặc cloud OCR | catalogue/brochure |
| Auth | NextAuth (email magic link + Google) | |
| Schema validation | **Zod** | input + output mọi agent + API boundary |
| Report render | **React Email** hoặc MDX → HTML; Puppeteer → PDF | composer là pure TS, no LLM |
| Charts trong PDF | Recharts → SSR static SVG nhúng | hoặc render canvas server-side |
| Deploy | **Railway** | web + worker + postgres + redis |
| CI/CD | GitHub Actions | lint + typecheck + test on PR; auto deploy `main` |

**Không bao giờ:** đổi stack chính (Next.js, Prisma, Anthropic SDK, Zod, BullMQ) trừ khi user ok rõ ràng.

---

## 3. Cấu trúc thư mục

```
/
├── apps/
│   ├── web/                          # Next.js
│   │   ├── app/(auth)/...
│   │   ├── app/dashboard/{upload,jobs/[id],reports}/...
│   │   ├── app/api/{upload,jobs,auth}/...
│   │   ├── components/{ui,report,upload}/...
│   │   └── lib/...
│   └── worker/
│       ├── src/
│       │   ├── pipeline/
│       │   │   ├── runAgent.ts       # generic runner: validate input → call → validate output → log
│       │   │   ├── orchestrator.ts   # DAG runner: chạy agents song song khi có thể
│       │   │   └── ingestion/        # adapter cho từng loại nguồn (xem §1.5)
│       │   │       ├── pdfIngestion.ts        # PDF text + scan OCR → Document
│       │   │       ├── docIngestion.ts        # DOCX (mammoth) → Document
│       │   │       ├── excelIngestion.ts      # XLSX/CSV → Document.tables[]
│       │   │       ├── imageIngestion.ts      # JPG/PNG OCR → Document
│       │   │       ├── webIngestion.ts        # Playwright + readability → Document
│       │   │       ├── crmIngestion.ts        # CSV/API → CrmExport
│       │   │       ├── accountingIngestion.ts # CSV/API MISA/Fast/AMIS → AccountingExport
│       │   │       └── erpIngestion.ts        # CSV/API Odoo/SAP → ErpExport
│       │   ├── agents/               # MỖI AGENT = 1 FOLDER
│       │   │   ├── _base.ts          # AgentDefinition type
│       │   │   ├── inputAuditor/             # đọc danh sách nguồn → InputManifest (provided/missing/fallbackStrategy)
│       │   │   ├── companyProfile/
│       │   │   │   ├── index.ts      # export AgentDefinition
│       │   │   │   ├── schema.ts     # Zod input + output
│       │   │   │   ├── prompt.md     # system prompt
│       │   │   │   └── fixture/      # input/output JSON examples để test
│       │   │   ├── industryResearch/
│       │   │   ├── businessAnalysis/
│       │   │   ├── financialExtraction/      # Document(BCTC) → FinancialStatement
│       │   │   ├── businessPlanExtraction/   # Document(KH KD) → BusinessPlan (revenue targets, strategy, capex plan)
│       │   │   ├── leadershipExtraction/     # Document(CV/Hồ sơ) → Leadership (background, experience)
│       │   │   ├── productCatalogExtraction/ # Document(Catalogue) → ProductCatalog
│       │   │   ├── webProfileExtraction/     # Document(web crawl) → WebProfile (positioning, products, channels)
│       │   │   ├── crmAnalysis/              # CrmExport → CustomerInsight (concentration, churn, LTV/CAC)
│       │   │   ├── accountingAnalysis/       # AccountingExport → DetailedFinancials (monthly/quarterly granularity)
│       │   │   ├── erpAnalysis/              # ErpExport → OperationalMetrics (volume, mix, working capital)
│       │   │   ├── ratioAnalysis/            # FinancialStatement → RatioAnalysis (DETERMINISTIC, không LLM)
│       │   │   ├── forecast/                 # ưu tiên BusinessPlan, fallback industry+history
│       │   │   ├── valuationDcf/             # math thuần TS, LLM chỉ chọn assumption
│       │   │   ├── valuationMultiples/
│       │   │   ├── sensitivity/              # DETERMINISTIC
│       │   │   ├── investmentThesis/
│       │   │   ├── risk/
│       │   │   ├── executiveSummary/
│       │   │   ├── recommendation/
│       │   │   └── appendixCompiler/         # PURE TS — gom mọi Assumption + InputManifest → Appendix
│       │   ├── tools/                # web_search, fetch_url, dcf_compute, wacc_compute, parse_table, …
│       │   ├── valuation/            # pure TS: DCF, WACC, multiples, terminal value (UNIT TESTED)
│       │   └── report/
│       │       ├── compose.ts        # (sectionJson) → html (PURE TS, no LLM)
│       │       ├── templates/        # React Email / MDX components per section
│       │       └── pdf.ts            # html → PDF (Puppeteer)
│       └── package.json
├── packages/
│   ├── db/                           # Prisma schema + client
│   ├── shared/                       # types + Zod schemas dùng chung web ↔ worker
│   │   └── schemas/
│   │       ├── document.ts
│   │       ├── financials.ts
│   │       ├── valuation.ts
│   │       ├── report.ts             # FullReport = composition của 12 section schemas
│   │       └── index.ts
│   └── ai/                           # Anthropic wrapper: caching, retry, structured outputs
├── prisma/schema.prisma
├── scripts/
│   ├── runAgent.ts                   # CLI: chạy 1 agent với 1 file input.json → output.json
│   └── runPipeline.ts                # CLI: chạy full pipeline với 1 PDF
├── .env.example
├── railway.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

**Quy ước cốt lõi:** mỗi agent là 1 folder tự đủ. Có thể copy folder ra dự án khác và nó vẫn chạy nếu có `runAgent` runner và Anthropic client.

---

## 4. Agent definition (chuẩn duy nhất)

```ts
// apps/worker/src/agents/_base.ts
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

export type AgentDefinition<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
  name: string;                  // "companyProfile" — unique
  version: string;               // semver, bump khi đổi schema/prompt
  model: "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";
  inputSchema: I;
  outputSchema: O;
  systemPrompt: string;          // load từ prompt.md
  tools?: Anthropic.Tool[];
  thinking?: { budget_tokens: number };  // bật cho valuation, thesis
  cache?: boolean;               // mặc định true
  maxRetries?: number;           // mặc định 2
};
```

**Runner duy nhất:**

```ts
// apps/worker/src/pipeline/runAgent.ts
export async function runAgent<I, O>(
  agent: AgentDefinition<z.ZodType<I>, z.ZodType<O>>,
  input: I,
): Promise<O> {
  const validatedInput = agent.inputSchema.parse(input);
  // 1. Gọi Anthropic với tool-use forced để output structured JSON
  // 2. Parse response → Zod validate
  // 3. Nếu fail Zod: retry với feedback lỗi (max agent.maxRetries)
  // 4. Lưu AgentOutput record (jobId, agentName, inputHash, outputJson, tokens, durationMs)
  // 5. Return validated output
}
```

**Cách ép Claude trả JSON đúng schema:**
- Khai báo 1 tool duy nhất: `{ name: "submit_<agent>", input_schema: zodToJsonSchema(outputSchema) }`.
- `tool_choice: { type: "tool", name: "submit_<agent>" }` → Claude **bắt buộc** gọi tool này, output là `tool_use.input` đã đúng JSON schema.
- Zod parse lại lần nữa ở runtime để chắc chắn (vì JSON schema chuyển đổi có thể mất một số constraint chi tiết).

---

## 5. Schema chính (overview)

Tất cả ở `packages/shared/schemas/`. Đây là **xương sống** — mọi agent map vào.

### 5.1. Provenance primitives (DÙNG XUYÊN SUỐT)

```ts
// provenance.ts
export const SourceType = z.enum([
  "user_input",     // user nhập trực tiếp form
  "extracted",      // từ document user upload (BCTC, web, CV, …)
  "web",            // từ web search / fetch (industry data, comparable)
  "computed",       // từ pure TS math (ratio, DCF, sensitivity)
  "assumed",        // AI giả định vì không có data — phải có basis
]);

export const Confidence = z.enum(["high", "medium", "low"]);

// TracedNumber — dùng cho mọi số quan trọng (revenue, ratios, fair value, WACC, beta, …)
export const TracedNumber = z.object({
  value: z.number(),
  unit: z.string(),                       // "VND_billion", "percent", "ratio", "USD_million", "years"
  source: SourceType,
  confidence: Confidence,
  note: z.string(),                       // BẮT BUỘC — giải thích gọn nguồn hoặc lý do giả định
  documentRef: z.object({
    documentId: z.string(),
    page: z.number().int().optional(),
    table: z.string().optional(),
    cell: z.string().optional(),
  }).optional(),
  webRef: z.object({
    url: z.string().url(),
    accessedAt: z.string(),               // ISO
    snippet: z.string().optional(),
  }).optional(),
  formula: z.string().optional(),         // cho source="computed", e.g. "NI[2024] / Equity[2024]"
});

// Assumption — emit khi source="assumed". Aggregate vào appendix.
export const Assumption = z.object({
  id: z.string(),                         // ULID hoặc agentName + index
  field: z.string(),                      // "valuation.dcf.wacc.beta"
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
  basis: z.string(),                      // "Damodaran 2025 Vietnam beta for Consumer Discretionary"
  reason: z.string(),                     // tại sao chọn giá trị này
  alternatives: z.array(z.object({        // optional — các lựa chọn khác đã cân nhắc
    value: z.union([z.number(), z.string(), z.boolean()]),
    basis: z.string(),
  })).optional(),
  emittedBy: z.string(),                  // agent name
  affectsSection: z.array(z.number().int()),  // [8, 9, 10]
});

// InputManifest — output của inputAuditor, dùng bởi mọi agent downstream
export const InputManifest = z.object({
  companyMeta: z.object({
    name: z.string(),
    taxId: z.string().optional(),
    industry: z.string(),
    country: z.string().default("VN"),
    sizeHint: z.enum(["micro", "small", "medium", "large"]).optional(),
  }),
  provided: z.array(z.object({
    sourceType: z.enum([
      "financial_statements", "website", "fanpage", "catalogue_brochure",
      "company_profile", "business_plan", "ceo_cv", "crm",
      "accounting_system", "erp", "manual_input"
    ]),
    documentIds: z.array(z.string()),
    notes: z.string().optional(),
  })),
  missing: z.array(z.object({
    sourceType: z.string(),
    impactedFields: z.array(z.string()),  // ["section6.revenue", "section8.forecast.revenueGrowth"]
    fallbackStrategy: z.string(),
    severity: z.enum(["blocking", "major", "minor"]),
  })),
  qualityScore: z.number().min(0).max(100),
  warnings: z.array(z.string()),
});
```

### 5.2. Domain schemas

```ts
// financials.ts — output của financialExtraction agent
export const FinancialStatement = z.object({
  currency: z.enum(["VND", "USD", "EUR"]),
  unit: z.enum(["raw", "thousand", "million", "billion"]),
  fiscalYears: z.array(z.number().int()),                  // [2021, 2022, 2023, 2024]
  incomeStatement: z.object({
    revenue: z.array(z.number()),                          // theo fiscalYears
    cogs: z.array(z.number()),
    grossProfit: z.array(z.number()),
    opex: z.array(z.number()),
    ebitda: z.array(z.number()),
    ebit: z.array(z.number()),
    interestExpense: z.array(z.number()),
    tax: z.array(z.number()),
    netIncome: z.array(z.number()),
  }),
  balanceSheet: z.object({
    totalAssets: z.array(z.number()),
    currentAssets: z.array(z.number()),
    cash: z.array(z.number()),
    inventory: z.array(z.number()),
    receivables: z.array(z.number()),
    totalLiabilities: z.array(z.number()),
    currentLiabilities: z.array(z.number()),
    longTermDebt: z.array(z.number()),
    equity: z.array(z.number()),
  }),
  cashFlow: z.object({
    cfo: z.array(z.number()),
    cfi: z.array(z.number()),
    cff: z.array(z.number()),
    capex: z.array(z.number()),
    fcf: z.array(z.number()),
  }),
  // Mọi số trong incomeStatement/balanceSheet/cashFlow trên đây là *primary numeric series* cho gọn,
  // nhưng provenance được lưu song song ở 'cellProvenance' theo path:
  cellProvenance: z.record(
    z.string(),                                            // "incomeStatement.revenue[2]"
    z.object({
      source: SourceType,
      confidence: Confidence,
      note: z.string(),
      documentRef: z.object({ documentId: z.string(), page: z.number().int().optional() }).optional(),
      formula: z.string().optional(),                      // ví dụ "computed: revenue[2] - cogs[2]"
    }),
  ),
  assumptions: z.array(Assumption),                        // assumption do agent này emit (nếu có cell phải assume)
});

// valuation.ts
export const DcfResult = z.object({
  assumptions: z.object({
    wacc: TracedNumber,                                    // luôn TracedNumber, không phải number trần
    terminalGrowth: TracedNumber,
    forecastYears: z.number().int().min(3).max(10),
    taxRate: TracedNumber,
    waccComponents: z.object({                             // chi tiết để audit
      rf: TracedNumber, beta: TracedNumber, mrp: TracedNumber,
      kd: TracedNumber, debtRatio: TracedNumber,
    }),
  }),
  fcfForecast: z.array(z.object({ year: z.number().int(), fcf: z.number() })),
  pvFcf: z.array(z.number()),
  terminalValue: z.number(),                               // computed → provenance ở cellProvenance hoặc inferred từ assumption tracedNumbers
  pvTerminal: z.number(),
  enterpriseValue: z.number(),
  netDebt: TracedNumber,
  equityValue: z.number(),
  fairValuePerShare: z.number().nullable(),
  currency: z.enum(["VND", "USD"]),
  emittedAssumptions: z.array(Assumption),                 // mọi Assumption agent này tạo
});

export const MultiplesResult = z.object({
  comparables: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    evEbitda: z.number().nullable(),
    pe: z.number().nullable(),
    pb: z.number().nullable(),
    sourceUrl: z.string().url().optional(),
  })),
  appliedMultiples: z.object({
    evEbitdaMedian: z.number(),
    peMedian: z.number(),
    pbMedian: z.number(),
  }),
  impliedEquityValue: z.object({
    fromEvEbitda: z.number(),
    fromPe: z.number(),
    fromPb: z.number(),
  }),
});

// appendix.ts — output của appendixCompiler (PURE TS)
export const Appendix = z.object({
  inputManifest: InputManifest,                            // §12: bảng "đã có / thiếu" để user thấy
  allAssumptions: z.array(Assumption),                     // gom từ mọi agent → bảng đầy đủ
  comparablesUsed: z.array(z.object({
    ticker: z.string(), name: z.string(), country: z.string(),
    metrics: z.record(z.string(), z.number()),
    sourceUrl: z.string().url().optional(),
  })),
  modelInputsTable: z.array(z.object({                     // mọi input model định giá
    label: z.string(), value: z.union([z.number(), z.string()]),
    source: SourceType, confidence: Confidence, note: z.string(),
  })),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })),
});

// report.ts — composition cuối cùng
export const FullReport = z.object({
  meta: z.object({
    companyName: z.string(),
    industry: z.string(),
    reportDate: z.string(),       // ISO
    analystVersion: z.string(),   // version của pipeline
    currency: z.string(),
    qualityScore: z.number().min(0).max(100),              // copy từ InputManifest
    disclaimers: z.array(z.string()),                      // auto từ qualityScore < 30 hoặc nhiều assumed
  }),
  section1_executiveSummary: ExecutiveSummary,
  section2_investmentThesis: InvestmentThesis,
  section3_companyOverview: CompanyOverview,
  section4_industry: IndustryAnalysis,
  section5_business: BusinessAnalysis,
  section6_financials: FinancialAnalysis,
  section7_ratios: RatioAnalysis,
  section8_forecast: Forecast,
  section9_valuation: Valuation,            // chứa DcfResult + MultiplesResult + footballField
  section10_sensitivity: SensitivityGrid,
  section11_recommendation: Recommendation,
  section12_appendix: Appendix,
});
```

> Mỗi section schema được sở hữu bởi 1 agent. Composer đọc `FullReport`, không quan tâm agent nào sinh ra — chỉ cần `FullReport.parse()` pass thì render được.

---

## 6. Catalogue agents

### 6.1. Ingestion adapters (pre-agent, không LLM hoặc LLM nhẹ)

| Adapter | Input loại file/nguồn | Output schema | LLM? |
|---|---|---|---|
| `pdfIngestion` | PDF (text + scan) | `Document { text, tables[], pages, ocrApplied }` | OCR có; layout extract có thể dùng haiku-4-5 |
| `docIngestion` | DOCX | `Document` | Không |
| `excelIngestion` | XLSX/CSV | `Document.tables[]` | Không |
| `imageIngestion` | JPG/PNG | `Document` | OCR (Tesseract VN hoặc cloud) |
| `webIngestion` | URL (website/fanpage) | `Document { html, text, screenshot, structuredFacts? }` | Không (raw); fanpage FB có thể cần auth, tạm fallback screenshot |
| `crmIngestion` | CSV/Excel/API | `CrmExport { contacts, deals, pipeline }` | Không |
| `accountingIngestion` | CSV/Excel/API (MISA, Fast, AMIS, …) | `AccountingExport { glAccounts, transactions, monthlyPL }` | Không |
| `erpIngestion` | CSV/Excel/API (Odoo, SAP, …) | `ErpExport { skuVolume, costOfGoods, inventory, payables }` | Không |

### 6.2. Analysis agents

| Agent | Model | Input | Output | LLM? |
|---|---|---|---|---|
| `inputAuditor` | sonnet-4-6 | danh sách `Document[]` + `companyMeta` | `InputManifest` | Có |
| `financialExtraction` | sonnet-4-6 | `Document` (BCTC) + `AccountingExport?` (ưu tiên nếu có) | `FinancialStatement` | Có |
| `companyProfile` | sonnet-4-6 | `Document[]` (capability profile, web, BCTC) + `Leadership?` | `CompanyOverview` | Có |
| `leadershipExtraction` | sonnet-4-6 | `Document` (CV/Hồ sơ năng lực) | `Leadership` (founder bio, team experience, education) | Có |
| `productCatalogExtraction` | sonnet-4-6 | `Document` (Catalogue/Brochure) | `ProductCatalog` | Có |
| `webProfileExtraction` | sonnet-4-6 | `Document` (web crawl) | `WebProfile` (positioning, channels, customer reviews) | Có |
| `businessPlanExtraction` | sonnet-4-6 | `Document` (KH KD) | `BusinessPlan` (revenue targets, capex plan, strategy) | Có |
| `crmAnalysis` | sonnet-4-6 | `CrmExport` | `CustomerInsight` (concentration top10, churn, LTV/CAC nếu đủ data) | Có (LLM aggregate) |
| `accountingAnalysis` | sonnet-4-6 | `AccountingExport` | `DetailedFinancials` (monthly granularity, cost breakdown) | Có |
| `erpAnalysis` | sonnet-4-6 | `ErpExport` | `OperationalMetrics` (volume, mix, WC days) | Có |
| `industryResearch` | sonnet-4-6 | `companyMeta` + `WebProfile?` | `IndustryAnalysis` (TAM, CAGR, competitors[]) | Có (web_search) |
| `businessAnalysis` | sonnet-4-6 | `Document[]` + `FinancialStatement` + `ProductCatalog?` + `OperationalMetrics?` | `BusinessAnalysis` | Có |
| `ratioAnalysis` | — (PURE TS) | `FinancialStatement` | `RatioAnalysis` | **Không** |
| `forecast` | opus-4-7 + thinking | `FinancialStatement` + `BusinessPlan?` + `IndustryAnalysis` + `BusinessAnalysis` | `Forecast` | Có (ưu tiên BusinessPlan, fallback industry+history) |
| `valuationDcf` | opus-4-7 + thinking | `Forecast` + `companyMeta` | `DcfResult` | Hybrid: LLM chọn assumption, `dcf_compute` tính |
| `valuationMultiples` | sonnet-4-6 | `FinancialStatement` + `companyMeta` | `MultiplesResult` | Có (web comparable_search) |
| `sensitivity` | — (PURE TS) | `DcfResult` + grid params | `SensitivityGrid` | **Không** |
| `risk` | sonnet-4-6 | tất cả outputs trên | `RiskAssessment` | Có |
| `investmentThesis` | opus-4-7 + thinking | tất cả outputs trên | `InvestmentThesis` | Có |
| `executiveSummary` | opus-4-7 | tất cả outputs trên | `ExecutiveSummary` | Có |
| `recommendation` | opus-4-7 | tất cả outputs trên | `Recommendation` | Có |
| `appendixCompiler` | — (PURE TS) | mọi `emittedAssumptions[]` + `InputManifest` + `MultiplesResult.comparables` | `Appendix` | **Không** |

**Pattern hybrid:** với valuation, LLM **chỉ chọn input** (WACC components, terminal growth, margin assumptions) — math do pure TS làm. Output JSON tách rõ `assumptions` (LLM, có `TracedNumber` + justification) và `result` (code). Sensitivity, ratios, appendix 100% deterministic.

**Pattern fallback khi nguồn missing:** mỗi LLM agent đọc `InputManifest`. Nếu nguồn cần thiết cho field X bị missing → agent dùng `web_search` tool / industry benchmark → emit `Assumption` đúng schema. Bộ prompt riêng (`prompt.md`) phải có **section "Missing input handling"** liệt kê chiến lược cho từng case.

---

## 7. Orchestrator (DAG)

```
              [STAGE 0: Ingestion adapters — chạy parallel theo loại file]
   pdfIngestion / docIngestion / excelIngestion / imageIngestion
   webIngestion / crmIngestion / accountingIngestion / erpIngestion
                              │
                              ▼  Document[] + CrmExport? + AccountingExport? + ErpExport?
                       ┌──────────────┐
                       │ inputAuditor │ → InputManifest (provided/missing/qualityScore)
                       └──────┬───────┘
                              │
        ┌─────────────────────┼──────────────────────────────────────────┐
        ▼ (BCTC + Acc?)       ▼ (CV)        ▼ (Catalogue)   ▼ (Web)      ▼ (KH KD)
 financialExtraction   leadershipExtraction  productCatalog  webProfile  businessPlanExtraction
        │                                                                     │
        ▼                                                                     │
   ratioAnalysis (pure TS)                                                    │
        │                                                                     │
        │   crmAnalysis? / accountingAnalysis? / erpAnalysis? (parallel nếu có data)
        │           │                                                         │
        ▼           ▼                                                         │
   ┌─────────────────────────────────────────────────────┐                    │
   ▼                  ▼                  ▼               ▼                    │
 companyProfile  industryResearch  businessAnalysis  (consume các trên)       │
        └─────────┬─────────┬───────────┬─────────┘                           │
                  │         │           │                                     │
                  └─────────┴────┬──────┴─────────────────────────────────────┘
                                 ▼
                              forecast (opus + thinking)
                                 │
                          ┌──────┴──────┐
                          ▼             ▼
                    valuationDcf   valuationMultiples
                          │             │
                          ▼             │
                     sensitivity        │
                          │             │
                          └──────┬──────┘
                                 ▼
                          ┌──────┴──────┐
                          ▼             ▼
                         risk    investmentThesis
                                 │
                                 ▼
                  executiveSummary + recommendation + appendixCompiler
                                 │
                                 ▼  FullReport JSON
                          Composer (pure TS)
                                 │
                                 ▼
                          HTML → PDF
```

**Ghi chú DAG:**
- Stage 0 (ingestion adapters) chạy parallel theo loại file user upload. Output đi vào `inputAuditor` chung.
- Các extraction agents (financial, leadership, productCatalog, webProfile, businessPlan) chạy **conditional** — chỉ chạy khi `InputManifest.provided` chứa nguồn tương ứng. Nếu missing → skip agent, downstream sẽ assume.
- `crmAnalysis`, `accountingAnalysis`, `erpAnalysis` cũng conditional, chạy parallel.
- `forecast` ưu tiên dùng `BusinessPlan` (nếu có) làm anchor; nếu không thì dùng industry CAGR + history → emit Assumption.
- Mọi agent emit `Assumption[]` cho các field mà nó phải giả định → cuối cùng `appendixCompiler` gom hết về `Appendix.allAssumptions`.

**Orchestrator:**
- Khai báo dạng DAG `{ agentName, dependsOn[] }`.
- Topo sort + run parallel khi không có dep.
- Mỗi node: gọi `runAgent(definition, gatherInputs(state))` → lưu output vào `state[agentName]`.
- Idempotent: trước khi chạy, hash input → check `AgentOutput` cache; hit thì skip, miss thì chạy.
- Fail của 1 agent → mark job failed, KHÔNG chạy node phụ thuộc; các node độc lập đã chạy xong vẫn giữ output (rerun không phải làm lại).

---

## 8. Tools (deterministic helpers cho agents)

| Tool | Loại | Mô tả |
|---|---|---|
| `web_search(query, n)` | I/O | Tavily, có Redis cache 7d theo `sha256(query)` |
| `fetch_url(url)` | I/O | readability extract, cache |
| `read_document(documentId, page?)` | I/O | đọc text đã ingest, kèm table refs |
| `parse_table(documentId, tableId)` | I/O | trả JSON 2D structured |
| `compute(expr)` | math | mathjs sandboxed, dùng cho LLM khi cần check số |
| `dcf_compute(fcf[], wacc, g)` | math | DCF deterministic, đầy đủ test |
| `wacc_compute(rf, beta, mrp, kd, t, dRatio)` | math | CAPM + WACC |
| `comparable_search(industry, country, sizeRange)` | I/O | DB lookup → fallback web search |

**Quy tắc:** mọi tool có schema input/output Zod riêng. Tool implementation pure (cho math) hoặc có cache (cho I/O). Không bao giờ để LLM tự tính số tài chính — luôn route qua `compute` / `dcf_compute` / `wacc_compute`.

---

## 9. Composer — file output chính xác

```ts
// apps/worker/src/report/compose.ts
export function composeReport(report: FullReport): string {
  FullReport.parse(report);                    // double-validate
  return renderToString(<ReportTemplate data={report} />);
}
```

**Bắt buộc:**
- KHÔNG gọi Anthropic trong composer.
- KHÔNG có nhánh "fallback narrative" tự sinh chữ — nếu thiếu field thì throw, không che giấu.
- Mọi format số (currency, %) qua `Intl.NumberFormat("vi-VN", …)` ở component shared, không inline.
- Charts: render server-side bằng `recharts` + `react-dom/server` ra SVG inline, hoặc render canvas + nhúng base64 PNG.
- Snapshot test: cho fixture `FullReport` cố định → `composeReport()` ra HTML cố định (chỉ trừ field timestamp được mock).
- PDF: `pdf.ts` chạy Puppeteer headless với CSS print rules, paged.js cho page break đúng chỗ.

**Test composer:**
- Fixture đầy đủ `FullReport` → render → so sánh HTML với snapshot lưu trong `__snapshots__/`.
- Fixture thiếu field bắt buộc → expect throw `ZodError`.
- Có 1 fixture cho công ty Việt Nam (số VND tỷ), 1 cho công ty USD.

---

## 10. Testing strategy

### Per-agent tests
- Mỗi agent có folder `fixture/` chứa `input.json`, `expectedOutput.example.json`.
- Unit test: validate input fixture parse được `inputSchema`; mock Anthropic call → return một output mẫu → validate parse được `outputSchema`.
- Integration test (chạy thật, đánh dấu `@live`, không chạy CI mặc định): gọi Anthropic thật với fixture input, check output structure (không check exact values).

### Math tests (CRITICAL)
- `valuation/dcf.test.ts`: NPV với input known → exact value.
- `valuation/wacc.test.ts`: CAPM + weighted average — exact.
- `valuation/multiples.test.ts`: median, applied multiples.
- `valuation/sensitivity.test.ts`: grid generation 5×5 với WACC ± và g ±.
- `agents/ratioAnalysis`: ROE = NI/Equity với fixture financials → exact.
- Coverage > 95% cho `apps/worker/src/valuation/` và `apps/worker/src/agents/ratioAnalysis/`.

### Composer tests
- Snapshot per section + full report.
- Visual regression (optional sau): Playwright screenshot PDF → diff.

### Pipeline e2e (offline)
- 1 PDF mẫu fixture → mock Anthropic responses theo agent name → composer ra HTML → snapshot.

### CLI để test thủ công
- `pnpm run agent <agentName> --input fixtures/x.json --output out.json` → chạy agent đơn lẻ thật với Anthropic. Đây là cách primary để debug từng agent độc lập.

---

## 11. Data model (Prisma — phác)

```prisma
model User       { id, email, name, createdAt, jobs[] }
model Document   { id, userId, filename, storageKey, mimeType, pages, ocrStatus, extractedJson Json, createdAt }
model Job        { id, userId, status, progress, currentAgent, documents[], outputs AgentOutput[], reportId?, error?, createdAt, finishedAt }
model AgentOutput{
  id, jobId, agentName, agentVersion, inputHash, inputJson Json, outputJson Json,
  modelUsed, tokensIn, tokensOut, durationMs, retries, status, errorMsg?, createdAt,
  @@unique([jobId, agentName])
}
model Report     { id, jobId, fullReportJson Json, html, pdfStorageKey, createdAt }
model Comparable { id, ticker, name, country, industry, marketCap, evEbitda, pe, pb, updatedAt }
model SearchCache{ id, queryHash @unique, payloadJson, expiresAt }
```

`AgentOutput` là **store of truth** — chứa cả input và output JSON đã validate. Job rerun = tra cache theo `inputHash`.

---

## 12. User flow

1. Login → upload PDF(s) + nhập tên DN/MST/ngành (gợi ý).
2. API tạo `Job(status=queued)` + enqueue BullMQ.
3. Worker chạy DAG. UI poll/SSE hiển thị `currentAgent` + progress %.
4. Khi xong: composer build `FullReport` JSON → render HTML → render PDF → upload R2 → `Report` record.
5. UI hiển thị báo cáo trong app (HTML) + nút download PDF + nút "Re-run với assumptions khác" (mở form chỉnh WACC, growth → rerun chỉ valuation + sensitivity + downstream, các agent trên cache hit không chạy lại).

---

## 13. Environment variables

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Web search
TAVILY_API_KEY=tvly-...

# OCR
MISTRAL_API_KEY=...

# DB & Cache (Railway tự inject khi link service)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Storage (R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=valuation-docs

# Auth
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

GitHub token → GitHub Actions secrets, không vào `.env`. Railway token → Railway CLI / Actions secret, không vào `.env`. KHÔNG bao giờ commit hoặc log token.

---

## 14. Quy ước cho Claude khi code repo này

1. **Đọc CLAUDE.md trước.** Nếu instruction tức thời mâu thuẫn 5 nguyên tắc N1-N5, hỏi user trước.
2. **Mọi agent phải có schema.ts + prompt.md + fixture/ trước khi viết logic.** Schema-first.
3. **Mọi output LLM phải validate Zod.** Không có "trust the model".
4. **Math tài chính phải pure TS có unit test.** Không bao giờ để LLM tự ra số định giá.
5. **Composer không gọi LLM.** Bao giờ cũng pure function.
6. **Default models:** opus-4-7, sonnet-4-6, haiku-4-5-20251001. Không hardcode model cũ.
7. **Bật prompt caching** cho mọi agent có system prompt > 1024 tokens.
8. **Bật extended thinking** cho `forecast`, `valuationDcf`, `investmentThesis`, `recommendation`.
9. **Tool use forced** để ép structured output: 1 tool tên `submit_<agent>`, `tool_choice: { type: "tool", name }`.
10. **Khi rerun agent fail Zod:** đính kèm `error.issues` vào user message của lần retry, không chỉ retry không feedback.
11. **Khi sửa schema của 1 agent → bump `version`.** Cache `AgentOutput` invalidate theo `(agentName, agentVersion, inputHash)`.
12. **Không commit secrets.** Pre-commit hook `gitleaks` nếu có.
13. **Trước khi báo done:** `pnpm typecheck && pnpm lint && pnpm test`. UI features: phải mở browser test thật.
14. **UI labels và prompt agent ưu tiên tiếng Việt** (output báo cáo tiếng Việt). Code, comment, schema field name dùng tiếng Anh.
15. **Provenance bắt buộc (N5):** mỗi field number quan trọng phải dùng `TracedNumber`. Nếu phải giả định, agent **bắt buộc** emit `Assumption{ id, field, value, basis, reason, emittedBy, affectsSection }`. Không có giá trị `assumed` nào được emit mà không có entry tương ứng trong `emittedAssumptions[]`.
16. **Khi viết prompt agent:** phải có section **"Handling missing inputs"** — liệt kê các nguồn agent này kỳ vọng, và chiến lược fallback cho từng case (web search, industry benchmark, conservative default).
17. **Không bao giờ gộp `assumed` với `extracted`** ở cùng numeric series. Ví dụ: nếu BCTC chỉ có 2022-2024, forecast 2025-2027 phải là `Forecast.years[]` riêng, không append vào `FinancialStatement.fiscalYears[]`.
18. **Web crawl (Playwright):** dùng user-agent, tôn trọng robots.txt, timeout 30s, retry 1 lần. Cache HTML 24h theo URL hash.

---

## 15. Khi user cấp tokens

- `ANTHROPIC_API_KEY` → `.env.local` (dev) + Railway env (prod).
- GitHub developer token → `gh auth login` ở máy dev, hoặc `GH_TOKEN` env. CI dùng `GITHUB_TOKEN` Actions tự inject.
- Railway token → `railway login` ở máy dev (hoặc `RAILWAY_TOKEN` env), GitHub Actions dùng secret cùng tên.

Khi nhận token, Claude PHẢI: xác nhận đã nhận, nói rõ đã lưu ở đâu, KHÔNG echo lại token, nhắc user revoke nếu lỡ paste vào chỗ public.

---

## 16. Câu hỏi user cần chốt trước khi build sâu

1. Báo cáo output: 100% tiếng Việt, hay song ngữ Việt-Anh?
2. Multi-tenant ngay từ đầu, hay single-user trước rồi migrate?
3. Lưu lịch sử phiên bản report (rerun) — cần hay không?
4. Human-in-the-loop để approve từng section trước composer — cần hay không?
5. Comparable companies dataset: tự crawl HOSE/HNX, mua data, hay manual seed?
6. Cost target trên 1 job (USD) — quyết tỉ lệ Opus vs Sonnet.
7. Đơn vị tiền mặc định: VND (tỷ) hay tự detect từ BCTC?
8. **MVP scope cho ingestion:** Phase 1 chỉ file (PDF/DOCX/Excel/image) hay bao gồm cả web crawl Playwright?
9. **Connector ưu tiên:** trong Phase 2, làm CRM nào trước (HubSpot / Salesforce / Bitrix / MISA CRM / khác)?
10. **Phần mềm kế toán ưu tiên:** MISA AMIS (REST API có), Fast Online, Bravo, hay chỉ accept CSV/Excel export?
11. **ERP:** có user dùng Odoo/SAP/Oracle không, hay chấp nhận chỉ CSV export?
12. **Fanpage Facebook:** crawl public page (không cần auth) đủ không, hay cần Graph API token?
13. **Quality threshold:** `qualityScore < 30` thì cảnh báo to ở §1, hay từ chối tạo báo cáo? (gợi ý: cảnh báo + cho user chọn "vẫn tạo")
14. **Default benchmark dataset:** có muốn license Damodaran data, BMI, hay tự build từ HOSE + web?
