import { describe, expect, it } from "vitest";
import { computeMultiples } from "./multiples.js";

describe("computeMultiples", () => {
  it("computes median multiples and implied equity", () => {
    const r = computeMultiples({
      comparables: [
        { ticker: "A", name: "A", country: "VN", evEbitda: 8, pe: 10, pb: 1, marketCap: null, source: "seed" },
        { ticker: "B", name: "B", country: "VN", evEbitda: 10, pe: 12, pb: 1.5, marketCap: null, source: "seed" },
        { ticker: "C", name: "C", country: "VN", evEbitda: 12, pe: 14, pb: 2, marketCap: null, source: "seed" },
      ],
      targetEbitda: 100,
      targetNetIncome: 60,
      targetBookValue: 400,
      netDebt: 50,
      currency: "VND",
    });
    expect(r.appliedMultiples.evEbitdaMedian).toBe(10);
    expect(r.appliedMultiples.peMedian).toBe(12);
    expect(r.appliedMultiples.pbMedian).toBe(1.5);

    expect(r.impliedEquityValue.fromEvEbitda).toBe(10 * 100 - 50);
    expect(r.impliedEquityValue.fromPe).toBe(12 * 60);
    expect(r.impliedEquityValue.fromPb).toBe(1.5 * 400);
  });

  it("ignores null multiples", () => {
    const r = computeMultiples({
      comparables: [
        { ticker: "A", name: "A", country: "VN", evEbitda: null, pe: 10, pb: null, marketCap: null, source: "seed" },
        { ticker: "B", name: "B", country: "VN", evEbitda: 10, pe: 12, pb: 1.5, marketCap: null, source: "seed" },
      ],
      targetEbitda: 100,
      targetNetIncome: 60,
      targetBookValue: 400,
      netDebt: 0,
      currency: "VND",
    });
    expect(r.appliedMultiples.evEbitdaMedian).toBe(10);
    expect(r.appliedMultiples.peMedian).toBe(11);
    expect(r.appliedMultiples.pbMedian).toBe(1.5);
  });
});
