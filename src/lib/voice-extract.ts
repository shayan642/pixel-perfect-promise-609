import {
  CATEGORY_LABEL,
  TYPE_LABEL,
  defaultAssumptions,
  defaultCategory,
  defaultSpendClass,
  type Assumptions,
  type CategoryId,
  type TxTypeId,
} from "./greenledger";
import { defaultWorkforce, type WorkforceRole } from "./workforce";

export type VoiceDraftSource = "speech" | "typed" | "sample";

export interface InvestmentVoiceDraft {
  source: VoiceDraftSource;
  transcript: string;
  projectName: string;
  title: string;
  description: string;
  purpose: string;
  category: CategoryId | "";
  type: TxTypeId | "";
  budgetAed: number | null;
  expectedBenefitAed: number | null;
  benefitNote: string;
  workforceNote: string;
  fteHint: number | null;
}

export const SAMPLE_IDEA_LABEL = "Sample idea (illustrative)";

export const SAMPLE_IDEA_TRANSCRIPT =
  "Propose a project called National AI Data Centre Capacity. It is a GPU server procurement for a government data hall. Estimated budget AED 12.4 million. Category is AI infrastructure. Expected benefits include faster internal model training and lower burst cloud spend of about AED 1.8 million a year. Workforce requires 8 GPU specialists.";

export function emptyDraft(source: VoiceDraftSource = "typed"): InvestmentVoiceDraft {
  return {
    source,
    transcript: "",
    projectName: "",
    title: "",
    description: "",
    purpose: "",
    category: "",
    type: "",
    budgetAed: null,
    expectedBenefitAed: null,
    benefitNote: "",
    workforceNote: "",
    fteHint: null,
  };
}

export function structureTranscript(transcript: string, source: VoiceDraftSource): InvestmentVoiceDraft {
  const text = transcript.replace(/\s+/g, " ").trim();
  if (!text) return emptyDraft(source);

  const type = inferType(text);
  const category = inferCategory(text, type);
  const projectName = inferProjectName(text);
  const budgetAed = inferMoney(text, /(?:estimated\s+)?(?:budget|cost|investment|capex|envelope)/i);
  const expectedBenefitAed = inferBenefitAmount(text);
  const benefitNote = inferClause(text, /expected benefits?(?:\s+include)?\s+/i);
  const fteHint = inferFte(text);
  const workforceNote = inferWorkforceNote(text, fteHint);
  const purpose = benefitNote || inferClause(text, /(?:purpose|intended to|to support)\s+/i);
  const title = type ? TYPE_LABEL[type] : inferTitle(text, projectName);
  const description = text.length > 280 ? `${text.slice(0, 277)}…` : text;

  return {
    source,
    transcript: text,
    projectName,
    title,
    description,
    purpose,
    category: category ?? "",
    type: type ?? "",
    budgetAed,
    expectedBenefitAed,
    benefitNote,
    workforceNote,
    fteHint,
  };
}

export function filledFieldCount(d: InvestmentVoiceDraft) {
  return [
    d.projectName,
    d.title,
    d.description,
    d.purpose,
    d.category,
    d.type,
    d.budgetAed,
    d.expectedBenefitAed,
    d.benefitNote,
    d.workforceNote,
    d.fteHint,
  ].filter((v) => v !== "" && v != null).length;
}

export interface VoiceCreatePrefill {
  type: TxTypeId;
  category: CategoryId;
  spendClass: ReturnType<typeof defaultSpendClass>;
  projectName: string;
  title: string;
  purpose: string;
  description: string;
  assumptions: Assumptions;
  workforce: WorkforceRole[];
}

export function toCreatePrefill(draft: InvestmentVoiceDraft): VoiceCreatePrefill {
  const type: TxTypeId = draft.type || "other";
  const category: CategoryId = draft.category || defaultCategory(type);
  let assumptions = defaultAssumptions(type);
  assumptions = applyBudget(assumptions, draft.budgetAed);
  assumptions = applyBenefit(assumptions, draft.expectedBenefitAed, draft.benefitNote || draft.purpose);

  const workforce = applyWorkforceHint(defaultWorkforce(type), draft);

  const purpose = draft.purpose || draft.benefitNote;
  const extra = [
    draft.source === "sample" ? "Structured from the built-in sample idea, not a spoken submission." : "",
    draft.workforceNote,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    type,
    category,
    spendClass: defaultSpendClass(type),
    projectName: draft.projectName,
    title: draft.title,
    purpose,
    description: extra ? `${draft.description}${draft.description ? " " : ""}${extra}` : draft.description,
    assumptions,
    workforce,
  };
}

function inferType(text: string): TxTypeId | null {
  const t = text.toLowerCase();
  if (/\b(cooling|hvac|energy efficienc)/.test(t)) return "dc_cooling";
  if (/\b(gpu|server|data[- ]cent(?:re|er)|data hall)\b/.test(t)) return "gpu_servers";
  if (/\bcloud\b/.test(t)) return "cloud_ai";
  if (/\b(licen[cs]e|software)\b/.test(t)) return "software_licence";
  if (/\b(training|literacy|skills programme|workforce programme)\b/.test(t)) return "workforce_training";
  if (/\badoption programme\b/.test(t)) return "adoption_programme";
  if (/\bpilot\b/.test(t)) return "ai_pilot";
  return null;
}

function inferCategory(text: string, type: TxTypeId | null): CategoryId | null {
  const t = text.toLowerCase();
  if (/\bai adoption\b|\bworkforce\b|\btraining\b/.test(t) && !/\binfrastructure\b/.test(t)) return "adoption";
  if (/\binfrastructure\b|\bdata[- ]cent|\bgpu\b/.test(t)) return "infrastructure";
  if (type) return defaultCategory(type);
  return null;
}

