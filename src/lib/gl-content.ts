import {
  aed,
  aedOpt,
  calcEfficiency,
  calcPilot,
  calcPpe,
  calcService,
  calcSoftware,
  calcTraining,
  num,
  numOpt,
  TYPE_LABEL,
  type EfficiencyAssumptions,
  type PilotAssumptions,
  type PpeAssumptions,
  type ServiceAssumptions,
  type SoftwareAssumptions,
  type TrainingAssumptions,
  type Transaction,
} from "./greenledger";
import { isPositive } from "./opt";
import { calcWorkforce, type WorkforceAssessment } from "./workforce";

export interface Journal {
  label: string;
  lines: { account: string; dr?: number; cr?: number }[];
}
export interface Metric {
  label: string;
  value: string;
  hint?: string;
}

function formatEnergyKwh(kwh: number | null | undefined): string | null {
  if (!isPositive(kwh) || kwh == null) return null;
  if (kwh >= 1_000_000) {
    const millions = kwh / 1_000_000;
    const shown = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);
    return `${shown} million kWh`;
  }
  return `${num(kwh, 0)} kWh`;
}

function formatTco2e(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  const decimals = Number.isInteger(value) ? 0 : 1;
  return `${num(value, decimals)} tCO₂e`;
}
export interface AuditItem {
  risk: string;
  control: string;
  substantive: string;
}
export interface View {
  summary: string;
  capability: "full" | "limited";
  capabilityNote: string;
  trace: { step: string; detail: string }[];
  accounting: {
    standard: string;
    points: string[];
    journals: Journal[];
    statements: { statement: string; effect: string }[];
  };
  financial: Metric[];
  audit: { items: AuditItem[]; exceptions: string[]; actions: string[] };
  sustainability: {
    headline: Metric[];
    notice?: string;
    method: string[];
    limitations: string[];
    reporting: string[];
  };
  integrated: { financial: string; accounting: string; audit: string; climate: string; workforce?: string };
  workforce?: WorkforceAssessment;
  recommendations: string[];
  questions: string[];
}

const S1S2 = [
  "IFRS S1 / S2 may inform disclosure of sustainability-related risks and climate metrics where the entity's reporting mandate requires it.",
  "These standards do not automatically apply to every government entity.",
];

export function transactionView(tx: Transaction): View {
  const base = (() => {
    switch (tx.assumptions.kind) {
      case "ppe":
        return ppeView(tx, tx.assumptions);
      case "efficiency":
        return efficiencyView(tx, tx.assumptions);
      case "service":
        return serviceView(tx, tx.assumptions);
      case "software":
        return softwareView(tx, tx.assumptions);
      case "training":
        return trainingView(tx, tx.assumptions);
      case "pilot":
        return pilotView(tx, tx.assumptions);
    }
  })();
  const workforce = calcWorkforce(tx.workforce ?? []);
  return {
    ...base,
    workforce,
    integrated: { ...base.integrated, workforce: workforce.headline },
  };
}

