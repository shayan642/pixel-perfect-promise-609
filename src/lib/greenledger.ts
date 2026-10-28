// MIZAN AI — Synthetic demo data and connected calculations.
import { isNonNeg, isNum, isPositive, type Opt } from "./opt";
import { advancedWorkforce, defaultWorkforce, literacyWorkforce, type WorkforceRole } from "./workforce";

export type { Opt, WorkforceRole };
export type CategoryId = "infrastructure" | "adoption";
export type TxTypeId =
  | "gpu_servers"
  | "dc_cooling"
  | "cloud_ai"
  | "software_licence"
  | "workforce_training"
  | "ai_pilot"
  | "adoption_programme"
  | "other";
export type SpendClass = "capex" | "opex" | "mixed";
export type TxStatus = "draft" | "under_review" | "in_progress" | "approved";
export type AssumptionKind = "ppe" | "efficiency" | "service" | "software" | "training" | "pilot";
export type CapitalisationTreatment = "requires_review" | "expense" | "capitalise_if_criteria_met";
export type BenefitEvidence = "forecast" | "realised" | "not_recorded";

export interface PpeAssumptions {
  kind: "ppe";
  purchaseCost: number;
  acquisitionCost: Opt;
  installationCost: Opt;
  units: Opt;
  unitLabel: string;
  usefulLife: Opt;
  residualValue: Opt;
  annualMaintenance: Opt;
  annualEnergyCost: Opt;
  annualKwh: Opt;
  electricityTariffAedPerKwh: Opt;
  emissionsFactorKgPerKwh: Opt;
  emissionsFactorUnit: "kgCO2e/kWh";
}

export interface EfficiencyAssumptions {
  kind: "efficiency";
  investment: number;
  usefulLife: Opt;
  /** Forecast (not realised) energy-cost savings. */
  annualSavingsForecast: number;
  annualSavingsRealised: Opt;
  annualMaintenance: Opt;
  annualKwhReductionForecast: Opt;
  annualKwhReductionRealised: Opt;
  emissionsFactorKgPerKwh: Opt;
  emissionsFactorUnit: "kgCO2e/kWh";
  horizonYears: Opt;
}

export interface ServiceAssumptions {
  kind: "service";
  annualCost: number;
  termYears: Opt;
  unitsOfWork: Opt;
  unitOfWorkLabel: string;
  estimatedAnnualKwh: Opt;
  emissionsFactorKgPerKwh: Opt;
  emissionsFactorUnit: "kgCO2e/kWh";
}

export interface SoftwareAssumptions {
  kind: "software";
  initialLicence: number;
  annualSubscription: Opt;
  annualMaintenance: Opt;
  implementationCost: Opt;
  usefulLife: Opt;
  residualValue: Opt;
  capitalisationTreatment: CapitalisationTreatment;
}

export interface TrainingAssumptions {
  kind: "training";
  plannedParticipants: number;
  actualEnrolment: Opt;
  plannedCompletions: Opt;
  actualCompletions: Opt;
  costPerParticipant: number;
  durationMonths: Opt;
  plannedCompletionRatePct: Opt;
  trainerCapacityFte: Opt;
}

export interface PilotAssumptions {
  kind: "pilot";
  capexEstimate: number;
  opexEstimate: number;
  implementationCost: Opt;
  supportCost: Opt;
  changeManagementCost: Opt;
  targetUsers: number;
  activeUsers: Opt;
  expectedBenefitAed: Opt;
  realisedBenefitAed: Opt;
  plannedBenefitNote: string;
}

export type Assumptions =
  | PpeAssumptions
  | EfficiencyAssumptions
  | ServiceAssumptions
  | SoftwareAssumptions
  | TrainingAssumptions
  | PilotAssumptions;

export interface Transaction {
  id: string;
  ref: string;
  projectName: string;
  title: string;
  short: string;
  category: CategoryId;
  type: TxTypeId;
  spendClass: SpendClass;
  entity: string;
  isoDate: string;
  status: TxStatus;
  amount: number;
  purpose: string;
  description: string;
  assumptions: Assumptions;
  workforce: WorkforceRole[];
  assumptionNotes: string;
  source: "seed" | "user";
}

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  infrastructure: "AI Infrastructure",
  adoption: "AI Adoption & Workforce",
};

export const TYPE_LABEL: Record<TxTypeId, string> = {
  gpu_servers: "GPU / AI Server Procurement",
  dc_cooling: "Data-Centre Energy Efficiency",
  cloud_ai: "Cloud AI Services",
  software_licence: "Software Licensing",
  workforce_training: "AI Workforce Training",
  ai_pilot: "AI Adoption Pilot",
  adoption_programme: "AI Adoption Programme",
  other: "Other AI Investment",
};

