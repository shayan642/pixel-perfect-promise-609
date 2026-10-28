import type { TxTypeId } from "./greenledger";
import { isNonNeg, isNum, isPositive, type Opt } from "./opt";

export type WorkforcePhase = "construction" | "implementation" | "training" | "operations";
export type WorkforceTenure = "temporary" | "ongoing";
export type WorkforceUnit = "fte";
export type DataQuality = "synthetic_illustrative" | "user_entered" | "missing";

export interface WorkforceRole {
  id: string;
  occupation: string;
  phase: WorkforcePhase;
  tenure: WorkforceTenure;
  unit: WorkforceUnit;
  requiredFte: Opt;
  domesticAvailabilityFte: Opt;
  /** Qualified jobseekers potentially available. Not added to domestic availability. */
  qualifiedJobseekersFte: Opt;
  needingAdditionalTrainingFte: Opt;
  /** Only used when explicitly recorded. Never inferred from a gap. */
  internationalRecruitmentFte: Opt;
  recruitmentCostAed: Opt;
  /** Annual compensation per FTE, where assumed. */
  annualCompensationPerFteAed: Opt;
  contractorCostAed: Opt;
  notes: string;
  quality: DataQuality;
}

export interface RoleAssessment {
  role: WorkforceRole;
  gapFte: Opt;
  jobseekerScenarioCoverFte: Opt;
  residualGapAfterJobseekersFte: Opt;
  annualCompensationTotalAed: Opt;
  missing: string[];
  issues: string[];
}

export interface WorkforceAssessment {
  complete: boolean;
  disclosure: string;
  missing: string[];
  issues: string[];
  roles: RoleAssessment[];
  constructionFte: Opt;
  implementationFte: Opt;
  trainingFte: Opt;
  operationsFte: Opt;
  temporaryFte: Opt;
  ongoingFte: Opt;
  totalRequiredFte: Opt;
  totalGapFte: Opt;
  totalJobseekerScenarioFte: Opt;
  totalCompensationAed: Opt;
  totalRecruitmentCostAed: Opt;
  totalContractorCostAed: Opt;
  headline: string;
  recommendations: string[];
}

export const WORKFORCE_DISCLOSURE =
  "Staffing figures are indicative planning estimates for this investment. They are not official labour-market statistics.";

export type WorkforceOutlook = "shortage" | "balanced" | "surplus" | "incomplete";
export type WorkforceAction = "Recruit" | "Train" | "Redeploy" | "Phase hiring" | "Validate availability";

export interface OccupationView {
  occupation: string;
  currentlyEmployed: number | null;
  availableJobseekers: number | null;
  additionalRequired: number | null;
  potentialGap: number | null;
  outlook: WorkforceOutlook;
  outlookLabel: string;
  action: WorkforceAction;
}

export function people(n: Opt): number | null {
  if (!isNum(n)) return null;
  return Math.round(n);
}

export const OUTLOOK_LABEL: Record<WorkforceOutlook, string> = {
  shortage: "Potential Shortage",
  balanced: "Broadly Balanced",
  surplus: "Potential Surplus",
  incomplete: "Insufficient occupation-level data",
};

function planningAction(occupation: string): WorkforceAction {
  if (/trainer|mentor|learning and development/i.test(occupation)) return "Train";
  if (/change-management/i.test(occupation)) return "Phase hiring";
  if (/analyst/i.test(occupation)) return "Validate availability";
  return "Recruit";
}