function ppeView(tx: Transaction, i: PpeAssumptions): View {
  const c = calcPpe(i);
  const L = i.usefulLife;
  const standard = "IAS 16 Property, Plant and Equipment (or IPSAS 17). Illustrative.";
  const depLabel = aedOpt(c.annualDep);
  return {
    summary: `${tx.title}: ${aed(i.purchaseCost)} for ${numOpt(i.units)} ${i.unitLabel}. Depreciation ${depLabel} per year where inputs are valid.`,
    capability: c.annualDep == null ? "limited" : "full",
    capabilityNote:
      c.annualDep == null
        ? `Depreciation not calculated: ${c.issues.concat(c.missing).join("; ") || "required inputs missing."}`
        : "Connected depreciation, cash and illustrative journals update with these assumptions.",
    trace: [
      { step: "Acquisition", detail: `${aed(i.purchaseCost)} cash / payable` },
      { step: "Recognition", detail: "AI computing equipment (PPE) at cost, if criteria are met" },
      { step: "Depreciation & opex", detail: `${depLabel} non-cash + ${aedOpt(c.annualOpex)} cash / yr` },
      { step: "Audit procedures", detail: "Existence, capitalisation criteria, recalculation" },
      { step: "Energy / emissions", detail: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2e) ?? "Not calculated"} / yr electricity-related (estimate)` : "No energy assumption recorded" },
      { step: "Decision report", detail: `TCO ${aedOpt(c.tcoGross)} over ${numOpt(L)} yrs` },
    ],
    accounting: {
      standard,
      points: [
        "GPU servers and racks may be recognised as PPE when future economic benefits or service potential are probable and cost can be measured reliably.",
        `Initial measurement at cost: ${aed(i.purchaseCost)}. Installation is included only if it is part of the recorded amount. It is not added again in TCO.`,
        c.annualDep == null
          ? "Straight-line depreciation is not calculated because useful life, residual value or cost is missing or invalid."
          : `Straight-line depreciation: (${aed(i.purchaseCost)} − ${aedOpt(i.residualValue)}) ÷ ${numOpt(L)} years = ${depLabel} per year.`,
        `Carrying amount after year 1: ${aedOpt(c.carryingAfterYear1)}.`,
        "Day-to-day maintenance and energy are cash operating expenditure, not capitalised, and are counted once in TCO.",
        "Cloud-hosted elements of the same programme should not be capitalised as hardware.",
      ],
      journals: [
        {
          label: "On acquisition",
          lines: [
            { account: "AI Computing Equipment (PPE)", dr: i.purchaseCost },
            { account: "Cash / Accounts Payable", cr: i.purchaseCost },
          ],
        },
        ...(c.annualDep != null
          ? [{
              label: "Annual depreciation",
              lines: [
                { account: "Depreciation Expense", dr: c.annualDep },
                { account: "Accumulated Depreciation – Equipment", cr: c.annualDep },
              ],
            }]
          : []),
        ...(c.annualOpex != null
          ? [{
              label: "Annual running costs",
              lines: [
                ...(i.annualMaintenance != null ? [{ account: "Maintenance Expense", dr: i.annualMaintenance }] : []),
                ...(i.annualEnergyCost != null && i.annualEnergyCost > 0 ? [{ account: "Energy Expense", dr: i.annualEnergyCost }] : []),
                { account: "Cash / Accounts Payable", cr: c.annualOpex },
              ],
            }]
          : []),
      ],
      statements: [
        { statement: "Statement of financial position", effect: `Asset +${aed(i.purchaseCost)} at acquisition, reducing by ${depLabel} per year.` },
        { statement: "Income statement", effect: `Annual accounting expense ${aedOpt(c.annualExpenseIS)} (depreciation ${depLabel} + cash opex ${aedOpt(c.annualOpex)}).` },
        { statement: "Cash flow statement", effect: `Investing outflow ${aed(i.purchaseCost)} in year 0; operating outflow ${aedOpt(c.annualCashOut)} per year. Depreciation is non-cash.` },
      ],
    },
    financial: [
      { label: `Cost per ${i.unitLabel.replace(/s$/, "")}`, value: aedOpt(c.costPerUnit) },
      { label: "Annual depreciation", value: depLabel, hint: "Non-cash; not a cash outflow" },
      { label: "Annual cash operating cost", value: aedOpt(c.annualOpex), hint: "Maintenance + energy, cash" },
      { label: "Annual accounting expense", value: aedOpt(c.annualExpenseIS), hint: "Depreciation plus cash operating cost" },
      { label: `Gross TCO (${numOpt(L)} years)`, value: aedOpt(c.tcoGross), hint: "Initial investment plus cash operating cost over useful life" },
      { label: "TCO net of residual", value: aedOpt(c.tcoNet), hint: "Assumed end-of-life residual, not a year-0 cash inflow" },
      { label: "Assumed residual value", value: aedOpt(i.residualValue), hint: "End-of-life assumption, not cash today" },
    ],
    audit: {
      items: [
        { risk: "Unauthorised or non-compliant procurement", control: "Inspect approval matrix and tender committee sign-off.", substantive: "Vouch the recorded amount to approved budget and quotations." },
        { risk: "Payment for goods not received", control: "Test three-way match of PO, invoice and receipt.", substantive: `Agree ${aed(i.purchaseCost)} to PO and payment records.` },
        { risk: "Existence of equipment", control: "Review asset tagging and data-hall access logs.", substantive: `Physically verify a sample of the ${numOpt(i.units)} ${i.unitLabel}.` },
        { risk: "Incorrect capitalisation (cloud vs asset)", control: "Review capitalisation policy application.", substantive: "Separate hardware from cloud subscriptions and training." },
        { risk: "Misstated depreciation", control: "Review useful-life policy approval.", substantive: `Recalculate: expected ${depLabel} per year.` },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        i.residualValue != null && i.purchaseCost > 0 && i.residualValue / i.purchaseCost > 0.3
          ? "Flag for review: residual value above 30% of cost may require supporting evidence."
          : "Residual value assumption is within a typical illustrative range, or is not recorded.",
        ...c.issues,
      ],
      actions: [
        "Document the recognition criteria and the capital vs expense split.",
        "Reconcile the asset or licence register to the general ledger.",
        c.hasEnergy ? "Replace illustrative kWh with metered data before any reported emissions figure." : "Record whether energy use is in scope for this asset.",
      ],
    },
    sustainability: c.hasEnergy
      ? {
          headline: [
            {
              label: "Estimated annual electricity-related emissions",
              value: formatTco2e(c.annualTco2e) ?? "Not calculated",
              hint: "From assumed consumption, not an emissions reduction",
            },
            {
              label: "Estimated annual electricity",
              value: formatEnergyKwh(i.annualKwh) ?? "Not calculated",
              hint: "Assumption — not a metered reading",
            },
          ],
          notice:
            "Illustrative estimate based on assumed electricity consumption and an illustrative grid factor. Not metered or independently verified.",
          method: [
            `Electricity-related emissions = ${numOpt(i.annualKwh)} kWh × ${i.emissionsFactorKgPerKwh} ${i.emissionsFactorUnit} ÷ 1,000 = ${formatTco2e(c.annualTco2e) ?? "Not calculated"}.`,
            "This is consumption-based. It is not an avoided-emissions figure, because no documented baseline reduction is recorded.",
          ],
          limitations: [
            "Estimated impact, not measured results. The grid factor is illustrative.",
            "Actual energy depends on utilisation, idle power and cooling allocation.",
          ],
          reporting: S1S2,
        }
      : {
          headline: [{ label: "Emissions estimate", value: "Not calculated", hint: "No energy assumption" }],
          method: ["No electricity use was recorded for this item, so no tCO₂e figure is produced."],
          limitations: ["Do not infer a zero-emission outcome from a missing input."],
          reporting: S1S2,
        },
    integrated: {
      financial: `${aedOpt(c.tcoGross)} TCO; ${aedOpt(c.annualOpex)} annual cash opex.`,
      accounting: `Capitalise ${aed(i.purchaseCost)} if criteria met; ${depLabel} / yr non-cash.`,
      audit: "Existence, capitalisation split and recalculation are key.",
      climate: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2e) ?? "Not calculated"} / yr electricity-related (estimate)` : "Emissions not calculated.",
    },
    recommendations: [
      "Approve recognition only after the applicable framework and capitalisation policy are confirmed.",
      "Keep cloud subscriptions and training costs out of the hardware / licence asset.",
      c.hasEnergy ? "Track metered kWh before using emissions in any external report." : "Decide whether energy is in scope.",
    ],
    questions: [
      "Which accounting framework (IFRS, IPSAS, cash-basis) does the entity apply?",
      `Is the ${numOpt(L)}-year useful life consistent with replacement policy?`,
      "What evidence supports residual value and the capital / expense split?",
    ],
  };
}

