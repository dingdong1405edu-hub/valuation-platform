import { describe, expect, it } from "vitest";
import { computeSensitivity } from "./sensitivity.js";

describe("computeSensitivity", () => {
  it("produces a 5x5 grid centered at base assumptions", () => {
    const grid = computeSensitivity({
      fcf: [100, 110, 121, 133.1, 146.41],
      netDebt: 50,
      sharesOutstanding: null,
      baseWacc: 0.1,
      baseTerminalGrowth: 0.03,
      waccDelta: 0.02,
      growthDelta: 0.02,
      steps: 4,
      metric: "equityValue",
      currency: "VND",
    });
    // steps=4 → half=2 → 5 entries on each axis
    expect(grid.axisX.values).toHaveLength(5);
    expect(grid.axisY.values).toHaveLength(5);
    expect(grid.cells).toHaveLength(5);
    expect(grid.cells[0]).toHaveLength(5);
    // Center cell
    expect(grid.centerCell).toEqual({ x: 2, y: 2 });
  });

  it("monotonic: higher WACC → lower equity value (with growth held)", () => {
    const grid = computeSensitivity({
      fcf: [100, 110, 121, 133.1, 146.41],
      netDebt: 0,
      sharesOutstanding: null,
      baseWacc: 0.1,
      baseTerminalGrowth: 0.03,
      waccDelta: 0.04,
      growthDelta: 0,
      steps: 4,
      metric: "equityValue",
      currency: "VND",
    });
    const middleRow = grid.cells[2]!;
    for (let i = 1; i < middleRow.length; i += 1) {
      expect(middleRow[i]!).toBeLessThan(middleRow[i - 1]!);
    }
  });
});