/** Group roles by occupation. A talent gap is not declared without occupation-level supply evidence. */
export function occupationSupplyDemand(roles: WorkforceRole[]): OccupationView[] {
  const groups = new Map<string, WorkforceRole[]>();
  for (const role of roles) {
    const list = groups.get(role.occupation) ?? [];
    list.push(role);
    groups.set(role.occupation, list);
  }
  return [...groups.entries()]
    .map(([occupation, items]) => {
      const additionalRequired = people(sumPresent(items.map((r) => r.requiredFte)));
      const currentlyEmployed = people(sumPresent(items.map((r) => r.domesticAvailabilityFte)));
      const availableJobseekers = people(sumPresent(items.map((r) => r.qualifiedJobseekersFte)));

      let potentialGap: number | null = null;
      let outlook: WorkforceOutlook = "incomplete";
      if (additionalRequired != null && currentlyEmployed != null) {
        potentialGap = Math.max(0, additionalRequired - currentlyEmployed);
        if (currentlyEmployed > additionalRequired) outlook = "surplus";
        else if (potentialGap === 0) outlook = "balanced";
        else outlook = "shortage";
      }

      return {
        occupation,
        currentlyEmployed,
        availableJobseekers,
        additionalRequired,
        potentialGap,
        outlook,
        outlookLabel: OUTLOOK_LABEL[outlook],
        action: planningAction(occupation),
      };
    })
    .sort((a, b) => (b.additionalRequired ?? -1) - (a.additionalRequired ?? -1));
}

const PHASE_ORDER: WorkforcePhase[] = ["construction", "implementation", "training", "operations"];

function sumPresent(xs: Opt[]): Opt {
  const nums = xs.filter(isNum);
  if (nums.length === 0) return null;
  if (nums.length !== xs.length) return null;
  return nums.reduce((a, b) => a + b, 0);
}

function sumPresentPartial(xs: Opt[]): { value: Opt; incomplete: boolean } {
  const nums = xs.filter(isNum);
  if (nums.length === 0) return { value: null, incomplete: xs.length > 0 };
  return { value: nums.reduce((a, b) => a + b, 0), incomplete: nums.length !== xs.length };
}

export function assessRole(role: WorkforceRole): RoleAssessment {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isNonNeg(role.requiredFte)) missing.push(`${role.occupation}: additional talent required`);
  if (isNum(role.requiredFte) && role.requiredFte < 0) issues.push(`${role.occupation}: negative additional talent required`);
  if (isNum(role.domesticAvailabilityFte) && role.domesticAvailabilityFte < 0) {
    issues.push(`${role.occupation}: negative domestic availability`);
  }
  if (isNum(role.qualifiedJobseekersFte) && role.qualifiedJobseekersFte < 0) {
    issues.push(`${role.occupation}: negative jobseeker estimate`);
  }

  const sameUnit = role.unit === "fte";
  let gapFte: Opt = null;
  if (sameUnit && isNonNeg(role.requiredFte) && isNonNeg(role.domesticAvailabilityFte)) {
    gapFte = Math.max(0, role.requiredFte - role.domesticAvailabilityFte);
  }

  let jobseekerScenarioCoverFte: Opt = null;
  let residualGapAfterJobseekersFte: Opt = null;
  if (isNonNeg(gapFte) && isNonNeg(role.qualifiedJobseekersFte)) {
    jobseekerScenarioCoverFte = Math.min(gapFte, role.qualifiedJobseekersFte);
    residualGapAfterJobseekersFte = gapFte - jobseekerScenarioCoverFte;
  } else if (isNonNeg(gapFte)) {
    residualGapAfterJobseekersFte = gapFte;
  }

  let annualCompensationTotalAed: Opt = null;
  if (isPositive(role.requiredFte) && isNonNeg(role.annualCompensationPerFteAed)) {
    annualCompensationTotalAed = role.requiredFte * role.annualCompensationPerFteAed;
  }

  if (
    isNonNeg(role.needingAdditionalTrainingFte) &&
    isNonNeg(role.requiredFte) &&
    role.needingAdditionalTrainingFte > role.requiredFte
  ) {
    issues.push(`${role.occupation}: training need exceeds additional talent required`);
  }

  return {
    role,
    gapFte,
    jobseekerScenarioCoverFte,
    residualGapAfterJobseekersFte,
    annualCompensationTotalAed,
    missing,
    issues,
  };
}