function efficiencyView(tx: Transaction, i: EfficiencyAssumptions): View {
  const c = calcEfficiency(i);
  const pb = c.payback === null ? "Not achieved" : `${num(c.payback, 1)} years`;
  return {
    summary: `${tx.title}: ${aed(i.investment)} with forecast energy-cost savings of ${aed(i.annualSavingsForecast)} / yr (not realised) and simple payback ${pb}.`,
    capability: "full",
    capabilityNote: "Payback, depreciation and estimated emissions reduction (forecast) update with these assumptions.",
    trace: [
      { step: "Upgrade", detail: `${aed(i.investment)} cash outflow` },
      { step: "Capex vs maintenance", detail: "Qualifying equipment may be capitalised" },
      { step: "Savings & depreciation", detail: `${aedOpt(c.netAnnual)} net cash; ${aedOpt(c.annualDep)} dep. / yr` },
      { step: "Audit procedures", detail: "Completion, commissioning, savings verification" },
      { step: "Estimated emissions reduction", detail: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2eAvoided) ?? "Not calculated"} / yr (forecast)` : "Not calculated" },
      { step: "Decision report", detail: `Payback ${pb}` },
    ],
    accounting: {
      standard: "IAS 16 / IPSAS 17: capital vs maintenance expenditure (illustrative)",
      points: [
        "Replacement components that enhance service potential (for example cooling plant or controls) may be recognised as PPE.",
        "Repairs that restore rather than enhance the asset are expensed.",
        `Illustrative depreciation: ${aed(i.investment)} ÷ ${i.usefulLife} years = ${aedOpt(c.annualDep)} per year (nil residual assumed).`,
        "Energy-cost savings are not income; they reduce future utility expense.",
      ],
      journals: [
        { label: "On installation (qualifying equipment)", lines: [{ account: "Building / Cooling Equipment (PPE)", dr: i.investment }, { account: "Cash / Accounts Payable", cr: i.investment }] },
        ...(c.annualDep != null
          ? [{ label: "Annual depreciation", lines: [{ account: "Depreciation Expense", dr: c.annualDep }, { account: "Accumulated Depreciation – Equipment", cr: c.annualDep }] }]
          : []),
        ...(i.annualMaintenance != null
          ? [{ label: "Annual maintenance", lines: [{ account: "Repairs & Maintenance Expense", dr: i.annualMaintenance }, { account: "Cash / Accounts Payable", cr: i.annualMaintenance }] }]
          : []),
      ],
      statements: [
        { statement: "Statement of financial position", effect: `PPE +${aed(i.investment)}, reducing by ${aedOpt(c.annualDep)} per year.` },
        { statement: "Income statement", effect: `Lower utility expense of ${aed(i.annualSavingsForecast)} (forecast), offset by maintenance ${aedOpt(i.annualMaintenance)} and depreciation ${aedOpt(c.annualDep)}: net ${aedOpt(c.netIncomeEffect)} / yr.` },
        { statement: "Cash flow statement", effect: `Investing outflow ${aed(i.investment)}; estimated operating cash improvement ${aedOpt(c.netAnnual)} / yr.` },
      ],
    },
    financial: [
      { label: "Forecast annual energy-cost savings", value: aed(i.annualSavingsForecast), hint: "Forecast, not realised" },
      { label: "Realised annual savings", value: aedOpt(i.annualSavingsRealised), hint: "Not inferred from forecast" },
      { label: "Annual maintenance", value: aedOpt(i.annualMaintenance) },
      { label: "Net annual operating savings", value: aedOpt(c.netAnnual), hint: "Cash, estimated" },
      { label: "Simple payback", value: pb },
      { label: `${numOpt(i.horizonYears)}-year net forecast savings`, value: aedOpt(c.horizonNet), hint: "After recovering investment (forecast)" },
      { label: "Annual depreciation", value: aedOpt(c.annualDep), hint: "Non-cash" },
    ],
    audit: {
      items: [
        { risk: "Unapproved project or scope", control: "Inspect project approval and budget authorisation.", substantive: "Agree contract value to the approved business case." },
        { risk: "Payment for incomplete work", control: "Test milestone-payment controls.", substantive: "Vouch invoices to completion certificates." },
        { risk: "Overstated savings claims", control: "Review the measurement and verification plan.", substantive: `Treat ${aed(i.annualSavingsForecast)} as a forecast until metered.` },
        { risk: "Incorrect capitalisation", control: "Review capitalisation policy.", substantive: "Split invoices between capital components and maintenance." },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        c.payback === null
          ? "Flag for review: estimated savings do not exceed maintenance, so the investment case is not supported on these assumptions."
          : i.usefulLife != null && c.payback > i.usefulLife
            ? "Flag for review: payback exceeds the useful life of the equipment."
            : "Payback falls within the assumed useful life.",
      ],
      actions: [
        "Establish a baseline consumption period before savings are claimed.",
        "Separate capital and maintenance components in contractor invoices.",
        "Schedule a post-implementation review after 12 months of metered data.",
      ],
    },
    sustainability: {
      headline: [
        {
          label: "Estimated annual energy saved",
          value: formatEnergyKwh(i.annualKwhReductionForecast) ?? "Not calculated",
          hint: "Depends on achieving the forecast reduction",
        },
        {
          label: "Estimated annual emissions reduction",
          value: formatTco2e(c.annualTco2eAvoided) ?? "Not calculated",
          hint: "Forecast only — not measured or verified",
        },
        ...(c.netAnnual != null
          ? [
              {
                label: "Estimated annual financial saving",
                value: aed(c.netAnnual),
                hint: "Financial estimate, not an environmental metric",
              },
            ]
          : []),
      ],
      notice:
        "Illustrative forecast based on assumed energy savings and an illustrative grid factor. Not measured or independently verified.",
      method: c.hasEnergy
        ? [
            `Estimated emissions reduction (forecast) = ${numOpt(i.annualKwhReductionForecast)} kWh × ${i.emissionsFactorKgPerKwh} ${i.emissionsFactorUnit} ÷ 1,000.`,
            "Financial saving (if shown) = forecast operating saving − annual maintenance, from the financial assumptions — not an emissions figure.",
            "This is a forecast reduction against assumed consumption, not a carbon credit, offset, or measured result.",
          ]
        : ["No kWh reduction was recorded, so an emissions reduction is not calculated."],
      limitations: [
        "Projected savings depend on the upgrade achieving the forecast energy reduction.",
        "Grid factor is illustrative — not a measured inventory or independently verified result.",
        "No refrigerant leakage modelled.",
        "Ten-year cumulative emissions and CapEx per tonne remain in the calculation layer and are not shown on the primary display.",
      ],
      reporting: S1S2,
    },
    integrated: {
      financial: `${aedOpt(c.netAnnual)} estimated net annual saving; payback ${pb}.`,
      accounting: `Capitalise qualifying equipment; ${aedOpt(c.annualDep)} annual depreciation.`,
      audit: "Completion evidence and savings verification are key.",
      climate: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2eAvoided) ?? "Not calculated"} / yr estimated reduction (forecast)` : "Emissions not calculated.",
    },
    recommendations: [
      c.payback !== null && i.usefulLife != null && c.payback <= i.usefulLife
        ? "On these assumptions, estimated payback falls within useful life. Still verify with metered data."
        : "Re-scope or challenge savings assumptions: payback is not achieved within useful life.",
      "Install sub-metering before claiming energy or emissions benefits.",
      "Report the estimated emissions reduction as a forecast until verified.",
    ],
    questions: [
      "Which components meet capitalisation criteria versus maintenance?",
      "What baseline period supports the estimated savings?",
      "Which grid emission factor source will be used if the figure is reported?",
    ],
  };
}

