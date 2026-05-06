import { describe, expect, it } from "vitest";
import { dcfCompute } from "./dcf.js";

describe("dcfCompute", () => {
  it("matches a hand-computed 5-year DCF", () => {
    const fcf = [100, 110, 121, 133.1, 146.41];
    const wacc = 0.1;
    const terminalGrowth = 0.03;
    const r = dcfCompute({ fcf, wacc, terminalGrowth, netDebt: 50 });

    // Terminal value at end of year 5: FCF5 * (1+g) / (wacc-g) = 146.41 * 1.03 / 0.07
    const expectedTV = (146.41 * 1.03) / 0.07;
    expect(r.terminalValue).toBeCloseTo(expectedTV, 4);

    // Discount each FCF and sum + discounted TV
    const expectedPvSum = fcf.reduce((acc, v, i) => acc + v / Math.pow(1 + wacc, i + 1), 0);
    const expectedPvTV = expectedTV / Math.pow(1 + wacc, fcf.length);
    expect(r.pvFcf.reduce((a, b) => a + b, 0)).toBeCloseTo(expectedPvSum, 4);
    expect(r.pvTerminal).toBeCloseTo(expectedPvTV, 4);
    expect(r.enterpriseValue).toBeCloseTo(expectedPvSum + expectedPvTV, 4);
    expect(r.equityValue).toBeCloseTo(expectedPvSum + expectedPvTV - 50, 4);
  });

  it("computes fair value per share when shares are provided", () => {
    const r = dcfCompute({
      fcf: [200, 220, 240, 260, 280],
      wacc: 0.12,
      terminalGrowth: 0.03,
      netDebt: 100,
      sharesOutstanding: 1000,
    });
    expect(r.fairValuePerShare).not.toBeNull();
    expect(r.fairValuePerShare).toBeCloseTo(r.equityValue / 1000, 6);
  });

  it("returns null fair value per share when shares missing", () => {
    const r = dcfCompute({
      fcf: [100, 100, 100, 100, 100],
      wacc: 0.1,
      terminalGrowth: 0.02,
    });
    expect(r.fairValuePerShare).toBeNull();
  });

  it("throws when terminalGrowth >= wacc", () => {
    expect(() =>
      dcfCompute({ fcf: [100, 100, 100, 100, 100], wacc: 0.05, terminalGrowth: 0.06 }),
    ).toThrow();
  });

  it("rejects fewer than 3 forecast years", () => {
    expect(() => dcfCompute({ fcf: [100, 110], wacc: 0.1, terminalGrowth: 0.02 })).toThrow();
  });
});