export function calcWorkforce(roles: WorkforceRole[]): WorkforceAssessment {
  if (!roles.length) {
    return {
      complete: false,
      disclosure: WORKFORCE_DISCLOSURE,
      missing: ["No workforce roles recorded for this investment."],
      issues: [],
      roles: [],
      constructionFte: null,
      implementationFte: null,
      trainingFte: null,
      operationsFte: null,
      temporaryFte: null,
      ongoingFte: null,
      totalRequiredFte: null,
      totalGapFte: null,
      totalJobseekerScenarioFte: null,
      totalCompensationAed: null,
      totalRecruitmentCostAed: null,
      totalContractorCostAed: null,
      headline: "Workforce assessment unavailable. No occupation inputs recorded.",
      recommendations: ["Add occupation assumptions before using workforce findings in a decision."],
    };
  }

  const assessed = roles.map(assessRole);
  const missing = assessed.flatMap((r) => r.missing);
  const issues = assessed.flatMap((r) => r.issues);

  const byPhase = (phase: WorkforcePhase) =>
    sumPresentPartial(assessed.filter((r) => r.role.phase === phase).map((r) => r.role.requiredFte));
  const byTenure = (tenure: WorkforceTenure) =>
    sumPresentPartial(assessed.filter((r) => r.role.tenure === tenure).map((r) => r.role.requiredFte));

  const construction = byPhase("construction");
  const implementation = byPhase("implementation");
  const training = byPhase("training");
  const operations = byPhase("operations");
  const temporary = byTenure("temporary");
  const ongoing = byTenure("ongoing");
  const required = sumPresentPartial(assessed.map((r) => r.role.requiredFte));
  const gap = sumPresentPartial(assessed.map((r) => r.gapFte));
  const jobseekers = sumPresentPartial(assessed.map((r) => r.jobseekerScenarioCoverFte));
  const compensation = sumPresentPartial(assessed.map((r) => r.annualCompensationTotalAed));
  const recruitment = sumPresentPartial(assessed.map((r) => r.role.recruitmentCostAed));
  const contractor = sumPresentPartial(assessed.map((r) => r.role.contractorCostAed));

  const complete = missing.length === 0 && issues.length === 0 && required.value != null;

  const recommendations = workforceRecommendations(assessed);

  const headline =
    required.value == null
      ? "Additional people required is not recorded for this investment."
      : `${people(required.value)} additional ${people(required.value) === 1 ? "person" : "people"} required as a planning estimate. Occupation-level national supply is not recorded, so a talent gap is not calculated.`;

  return {
    complete,
    disclosure: WORKFORCE_DISCLOSURE,
    missing,
    issues,
    roles: assessed,
    constructionFte: construction.value,
    implementationFte: implementation.value,
    trainingFte: training.value,
    operationsFte: operations.value,
    temporaryFte: temporary.value,
    ongoingFte: ongoing.value,
    totalRequiredFte: required.value,
    totalGapFte: gap.value,
    totalJobseekerScenarioFte: jobseekers.value,
    totalCompensationAed: compensation.value,
    totalRecruitmentCostAed: recruitment.value,
    totalContractorCostAed: contractor.value,
    headline,
    recommendations,
  };
}

export function workforceRecommendations(assessed: RoleAssessment[]): string[] {
  if (!assessed.length) {
    return ["Record additional people required before using workforce findings in a decision."];
  }
  return [
    "Validate occupation-level availability before hiring. These figures are planning estimates, not labour-market statistics.",
    "Recruit, train or phase hiring against the additional people required for this investment.",
  ];
}