export const STATUS_LABEL: Record<TxStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  in_progress: "In progress",
  approved: "Approved",
};

export const SPEND_LABEL: Record<SpendClass, string> = {
  capex: "Capital expenditure",
  opex: "Operating expenditure",
  mixed: "Mixed (capex and opex)",
};

export const aed = (n: number) =>
  "AED " + Math.round(n).toLocaleString("en-US");
export const num = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
export const aedOpt = (n: Opt) => (isNum(n) ? aed(n) : "Not recorded");
export const numOpt = (n: Opt, d = 0) => (isNum(n) ? num(n, d) : "Not recorded");

export function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function calcPpe(i: PpeAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isNonNeg(i.purchaseCost)) missing.push("initial investment");
  if (isNum(i.purchaseCost) && i.purchaseCost < 0) issues.push("negative initial investment");
  if (!isPositive(i.usefulLife)) {
    missing.push("useful life");
    if (isNum(i.usefulLife)) issues.push("useful life must be greater than zero");
  }
  if (isNum(i.residualValue) && i.residualValue < 0) issues.push("negative residual value");
  if (isNonNeg(i.purchaseCost) && isNum(i.residualValue) && i.residualValue > i.purchaseCost) {
    issues.push("residual value exceeds acquisition cost");
  }
  if (isNum(i.annualKwh) && i.annualKwh < 0) issues.push("negative electricity consumption");
  if (isNum(i.emissionsFactorKgPerKwh) && i.emissionsFactorKgPerKwh < 0) issues.push("negative emission factor");

  const breakdown =
    isNonNeg(i.acquisitionCost) && isNonNeg(i.installationCost) ? i.acquisitionCost + i.installationCost : null;
  if (breakdown != null && isNonNeg(i.purchaseCost) && breakdown !== i.purchaseCost) {
    issues.push("acquisition + installation does not equal recorded initial investment (not summed into TCO twice)");
  }

  const residual = i.residualValue;
  const canDep =
    isNonNeg(i.purchaseCost) &&
    isPositive(i.usefulLife) &&
    isNonNeg(residual) &&
    residual <= i.purchaseCost;
  const life = canDep ? i.usefulLife : null;
  const depreciable = canDep ? i.purchaseCost - residual : null;
  const annualDep = canDep && life ? depreciable! / life : null;

  const maint = isNonNeg(i.annualMaintenance) ? i.annualMaintenance : null;
  if (i.annualMaintenance == null) missing.push("annual maintenance");
  const energyStated = isNonNeg(i.annualEnergyCost) ? i.annualEnergyCost : null;
  const energyFromTariff =
    isNonNeg(i.annualKwh) && isNonNeg(i.electricityTariffAedPerKwh)
      ? i.annualKwh * i.electricityTariffAedPerKwh
      : null;
  const energyCash = energyStated ?? energyFromTariff;
  if (energyStated != null && energyFromTariff != null && energyStated !== energyFromTariff) {
    issues.push("stated energy cost differs from kWh × tariff; TCO uses the stated energy cost only");
  }
  const annualCashOpex = maint != null && energyCash != null ? maint + energyCash : null;
  if (annualCashOpex == null) missing.push("complete annual cash operating cost");

  const tcoGross =
    isNonNeg(i.purchaseCost) && annualCashOpex != null && isPositive(life) ? i.purchaseCost + annualCashOpex * life : null;
  const tcoNet = tcoGross != null && isNonNeg(i.residualValue) ? tcoGross - i.residualValue : null;

  const schedule =
    canDep && annualDep != null && annualCashOpex != null
      ? Array.from({ length: Math.ceil(life!) }, (_, k) => {
          const year = k + 1;
          const dep = year <= life! ? annualDep : 0;
          const opening = i.purchaseCost - annualDep * k;
          const closing = Math.max(i.residualValue!, opening - dep);
          return { year, opening, dep, closing, opex: annualCashOpex };
        })
      : [];

  const canEmit = isPositive(i.annualKwh) && isPositive(i.emissionsFactorKgPerKwh);
  const annualTco2e = canEmit ? (i.annualKwh! * i.emissionsFactorKgPerKwh!) / 1000 : null;

  return {
    missing,
    issues,
    costPerUnit: isPositive(i.units) && isNonNeg(i.purchaseCost) ? i.purchaseCost / i.units : null,
    annualDep,
    depreciable,
    schedule,
    closingCarrying: canDep ? i.residualValue : null,
    carryingAfterYear1: canDep && annualDep != null ? i.purchaseCost - annualDep : null,
    annualOpex: annualCashOpex,
    annualExpenseIS: annualCashOpex != null && annualDep != null ? annualCashOpex + annualDep : null,
    annualCashOut: annualCashOpex,
    tcoGross,
    tcoNet,
    opexShareOfCapex:
      isPositive(i.purchaseCost) && annualCashOpex != null && isPositive(life)
        ? (annualCashOpex * life) / i.purchaseCost
        : null,
    annualTco2e,
    lifetimeTco2e: annualTco2e != null && isPositive(life) ? annualTco2e * life : null,
    hasEnergy: canEmit,
    emissionsFactorUnit: i.emissionsFactorUnit,
  };
}

