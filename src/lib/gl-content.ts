import {
  aed,
  calcBuilding,
  calcVehicle,
  num,
  type BuildingInputs,
  type VehicleInputs,
} from "./greenledger";

export interface Journal {
  label: string;
  lines: { account: string; dr?: number; cr?: number }[];
}
export interface Metric {
  label: string;
  value: string;
  hint?: string;
}
export interface AuditItem {
  risk: string;
  control: string;
  substantive: string;
}
export interface View {
  summary: string;
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
    method: string[];
    limitations: string[];
    reporting: string[];
  };
  integrated: { financial: string; accounting: string; audit: string; climate: string };
  recommendations: string[];
  questions: string[];
}

export function vehicleView(i: VehicleInputs): View {
  const c = calcVehicle(i);
  const L = i.usefulLife;
  return {
    summary: `Purchase of ${i.vehicles} vehicles for ${aed(i.purchaseCost)} (${aed(c.costPerVehicle)} each), depreciated over ${L} years to a residual value of ${aed(i.residualValue)}.`,
    trace: [
      { step: "Purchase transaction", detail: `${aed(i.purchaseCost)} cash outflow` },
      { step: "Asset recognition", detail: `PPE recognised at ${aed(i.purchaseCost)} (IAS 16)` },
      { step: "Depreciation & opex", detail: `${aed(c.annualDep)} dep. + ${aed(c.annualOpex)} opex / yr` },
      { step: "Audit procedures", detail: "Existence, capitalisation, depreciation recalculation" },
      { step: "Fuel emissions", detail: `≈ ${num(c.annualTco2e, 1)} tCO₂e / yr (estimate)` },
      { step: "Decision report", detail: `TCO ${aed(c.tcoGross)} over ${L} yrs` },
    ],
    accounting: {
      standard: "IAS 16 Property, Plant and Equipment (or equivalent IPSAS 17 for public-sector entities)",
      points: [
        "Vehicles may be recognised as PPE when it is probable future economic benefits or service potential will flow to the entity and cost can be measured reliably.",
        `Initial measurement at cost: ${aed(i.purchaseCost)}, including directly attributable costs (registration, delivery) if applicable.`,
        `Straight-line depreciation: (${aed(i.purchaseCost)} − ${aed(i.residualValue)}) ÷ ${L} years = ${aed(c.annualDep)} per year.`,
        `Carrying amount after year 1: ${aed(c.carryingAfterYear1)}; at end of useful life: ${aed(c.closingCarrying)}.`,
        "Maintenance and fuel are day-to-day servicing costs and are expensed as incurred, not capitalised.",
        "Useful life and residual value should be reviewed at least annually; changes are accounted for prospectively.",
      ],
      journals: [
        { label: "On acquisition", lines: [{ account: "Motor Vehicles (PPE)", dr: i.purchaseCost }, { account: "Cash / Accounts Payable", cr: i.purchaseCost }] },
        { label: "Annual depreciation", lines: [{ account: "Depreciation Expense", dr: c.annualDep }, { account: "Accumulated Depreciation – Vehicles", cr: c.annualDep }] },
        { label: "Annual running costs", lines: [{ account: "Vehicle Maintenance Expense", dr: i.annualMaintenance }, { account: "Fuel Expense", dr: i.annualFuel }, { account: "Cash / Accounts Payable", cr: c.annualOpex }] },
      ],
      statements: [
        { statement: "Statement of financial position", effect: `PPE +${aed(i.purchaseCost)} at acquisition, reducing by ${aed(c.annualDep)} per year to ${aed(i.residualValue)}.` },
        { statement: "Income statement", effect: `Annual expense ${aed(c.annualExpenseIS)} (depreciation ${aed(c.annualDep)} + opex ${aed(c.annualOpex)}).` },
        { statement: "Cash flow statement", effect: `Investing outflow ${aed(i.purchaseCost)} in year 0; operating outflow ${aed(c.annualOpex)} per year. Depreciation is non-cash.` },
      ],
    },
    financial: [
      { label: "Cost per vehicle", value: aed(c.costPerVehicle) },
      { label: "Annual depreciation", value: aed(c.annualDep), hint: "Non-cash" },
      { label: "Annual maintenance + fuel", value: aed(c.annualOpex), hint: "Cash" },
      { label: `${L}-year total cost of ownership`, value: aed(c.tcoGross), hint: `Capex + ${L}×opex` },
      { label: "TCO net of residual", value: aed(c.tcoNet) },
      { label: `Lifetime opex vs capex`, value: `${num(c.opexShareOfCapex * 100)}%`, hint: "Operating ÷ initial capex" },
    ],
    audit: {
      items: [
        { risk: "Unauthorised or non-compliant procurement", control: "Inspect approval matrix and tender / procurement committee sign-off.", substantive: "Vouch purchase to approved budget line and competitive quotations." },
        { risk: "Payment for goods not received", control: "Test three-way match of PO, supplier invoice and goods-receipt note.", substantive: `Agree ${aed(i.purchaseCost)} invoice total to PO and payment records.` },
        { risk: "Existence of vehicles", control: "Review fixed-asset register maintenance and asset-tagging controls.", substantive: `Physically verify a sample of the ${i.vehicles} vehicles against chassis numbers.` },
        { risk: "Ownership and completeness of capitalisation", control: "Review registration process controls.", substantive: "Inspect ownership / registration documents; confirm all units capitalised." },
        { risk: "Misstated depreciation", control: "Review useful-life policy approval.", substantive: `Recalculate depreciation: expected ${aed(c.annualDep)} per year.` },
        { risk: "Misclassified or excessive running costs", control: "Review fuel-card and maintenance authorisation controls.", substantive: `Analyse maintenance (${aed(i.annualMaintenance)}) and fuel (${aed(i.annualFuel)}) for unusual items.` },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        i.residualValue / i.purchaseCost > 0.3 ? "Flag for review: residual value above 30% of cost may require supporting evidence." : "Residual value assumption is within a typical illustrative range.",
      ],
      actions: [
        "Document recognition criteria and capitalisation threshold applied.",
        "Reconcile vehicle register to general ledger before year-end.",
        "Implement fuel-card telemetry to support emissions estimates.",
      ],
    },
    sustainability: {
      headline: [
        { label: "Estimated annual emissions", value: `${num(c.annualTco2e, 1)} tCO₂e` },
        { label: `Estimated over ${L} years`, value: `${num(c.lifetimeTco2e, 0)} tCO₂e` },
        { label: "Per vehicle / year", value: `${num(c.tco2ePerVehicle, 2)} tCO₂e` },
        { label: "Fleet distance / year", value: `${num(c.totalKm)} km` },
      ],
      method: [
        `Fleet distance = ${i.vehicles} vehicles × ${num(i.annualKmPerVehicle)} km = ${num(c.totalKm)} km.`,
        `Emissions = distance × illustrative factor ${i.emissionsFactorKgPerKm} kgCO₂e/km ÷ 1,000 = ${num(c.annualTco2e, 1)} tCO₂e.`,
      ],
      limitations: [
        "Estimated impact, not measured results. The emissions factor is illustrative.",
        "Actual emissions depend on vehicle model, load, driving conditions and fuel type.",
        "Use fuel-litre records and a recognised factor source for any reported figure.",
      ],
      reporting: [
        "IFRS S2 (Climate-related Disclosures) could frame Scope 1 fleet emissions as a metric, with transition risk from future fuel pricing or fleet electrification targets.",
        "IFRS S1 could inform disclosure of sustainability-related risks and opportunities affecting fleet cost planning.",
        "These standards do not automatically apply to every government entity; applicability depends on the reporting mandate.",
      ],
    },
    integrated: {
      financial: `${aed(c.tcoGross)} ${L}-yr TCO; ${aed(c.annualOpex)} annual cash opex.`,
      accounting: `Capitalise under IAS 16; ${aed(c.annualDep)} annual depreciation.`,
      audit: "Existence, three-way match and depreciation recalculation are key.",
      climate: `≈ ${num(c.annualTco2e, 1)} tCO₂e per year (estimated).`,
    },
    recommendations: [
      "Approve capitalisation subject to confirmation of recognition criteria.",
      "Evaluate hybrid / EV alternatives on a TCO plus emissions basis before future procurement.",
      "Track actual fuel consumption to replace estimated emissions with measured data.",
    ],
    questions: [
      "Which accounting framework (IFRS, IPSAS, cash-basis) does the entity apply?",
      `Is the ${L}-year useful life consistent with fleet replacement policy?`,
      "What is the source and basis of the residual value estimate?",
    ],
  };
}