function staff(
  id: string,
  occupation: string,
  additionalPeople: number,
  phase: WorkforcePhase,
  tenure: WorkforceTenure,
): WorkforceRole {
  return {
    id,
    occupation,
    phase,
    tenure,
    unit: "fte",
    requiredFte: additionalPeople,
    domesticAvailabilityFte: null,
    qualifiedJobseekersFte: null,
    needingAdditionalTrainingFte: null,
    internationalRecruitmentFte: null,
    recruitmentCostAed: null,
    annualCompensationPerFteAed: null,
    contractorCostAed: null,
    notes: "Indicative planning estimate for this investment. Not an official labour-market statistic.",
    quality: "synthetic_illustrative",
  };
}

export function literacyWorkforce(): WorkforceRole[] {
  return [
    staff("lit-train", "AI trainers", 2, "training", "temporary"),
    staff("lit-ld", "Learning and development specialists", 1, "training", "temporary"),
    staff("lit-impact", "Workforce/impact analysts", 1, "implementation", "temporary"),
  ];
}

export function advancedWorkforce(): WorkforceRole[] {
  return [
    staff("adv-mentor", "Technical trainers/mentors", 2, "training", "temporary"),
    staff("adv-eng", "AI engineers", 1, "implementation", "temporary"),
    staff("adv-plan", "Workforce planners", 1, "implementation", "temporary"),
  ];
}

/** Occupation packs for templates and seeded investments. Additional people required only. */
export function defaultWorkforce(type: TxTypeId): WorkforceRole[] {
  switch (type) {
    case "gpu_servers":
      return [
        staff("gpu-infra", "AI infrastructure specialists", 3, "implementation", "temporary"),
        staff("gpu-cloud", "Cloud/platform engineers", 2, "implementation", "temporary"),
        staff("gpu-data", "Data engineers", 2, "implementation", "temporary"),
        staff("gpu-cyber", "Cybersecurity specialists", 1, "operations", "ongoing"),
      ];
    case "dc_cooling":
      return [
        staff("cool-fac", "Data-centre cooling/facilities engineers", 2, "implementation", "temporary"),
        staff("cool-energy", "Energy and sustainability analysts", 1, "implementation", "temporary"),
        staff("cool-ops", "Infrastructure operations specialists", 1, "operations", "ongoing"),
      ];
    case "cloud_ai":
      return [
        staff("cld-cloud", "Cloud engineers", 2, "implementation", "temporary"),
        staff("cld-ai", "AI/software engineers", 2, "implementation", "temporary"),
        staff("cld-cyber", "Cybersecurity specialists", 1, "operations", "ongoing"),
        staff("cld-finops", "Financial/FinOps analysts", 1, "operations", "ongoing"),
      ];
    case "software_licence":
      return [
        staff("sw-admin", "Software/platform administrators", 1, "implementation", "temporary"),
        staff("sw-cyber", "Cybersecurity and privacy specialists", 1, "operations", "ongoing"),
        staff("sw-proc", "Procurement/vendor management specialists", 1, "implementation", "temporary"),
      ];
    case "workforce_training":
      return literacyWorkforce();
    case "ai_pilot":
      return [
        staff("pi-ai", "AI/software engineers", 2, "implementation", "temporary"),
        staff("pi-data", "Data engineers", 1, "implementation", "temporary"),
        staff("pi-cyber", "Cybersecurity/privacy specialists", 1, "implementation", "temporary"),
        staff("pi-svc", "Service designer/business analyst", 1, "implementation", "temporary"),
      ];
    case "adoption_programme":
      return [
        staff("ad-chg", "Change-management specialists", 2, "implementation", "temporary"),
        staff("ad-train", "AI trainers", 2, "training", "temporary"),
        staff("ad-ba", "Business/data analysts", 1, "implementation", "temporary"),
      ];
    default:
      return [];
  }
}

export const PHASE_LABEL: Record<WorkforcePhase, string> = {
  construction: "Construction / installation (temporary)",
  implementation: "Implementation",
  training: "Training delivery",
  operations: "Ongoing operations",
};

export function phaseSort(a: WorkforceRole, b: WorkforceRole) {
  return PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
}
