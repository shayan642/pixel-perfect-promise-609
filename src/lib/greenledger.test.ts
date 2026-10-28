import { describe, it, expect } from "vitest";
import {
  SEED_TRANSACTIONS,
  calcEfficiency,
  calcPilot,
  calcPpe,
  calcService,
  calcSoftware,
  calcTraining,
  derivedAmount,
  portfolio,
  type EfficiencyAssumptions,
  type PpeAssumptions,
  type ServiceAssumptions,
  type SoftwareAssumptions,
  type TrainingAssumptions,
} from "./greenledger";
import { WORKFORCE_DISCLOSURE, assessRole, calcWorkforce, defaultWorkforce, occupationSupplyDemand } from "./workforce";

const gpu = SEED_TRANSACTIONS.find((t) => t.id === "gpu-compute")!;
const cooling = SEED_TRANSACTIONS.find((t) => t.id === "dc-cooling")!;
const literacy = SEED_TRANSACTIONS.find((t) => t.id === "literacy-programme")!;
const cloud = SEED_TRANSACTIONS.find((t) => t.id === "cloud-capacity")!;
const software = SEED_TRANSACTIONS.find((t) => t.id === "software-licences")!;

describe("seed integrity", () => {
  it("keeps eight synthetic transactions and original identities/amounts", () => {
    expect(SEED_TRANSACTIONS).toHaveLength(8);
    expect(gpu.ref).toBe("DEMO-PO-104");
    expect(gpu.projectName).toBe("Watani Compute Sandbox");
    expect(gpu.amount).toBe(12_400_000);
    expect(cooling.amount).toBe(2_850_000);
    expect(cloud.amount).toBe(3_600_000);
    expect(software.amount).toBe(960_000);
    expect(literacy.amount).toBe(450_000);
  });
  it("keeps recorded amounts aligned with assumptions", () => {
    for (const tx of SEED_TRANSACTIONS) {
      expect(tx.amount).toBe(derivedAmount(tx.assumptions));
    }
  });
  it("discloses synthetic workforce data", () => {
    expect(WORKFORCE_DISCLOSURE.toLowerCase()).toContain("synthetic");
    expect(gpu.workforce.length).toBeGreaterThan(0);
  });
});

describe("PPE / infrastructure", () => {
  const i = gpu.assumptions as PpeAssumptions;
  it("straight-line depreciation is (12,400,000 - 1,240,000) / 4", () => {
    expect(calcPpe(i).annualDep).toBe(2_790_000);
  });
  it("TCO counts maintenance and energy once with capex", () => {
    expect(calcPpe(i).tcoGross).toBe(16_800_000);
    expect(calcPpe(i).tcoNet).toBe(15_560_000);
  });
  it("does not treat depreciation as cash", () => {
    expect(calcPpe(i).annualCashOut).toBe(1_100_000);
    expect(calcPpe(i).annualExpenseIS).toBe(1_100_000 + 2_790_000);
  });
  it("does not calculate depreciation when useful life is invalid", () => {
    expect(calcPpe({ ...i, usefulLife: 0 }).annualDep).toBeNull();
    expect(calcPpe({ ...i, usefulLife: null }).annualDep).toBeNull();
  });
  it("does not calculate depreciation when residual exceeds cost", () => {
    expect(calcPpe({ ...i, residualValue: 20_000_000 }).annualDep).toBeNull();
  });
  it("does not invent emissions without a valid factor", () => {
    expect(calcPpe(i).annualTco2e).toBe(480);
    expect(calcPpe({ ...i, emissionsFactorKgPerKwh: null }).annualTco2e).toBeNull();
    expect(calcPpe({ ...i, annualKwh: null }).annualTco2e).toBeNull();
  });
  it("carrying value after year 1 is cost minus one year of dep", () => {
    expect(calcPpe(i).carryingAfterYear1).toBe(12_400_000 - 2_790_000);
  });
});

describe("energy-efficiency", () => {
  const i = cooling.assumptions as EfficiencyAssumptions;
  it("forecast net annual saving = 520k - 85k", () => {
    expect(calcEfficiency(i).netAnnualForecast).toBe(435_000);
  });
  it("payback uses forecast savings only", () => {
    expect(calcEfficiency(i).paybackForecast).toBeCloseTo(6.552, 2);
    expect(calcEfficiency(i).netAnnualRealised).toBeNull();
  });
  it("does not treat missing realised savings as zero results", () => {
    expect(i.annualSavingsRealised).toBeNull();
  });
});

describe("cloud services", () => {
  const i = cloud.assumptions as ServiceAssumptions;
  it("projects term expenditure without hardware depreciation", () => {
    const c = calcService(i);
    expect(c.totalCommit).toBe(3_600_000);
    expect(c.annualDep).toBeNull();
  });
  it("unit cost is omitted without a valid denominator", () => {
    expect(calcService(i).unitCost).toBeNull();
    expect(calcService({ ...i, unitsOfWork: 0 }).unitCost).toBeNull();
    expect(calcService({ ...i, unitsOfWork: 12 }).unitCost).toBe(100_000);
  });
});

describe("software licensing", () => {
  const i = software.assumptions as SoftwareAssumptions;
  it("separates licence and maintenance and does not auto-depreciate", () => {
    const c = calcSoftware(i);
    expect(c.initialCash).toBe(960_000);
    expect(c.recurringAnnual).toBe(120_000);
    expect(c.annualDep).toBeNull();
    expect(c.capitalisationTreatment).toBe("requires_review");
  });
});

