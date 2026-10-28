import { calcEfficiency, calcPpe, calcService, type Transaction } from "./greenledger";

export type EsgBand = "low" | "moderate" | "high";
export type EsgFactorLevel = EsgBand | "insufficient";

export interface EsgFactor {
  id: "environmental" | "social" | "governance";
  label: string;
  level: EsgFactorLevel;
  note: string;
}

export interface EsgAssessment {
  overall: EsgFactorLevel;
  rationale: string;
  factors: [EsgFactor, EsgFactor, EsgFactor];
}

const QUALIFIER = "Illustrative assessment";

function factor(
  id: EsgFactor["id"],
  label: string,
  level: EsgFactorLevel,
  note: string,
): EsgFactor {
  return { id, label, level, note };
}

export function assessEsgRisk(tx: Transaction): EsgAssessment {
  switch (tx.type) {
    case "dc_cooling":
      return coolingAssessment(tx);
    case "gpu_servers":
      return gpuAssessment(tx);
    case "cloud_ai":
      return cloudAssessment(tx);
    case "software_licence":
      return softwareAssessment();
    case "workforce_training":
      return trainingAssessment();
    case "ai_pilot":
      return programmeAssessment(
        "Pilot delivery and scale-up depend on stage gates and planned benefits that are not yet evidenced. Environmental activity data is not attached to this record.",
      );
    case "adoption_programme":
      return programmeAssessment(
        "Adoption spend is a mixed envelope. Governance hinges on contract split and benefit labelling; environmental and social ratings cannot be supported from the recorded assumptions.",
      );
    default:
      return {
        overall: "insufficient",
        rationale:
          "This investment type does not carry enough recorded environmental, social or governance evidence for an estimated ESG risk category.",
        factors: [
          factor("environmental", "Environmental", "insufficient", "No activity data recorded."),
          factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
          factor("governance", "Governance", "insufficient", "Ownership of risks is not documented on this record."),
        ],
      };
  }
}

export function esgLevelLabel(level: EsgFactorLevel): string {
  if (level === "insufficient") return "Insufficient evidence";
  if (level === "low") return "Low risk";
  if (level === "moderate") return "Moderate risk";
  return "High risk";
}

export { QUALIFIER as ESG_QUALIFIER };

function coolingAssessment(tx: Transaction): EsgAssessment {
  const a = tx.assumptions.kind === "efficiency" ? tx.assumptions : null;
  const c = a ? calcEfficiency(a) : null;
  const hasForecast = c?.hasEnergy === true;
  return {
    overall: hasForecast ? "moderate" : "insufficient",
    rationale:
      "The investment could reduce cooling-related energy consumption, while still carrying environmental and operational risks that require verification. Potential refrigerant and commissioning issues are considerations, not confirmed findings.",
    factors: [
      factor(
        "environmental",
        "Environmental",
        hasForecast ? "moderate" : "insufficient",
        hasForecast
          ? "Moderate, pending verification of forecast energy savings."
          : "Insufficient evidence: forecast energy reduction or grid factor is missing.",
      ),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Potential evidence gap: review commissioning records, procurement controls and savings verification.",
      ),
    ],
  };
}

function gpuAssessment(tx: Transaction): EsgAssessment {
  const a = tx.assumptions.kind === "ppe" ? tx.assumptions : null;
  const c = a ? calcPpe(a) : null;
  const hasEnergy = c?.hasEnergy === true;
  return {
    overall: hasEnergy ? "moderate" : "insufficient",
    rationale:
      "Dedicated GPU capacity implies ongoing electricity use. The emissions figure is an illustrative consumption estimate, not a reduction against a baseline. Recognition, metering and installation-safety items are evidence gaps, not confirmed findings.",
    factors: [
      factor(
        "environmental",
        "Environmental",
        hasEnergy ? "moderate" : "insufficient",
        hasEnergy
          ? "Moderate illustrative risk, pending verification of electricity consumption and emissions assumptions."
          : "Insufficient evidence: no electricity assumption recorded.",
      ),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Review capitalisation evidence, the asset register and energy-metering arrangements.",
      ),
    ],
  };
}

function cloudAssessment(tx: Transaction): EsgAssessment {
  const a = tx.assumptions.kind === "service" ? tx.assumptions : null;
  const c = a ? calcService(a) : null;
  const hasEnergy = c?.hasEnergy === true;
  return {
    overall: "insufficient",
    rationale:
      "Estimated ESG risk cannot be categorised from contract value alone. Utilisation, residency and classification are documented review points, not scored findings.",
    factors: [
      factor(
        "environmental",
        "Environmental",
        hasEnergy ? "moderate" : "insufficient",
        hasEnergy
          ? "Moderate: illustrative supplier energy assumption, not a measured inventory."
          : "Insufficient evidence: no kWh assumption recorded.",
      ),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Review utilisation reporting, data-residency terms and classification against PPE.",
      ),
    ],
  };
}

function softwareAssessment(): EsgAssessment {
  return {
    overall: "insufficient",
    rationale:
      "No activity data supports an environmental rating. Contract classification is unresolved in this prototype and is treated as an evidence gap, not a scored finding.",
    factors: [
      factor("environmental", "Environmental", "insufficient", "Insufficient evidence: no energy or supplier factor recorded."),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Review whether the entity controls the software or only a right of access.",
      ),
    ],
  };
}

function trainingAssessment(): EsgAssessment {
  return {
    overall: "insufficient",
    rationale:
      "Training records do not include travel, venue or platform-energy data. Completion figures on file are planned targets, not achieved outcomes.",
    factors: [
      factor("environmental", "Environmental", "insufficient", "Insufficient evidence: emissions are not modelled for this type."),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Review attendance evidence and keep training invoices out of the AI asset register.",
      ),
    ],
  };
}

function programmeAssessment(rationale: string): EsgAssessment {
  return {
    overall: "moderate",
    rationale,
    factors: [
      factor("environmental", "Environmental", "insufficient", "Insufficient evidence: no activity data attached."),
      factor("social", "Social", "insufficient", "Insufficient evidence for a confident rating."),
      factor(
        "governance",
        "Governance",
        "moderate",
        "Review stage gates, contract split, and that planned benefits are not labelled as results.",
      ),
    ],
  };
}
