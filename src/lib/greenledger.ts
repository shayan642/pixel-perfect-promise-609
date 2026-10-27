// GreenLedger AI — Synthetic demo data and connected calculations.
export type TxId = "vehicles" | "building";

export interface VehicleInputs {
  purchaseCost: number;
  vehicles: number;
  usefulLife: number;
  residualValue: number;
  annualMaintenance: number;
  annualFuel: number;
  annualKmPerVehicle: number;
  emissionsFactorKgPerKm: number;
}

export interface BuildingInputs {
  investment: number;
  usefulLife: number;
  annualSavings: number;
  annualMaintenance: number;
  annualKwhReduction: number;
  emissionsFactorKgPerKwh: number;
  horizonYears: number;
}

export const DEFAULT_VEHICLE: VehicleInputs = {
  purchaseCost: 1_000_000,
  vehicles: 10,
  usefulLife: 5,
  residualValue: 100_000,
  annualMaintenance: 60_000,
  annualFuel: 100_000,
  annualKmPerVehicle: 30_000,
  emissionsFactorKgPerKm: 0.25,
};

export const DEFAULT_BUILDING: BuildingInputs = {
  investment: 750_000,
  usefulLife: 10,
  annualSavings: 150_000,
  annualMaintenance: 20_000,
  annualKwhReduction: 400_000,
  emissionsFactorKgPerKwh: 0.4,
  horizonYears: 10,
};

export const TX_META = {
  vehicles: {
    id: "vehicles" as const,
    ref: "DEMO-PO-014",
    title: "Government Motor Vehicle Procurement",
    short: "Vehicle Procurement",
    entity: "Fictional Federal Services Authority",
    date: "27 Oct 2026",
  },
  building: {
    id: "building" as const,
    ref: "DEMO-EN-021",
    title: "Government Building Energy-Efficiency Upgrade",
    short: "Energy-Efficiency Upgrade",
    entity: "Fictional Municipal Facilities Department",
    date: "27 Oct 2026",
  },
};

const pos = (n: number) => (Number.isFinite(n) ? n : 0);

export function calcVehicle(i: VehicleInputs) {
  const life = Math.max(1, pos(i.usefulLife));
  const depreciable = Math.max(0, i.purchaseCost - i.residualValue);
  const annualDep = depreciable / life;
  const schedule = Array.from({ length: Math.ceil(life) }, (_, k) => {
    const year = k + 1;
    const dep = year <= life ? annualDep : 0;
    const opening = i.purchaseCost - annualDep * k;
    const closing = Math.max(i.residualValue, opening - dep);
    return { year, opening, dep, closing, opex: i.annualMaintenance + i.annualFuel };
  });
  const annualOpex = i.annualMaintenance + i.annualFuel;
  const tcoGross = i.purchaseCost + annualOpex * life;
  const tcoNet = tcoGross - i.residualValue;
  const totalKm = i.vehicles * i.annualKmPerVehicle;
  const annualTco2e = (totalKm * i.emissionsFactorKgPerKm) / 1000;
  return {
    costPerVehicle: i.vehicles > 0 ? i.purchaseCost / i.vehicles : 0,
    annualDep,
    depreciable,
    schedule,
    closingCarrying: i.residualValue,
    carryingAfterYear1: i.purchaseCost - annualDep,
    annualOpex,
    annualExpenseIS: annualOpex + annualDep, // income statement
    annualCashOut: annualOpex, // depreciation is non-cash
    tcoGross,
    tcoNet,
    opexShareOfCapex: i.purchaseCost > 0 ? (annualOpex * life) / i.purchaseCost : 0,
    totalKm,
    annualTco2e,
    lifetimeTco2e: annualTco2e * life,
    tco2ePerVehicle: i.vehicles > 0 ? annualTco2e / i.vehicles : 0,
  };
}

export function calcBuilding(i: BuildingInputs) {
  const life = Math.max(1, pos(i.usefulLife));
  const annualDep = i.investment / life;
  const netAnnual = i.annualSavings - i.annualMaintenance;
  const payback = netAnnual > 0 ? i.investment / netAnnual : null;
  const horizon = Math.max(1, pos(i.horizonYears));
  const horizonNet = netAnnual * horizon - i.investment;
  const cumulative = Array.from({ length: Math.ceil(horizon) + 1 }, (_, y) => ({
    year: y,
    cumulative: netAnnual * y - i.investment,
    carrying: Math.max(0, i.investment - annualDep * Math.min(y, life)),
  }));
  const annualTco2eAvoided = (i.annualKwhReduction * i.emissionsFactorKgPerKwh) / 1000;
  return {
    annualDep,
    netAnnual,
    payback,
    horizonNet,
    cumulative,
    netIncomeEffect: netAnnual - annualDep,
    annualTco2eAvoided,
    horizonTco2eAvoided: annualTco2eAvoided * horizon,
    costPerTco2e:
      annualTco2eAvoided > 0 ? i.investment / (annualTco2eAvoided * life) : null,
  };
}

export const aed = (n: number) =>
  "AED " + Math.round(n).toLocaleString("en-US");
export const num = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