export function calcEfficiency(i: EfficiencyAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isNonNeg(i.investment)) missing.push("initial investment");
  const lifeOk = isPositive(i.usefulLife);
  if (!lifeOk) missing.push("useful life");
  const maint = isNonNeg(i.annualMaintenance) ? i.annualMaintenance : null;
  if (i.annualMaintenance == null) missing.push("annual maintenance");
  const forecast = isNum(i.annualSavingsForecast) ? i.annualSavingsForecast : null;
  if (forecast == null) missing.push("forecast annual financial savings");
  if (isNum(i.annualSavingsForecast) && i.annualSavingsForecast < 0) issues.push("negative forecast savings");
  const realised = isNonNeg(i.annualSavingsRealised) ? i.annualSavingsRealised : null;

  const annualDep = isNonNeg(i.investment) && lifeOk ? i.investment / i.usefulLife! : null;
  const netAnnualForecast = forecast != null && maint != null ? forecast - maint : null;
  const netAnnualRealised = realised != null && maint != null ? realised - maint : null;
  const paybackForecast =
    netAnnualForecast != null && netAnnualForecast > 0 && isNonNeg(i.investment) ? i.investment / netAnnualForecast : null;
  const horizon = isPositive(i.horizonYears) ? i.horizonYears : null;
  const horizonNet =
    netAnnualForecast != null && horizon != null && isNonNeg(i.investment)
      ? netAnnualForecast * horizon - i.investment
      : null;
  const cumulative =
    netAnnualForecast != null && horizon != null && annualDep != null && lifeOk
      ? Array.from({ length: Math.ceil(horizon) + 1 }, (_, y) => ({
          year: y,
          cumulative: netAnnualForecast * y - i.investment,
          carrying: Math.max(0, i.investment - annualDep * Math.min(y, i.usefulLife!)),
        }))
      : [];

  const kwh = isPositive(i.annualKwhReductionForecast) ? i.annualKwhReductionForecast : null;
  const factor = isPositive(i.emissionsFactorKgPerKwh) ? i.emissionsFactorKgPerKwh : null;
  if (isNum(i.annualKwhReductionForecast) && i.annualKwhReductionForecast < 0) issues.push("negative energy reduction");
  const annualTco2eAvoided = kwh != null && factor != null ? (kwh * factor) / 1000 : null;

  return {
    missing,
    issues,
    annualDep,
    netAnnual: netAnnualForecast,
    netAnnualForecast,
    netAnnualRealised,
    payback: paybackForecast,
    paybackForecast,
    horizonNet,
    cumulative,
    netIncomeEffect: netAnnualForecast != null && annualDep != null ? netAnnualForecast - annualDep : null,
    annualTco2eAvoided,
    horizonTco2eAvoided: annualTco2eAvoided != null && horizon != null ? annualTco2eAvoided * horizon : null,
    costPerTco2e:
      annualTco2eAvoided != null && annualTco2eAvoided > 0 && lifeOk
        ? i.investment / (annualTco2eAvoided * i.usefulLife!)
        : null,
    hasEnergy: annualTco2eAvoided != null,
    savingsBasis: "forecast" as BenefitEvidence,
  };
}

export function calcService(i: ServiceAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isNonNeg(i.annualCost)) missing.push("annual service cost");
  const term = isPositive(i.termYears) ? i.termYears : null;
  if (term == null) missing.push("contract term");
  const totalCommit = isNonNeg(i.annualCost) && term != null ? i.annualCost * term : null;
  const unitCost =
    isNonNeg(i.annualCost) && isPositive(i.unitsOfWork) ? i.annualCost / i.unitsOfWork : null;
  if (i.unitsOfWork != null && !isPositive(i.unitsOfWork)) issues.push("unit-cost denominator is invalid");
  const canEmit = isPositive(i.estimatedAnnualKwh) && isPositive(i.emissionsFactorKgPerKwh);
  const annualTco2e = canEmit ? (i.estimatedAnnualKwh! * i.emissionsFactorKgPerKwh!) / 1000 : null;
  return {
    missing,
    issues,
    term,
    totalCommit,
    unitCost,
    annualDep: null as Opt,
    annualTco2e,
    termTco2e: annualTco2e != null && term != null ? annualTco2e * term : null,
    hasEnergy: canEmit,
  };
}