function serviceView(tx: Transaction, i: ServiceAssumptions): View {
  const c = calcService(i);
  return {
    summary: `${tx.title}: ${aedOpt(c.totalCommit)} committed over ${c.term} years (${aed(i.annualCost)} / yr). Treated as operating expenditure in this prototype.`,
    capability: "full",
    capabilityNote: "Term commitment is calculated. No depreciation is applied because no on-premise asset is assumed.",
    trace: [
      { step: "Service commitment", detail: `${aedOpt(c.totalCommit)} over ${c.term} years` },
      { step: "Accounting view", detail: "Expense as incurred (illustrative)" },
      { step: "No PPE recognition", detail: "Cloud capacity is not capitalised as hardware" },
      { step: "Audit procedures", detail: "Contract, usage vs commit, related-party / tender" },
      { step: "Emissions", detail: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2e) ?? "Not calculated"} / yr (estimate)` : "Not calculated. No kWh assumption." },
      { step: "Decision report", detail: `Annual cash ${aed(i.annualCost)}` },
    ],
    accounting: {
      standard: "Cloud computing arrangements, typically expensed (illustrative; not a full IFRIC agenda decision engine)",
      points: [
        "A cloud GPU or model-hosting contract generally does not create PPE. Fees are expensed as the service is received.",
        "A prepayment may be recognised if payment is made before the service period, then released to expense.",
        "Do not depreciate this commitment as if it were an owned server.",
        `Illustrative annual expense: ${aed(i.annualCost)}. Total recorded commitment: ${aedOpt(c.totalCommit)}.`,
      ],
      journals: [
        {
          label: "Annual service cost (illustrative)",
          lines: [
            { account: "Cloud AI Services Expense", dr: i.annualCost },
            { account: "Cash / Accounts Payable", cr: i.annualCost },
          ],
        },
      ],
      statements: [
        { statement: "Statement of financial position", effect: "No PPE recognised for the cloud service itself. A prepayment asset only if paid in advance." },
        { statement: "Income statement", effect: `Operating expense ${aed(i.annualCost)} per year (illustrative).` },
        { statement: "Cash flow statement", effect: `Operating outflow ${aed(i.annualCost)} per year.` },
      ],
    },
    financial: [
      { label: "Annual service cost", value: aed(i.annualCost), hint: "Cash opex" },
      { label: "Contract term", value: `${numOpt(c.term)} years` },
      { label: "Total commitment", value: aedOpt(c.totalCommit) },
      { label: "Unit cost", value: aedOpt(c.unitCost), hint: "Only if a valid workload/user denominator is recorded" },
      { label: "Hardware depreciation", value: "Not applied" },
    ],
    audit: {
      items: [
        { risk: "Commitment not authorised", control: "Inspect contract approval and budget cover.", substantive: `Agree ${aedOpt(c.totalCommit)} to the signed schedule of services.` },
        { risk: "Paying for unused capacity", control: "Review utilisation reporting against reserved capacity.", substantive: "Compare invoices to consumption statements." },
        { risk: "Misclassification as PPE", control: "Review capitalisation policy for cloud arrangements.", substantive: "Confirm no hardware asset has been recognised for this contract." },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        "Flag if invoices include perpetual software that should be assessed separately under IAS 38.",
      ],
      actions: [
        "Retain the contract, data-residency terms and exit provisions.",
        "Monitor utilisation against reserved capacity before renewal.",
      ],
    },
    sustainability: {
      headline: c.hasEnergy
        ? [
            {
              label: "Estimated annual emissions",
              value: formatTco2e(c.annualTco2e) ?? "Not calculated",
              hint: "Only where an annual kWh assumption is recorded",
            },
          ]
        : [{ label: "Emissions estimate", value: "Not calculated", hint: "No kWh assumption" }],
      ...(c.hasEnergy
        ? {
            notice:
              "Illustrative forecast based on assumed energy use and an illustrative grid factor. Not measured or independently verified.",
          }
        : {}),
      method: c.hasEnergy
        ? [`${numOpt(i.estimatedAnnualKwh)} kWh × ${i.emissionsFactorKgPerKwh} kgCO₂e/kWh ÷ 1,000.`]
        : ["Supplier location-based factors would be required for a reported figure."],
      limitations: ["Cloud emissions cannot be inferred from contract value alone."],
      reporting: S1S2,
    },
    integrated: {
      financial: `${aedOpt(c.totalCommit)} ${numOpt(c.term)}-year opex commitment.`,
      accounting: "Expense as a service; do not capitalise as GPU hardware.",
      audit: "Authorisation, utilisation and classification are key.",
      climate: c.hasEnergy ? `≈ ${formatTco2e(c.annualTco2e) ?? "Not calculated"} / yr (estimate)` : "Emissions not calculated.",
    },
    recommendations: [
      "Keep this item in operating expenditure unless a distinct software asset is identified.",
      "Compare reserved versus used capacity before extending the term.",
    ],
    questions: [
      "Is any portion a separately identifiable software licence?",
      "What utilisation evidence will be reviewed at renewal?",
    ],
  };
}

function softwareView(tx: Transaction, i: SoftwareAssumptions): View {
  const c = calcSoftware(i);
  return {
    summary: `${tx.title}: initial licence ${aed(i.initialLicence)}; recurring maintenance ${aedOpt(i.annualMaintenance)}; subscription ${aedOpt(i.annualSubscription)}. Capitalisation requires case-specific review.`,
    capability: "full",
    capabilityNote: "Licence, subscription, maintenance and implementation are separated. Hardware depreciation is not applied. Capitalisation is not auto-determined.",
    trace: [
      { step: "Initial licence", detail: aed(i.initialLicence) },
      { step: "Implementation", detail: aedOpt(i.implementationCost) },
      { step: "Recurring", detail: `Subscription ${aedOpt(i.annualSubscription)} · maintenance ${aedOpt(i.annualMaintenance)}` },
      { step: "Accounting treatment", detail: "Requires review. Not auto-capitalised." },
      { step: "Depreciation", detail: "Not applied to this software record" },
      { step: "Decision report", detail: aedOpt(c.initialCash) },
    ],
    accounting: {
      standard: "IAS 38 / IPSAS 31 and cloud-arrangement guidance. Treatment depends on the contract (not auto-determined).",
      points: [
        "A software licence is not automatically a capital asset. Perpetual licences, SaaS access, and hybrid contracts can require different treatments.",
        "This prototype does not determine capitalisation. The recorded assumption is: requires review.",
        `Initial licence cash: ${aed(i.initialLicence)}. Implementation ${aedOpt(i.implementationCost)} is shown separately and included in recorded amount only when entered.`,
        `Recurring subscription ${aedOpt(i.annualSubscription)} and maintenance ${aedOpt(i.annualMaintenance)} are operating expenditure when incurred.`,
        "Do not depreciate this item as GPU hardware.",
      ],
      journals: [
        {
          label: "Illustrative, if expensed as incurred (not a determination)",
          lines: [
            { account: "Software / Licence Expense", dr: i.initialLicence },
            { account: "Cash / Accounts Payable", cr: i.initialLicence },
          ],
        },
        ...(i.annualMaintenance != null
          ? [{
              label: "Annual maintenance (opex)",
              lines: [
                { account: "Software Maintenance Expense", dr: i.annualMaintenance },
                { account: "Cash / Accounts Payable", cr: i.annualMaintenance },
              ],
            }]
          : []),
      ],
      statements: [
        { statement: "Statement of financial position", effect: "No automatic intangible asset. Recognise one only if the contract and policy support it." },
        { statement: "Income statement", effect: `Licence ${aed(i.initialLicence)} may be expense or amortisation depending on review; maintenance ${aedOpt(i.annualMaintenance)} is typically opex.` },
        { statement: "Cash flow statement", effect: `Initial cash ${aedOpt(c.initialCash)}; recurring cash ${aedOpt(c.recurringAnnual)} / yr.` },
      ],
    },
    financial: [
      { label: "Initial licence", value: aed(i.initialLicence), hint: "Cash" },
      { label: "Implementation / integration", value: aedOpt(i.implementationCost) },
      { label: "Annual subscription", value: aedOpt(i.annualSubscription), hint: "Recurring opex" },
      { label: "Annual maintenance & support", value: aedOpt(i.annualMaintenance), hint: "Recurring opex" },
      { label: "Hardware depreciation", value: "Not applied" },
      { label: "Capitalisation treatment", value: "Requires case-specific review" },
    ],
    audit: {
      items: [
        { risk: "Misclassifying SaaS as an intangible asset", control: "Review the contract against the capitalisation policy.", substantive: "Inspect whether the entity controls the software or only a right of access." },
        { risk: "Bundled implementation capitalised in error", control: "Review cost codes for implementation vs licence.", substantive: `Agree maintenance ${aedOpt(i.annualMaintenance)} to the support schedule.` },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        "Unresolved: accounting treatment of this licence has not been determined by MIZAN AI.",
      ],
      actions: [
        "Obtain a contract extract and apply the entity's intangible-asset and cloud-arrangement policy.",
        "Keep recurring subscriptions out of any asset register unless criteria are met.",
      ],
    },
    sustainability: {
      headline: [{ label: "Emissions estimate", value: "Not calculated", hint: "No activity data" }],
      method: ["Software licences do not carry a default energy model in this prototype."],
      limitations: ["Do not infer a climate outcome from licence value."],
      reporting: S1S2,
    },
    integrated: {
      financial: `Licence ${aed(i.initialLicence)}; recurring ${aedOpt(c.recurringAnnual)} / yr.`,
      accounting: "Capitalisation requires review. Not auto-posted as an intangible.",
      audit: "Contract classification is the key procedure.",
      climate: "Emissions not calculated.",
    },
    recommendations: [
      "Do not assume IFRS capitalisation of this licence.",
      "Separate implementation, subscription and maintenance in the contract file.",
    ],
    questions: [
      "Does the entity control the software or only access a supplier's cloud service?",
      "Is any portion a distinct perpetual licence?",
    ],
  };
}

function trainingView(tx: Transaction, i: TrainingAssumptions): View {
  const c = calcTraining(i);
  return {
    summary: `${tx.title}: ${num(c.plannedParticipants)} planned participants × ${aedOpt(c.costPerParticipant)} = ${aedOpt(c.total)}, over ${numOpt(c.durationMonths)} months. Planned completion ${numOpt(c.plannedCompletionRatePct)}% (target, not achieved).`,
    capability: "full",
    capabilityNote: "Total cost is calculated from participants and rate. Training is expensed; no depreciation is applied.",
    trace: [
      { step: "Programme cost", detail: aedOpt(c.total) },
      { step: "Accounting view", detail: "Expense as incurred" },
      { step: "Workforce target", detail: `${numOpt(c.plannedCompletionRatePct)}% planned completion` },
      { step: "Audit procedures", detail: "Attendance, procurement of provider, cost per head" },
      { step: "Sustainability", detail: "No emissions model for classroom or virtual delivery in this pass" },
      { step: "Decision report", detail: `${num(c.plannedParticipants)} planned participants` },
    ],
    accounting: {
      standard: "Training costs generally expensed as incurred (IAS 38 prohibits most internally generated skills as assets)",
      points: [
        "Employee training does not create a recognisable intangible asset under typical IFRS / IPSAS treatments.",
        `Illustrative programme cost: ${num(c.plannedParticipants)} × ${aedOpt(c.costPerParticipant)} = ${aedOpt(c.total)}.`,
        "If the provider is prepaid, a prepayment is released as sessions are delivered.",
        "Do not capitalise training as part of GPU or software assets except for directly attributable costs that meet a specific recognition policy. None are assumed here.",
      ],
      journals: [
        {
          label: "Programme cost (illustrative, as delivered)",
          lines: [
            { account: "Training & Development Expense", dr: c.total ?? 0 },
            { account: "Cash / Accounts Payable", cr: c.total ?? 0 },
          ],
        },
      ],
      statements: [
        { statement: "Statement of financial position", effect: "No PPE or intangible asset for workforce skills." },
        { statement: "Income statement", effect: `Operating expense ${aedOpt(c.total)} over the programme (illustrative).` },
        { statement: "Cash flow statement", effect: `Operating outflow ${aedOpt(c.total)}.` },
      ],
    },
    financial: [
      { label: "Planned participants", value: num(c.plannedParticipants), hint: "Not actual enrolment" },
      { label: "Actual enrolment", value: numOpt(c.actualEnrolment), hint: "Not recorded unless evidenced" },
      { label: "Cost per planned participant", value: aedOpt(c.costPerParticipant) },
      { label: "Cost per completed participant", value: aedOpt(c.costPerCompleted), hint: "Only if actual completions recorded" },
      { label: "Programme cost", value: aedOpt(c.total) },
      { label: "Planned completion rate", value: `${numOpt(c.plannedCompletionRatePct)}%`, hint: "Target, not achieved" },
      { label: "Actual completion rate", value: c.actualCompletionRatePct == null ? "Not calculated" : `${num(c.actualCompletionRatePct, 1)}%` },
    ],
    audit: {
      items: [
        { risk: "Training procured without approval", control: "Inspect learning-budget approval.", substantive: `Agree ${aedOpt(c.total)} to the approved programme paper.` },
        { risk: "Paying for unattended places", control: "Review attendance and completion records.", substantive: "Sample participants against the planned headcount." },
        { risk: "Capitalising training into an AI asset", control: "Review cost-collection codes.", substantive: "Confirm training is coded to expense." },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        "Completion percentage is a planned target. Do not treat it as an achieved outcome.",
      ],
      actions: [
        "Define completion evidence (assessment, attendance, manager confirmation).",
        "Keep training invoices out of the GPU / software asset register.",
      ],
    },
    sustainability: {
      headline: [{ label: "Emissions estimate", value: "Not modelled", hint: "Out of scope this pass" }],
      method: ["No travel or platform-energy model is attached to training records in this prototype."],
      limitations: ["Workforce programmes can have travel and digital-delivery impacts; they are not quantified here."],
      reporting: S1S2,
    },
    integrated: {
      financial: `${aedOpt(c.total)} operating programme cost.`,
      accounting: "Expense training; do not recognise an AI skills asset.",
      audit: "Attendance, approval and coding are key.",
      climate: "Emissions not modelled for this type.",
    },
    recommendations: [
      "Treat completion and any productivity claims as targets until evidenced.",
      "Link this programme to the related AI tools so benefit realisation can be reviewed later.",
    ],
    questions: [
      "What evidence will count as completion?",
      "Are travel or venue costs included in the recorded amount?",
    ],
  };
}

function pilotView(tx: Transaction, i: PilotAssumptions): View {
  const c = calcPilot(i);
  return {
    summary: `${tx.title}: recorded envelope ${aedOpt(c.total)} (capex estimate ${aed(c.capexEstimate)}, opex estimate ${aed(c.opexEstimate)}). Benefits are planned targets only.`,
    capability: "limited",
    capabilityNote:
      "This investment type records the envelope and planned targets. Connected depreciation, payback and emissions engines are not applied, to avoid misleading figures.",
    trace: [
      { step: "Recorded envelope", detail: aedOpt(c.total) },
      { step: "Indicative split", detail: `Capex ${aed(c.capexEstimate)} · Opex ${aed(c.opexEstimate)}` },
      { step: "Target users", detail: `${num(c.targetUsers)} (target, not active)` },
      { step: "Benefit statement", detail: "Planned, not measured" },
      { step: "Analysis engine", detail: "Limited for this type" },
      { step: "Decision report", detail: TYPE_LABEL[tx.type] },
    ],
    accounting: {
      standard: "Mixed programme. Classification depends on the underlying contracts (not auto-journalised).",
      points: [
        "A pilot or adoption programme usually mixes configuration, licences, change management and operating support.",
        "This prototype does not auto-post a full journal set, because a single envelope can span several recognition treatments.",
        `Indicative split recorded by the user: capex ${aed(c.capexEstimate)}, opex ${aed(c.opexEstimate)}.`,
        "Until contracts are split, treat these amounts as a planning envelope, not as audited classification.",
      ],
      journals: [],
      statements: [
        { statement: "Statement of financial position", effect: "Not auto-generated. Depends on which contracts meet asset criteria." },
        { statement: "Income statement", effect: `Opex estimate ${aed(c.opexEstimate)} would typically be expensed as incurred.` },
        { statement: "Cash flow statement", effect: `Total envelope ${aedOpt(c.total)} across investing and operating, pending split.` },
      ],
    },
    financial: [
      { label: "Recorded envelope", value: aedOpt(c.total) },
      { label: "Capex estimate", value: aed(c.capexEstimate), hint: "Indicative" },
      { label: "Opex estimate", value: aed(c.opexEstimate), hint: "Indicative" },
      { label: "Target users", value: num(c.targetUsers), hint: "Target, not active" },
      { label: "Active users", value: numOpt(c.activeUsers), hint: "Not inferred from target" },
      { label: "Expected benefits (AED)", value: aedOpt(c.expectedBenefitAed), hint: "Forecast" },
      { label: "Realised benefits (AED)", value: aedOpt(c.realisedBenefitAed), hint: "Not inferred from forecast" },
      { label: "Cost per active user", value: aedOpt(c.costPerActiveUser) },
    ],
    audit: {
      items: [
        { risk: "Pilot scaled before quality gates", control: "Inspect stage-gate approval.", substantive: "Confirm go/no-go criteria are documented." },
        { risk: "Benefit claims treated as results", control: "Review benefit-realisation plan.", substantive: "Check that planned targets are not reported as achieved outcomes." },
        { risk: "Envelope not mapped to contracts", control: "Review cost breakdown.", substantive: "Agree capex and opex estimates to underlying POs when available." },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        "Unresolved: full journal and emissions analysis is not available for this investment type in the current prototype.",
      ],
      actions: [
        "Split the envelope into contracts before capitalisation decisions.",
        "Keep planned benefit text labelled as a target until evidenced.",
      ],
    },
    sustainability: {
      headline: [{ label: "Emissions estimate", value: "Not calculated", hint: "Unavailable for this type" }],
      method: ["No activity data (kWh, distance, or supplier factor) is attached to this record."],
      limitations: [i.plannedBenefitNote],
      reporting: S1S2,
    },
    integrated: {
      financial: `${aedOpt(c.total)} recorded envelope (indicative mix).`,
      accounting: "Classification pending contract split. Journals not auto-posted.",
      audit: "Stage gates and benefit labelling are key.",
      climate: "Emissions analysis not available for this type.",
    },
    recommendations: [
      "Do not approve scale-up on planned benefits alone.",
      "Commission a contract-level classification before year-end reporting.",
    ],
    questions: [
      "Which contracts sit inside this envelope?",
      "What evidence will convert planned benefits into reported results?",
    ],
  };
}
