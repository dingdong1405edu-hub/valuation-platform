import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeReport } from "./compose.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, "../../../../fixtures/full-report.json");

describe("composeReport", () => {
  it("renders a complete report from fixture without throwing", () => {
    const data = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
    const html = composeReport(data);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Công ty CP Mẫu Demo");
    expect(html).toContain("1. Tóm tắt điều hành");
    expect(html).toContain("12. Phụ lục");
  });

  it("throws on missing required field", () => {
    const data = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
    delete data.section1_executiveSummary;
    expect(() => composeReport(data)).toThrow();
  });

  it("includes assumption table when assumptions exist", () => {
    const data = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
    const html = composeReport(data);
    expect(html).toContain("section9.dcf.terminalGrowth");
  });
});