export function calcSoftware(i: SoftwareAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isNonNeg(i.initialLicence)) missing.push("initial licence");
  const initial = (i.initialLicence || 0) + (isNonNeg(i.implementationCost) ? i.implementationCost : 0);
  const recurring =
    (isNonNeg(i.annualSubscription) ? i.annualSubscription : 0) +
    (isNonNeg(i.annualMaintenance) ? i.annualMaintenance : 0);
  const recurringComplete = i.annualSubscription != null || i.annualMaintenance != null;
  if (isNum(i.residualValue) && isNonNeg(i.initialLicence) && i.residualValue > i.initialLicence) {
    issues.push("residual exceeds licence cost");
  }
  return {
    missing,
    issues,
    initialCash: isNonNeg(i.initialLicence) ? initial : null,
    recurringAnnual: recurringComplete ? recurring : null,
    annualDep: null as Opt,
    capitalisationTreatment: i.capitalisationTreatment,
  };
}

export function calcTraining(i: TrainingAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  if (!isPositive(i.plannedParticipants)) missing.push("planned participants");
  if (!isNonNeg(i.costPerParticipant)) missing.push("cost per planned participant");
  const total =
    isPositive(i.plannedParticipants) && isNonNeg(i.costPerParticipant)
      ? i.plannedParticipants * i.costPerParticipant
      : null;
  const plannedRate =
    isNonNeg(i.plannedCompletionRatePct) && i.plannedCompletionRatePct <= 100 ? i.plannedCompletionRatePct : null;
  if (isNum(i.plannedCompletionRatePct) && (i.plannedCompletionRatePct < 0 || i.plannedCompletionRatePct > 100)) {
    issues.push("planned completion rate is outside 0–100");
  }
  const actualRate =
    isPositive(i.actualEnrolment) && isNonNeg(i.actualCompletions)
      ? (i.actualCompletions / i.actualEnrolment) * 100
      : i.actualEnrolment != null && !isPositive(i.actualEnrolment)
        ? (issues.push("invalid actual-enrolment denominator"), null)
        : null;
  const costPerCompleted =
    total != null && isPositive(i.actualCompletions) ? total / i.actualCompletions : null;
  const costPerPlanned =
    isPositive(i.plannedParticipants) && isNonNeg(i.costPerParticipant) ? i.costPerParticipant : null;
  return {
    missing,
    issues,
    total,
    participants: i.plannedParticipants,
    plannedParticipants: i.plannedParticipants,
    actualEnrolment: i.actualEnrolment,
    plannedCompletions: i.plannedCompletions,
    actualCompletions: i.actualCompletions,
    costPerParticipant: costPerPlanned,
    costPerCompleted,
    durationMonths: i.durationMonths,
    plannedCompletionRatePct: plannedRate,
    actualCompletionRatePct: actualRate,
    trainerCapacityFte: i.trainerCapacityFte,
  };
}

export function calcPilot(i: PilotAssumptions) {
  const missing: string[] = [];
  const issues: string[] = [];
  const total = (isNonNeg(i.capexEstimate) ? i.capexEstimate : 0) + (isNonNeg(i.opexEstimate) ? i.opexEstimate : 0);
  const split =
    (isNonNeg(i.implementationCost) ? i.implementationCost : 0) +
    (isNonNeg(i.supportCost) ? i.supportCost : 0) +
    (isNonNeg(i.changeManagementCost) ? i.changeManagementCost : 0);
  if (split > 0 && Math.abs(split - total) > 1) {
    issues.push("implementation/support/change costs do not reconcile to the recorded envelope (envelope used as total)");
  }
  if (isNum(i.realisedBenefitAed) && i.realisedBenefitAed > 0) {
    issues.push("realised benefits require supporting evidence. They are not inferred from the forecast");
  }
  const costPerActiveUser = isPositive(i.activeUsers) ? total / i.activeUsers : null;
  if (i.activeUsers != null && !isPositive(i.activeUsers)) issues.push("invalid active-user denominator");
  return {
    missing,
    issues,
    capexEstimate: i.capexEstimate,
    opexEstimate: i.opexEstimate,
    total,
    plannedUsers: i.targetUsers,
    targetUsers: i.targetUsers,
    activeUsers: i.activeUsers,
    expectedBenefitAed: i.expectedBenefitAed,
    realisedBenefitAed: i.realisedBenefitAed,
    costPerActiveUser,
  };
}

