import { describe, it, expect } from "vitest";
import { calcVehicle, calcBuilding, DEFAULT_VEHICLE, DEFAULT_BUILDING } from "./greenledger";

describe("vehicle calculations", () => {
  it("straight-line depreciation is (1,000,000 - 100,000) / 5", () => {
    expect(calcVehicle(DEFAULT_VEHICLE).annualDep).toBe(180_000);
  });
  it("useful life change updates depreciation", () => {
    expect(calcVehicle({ ...DEFAULT_VEHICLE, usefulLife: 6 }).annualDep).toBe(150_000);
  });
  it("5-year TCO = capex + 5 x (60k + 100k)", () => {
    expect(calcVehicle(DEFAULT_VEHICLE).tcoGross).toBe(1_800_000);
  });
  it("depreciation is not counted as cash", () => {
    expect(calcVehicle(DEFAULT_VEHICLE).annualCashOut).toBe(160_000);
  });
});

describe("building calculations", () => {
  it("net annual saving = 150k - 20k", () => {
    expect(calcBuilding(DEFAULT_BUILDING).netAnnual).toBe(130_000);
  });
  it("payback = 750k / 130k", () => {
    expect(calcBuilding(DEFAULT_BUILDING).payback).toBeCloseTo(5.769, 2);
  });
  it("10-year net savings = 1.3m - 750k", () => {
    expect(calcBuilding(DEFAULT_BUILDING).horizonNet).toBe(550_000);
  });
  it("no payback when savings do not exceed maintenance", () => {
    expect(calcBuilding({ ...DEFAULT_BUILDING, annualSavings: 20_000 }).payback).toBeNull();
  });
});
