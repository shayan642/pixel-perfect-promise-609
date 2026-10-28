import { describe, expect, it } from "vitest";
import { SEED_TRANSACTIONS } from "./greenledger";
import { assessEsgRisk, esgLevelLabel } from "./esg";

function seed(id: string) {
  const tx = SEED_TRANSACTIONS.find((t) => t.id === id);
  if (!tx) throw new Error(`missing seed ${id}`);
  return tx;
}

describe("assessEsgRisk", () => {
  it("rates the cooling upgrade as moderate ESG risk with verification caveats", () => {
    const a = assessEsgRisk(seed("dc-cooling"));
    expect(a.overall).toBe("moderate");
    expect(esgLevelLabel(a.overall)).toBe("Moderate risk");
    expect(a.factors[0].level).toBe("moderate");
    expect(a.factors[0].note).toMatch(/verification/i);
    expect(a.factors[1].level).toBe("insufficient");
    expect(a.rationale).toMatch(/cooling-related energy/i);
  });

  it("does not assign the same overall category to every seed investment", () => {
    const levels = new Set(SEED_TRANSACTIONS.map((tx) => assessEsgRisk(tx).overall));
    expect(levels.size).toBeGreaterThan(1);
  });

  it("describes GPU environmental risk as illustrative, not a confirmed finding", () => {
    const a = assessEsgRisk(seed("gpu-compute"));
    expect(a.overall).toBe("moderate");
    expect(a.factors[0].note).toMatch(/illustrative risk/i);
    expect(a.factors[0].note).toMatch(/pending verification/i);
    expect(a.rationale).toMatch(/evidence gaps, not confirmed findings/i);
  });

  it("does not invent an environmental rating when kWh is missing", () => {
    const a = assessEsgRisk(seed("cloud-capacity"));
    expect(a.factors[0].level).toBe("insufficient");
    expect(a.overall).toBe("insufficient");
  });
});