export function derivedAmount(a: Assumptions): number {
  switch (a.kind) {
    case "ppe":
      return a.purchaseCost;
    case "efficiency":
      return a.investment;
    case "service": {
      const c = calcService(a);
      return c.totalCommit ?? a.annualCost;
    }
    case "software":
      return a.initialLicence + (isNonNeg(a.implementationCost) ? a.implementationCost : 0);
    case "training":
      return calcTraining(a).total ?? 0;
    case "pilot":
      return calcPilot(a).total;
  }
}

export function syncAmount(tx: Transaction): Transaction {
  return { ...tx, amount: derivedAmount(tx.assumptions) };
}

export function analysisCapability(type: TxTypeId): AssumptionKind {
  switch (type) {
    case "gpu_servers":
      return "ppe";
    case "software_licence":
      return "software";
    case "dc_cooling":
      return "efficiency";
    case "cloud_ai":
      return "service";
    case "workforce_training":
      return "training";
    default:
      return "pilot";
  }
}

export function defaultSpendClass(type: TxTypeId): SpendClass {
  switch (type) {
    case "gpu_servers":
    case "dc_cooling":
      return "capex";
    case "cloud_ai":
    case "workforce_training":
      return "opex";
    default:
      return "mixed";
  }
}

export function defaultCategory(type: TxTypeId): CategoryId {
  switch (type) {
    case "workforce_training":
    case "ai_pilot":
    case "adoption_programme":
      return "adoption";
    case "other":
      return "infrastructure";
    default:
      return "infrastructure";
  }
}

export function defaultAssumptions(type: TxTypeId): Assumptions {
  switch (type) {
    case "gpu_servers":
      return {
        kind: "ppe",
        purchaseCost: 4_000_000,
        acquisitionCost: null,
        installationCost: null,
        units: 4,
        unitLabel: "GPU servers",
        usefulLife: 4,
        residualValue: 400_000,
        annualMaintenance: 200_000,
        annualEnergyCost: 160_000,
        annualKwh: 400_000,
        electricityTariffAedPerKwh: null,
        emissionsFactorKgPerKwh: 0.4,
        emissionsFactorUnit: "kgCO2e/kWh",
      };
    case "software_licence":
      return {
        kind: "software",
        initialLicence: 600_000,
        annualSubscription: null,
        annualMaintenance: 80_000,
        implementationCost: null,
        usefulLife: 3,
        residualValue: null,
        capitalisationTreatment: "requires_review",
      };
    case "dc_cooling":
      return {
        kind: "efficiency",
        investment: 1_500_000,
        usefulLife: 10,
        annualSavingsForecast: 280_000,
        annualSavingsRealised: null,
        annualMaintenance: 50_000,
        annualKwhReductionForecast: 900_000,
        annualKwhReductionRealised: null,
        emissionsFactorKgPerKwh: 0.4,
        emissionsFactorUnit: "kgCO2e/kWh",
        horizonYears: 10,
      };
    case "cloud_ai":
      return {
        kind: "service",
        annualCost: 800_000,
        termYears: 3,
        unitsOfWork: null,
        unitOfWorkLabel: "workloads",
        estimatedAnnualKwh: null,
        emissionsFactorKgPerKwh: null,
        emissionsFactorUnit: "kgCO2e/kWh",
      };
    case "workforce_training":
      return {
        kind: "training",
        plannedParticipants: 100,
        actualEnrolment: null,
        plannedCompletions: null,
        actualCompletions: null,
        costPerParticipant: 2_000,
        durationMonths: 6,
        plannedCompletionRatePct: 85,
        trainerCapacityFte: 2,
      };
    case "ai_pilot":
    case "adoption_programme":
    case "other":
      return {
        kind: "pilot",
        capexEstimate: 500_000,
        opexEstimate: 250_000,
        implementationCost: null,
        supportCost: null,
        changeManagementCost: null,
        targetUsers: 80,
        activeUsers: null,
        expectedBenefitAed: null,
        realisedBenefitAed: null,
        plannedBenefitNote: "Planned target only. Not a measured result.",
      };
  }
}

export interface InvestmentTemplate {
  type: TxTypeId;
  blurb: string;
  defaultProject: string;
  defaultTitle: string;
  defaultPurpose: string;
}

