# Valuation Platform

AI-powered nền tảng định giá doanh nghiệp.

User upload BCTC + tài liệu công ty → multi-agent system phân tích, tra cứu thị trường, định giá → xuất báo cáo 12 phần (HTML + PDF).

Đọc [CLAUDE.md](CLAUDE.md) trước khi code.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind
- **Worker:** Node.js + BullMQ
- **DB:** PostgreSQL + Prisma
- **Cache/Queue:** Redis
- **AI:** Anthropic SDK (Claude Opus 4.7 / Sonnet 4.6 / Haiku 4.5)
- **Web search:** Tavily
- **OCR:** Tesseract.js (Vietnamese), tuỳ chọn Mistral OCR
- **PDF:** Puppeteer
- **Deploy:** Railway

## Cấu trúc

```
.
├── apps/
│   ├── web/            # Next.js — UI + API routes
│   └── worker/         # Node worker — agents + ingestion + composer
├── packages/
│   ├── shared/         # Zod schemas (provenance, financials, valuation, sections, report)
│   ├── ai/             # Anthropic wrapper + tools (compute, dcf_compute, web_search, …)
│   └── db/             # Prisma client
├── prisma/
│   └── schema.prisma
├── scripts/
│   ├── runAgent.ts     # CLI: chạy 1 agent với JSON input
│   ├── runPipeline.ts  # CLI: render composer từ fixture
│   └── seed.ts         # seed top 30 mã HOSE/HNX vào Comparable
└── CLAUDE.md           # SOURCE OF TRUTH cho mọi quyết định kiến trúc
```

## Setup local

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env
# Điền ANTHROPIC_API_KEY, TAVILY_API_KEY, DATABASE_URL, REDIS_URL

# 3. DB
pnpm db:generate
pnpm db:push          # hoặc db:migrate cho prod
pnpm seed             # seed comparables

# 4. Test math
pnpm test             # vitest cho dcf, wacc, ratios, multiples, sensitivity

# 5. Run
pnpm dev:worker       # terminal 1 — BullMQ worker
pnpm dev:web          # terminal 2 — Next.js UI ở localhost:3000
```

## Chạy 1 agent đơn lẻ (debug)

```bash
# Tạo input.json theo schema của agent
pnpm agent inputAuditor --input fixtures/auditor.json --output out.json
pnpm agent ratioAnalysis --input fixtures/financials.json --output out.json
```

## Architecture quick-ref

5 nguyên tắc cứng (xem CLAUDE.md §0):
- **N1:** Mỗi agent là pure function `JSON → JSON`, validate Zod cả 2 đầu.
- **N2:** Agents độc lập + mixable — chạy được riêng lẻ với 1 file JSON.
- **N3:** Schema là hợp đồng — tool-use forced ép structured output.
- **N4:** Composer KHÔNG phải LLM — pure TS function `(JSON) → HTML → PDF`.
- **N5:** Provenance — mọi số có `TracedNumber{ source, confidence, note }`. Khi giả định, BẮT BUỘC emit `Assumption` → §12 báo cáo.

DAG pipeline: ingestion → inputAuditor → extraction (parallel) → ratioAnalysis (pure) → analysis (parallel) → forecast → valuation (DCF + Multiples parallel) → sensitivity (pure) → risk + thesis → executiveSummary + recommendation → appendixCompiler (pure) → composer (pure) → PDF.

## Còn cần làm

Skeleton này chạy được nhưng cần bổ sung:
- Web crawl Playwright cho website/fanpage (Phase 2)
- API connector cho HubSpot, Salesforce, MISA AMIS, Odoo (Phase 2-3)
- Unit test cho composer + integration test pipeline với fixture mocked Anthropic
- NextAuth thật (hiện đang dùng dev user cố định)
- Charts SVG nhúng vào PDF
- Damodaran beta dataset seed
- Multi-tenant (User-scoped queries)
