import { describe, expect, it } from "vitest";
import { SAMPLE_IDEA_TRANSCRIPT, filledFieldCount, structureTranscript, toCreatePrefill } from "./voice-extract";

describe("structureTranscript", () => {
  it("leaves uncertain fields blank on empty input", () => {
    const d = structureTranscript("   ", "typed");
    expect(d.projectName).toBe("");
    expect(d.budgetAed).toBeNull();
    expect(filledFieldCount(d)).toBe(0);
  });

  it("extracts identifiable fields from the sample idea", () => {
    const d = structureTranscript(SAMPLE_IDEA_TRANSCRIPT, "sample");
    expect(d.projectName).toBe("National AI Data Centre Capacity");
    expect(d.type).toBe("gpu_servers");
    expect(d.category).toBe("infrastructure");
    expect(d.budgetAed).toBe(12_400_000);
    expect(d.expectedBenefitAed).toBe(1_800_000);
    expect(d.fteHint).toBe(8);
    expect(d.benefitNote.toLowerCase()).toContain("faster internal model training");
  });

  it("does not invent a type when none is identifiable", () => {
    const d = structureTranscript("We should look at something next year for the team.", "typed");
    expect(d.type).toBe("");
    expect(d.budgetAed).toBeNull();
  });

  it("maps a gpu sample onto existing create-form defaults without changing seed data", () => {
    const d = structureTranscript(SAMPLE_IDEA_TRANSCRIPT, "sample");
    const pre = toCreatePrefill(d);
    expect(pre.type).toBe("gpu_servers");
    expect(pre.assumptions.kind).toBe("ppe");
    if (pre.assumptions.kind === "ppe") expect(pre.assumptions.purchaseCost).toBe(12_400_000);
    expect(pre.workforce.length).toBeGreaterThan(0);
  });
});
