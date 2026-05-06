import { runAgent } from "@vp/ai";
import { hashInput, type Assumption, type Document, type FullReport } from "@vp/shared";
import { prisma } from "@vp/db";
import { logger } from "@vp/ai";
import { llmAgents, pureAgents } from "../agents/registry.js";
import { setDocumentResolver } from "@vp/ai";
import { computeMultiples } from "../valuation/multiples.js";
import { ingest } from "../ingestion/index.js";
import { getObject } from "../storage/index.js";
import { installRedisCaches } from "./redisCache.js";

type State = {
  jobId: string;
  inputManifest?: import("@vp/shared").InputManifest;
  documents: Document[];
  financials?: import("@vp/shared").FinancialStatement;
  ratios?: import("@vp/shared").RatioAnalysis;
  industry?: import("@vp/shared").IndustryAnalysis;
  business?: import("@vp/shared").BusinessAnalysis;
  companyOverview?: import("@vp/shared").CompanyOverview;
  forecast?: import("@vp/shared").Forecast;
  dcf?: import("@vp/shared").DcfResult;
  multiples?: import("@vp/shared").MultiplesResult;
  sensitivity?: import("@vp/shared").SensitivityGrid;
  risk?: import("@vp/shared").RiskAssessment;
  thesis?: import("@vp/shared").InvestmentThesis;
  execSummary?: import("@vp/shared").ExecutiveSummary;
  recommendation?: import("@vp/shared").Recommendation;
  appendix?: import("@vp/shared").Appendix;
  productCatalog?: import("@vp/shared").ProductCatalog;
  leadership?: import("@vp/shared").Leadership;
  businessPlan?: import("@vp/shared").BusinessPlan;
};

type RunOptions = {
  jobId: string;
  companyMeta: import("@vp/shared").CompanyMeta;
  documentIds: string[];
  marketPrice?: number | null;
  forecastYears?: number;
  onProgress?: (currentAgent: string, percent: number) => Promise<void>;
};

async function loadDocument(docId: string): Promise<Document> {
  const dbDoc = await prisma.document.findUnique({ where: { id: docId } });
  if (!dbDoc) throw new Error(`Document ${docId} not found`);

  if (dbDoc.ingestedJson) {
    return dbDoc.ingestedJson as unknown as Document;
  }
  const data = await getObject(dbDoc.storageKey);
  const ingested = await ingest({
    documentId: dbDoc.id,
    filename: dbDoc.filename,
    mimeType: dbDoc.mimeType,
    sourceType: dbDoc.sourceType as Document["sourceType"],
    data,
  });
  await prisma.document.update({
    where: { id: dbDoc.id },
    data: {
      ingestedJson: ingested as unknown as object,
      status: "ready",
      pages: ingested.pages,
      ocrApplied: ingested.ocrApplied,
    },
  });
  return ingested;
}

async function runWithCache<I, O>(
  jobId: string,
  agentName: string,
  agentVersion: string,
  input: I,
  exec: () => Promise<{ output: O; modelUsed?: string; tokensIn?: number; tokensOut?: number; durationMs?: number }>,
): Promise<O> {
  const inputHash = hashInput({ agentVersion, input });

  const cached = await prisma.agentOutput.findFirst({
    where: { agentName, agentVersion, inputHash, status: "done" },
    orderBy: { createdAt: "desc" },
  });
  if (cached?.outputJson) {
    logger.info({ agent: agentName, jobId, inputHash }, "agent cache hit");
    return cached.outputJson as unknown as O;
  }

  const started = Date.now();
  try {
    const { output, modelUsed, tokensIn, tokensOut, durationMs } = await exec();
    await prisma.agentOutput.upsert({
      where: { jobId_agentName: { jobId, agentName } },
      create: {
        jobId,
        agentName,
        agentVersion,
        inputHash,
        inputJson: input as unknown as object,
        outputJson: output as unknown as object,
        modelUsed: modelUsed ?? null,
        tokensIn: tokensIn ?? 0,
        tokensOut: tokensOut ?? 0,
        durationMs: durationMs ?? Date.now() - started,
        status: "done",
      },
      update: {
        agentVersion,
        inputHash,
        inputJson: input as unknown as object,
        outputJson: output as unknown as object,
        modelUsed: modelUsed ?? null,
        tokensIn: tokensIn ?? 0,
        tokensOut: tokensOut ?? 0,
        durationMs: durationMs ?? Date.now() - started,
        status: "done",
      },
    });
    return output;
  } catch (err) {
    await prisma.agentOutput.upsert({
      where: { jobId_agentName: { jobId, agentName } },
      create: {
        jobId,
        agentName,
        agentVersion,
        inputHash,
        inputJson: input as unknown as object,
        status: "failed",
        errorMsg: err instanceof Error ? err.message : "unknown",
      },
      update: {
        status: "failed",
        errorMsg: err instanceof Error ? err.message : "unknown",
      },
    });
    throw err;
  }
}