export function buildingView(i: BuildingInputs): View {
  const c = calcBuilding(i);
  const pb = c.payback === null ? "Not achieved" : `${num(c.payback, 1)} years`;
  return {
    summary: `Investment of ${aed(i.investment)} in energy-efficiency equipment with estimated savings of ${aed(i.annualSavings)} per year, maintenance of ${aed(i.annualMaintenance)} and a simple payback of ${pb}.`,
    trace: [
      { step: "Upgrade transaction", detail: `${aed(i.investment)} cash outflow` },
      { step: "Capex vs maintenance", detail: "Qualifying equipment capitalised" },
      { step: "Savings & depreciation", detail: `${aed(c.netAnnual)} net saving; ${aed(c.annualDep)} dep. / yr` },
      { step: "Audit procedures", detail: "Completion, commissioning, savings verification" },
      { step: "Emissions avoided", detail: `≈ ${num(c.annualTco2eAvoided, 1)} tCO₂e / yr (estimate)` },
      { step: "Decision report", detail: `Payback ${pb}` },
    ],
    accounting: {
      standard: "IAS 16 / IPSAS 17 — capital vs maintenance expenditure",
      points: [
        "Capital expenditure: new or replacement components (e.g. chillers, LED systems, BMS controls) that provide future service potential may be recognised as PPE.",
        "Maintenance expenditure: repairs and servicing that restore rather than enhance the asset are expensed as incurred.",
        "Qualifying equipment is recognised when future benefits are probable and cost is reliably measurable; replaced components are derecognised.",
        `Illustrative depreciation: ${aed(i.investment)} ÷ ${i.usefulLife} years = ${aed(c.annualDep)} per year (nil residual assumed).`,
        "Energy savings are not recognised as income; they reduce future utility expenses.",
      ],
      journals: [
        { label: "On installation (qualifying equipment)", lines: [{ account: "Building Equipment (PPE)", dr: i.investment }, { account: "Cash / Accounts Payable", cr: i.investment }] },
        { label: "Annual depreciation", lines: [{ account: "Depreciation Expense", dr: c.annualDep }, { account: "Accumulated Depreciation – Equipment", cr: c.annualDep }] },
        { label: "Annual maintenance", lines: [{ account: "Repairs & Maintenance Expense", dr: i.annualMaintenance }, { account: "Cash / Accounts Payable", cr: i.annualMaintenance }] },
      ],
      statements: [
        { statement: "Statement of financial position", effect: `PPE +${aed(i.investment)}, reducing by ${aed(c.annualDep)} per year.` },
        { statement: "Income statement", effect: `Lower utility expense of ${aed(i.annualSavings)}, offset by maintenance ${aed(i.annualMaintenance)} and depreciation ${aed(c.annualDep)}: net effect ${aed(c.netIncomeEffect)} / yr.` },
        { statement: "Cash flow statement", effect: `Investing outflow ${aed(i.investment)}; net operating cash improvement ${aed(c.netAnnual)} / yr. Depreciation is non-cash.` },
      ],
    },
    financial: [
      { label: "Annual energy savings", value: aed(i.annualSavings), hint: "Estimated" },
      { label: "Annual maintenance", value: aed(i.annualMaintenance) },
      { label: "Net annual operating savings", value: aed(c.netAnnual), hint: "Cash" },
      { label: "Simple payback", value: pb },
      { label: `${i.horizonYears}-year net savings`, value: aed(c.horizonNet), hint: "After recovering investment" },
      { label: "Annual depreciation", value: aed(c.annualDep), hint: "Non-cash" },
    ],
    audit: {
      items: [
        { risk: "Unapproved project or scope", control: "Inspect project approval and budget authorisation.", substantive: "Agree contract value to approved business case." },
        { risk: "Payment for incomplete work", control: "Test milestone-payment approval controls.", substantive: "Vouch invoices to completion certificates and site evidence." },
        { risk: "Equipment not installed or not operating", control: "Review commissioning sign-off process.", substantive: "Inspect installation and commissioning records; site visit for a sample." },
        { risk: "Procurement non-compliance", control: "Test tender and payment controls.", substantive: "Review bid evaluation and supplier selection documentation." },
        { risk: "Overstated savings claims", control: "Review M&V (measurement & verification) plan.", substantive: `Compare claimed ${aed(i.annualSavings)} savings with actual utility consumption when available.` },
        { risk: "Incorrect capitalisation", control: "Review capitalisation policy application.", substantive: "Split invoices between capital components and maintenance; test classification." },
      ],
      exceptions: [
        "Illustrative only: no audit has been performed and no exceptions have been identified.",
        c.payback === null ? "Flag for review: estimated savings do not exceed maintenance — the investment case is not supported." : c.payback > i.usefulLife ? "Flag for review: payback exceeds the useful life of the equipment." : "Payback falls within the assumed useful life.",
      ],
      actions: [
        "Establish a baseline consumption period before savings are claimed.",
        "Separate capital and maintenance components in contractor invoices.",
        "Schedule post-implementation review after 12 months of metered data.",
      ],
    },
    sustainability: {
      headline: [
        { label: "Estimated annual reduction", value: `${num(c.annualTco2eAvoided, 1)} tCO₂e` },
        { label: `Over ${i.horizonYears} years`, value: `${num(c.horizonTco2eAvoided, 0)} tCO₂e` },
        { label: "Energy reduction / year", value: `${num(i.annualKwhReduction)} kWh` },
        { label: "Capex per tCO₂e avoided", value: c.costPerTco2e === null ? "n/a" : aed(c.costPerTco2e) },
      ],
      method: [
        `Avoided emissions = ${num(i.annualKwhReduction)} kWh × illustrative grid factor ${i.emissionsFactorKgPerKwh} kgCO₂e/kWh ÷ 1,000 = ${num(c.annualTco2eAvoided, 1)} tCO₂e.`,
        "Capex per tonne = investment ÷ (annual avoided tCO₂e × useful life).",
      ],
      limitations: [
        "Estimated reduction, not a measured or verified outcome.",
        "Grid emission factors vary by year and supplier; the factor used is explicitly illustrative.",
        "Savings depend on occupancy, weather and operational behaviour.",
      ],
      reporting: [
        "IFRS S2 could frame Scope 2 reductions as a metric against an entity's emissions-reduction targets.",
        "IFRS S1 could inform disclosure of the opportunity from reduced energy costs and resilience.",
        "These standards do not automatically apply to every government entity; applicability depends on the reporting mandate.",
      ],
    },
    integrated: {
      financial: `${aed(c.netAnnual)} net annual saving; payback ${pb}.`,
      accounting: `Capitalise qualifying equipment; ${aed(c.annualDep)} annual depreciation.`,
      audit: "Completion evidence and savings verification are key.",
      climate: `≈ ${num(c.annualTco2eAvoided, 1)} tCO₂e avoided per year (estimated).`,
    },
    recommendations: [
      c.payback !== null && c.payback <= i.usefulLife ? "Proceed: estimated payback falls within the equipment's useful life." : "Reconsider or re-scope: estimated payback is not achieved within useful life.",
      "Install sub-metering to evidence actual energy savings.",
      "Report avoided emissions as estimates until verified with metered data.",
    ],
    questions: [
      "Which components meet the capitalisation criteria versus maintenance?",
      "What baseline period supports the estimated savings?",
      "Which grid emission factor source will be used for reporting?",
    ],
  };
}