export const INVESTMENT_TEMPLATES: InvestmentTemplate[] = [
  {
    type: "gpu_servers",
    blurb: "On-premise GPU servers and supporting equipment, treated as PPE where criteria are met.",
    defaultProject: "Departmental AI compute capacity",
    defaultTitle: "GPU server procurement",
    defaultPurpose: "Acquire dedicated GPU capacity for an internal AI sandbox environment.",
  },
  {
    type: "dc_cooling",
    blurb: "Cooling or energy-efficiency works that may be capitalised if they enhance the asset.",
    defaultProject: "AI hall cooling optimisation",
    defaultTitle: "Data-centre cooling upgrade",
    defaultPurpose: "Reduce cooling energy use supporting AI compute loads.",
  },
  {
    type: "cloud_ai",
    blurb: "Cloud GPU or model-hosting services, typically expensed over the contract term.",
    defaultProject: "Burst AI inference capacity",
    defaultTitle: "Cloud AI services commitment",
    defaultPurpose: "Reserve cloud AI compute for peak demand without expanding on-premise kit.",
  },
  {
    type: "software_licence",
    blurb: "Licence, subscription, maintenance and implementation costs. Capitalisation requires case-specific review.",
    defaultProject: "Approved AI platform stack",
    defaultTitle: "AI software licence bundle",
    defaultPurpose: "Licence an approved model-operations and document-intelligence platform.",
  },
  {
    type: "workforce_training",
    blurb: "Literacy or advanced training; costs are generally expensed as incurred.",
    defaultProject: "AI skills pathway",
    defaultTitle: "Workforce AI training programme",
    defaultPurpose: "Build baseline AI literacy and safe-use capability across a department.",
  },
  {
    type: "ai_pilot",
    blurb: "Time-boxed public-service pilot with planned benefits that are not yet measured.",
    defaultProject: "Service-desk copilot pilot",
    defaultTitle: "AI-enabled service pilot",
    defaultPurpose: "Test an AI assistant on a bounded public-service workflow.",
  },
  {
    type: "other",
    blurb: "A residual AI investment that does not yet map to a specialised calculation.",
    defaultProject: "Unclassified AI investment",
    defaultTitle: "Other AI investment",
    defaultPurpose: "Record an AI-related outlay for review.",
  },
];

export function newRef(existing: Transaction[]) {
  const n = existing.filter((t) => t.source === "user").length + 1;
  return `DEMO-USR-${String(n).padStart(3, "0")}`;
}