function gatherAssumptions(state: State): Assumption[] {
  const all: Assumption[] = [];
  for (const obj of [
    state.financials?.assumptions,
    state.ratios?.assumptions,
    state.industry?.emittedAssumptions,
    state.business?.emittedAssumptions,
    state.companyOverview?.emittedAssumptions,
    state.forecast?.assumptions,
    state.dcf?.emittedAssumptions,
    state.multiples?.emittedAssumptions,
    state.thesis?.emittedAssumptions,
    state.risk?.emittedAssumptions,
    state.recommendation?.emittedAssumptions,
    state.execSummary?.emittedAssumptions,
    state.leadership?.emittedAssumptions,
    state.productCatalog?.emittedAssumptions,
    state.businessPlan?.emittedAssumptions,
  ]) {
    if (Array.isArray(obj)) all.push(...obj);
  }
  return all;
}

export async function runJob(opts: RunOptions): Promise<FullReport> {
  installRedisCaches();
  setDocumentResolver(async (id) => {
    const dbDoc = await prisma.document.findUnique({ where: { id } });
    if (!dbDoc?.ingestedJson) return null;
    return dbDoc.ingestedJson as unknown as Document;
  });

  const state: State = { jobId: opts.jobId, documents: [] };
  const reportProgress = async (agent: string, pct: number) => {
    if (opts.onProgress) await opts.onProgress(agent, pct);
  };

  // === Stage 0: Ingestion ===
  await reportProgress("ingestion", 5);
  state.documents = await Promise.all(opts.documentIds.map(loadDocument));

  // === Stage 1: inputAuditor ===
  await reportProgress("inputAuditor", 10);
  const auditorInput = {
    companyMeta: opts.companyMeta,
    documents: state.documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      sourceType: d.sourceType,
      pages: d.pages,
      excerpt: d.fullText.slice(0, 1500),
    })),
    hasFinancialPlan: state.documents.some((d) => d.sourceType === "business_plan"),
    hasCrm: state.documents.some((d) => d.sourceType === "crm"),
    hasErp: state.documents.some((d) => d.sourceType === "erp"),
    hasAccounting: state.documents.some((d) => d.sourceType === "accounting_system"),
  };
  state.inputManifest = await runWithCache(
    opts.jobId,
    "inputAuditor",
    llmAgents.inputAuditor.version,
    auditorInput,
    async () => {
      const r = await runAgent(llmAgents.inputAuditor, auditorInput);
      return {
        output: r.output,
        modelUsed: r.modelUsed,
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        durationMs: r.durationMs,
      };
    },
  );

  // === Stage 2: extraction (parallel where possible) ===
  await reportProgress("extraction", 20);
  const finDocs = state.documents.filter(
    (d) => d.sourceType === "financial_statements" || d.sourceType === "accounting_system",
  );

  const extractionPromises: Array<Promise<unknown>> = [];

  // Financial Extraction (mandatory if any financial doc exists)
  if (finDocs.length > 0) {
    const finInput = {
      companyMeta: opts.companyMeta,
      documents: finDocs.map((d) => ({
        id: d.id,
        filename: d.filename,
        sourceType: d.sourceType,
        text: d.fullText.slice(0, 60_000),
        tables: d.tables,
      })),
    };
    extractionPromises.push(
      runWithCache(
        opts.jobId,
        "financialExtraction",
        llmAgents.financialExtraction.version,
        finInput,
        async () => {
          const r = await runAgent(llmAgents.financialExtraction, finInput);
          return {
            output: r.output,
            modelUsed: r.modelUsed,
            tokensIn: r.tokensIn,
            tokensOut: r.tokensOut,
            durationMs: r.durationMs,
          };
        },
      ).then((out) => {
        state.financials = out;
      }),
    );
  }

  const cvDocs = state.documents.filter((d) => d.sourceType === "ceo_cv");
  if (cvDocs.length > 0) {
    extractionPromises.push(
      runWithCache(
        opts.jobId,
        "leadershipExtraction",
        llmAgents.leadershipExtraction.version,
        { documents: cvDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 30_000) })) },
        async () => {
          const r = await runAgent(llmAgents.leadershipExtraction, {
            documents: cvDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 30_000) })),
          });
          return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
        },
      ).then((out) => { state.leadership = out; }),
    );
  }

  const catalogDocs = state.documents.filter((d) => d.sourceType === "catalogue_brochure");
  if (catalogDocs.length > 0) {
    extractionPromises.push(
      runWithCache(
        opts.jobId,
        "productCatalogExtraction",
        llmAgents.productCatalogExtraction.version,
        { documents: catalogDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 30_000) })) },
        async () => {
          const r = await runAgent(llmAgents.productCatalogExtraction, {
            documents: catalogDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 30_000) })),
          });
          return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
        },
      ).then((out) => { state.productCatalog = out; }),
    );
  }

  const planDocs = state.documents.filter((d) => d.sourceType === "business_plan");
  if (planDocs.length > 0) {
    extractionPromises.push(
      runWithCache(
        opts.jobId,
        "businessPlanExtraction",
        llmAgents.businessPlanExtraction.version,
        { documents: planDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 50_000) })) },
        async () => {
          const r = await runAgent(llmAgents.businessPlanExtraction, {
            documents: planDocs.map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 50_000) })),
          });
          return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
        },
      ).then((out) => { state.businessPlan = out; }),
    );
  }

  await Promise.all(extractionPromises);
  if (!state.financials) {
    throw new Error(
      "Không trích xuất được FinancialStatement — cần ít nhất 1 BCTC hoặc accounting export.",
    );
  }

  // === Stage 3: pure TS ratio analysis ===
  await reportProgress("ratioAnalysis", 30);
  state.ratios = pureAgents.ratioAnalysis.run(state.financials);

  // === Stage 4: parallel analysis (companyProfile, industryResearch, businessAnalysis) ===
  await reportProgress("analysis", 40);
  const profileDocs = state.documents.filter(
    (d) =>
      d.sourceType === "company_profile" ||
      d.sourceType === "website" ||
      d.sourceType === "financial_statements",
  );

  await Promise.all([
    runWithCache(
      opts.jobId,
      "companyProfile",
      llmAgents.companyProfile.version,
      {
        companyMeta: opts.companyMeta,
        inputManifest: state.inputManifest!,
        documents: profileDocs.map((d) => ({ id: d.id, filename: d.filename, sourceType: d.sourceType, text: d.fullText.slice(0, 30_000) })),
      },
      async () => {
        const r = await runAgent(llmAgents.companyProfile, {
          companyMeta: opts.companyMeta,
          inputManifest: state.inputManifest!,
          documents: profileDocs.map((d) => ({ id: d.id, filename: d.filename, sourceType: d.sourceType, text: d.fullText.slice(0, 30_000) })),
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ).then((out) => { state.companyOverview = out; }),

    runWithCache(
      opts.jobId,
      "industryResearch",
      llmAgents.industryResearch.version,
      { companyMeta: opts.companyMeta, inputManifest: state.inputManifest! },
      async () => {
        const r = await runAgent(llmAgents.industryResearch, {
          companyMeta: opts.companyMeta,
          inputManifest: state.inputManifest!,
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ).then((out) => { state.industry = out; }),

    runWithCache(
      opts.jobId,
      "businessAnalysis",
      llmAgents.businessAnalysis.version,
      {
        inputManifest: state.inputManifest!,
        financials: state.financials,
        productCatalogSummary: state.productCatalog ? JSON.stringify(state.productCatalog) : undefined,
        documents: state.documents.slice(0, 3).map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 20_000) })),
      },
      async () => {
        const r = await runAgent(llmAgents.businessAnalysis, {
          inputManifest: state.inputManifest!,
          financials: state.financials!,
          productCatalogSummary: state.productCatalog ? JSON.stringify(state.productCatalog) : undefined,
          documents: state.documents.slice(0, 3).map((d) => ({ id: d.id, filename: d.filename, text: d.fullText.slice(0, 20_000) })),
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ).then((out) => { state.business = out; }),
  ]);

  // === Stage 5: forecast ===
  await reportProgress("forecast", 55);
  const forecastInput = {
    companyMeta: opts.companyMeta,
    financials: state.financials!,
    ratios: state.ratios!,
    industry: state.industry!,
    businessPlanSummary: state.businessPlan ? JSON.stringify(state.businessPlan) : undefined,
    forecastYears: opts.forecastYears ?? 5,
  };
  state.forecast = await runWithCache(
    opts.jobId,
    "forecast",
    llmAgents.forecast.version,
    forecastInput,
    async () => {
      const r = await runAgent(llmAgents.forecast, forecastInput);
      return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
    },
  );

  // === Stage 6: valuation (parallel: dcf + multiples) ===
  await reportProgress("valuation", 70);
  const lastIdx = state.financials!.fiscalYears.length - 1;
  const netDebt =
    (state.financials!.balanceSheet.longTermDebt[lastIdx] ?? 0) -
    (state.financials!.balanceSheet.cash[lastIdx] ?? 0);

  const [dcfResult, multiplesResult] = await Promise.all([
    runWithCache(
      opts.jobId,
      "valuationDcf",
      llmAgents.valuationDcf.version,
      { companyMeta: opts.companyMeta, forecast: state.forecast!, netDebt, sharesOutstanding: null },
      async () => {
        const r = await runAgent(llmAgents.valuationDcf, {
          companyMeta: opts.companyMeta,
          forecast: state.forecast!,
          netDebt,
          sharesOutstanding: null,
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ),
    runWithCache(
      opts.jobId,
      "valuationMultiples",
      llmAgents.valuationMultiples.version,
      { companyMeta: opts.companyMeta, financials: state.financials!, netDebt },
      async () => {
        const r = await runAgent(llmAgents.valuationMultiples, {
          companyMeta: opts.companyMeta,
          financials: state.financials!,
          netDebt,
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ),
  ]);
  state.dcf = dcfResult;
  state.multiples = multiplesResult;

  // === Stage 7: sensitivity (pure TS) ===
  await reportProgress("sensitivity", 78);
  state.sensitivity = pureAgents.sensitivity.run({
    dcf: state.dcf!,
    waccDelta: 0.02,
    growthDelta: 0.02,
    steps: 4,
    metric: "equityValue",
  });

  // === Stage 8: risk ===
  await reportProgress("risk", 82);
  state.risk = await runWithCache(
    opts.jobId,
    "risk",
    llmAgents.risk.version,
    {
      companyMeta: opts.companyMeta,
      financials: state.financials!,
      ratios: state.ratios!,
      industry: state.industry!,
      business: state.business!,
    },
    async () => {
      const r = await runAgent(llmAgents.risk, {
        companyMeta: opts.companyMeta,
        financials: state.financials!,
        ratios: state.ratios!,
        industry: state.industry!,
        business: state.business!,
      });
      return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
    },
  );

  // === Stage 9: investmentThesis ===
  await reportProgress("investmentThesis", 88);
  state.thesis = await runWithCache(
    opts.jobId,
    "investmentThesis",
    llmAgents.investmentThesis.version,
    {
      companyMeta: opts.companyMeta,
      companyOverview: state.companyOverview!,
      industry: state.industry!,
      business: state.business!,
      financials: state.financials!,
      ratios: state.ratios!,
      forecast: state.forecast!,
      dcf: state.dcf!,
      multiples: state.multiples!,
      risk: state.risk!,
    },
    async () => {
      const r = await runAgent(llmAgents.investmentThesis, {
        companyMeta: opts.companyMeta,
        companyOverview: state.companyOverview!,
        industry: state.industry!,
        business: state.business!,
        financials: state.financials!,
        ratios: state.ratios!,
        forecast: state.forecast!,
        dcf: state.dcf!,
        multiples: state.multiples!,
        risk: state.risk!,
      });
      return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
    },
  );

  // === Stage 10: build Valuation aggregate (deterministic) ===
  const dcfMid = state.dcf!.equityValue;
  const multiplesAvg =
    (state.multiples!.impliedEquityValue.fromEvEbitda +
      state.multiples!.impliedEquityValue.fromPe +
      state.multiples!.impliedEquityValue.fromPb) /
    3;
  const finalLow = Math.min(dcfMid, multiplesAvg) * 0.85;
  const finalMid = (dcfMid + multiplesAvg) / 2;
  const finalHigh = Math.max(dcfMid, multiplesAvg) * 1.15;

  const valuation: import("@vp/shared").Valuation = {
    dcf: state.dcf!,
    multiples: state.multiples!,
    footballField: {
      methods: [
        { label: "DCF", low: dcfMid * 0.85, mid: dcfMid, high: dcfMid * 1.15 },
        {
          label: "EV/EBITDA",
          low: state.multiples!.impliedEquityValue.fromEvEbitda * 0.9,
          mid: state.multiples!.impliedEquityValue.fromEvEbitda,
          high: state.multiples!.impliedEquityValue.fromEvEbitda * 1.1,
        },
        {
          label: "P/E",
          low: state.multiples!.impliedEquityValue.fromPe * 0.9,
          mid: state.multiples!.impliedEquityValue.fromPe,
          high: state.multiples!.impliedEquityValue.fromPe * 1.1,
        },
        {
          label: "P/B",
          low: state.multiples!.impliedEquityValue.fromPb * 0.9,
          mid: state.multiples!.impliedEquityValue.fromPb,
          high: state.multiples!.impliedEquityValue.fromPb * 1.1,
        },
      ],
      finalRange: { low: finalLow, mid: finalMid, high: finalHigh },
      currency: state.dcf!.currency,
    },
    recommendedFairValue: {
      low: finalLow,
      mid: finalMid,
      high: finalHigh,
      methodWeights: { DCF: 0.5, EvEbitda: 0.25, Pe: 0.15, Pb: 0.1 },
      rationale: "Trọng số nghiêng về DCF (50%) vì phản ánh dự phóng dòng tiền đặc thù, kết hợp multiples để neo theo thị trường.",
    },
  };

  // === Stage 11: executiveSummary + recommendation (parallel) ===
  await reportProgress("executiveSummary", 92);
  const [execSummary, recommendation] = await Promise.all([
    runWithCache(
      opts.jobId,
      "executiveSummary",
      llmAgents.executiveSummary.version,
      { companyMeta: opts.companyMeta, financials: state.financials!, thesis: state.thesis!, valuation },
      async () => {
        const r = await runAgent(llmAgents.executiveSummary, {
          companyMeta: opts.companyMeta,
          financials: state.financials!,
          thesis: state.thesis!,
          valuation,
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ),
    runWithCache(
      opts.jobId,
      "recommendation",
      llmAgents.recommendation.version,
      { companyMeta: opts.companyMeta, valuation, marketPrice: opts.marketPrice ?? null },
      async () => {
        const r = await runAgent(llmAgents.recommendation, {
          companyMeta: opts.companyMeta,
          valuation,
          marketPrice: opts.marketPrice ?? null,
        });
        return { output: r.output, modelUsed: r.modelUsed, tokensIn: r.tokensIn, tokensOut: r.tokensOut, durationMs: r.durationMs };
      },
    ),
  ]);
  state.execSummary = execSummary;
  state.recommendation = recommendation;

  // === Stage 12: appendix (pure TS) ===
  await reportProgress("appendix", 96);
  const allAssumptions = gatherAssumptions(state);
  state.appendix = pureAgents.appendixCompiler.run({
    inputManifest: state.inputManifest!,
    allAssumptions,
    comparablesUsed: state.multiples!.comparables,
    modelInputs: [
      { label: "WACC", value: state.dcf!.assumptions.wacc.value, unit: "decimal", source: state.dcf!.assumptions.wacc.source, confidence: state.dcf!.assumptions.wacc.confidence, note: state.dcf!.assumptions.wacc.note },
      { label: "Terminal Growth", value: state.dcf!.assumptions.terminalGrowth.value, unit: "decimal", source: state.dcf!.assumptions.terminalGrowth.source, confidence: state.dcf!.assumptions.terminalGrowth.confidence, note: state.dcf!.assumptions.terminalGrowth.note },
      { label: "Tax Rate", value: state.dcf!.assumptions.taxRate.value, unit: "decimal", source: state.dcf!.assumptions.taxRate.source, confidence: state.dcf!.assumptions.taxRate.confidence, note: state.dcf!.assumptions.taxRate.note },
      { label: "Risk-Free Rate", value: state.dcf!.assumptions.waccComponents.riskFreeRate.value, unit: "decimal", source: state.dcf!.assumptions.waccComponents.riskFreeRate.source, confidence: state.dcf!.assumptions.waccComponents.riskFreeRate.confidence, note: state.dcf!.assumptions.waccComponents.riskFreeRate.note },
      { label: "Beta", value: state.dcf!.assumptions.waccComponents.beta.value, unit: "decimal", source: state.dcf!.assumptions.waccComponents.beta.source, confidence: state.dcf!.assumptions.waccComponents.beta.confidence, note: state.dcf!.assumptions.waccComponents.beta.note },
      { label: "Market Risk Premium", value: state.dcf!.assumptions.waccComponents.marketRiskPremium.value, unit: "decimal", source: state.dcf!.assumptions.waccComponents.marketRiskPremium.source, confidence: state.dcf!.assumptions.waccComponents.marketRiskPremium.confidence, note: state.dcf!.assumptions.waccComponents.marketRiskPremium.note },
    ],
  });

  // === Stage 13: assemble FullReport ===
  await reportProgress("compose", 98);

  const disclaimers: string[] = [];
  const qs = state.inputManifest!.qualityScore;
  if (qs < 30) {
    disclaimers.push(
      `Chất lượng dữ liệu đầu vào thấp (${qs}/100). Báo cáo phần lớn dựa trên giả định và benchmark ngành.`,
    );
  }
  if (allAssumptions.length > 10) {
    disclaimers.push(
      `Báo cáo chứa ${allAssumptions.length} giả định lớn — xem §12 Phụ lục để kiểm tra trước khi quyết định.`,
    );
  }

  const report: FullReport = {
    meta: {
      companyName: opts.companyMeta.name,
      industry: opts.companyMeta.industry,
      reportDate: new Date().toISOString(),
      analystVersion: "0.1.0",
      currency: state.dcf!.currency,
      qualityScore: qs,
      disclaimers,
    },
    section1_executiveSummary: state.execSummary!,
    section2_investmentThesis: state.thesis!,
    section3_companyOverview: state.companyOverview!,
    section4_industry: state.industry!,
    section5_business: state.business!,
    section6_financials: {
      statement: state.financials!,
      highlights: [],
      narrative: "",
    },
    section7_ratios: state.ratios!,
    section8_forecast: state.forecast!,
    section9_valuation: valuation,
    section10_sensitivity: state.sensitivity!,
    section11_recommendation: state.recommendation!,
    section12_appendix: state.appendix!,
    section_risk: state.risk!,
  };

  return report;
}
// silence unused import warning
void computeMultiples;
