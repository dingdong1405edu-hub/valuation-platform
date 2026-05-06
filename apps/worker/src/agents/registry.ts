import { inputAuditorAgent } from "./inputAuditor/index.js";
import { financialExtractionAgent } from "./financialExtraction/index.js";
import { ratioAnalysisAgent } from "./ratioAnalysis/index.js";
import { sensitivityAgent } from "./sensitivity/index.js";
import { valuationDcfAgent } from "./valuationDcf/index.js";
import { valuationMultiplesAgent } from "./valuationMultiples/index.js";
import { appendixCompilerAgent } from "./appendixCompiler/index.js";
import { companyProfileAgent } from "./companyProfile/index.js";
import { industryResearchAgent } from "./industryResearch/index.js";
import { businessAnalysisAgent } from "./businessAnalysis/index.js";
import { forecastAgent } from "./forecast/index.js";
import { riskAgent } from "./risk/index.js";
import { investmentThesisAgent } from "./investmentThesis/index.js";
import { executiveSummaryAgent } from "./executiveSummary/index.js";
import { recommendationAgent } from "./recommendation/index.js";
import { leadershipExtractionAgent } from "./leadershipExtraction/index.js";
import { productCatalogExtractionAgent } from "./productCatalogExtraction/index.js";
import { businessPlanExtractionAgent } from "./businessPlanExtraction/index.js";

export const llmAgents = {
  inputAuditor: inputAuditorAgent,
  financialExtraction: financialExtractionAgent,
  companyProfile: companyProfileAgent,
  industryResearch: industryResearchAgent,
  businessAnalysis: businessAnalysisAgent,
  forecast: forecastAgent,
  valuationDcf: valuationDcfAgent,
  valuationMultiples: valuationMultiplesAgent,
  risk: riskAgent,
  investmentThesis: investmentThesisAgent,
  executiveSummary: executiveSummaryAgent,
  recommendation: recommendationAgent,
  leadershipExtraction: leadershipExtractionAgent,
  productCatalogExtraction: productCatalogExtractionAgent,
  businessPlanExtraction: businessPlanExtractionAgent,
} as const;

export const pureAgents = {
  ratioAnalysis: ratioAnalysisAgent,
  sensitivity: sensitivityAgent,
  appendixCompiler: appendixCompilerAgent,
} as const;

export type LlmAgentName = keyof typeof llmAgents;
export type PureAgentName = keyof typeof pureAgents;