export function newId() {
  return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildTransaction(partial: {
  existing: Transaction[];
  type: TxTypeId;
  projectName: string;
  title: string;
  category: CategoryId;
  spendClass: SpendClass;
  entity: string;
  isoDate: string;
  status: TxStatus;
  purpose: string;
  description: string;
  assumptions: Assumptions;
  workforce?: WorkforceRole[];
  amountOverride?: number;
}): Transaction {
  const tmpl = INVESTMENT_TEMPLATES.find((t) => t.type === partial.type);
  const assumptions = partial.assumptions;
  const amount =
    partial.amountOverride != null && Number.isFinite(partial.amountOverride)
      ? partial.amountOverride
      : derivedAmount(assumptions);
  return {
    id: newId(),
    ref: newRef(partial.existing),
    projectName: partial.projectName.trim(),
    title: partial.title.trim(),
    short: tmpl?.defaultTitle ?? TYPE_LABEL[partial.type],
    category: partial.category,
    type: partial.type,
    spendClass: partial.spendClass,
    entity: partial.entity.trim() || "Fictional Public Services Authority",
    isoDate: partial.isoDate,
    status: partial.status,
    amount,
    purpose: partial.purpose.trim(),
    description: partial.description.trim(),
    assumptions,
    workforce: partial.workforce ?? defaultWorkforce(partial.type),
    assumptionNotes: "Synthetic demonstration assumptions. Not official data.",
    source: "user",
  };
}

export function portfolio(txs: Transaction[]) {
  const sum = (xs: Transaction[]) => xs.reduce((s, t) => s + t.amount, 0);
  const byStatus = (Object.keys(STATUS_LABEL) as TxStatus[]).map((status) => ({
    status,
    count: txs.filter((t) => t.status === status).length,
  }));
  return {
    count: txs.length,
    total: sum(txs),
    capex: sum(txs.filter((t) => t.spendClass === "capex")),
    opex: sum(txs.filter((t) => t.spendClass === "opex")),
    mixed: sum(txs.filter((t) => t.spendClass === "mixed")),
    infrastructure: sum(txs.filter((t) => t.category === "infrastructure")),
    adoption: sum(txs.filter((t) => t.category === "adoption")),
    infraCount: txs.filter((t) => t.category === "infrastructure").length,
    adoptionCount: txs.filter((t) => t.category === "adoption").length,
    byStatus,
  };
}

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "gpu-compute",
    ref: "DEMO-PO-104",
    projectName: "Watani Compute Sandbox",
    title: "On-premise GPU server cluster procurement",
    short: "GPU cluster",
    category: "infrastructure",
    type: "gpu_servers",
    spendClass: "capex",
    entity: "Fictional Federal Digital Authority",
    isoDate: "2026-10-12",
    status: "under_review",
    amount: 12_400_000,
    purpose: "Establish a departmental AI sandbox with dedicated GPU servers and racks.",
    description:
      "Synthetic purchase of eight GPU servers, racks and installation. Recognised as PPE if recognition criteria are met. Energy use is an illustrative estimate, not a metered reading.",
    assumptions: {
      kind: "ppe",
      purchaseCost: 12_400_000,
      acquisitionCost: null,
      installationCost: null,
      units: 8,
      unitLabel: "GPU servers",
      usefulLife: 4,
      residualValue: 1_240_000,
      annualMaintenance: 620_000,
      annualEnergyCost: 480_000,
      annualKwh: 1_200_000,
      electricityTariffAedPerKwh: null,
      emissionsFactorKgPerKwh: 0.4,
      emissionsFactorUnit: "kgCO2e/kWh",
    },
    workforce: defaultWorkforce("gpu_servers"),
    assumptionNotes: "Synthetic demonstration assumptions. Energy factor is illustrative (kgCO₂e/kWh).",
    source: "seed",
  },
  {
    id: "dc-cooling",
    ref: "DEMO-EN-118",
    projectName: "AI Hall Thermal Efficiency",
    title: "Data-centre cooling and containment upgrade",
    short: "Cooling upgrade",
    category: "infrastructure",
    type: "dc_cooling",
    spendClass: "capex",
    entity: "Fictional Government Data Centre Office",
    isoDate: "2026-09-03",
    status: "in_progress",
    amount: 2_850_000,
    purpose: "Improve cooling efficiency for halls that will host AI compute loads.",
    description:
      "Synthetic capital works for containment, CRAC optimisation and controls. Estimated energy-cost savings are planning assumptions, not verified measurement-and-verification results.",
    assumptions: {
      kind: "efficiency",
      investment: 2_850_000,
      usefulLife: 10,
      annualSavingsForecast: 520_000,
      annualSavingsRealised: null,
      annualMaintenance: 85_000,
      annualKwhReductionForecast: 1_800_000,
      annualKwhReductionRealised: null,
      emissionsFactorKgPerKwh: 0.4,
      emissionsFactorUnit: "kgCO2e/kWh",
      horizonYears: 10,
    },
    workforce: defaultWorkforce("dc_cooling"),
    assumptionNotes: "Forecast energy savings only. No realised M&V result is recorded.",
    source: "seed",
  },
  {
    id: "cloud-capacity",
    ref: "DEMO-SV-221",
    projectName: "Burst Inference Reserve",
    title: "Cloud AI infrastructure and computing services",
    short: "Cloud AI services",
    category: "infrastructure",
    type: "cloud_ai",
    spendClass: "opex",
    entity: "Fictional Federal Digital Authority",
    isoDate: "2026-10-20",
    status: "under_review",
    amount: 3_600_000,
    purpose: "Reserve cloud GPU and model-hosting capacity for peak demand over a three-year term.",
    description:
      "Synthetic cloud commitment recorded as operating expenditure. No on-premise asset is recognised. Energy figures are omitted unless an illustrative estimate is supplied.",
    assumptions: {
      kind: "service",
      annualCost: 1_200_000,
      termYears: 3,
      unitsOfWork: null,
      unitOfWorkLabel: "inference workloads",
      estimatedAnnualKwh: null,
      emissionsFactorKgPerKwh: null,
      emissionsFactorUnit: "kgCO2e/kWh",
    },
    workforce: defaultWorkforce("cloud_ai"),
    assumptionNotes: "Cloud fees are treated as opex. No hardware depreciation. kWh not recorded.",
    source: "seed",
  },
  {
    id: "software-licences",
    ref: "DEMO-SW-087",
    projectName: "Approved Model Operations Stack",
    title: "AI platform software licences and maintenance",
    short: "Software licences",
    category: "infrastructure",
    type: "software_licence",
    spendClass: "capex",
    entity: "Fictional Municipal Services Department",
    isoDate: "2026-08-15",
    status: "approved",
    amount: 960_000,
    purpose: "Licence document-intelligence and model-operations software for approved use cases.",
    description:
      "Synthetic licence bundle. May be recognised as an intangible asset and amortised if IAS 38 / IPSAS 31 criteria are met. Annual maintenance is expensed.",
    assumptions: {
      kind: "software",
      initialLicence: 960_000,
      annualSubscription: null,
      annualMaintenance: 120_000,
      implementationCost: null,
      usefulLife: 3,
      residualValue: null,
      capitalisationTreatment: "requires_review",
    },
    workforce: defaultWorkforce("software_licence"),
    assumptionNotes: "Capitalisation of licences is not auto-determined. Maintenance is recurring opex.",
    source: "seed",
  },
  {
    id: "literacy-programme",
    ref: "DEMO-HR-044",
    projectName: "Public-Sector AI Literacy",
    title: "Foundation AI literacy and safe-use training",
    short: "AI literacy",
    category: "adoption",
    type: "workforce_training",
    spendClass: "opex",
    entity: "Fictional Civil Service Development Institute",
    isoDate: "2026-09-01",
    status: "in_progress",
    amount: 450_000,
    purpose: "Give 300 employees a shared baseline for responsible AI use.",
    description:
      "Synthetic training programme. Costs are treated as operating expenditure. Completion rate is a planned target, not an achieved result.",
    assumptions: {
      kind: "training",
      plannedParticipants: 300,
      actualEnrolment: null,
      plannedCompletions: null,
      actualCompletions: null,
      costPerParticipant: 1_500,
      durationMonths: 6,
      plannedCompletionRatePct: 90,
      trainerCapacityFte: 2,
    },
    workforce: literacyWorkforce(),
    assumptionNotes: "Completion rate is a planned target. Actual enrolment and completions are not recorded.",
    source: "seed",
  },
  {
    id: "advanced-pathway",
    ref: "DEMO-HR-061",
    projectName: "Advanced AI Practitioner Pathway",
    title: "Advanced AI training for government specialists",
    short: "Advanced training",
    category: "adoption",
    type: "workforce_training",
    spendClass: "opex",
    entity: "Fictional Civil Service Development Institute",
    isoDate: "2026-10-08",
    status: "under_review",
    amount: 720_000,
    purpose: "Train 60 specialists in applied AI delivery, evaluation and oversight.",
    description:
      "Synthetic advanced pathway. Cost per participant is illustrative. No productivity gain is claimed as a measured outcome.",
    assumptions: {
      kind: "training",
      plannedParticipants: 60,
      actualEnrolment: null,
      plannedCompletions: null,
      actualCompletions: null,
      costPerParticipant: 12_000,
      durationMonths: 9,
      plannedCompletionRatePct: 80,
      trainerCapacityFte: 1,
    },
    workforce: advancedWorkforce(),
    assumptionNotes: "Advanced pathway targets are not achieved results.",
    source: "seed",
  },
  {
    id: "services-pilot",
    ref: "DEMO-PI-033",
    projectName: "Citizen Services Copilot",
    title: "AI-enabled public-service implementation pilot",
    short: "Service copilot pilot",
    category: "adoption",
    type: "ai_pilot",
    spendClass: "mixed",
    entity: "Fictional Municipal Services Department",
    isoDate: "2026-10-18",
    status: "under_review",
    amount: 1_150_000,
    purpose: "Pilot an assistant on a bounded citizen-enquiry workflow before any scale decision.",
    description:
      "Synthetic pilot combining configuration (treated as a capex estimate) and operating support. Staff-time benefits are planned targets only.",
    assumptions: {
      kind: "pilot",
      capexEstimate: 700_000,
      opexEstimate: 450_000,
      implementationCost: null,
      supportCost: null,
      changeManagementCost: null,
      targetUsers: 40,
      activeUsers: null,
      expectedBenefitAed: null,
      realisedBenefitAed: null,
      plannedBenefitNote:
        "Planned target: up to 12,000 staff hours redirected per year if the pilot meets quality gates. Not a measured result.",
    },
    workforce: defaultWorkforce("ai_pilot"),
    assumptionNotes: "Active users and realised benefits are not recorded. Targets are not results.",
    source: "seed",
  },
  {
    id: "adoption-programme",
    ref: "DEMO-AD-019",
    projectName: "Departmental AI Adoption Programme",
    title: "AI adoption programme with usage and benefit-realisation targets",
    short: "Adoption programme",
    category: "adoption",
    type: "adoption_programme",
    spendClass: "mixed",
    entity: "Fictional Federal Services Authority",
    isoDate: "2026-10-22",
    status: "draft",
    amount: 2_200_000,
    purpose: "Coordinate tooling, change management and benefit tracking across one department.",
    description:
      "Synthetic programme envelope. Usage and benefit figures are planned targets for a future realisation review, not achieved outcomes.",
    assumptions: {
      kind: "pilot",
      capexEstimate: 800_000,
      opexEstimate: 1_400_000,
      implementationCost: null,
      supportCost: null,
      changeManagementCost: null,
      targetUsers: 250,
      activeUsers: null,
      expectedBenefitAed: null,
      realisedBenefitAed: null,
      plannedBenefitNote:
        "Planned target: 40% of in-scope staff using an approved tool within 12 months. Not a measured result.",
    },
    workforce: defaultWorkforce("adoption_programme"),
    assumptionNotes: "Usage and benefit figures are planned targets, not achieved outcomes.",
    source: "seed",
  },
];