describe("training", () => {
  const i = literacy.assumptions as TrainingAssumptions;
  it("cost per planned participant uses planned headcount", () => {
    const c = calcTraining(i);
    expect(c.total).toBe(450_000);
    expect(c.costPerParticipant).toBe(1_500);
    expect(c.costPerCompleted).toBeNull();
    expect(c.actualCompletionRatePct).toBeNull();
  });
  it("cost per completed participant requires actual completions", () => {
    const c = calcTraining({ ...i, actualCompletions: 200 });
    expect(c.costPerCompleted).toBe(2_250);
  });
  it("actual completion rate requires a valid enrolment denominator", () => {
    expect(calcTraining({ ...i, actualEnrolment: 0, actualCompletions: 10 }).actualCompletionRatePct).toBeNull();
    expect(calcTraining({ ...i, actualEnrolment: 50, actualCompletions: 40 }).actualCompletionRatePct).toBe(80);
  });
});

describe("pilot expected vs realised", () => {
  const pilot = SEED_TRANSACTIONS.find((t) => t.id === "services-pilot")!;
  it("does not infer realised benefits or cost per active user from targets", () => {
    const c = calcPilot(pilot.assumptions as never);
    expect(c.realisedBenefitAed).toBeNull();
    expect(c.activeUsers).toBeNull();
    expect(c.costPerActiveUser).toBeNull();
    expect(c.targetUsers).toBe(40);
    const a = pilot.assumptions;
    expect(a.kind).toBe("pilot");
    if (a.kind !== "pilot") return;
    expect(calcPilot({ ...a, activeUsers: 20 }).costPerActiveUser).toBe(1_150_000 / 20);
  });
});

describe("workforce", () => {
  it("records cooling staffing as additional people required", () => {
    const w = calcWorkforce(defaultWorkforce("dc_cooling"));
    expect(w.totalRequiredFte).toBe(4);
    expect(w.roles).toHaveLength(3);
  });
  it("gap is required minus domestic availability, not plus jobseekers", () => {
    const r = assessRole({
      id: "t",
      occupation: "GPU specialists",
      phase: "operations",
      tenure: "ongoing",
      unit: "fte",
      requiredFte: 2,
      domesticAvailabilityFte: 1,
      qualifiedJobseekersFte: 1,
      needingAdditionalTrainingFte: 0,
      internationalRecruitmentFte: null,
      recruitmentCostAed: null,
      annualCompensationPerFteAed: 100_000,
      contractorCostAed: null,
      notes: "",
      quality: "synthetic_illustrative",
    });
    expect(r.gapFte).toBe(1);
    expect(r.jobseekerScenarioCoverFte).toBe(1);
    expect(r.residualGapAfterJobseekersFte).toBe(0);
  });
  it("does not auto-fill international recruitment from a gap", () => {
    const w = calcWorkforce(defaultWorkforce("gpu_servers"));
    expect(w.roles.every((r) => r.role.internationalRecruitmentFte == null || r.role.internationalRecruitmentFte === 0)).toBe(
      true,
    );
    expect(w.recommendations.join(" ")).not.toMatch(/automatically/i);
  });
  it("calculates compensation only when a rate is present", () => {
    const r = assessRole({
      id: "t",
      occupation: "Trainer",
      phase: "training",
      tenure: "temporary",
      unit: "fte",
      requiredFte: 2,
      domesticAvailabilityFte: 2,
      qualifiedJobseekersFte: null,
      needingAdditionalTrainingFte: null,
      internationalRecruitmentFte: null,
      recruitmentCostAed: null,
      annualCompensationPerFteAed: 50_000,
      contractorCostAed: null,
      notes: "",
      quality: "synthetic_illustrative",
    });
    expect(r.annualCompensationTotalAed).toBe(100_000);
    const missing = assessRole({ ...r.role, annualCompensationPerFteAed: null });
    expect(missing.annualCompensationTotalAed).toBeNull();
  });
  it("records additional people required without inventing occupation supply", () => {
    const rows = occupationSupplyDemand(defaultWorkforce("gpu_servers"));
    const spec = rows.find((r) => r.occupation === "AI infrastructure specialists")!;
    expect(spec.additionalRequired).toBe(3);
    expect(spec.currentlyEmployed).toBeNull();
    expect(spec.availableJobseekers).toBeNull();
    expect(spec.potentialGap).toBeNull();
    expect(spec.outlook).toBe("incomplete");
    expect(spec.outlookLabel).toBe("Insufficient occupation-level data");
    expect(spec.action).toBe("Recruit");
  });
  it("returns an incomplete assessment when no roles are recorded", () => {
    const w = calcWorkforce([]);
    expect(w.complete).toBe(false);
    expect(w.totalRequiredFte).toBeNull();
    expect(w.disclosure).toBe(WORKFORCE_DISCLOSURE);
  });
});

describe("portfolio", () => {
  it("does not mix capex, opex and mixed into one spend class", () => {
    const p = portfolio(SEED_TRANSACTIONS);
    expect(p.capex + p.opex + p.mixed).toBe(p.total);
    expect(p.infrastructure + p.adoption).toBe(p.total);
    expect(p.count).toBe(8);
  });
});
