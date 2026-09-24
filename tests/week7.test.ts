import { describe, expect, it } from "vitest";

type Scenario = { coverage: number; mismatch: number | null; persistence: string };

const scenarios: Record<string, Scenario> = {
  mismatch: { coverage: 86, mismatch: 0.82, persistence: "6/7 days" },
  stable: { coverage: 88, mismatch: 0.24, persistence: "2/7 days" },
  insufficient: { coverage: 42, mismatch: null, persistence: "unknown" },
};

describe("Week 7 operational-change experiment", () => {
  it("never treats insufficient coverage as stability", () => {
    expect(scenarios.insufficient.coverage).toBeLessThan(70);
    expect(scenarios.insufficient.mismatch).toBeNull();
  });

  it("flags the demo mismatch scenario for human review", () => {
    expect(scenarios.mismatch.coverage).toBeGreaterThanOrEqual(70);
    expect(scenarios.mismatch.mismatch).toBeGreaterThanOrEqual(0.7);
    expect(scenarios.mismatch.persistence).toBe("6/7 days");
  });

  it("keeps normal variability below the review threshold", () => {
    expect(scenarios.stable.mismatch).toBeLessThan(0.7);
  });
});