function inferProjectName(text: string): string {
  const called = text.match(/\b(?:called|named)\s+([^.,;]+?)(?:\.|,|;| estimated| it is| category| budget)/i);
  if (called?.[1]) return tidyName(called[1]);
  const project = text.match(/\bproject(?:\s+name)?(?:\s+is)?\s+([^.,;]+?)(?:\.|,|;| estimated| it is| category| budget)/i);
  if (project?.[1]) return tidyName(project[1]);
  const propose = text.match(/propose (?:a |an )?(?:project |investment )?(?:called |named )?([^.,;]+?)(?:\.|,)/i);
  if (propose?.[1]) return tidyName(propose[1]);
  return "";
}

function tidyName(raw: string) {
  return raw
    .replace(/^(?:a |an |the |called |named )+/i, "")
    .replace(/[.:,;]+$/g, "")
    .trim();
}

function inferTitle(text: string, projectName: string): string {
  if (projectName) return projectName;
  const first = text.split(/[.!?]/)[0]?.trim() ?? "";
  return first.length <= 80 ? first : "";
}

function inferMoney(text: string, near?: RegExp): number | null {
  if (!near) return parseAedAmount(text);
  const windowed = sliceNear(text, near, 80);
  return (windowed ? parseAedAmount(windowed) : null) ?? parseAedAmount(text);
}

function inferBenefitAmount(text: string): number | null {
  const slice = sliceNear(text, /(?:benefit|save|saving|lower[^.]{0,40}spend)/i, 90);
  return slice ? parseAedAmount(slice) : null;
}

function inferFte(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:fte|full[ -]?time(?: equivalent)?s?|people|workers|specialists|engineers)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function inferWorkforceNote(text: string, fte: number | null): string {
  const m = text.match(/workforce[^.]*?(?:\.|$)/i);
  if (m) return m[0].trim();
  if (fte != null) return `Spoken workforce estimate: ${fte} people (review required).`;
  return "";
}

function inferClause(text: string, lead: RegExp): string {
  const m = text.match(new RegExp(lead.source + "([^.]{8,220})", lead.flags));
  const clause = m?.[1];
  return clause ? clause.trim().replace(/[.]+$/, "") : "";
}

function sliceNear(text: string, re: RegExp, span: number): string | null {
  const m = text.match(re);
  if (!m || m.index == null) return null;
  return text.slice(m.index, m.index + m[0].length + span);
}

function parseAedAmount(chunk: string): number | null {
  const m = chunk.match(
    /(?:aed\s*)?(\d+(?:\.\d+)?)\s*(million|billion|m|bn)?(?:\s*(?:aed|dirhams?))?/i,
  );
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "billion" || unit === "bn") return Math.round(n * 1_000_000_000);
  if (unit === "million" || unit === "m") return Math.round(n * 1_000_000);
  if (n >= 1000) return Math.round(n);
  return null;
}

function applyBudget(a: Assumptions, budget: number | null): Assumptions {
  if (budget == null || budget <= 0) return a;
  switch (a.kind) {
    case "ppe":
      return { ...a, purchaseCost: budget };
    case "efficiency":
      return { ...a, investment: budget };
    case "service":
      return { ...a, annualCost: budget };
    case "software":
      return { ...a, initialLicence: budget };
    case "training":
      return a;
    case "pilot":
      return { ...a, capexEstimate: budget };
  }
}

function applyBenefit(a: Assumptions, amount: number | null, note: string): Assumptions {
  if (a.kind !== "pilot") return a;
  return {
    ...a,
    expectedBenefitAed: amount,
    plannedBenefitNote: note || a.plannedBenefitNote,
  };
}

function applyWorkforceHint(roles: WorkforceRole[], draft: InvestmentVoiceDraft): WorkforceRole[] {
  if (!draft.workforceNote && draft.fteHint == null) return roles;
  if (roles.length === 0) {
    return [
      {
        id: "voice-review-role",
        occupation: "Role captured from voice draft. Review required.",
        phase: "implementation",
        tenure: "temporary",
        unit: "fte",
        requiredFte: draft.fteHint,
        domesticAvailabilityFte: null,
        qualifiedJobseekersFte: null,
        needingAdditionalTrainingFte: null,
        internationalRecruitmentFte: null,
        recruitmentCostAed: null,
        annualCompensationPerFteAed: null,
        contractorCostAed: null,
        notes: draft.workforceNote || "Extracted from voice draft. Figures left blank where not stated.",
        quality: "user_entered",
      },
    ];
  }
  return roles.map((role, i) =>
    i === 0
      ? {
          ...role,
          notes: [role.notes, draft.workforceNote].filter(Boolean).join(" "),
          quality: "user_entered" as const,
        }
      : role,
  );
}

export function draftSummary(d: InvestmentVoiceDraft) {
  return [
    { label: "Project name", value: d.projectName },
    { label: "Investment name", value: d.title },
    { label: "Category", value: d.category ? CATEGORY_LABEL[d.category] : "" },
    { label: "Type", value: d.type ? TYPE_LABEL[d.type] : "" },
    { label: "Estimated budget", value: d.budgetAed != null ? `AED ${d.budgetAed.toLocaleString("en-AE")}` : "" },
    { label: "Expected benefits", value: d.benefitNote },
    { label: "Benefit amount", value: d.expectedBenefitAed != null ? `AED ${d.expectedBenefitAed.toLocaleString("en-AE")}` : "" },
    { label: "Workforce", value: d.workforceNote },
  ];
}
