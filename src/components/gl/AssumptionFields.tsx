import { NumField, TextField } from "@/components/gl/parts";
import { aed, derivedAmount, type Assumptions } from "@/lib/greenledger";
import { PHASE_LABEL, type WorkforceRole } from "@/lib/workforce";

export function AssumptionFields({
  value,
  onChange,
  workforce,
  onWorkforceChange,
}: {
  value: Assumptions;
  onChange: (next: Assumptions) => void;
  workforce?: WorkforceRole[];
  onWorkforceChange?: (next: WorkforceRole[]) => void;
}) {
  const preview = aed(derivedAmount(value));
  return (
    <div className="space-y-3">
      {value.kind === "ppe" && (
        <>
          <NumField label="Initial investment" suffix="AED" step={10000} value={value.purchaseCost} onChange={(n) => onChange({ ...value, purchaseCost: n ?? 0 })} />
          <NumField label="Acquisition cost (breakdown)" suffix="AED" step={10000} optional value={value.acquisitionCost} onChange={(n) => onChange({ ...value, acquisitionCost: n })} />
          <NumField label="Installation cost (breakdown)" suffix="AED" step={10000} optional value={value.installationCost} onChange={(n) => onChange({ ...value, installationCost: n })} />
          <NumField label={`Number of ${value.unitLabel}`} optional value={value.units} onChange={(n) => onChange({ ...value, units: n })} />
          <NumField label="Useful life" suffix="years" optional value={value.usefulLife} onChange={(n) => onChange({ ...value, usefulLife: n })} />
          <NumField label="Residual value" suffix="AED" step={10000} optional value={value.residualValue} onChange={(n) => onChange({ ...value, residualValue: n })} />
          <NumField label="Annual maintenance" suffix="AED" step={1000} optional value={value.annualMaintenance} onChange={(n) => onChange({ ...value, annualMaintenance: n })} />
          <NumField label="Annual energy cost" suffix="AED" step={1000} optional value={value.annualEnergyCost} onChange={(n) => onChange({ ...value, annualEnergyCost: n })} />
          <NumField label="Annual electricity" suffix="kWh" step={10000} optional value={value.annualKwh} onChange={(n) => onChange({ ...value, annualKwh: n })} />
          <NumField label="Grid factor" suffix={value.emissionsFactorUnit} step={0.01} optional value={value.emissionsFactorKgPerKwh} onChange={(n) => onChange({ ...value, emissionsFactorKgPerKwh: n })} />
        </>
      )}
      {value.kind === "efficiency" && (
        <>
          <NumField label="Initial investment" suffix="AED" step={10000} value={value.investment} onChange={(n) => onChange({ ...value, investment: n ?? 0 })} />
          <NumField label="Useful life" suffix="years" optional value={value.usefulLife} onChange={(n) => onChange({ ...value, usefulLife: n })} />
          <NumField label="Forecast annual energy-cost savings" suffix="AED" step={5000} value={value.annualSavingsForecast} onChange={(n) => onChange({ ...value, annualSavingsForecast: n ?? 0 })} />
          <NumField label="Realised annual savings" suffix="AED" step={5000} optional value={value.annualSavingsRealised} onChange={(n) => onChange({ ...value, annualSavingsRealised: n })} />
          <NumField label="Annual maintenance" suffix="AED" step={1000} optional value={value.annualMaintenance} onChange={(n) => onChange({ ...value, annualMaintenance: n })} />
          <NumField label="Forecast energy reduction" suffix="kWh/yr" step={10000} optional value={value.annualKwhReductionForecast} onChange={(n) => onChange({ ...value, annualKwhReductionForecast: n })} />
          <NumField label="Grid factor" suffix={value.emissionsFactorUnit} step={0.01} optional value={value.emissionsFactorKgPerKwh} onChange={(n) => onChange({ ...value, emissionsFactorKgPerKwh: n })} />
          <NumField label="Analysis horizon" suffix="years" optional value={value.horizonYears} onChange={(n) => onChange({ ...value, horizonYears: n })} />
        </>
      )}
      {value.kind === "service" && (
        <>
          <NumField label="Annual service cost" suffix="AED" step={10000} value={value.annualCost} onChange={(n) => onChange({ ...value, annualCost: n ?? 0 })} />
          <NumField label="Contract term" suffix="years" optional value={value.termYears} onChange={(n) => onChange({ ...value, termYears: n })} />
          <NumField label={`Units of work (${value.unitOfWorkLabel})`} optional value={value.unitsOfWork} onChange={(n) => onChange({ ...value, unitsOfWork: n })} />
          <NumField label="Estimated annual electricity" suffix="kWh" step={10000} optional value={value.estimatedAnnualKwh} onChange={(n) => onChange({ ...value, estimatedAnnualKwh: n })} />
          <NumField label="Grid factor" suffix={value.emissionsFactorUnit} step={0.01} optional value={value.emissionsFactorKgPerKwh} onChange={(n) => onChange({ ...value, emissionsFactorKgPerKwh: n })} />
        </>
      )}
      {value.kind === "software" && (
        <>
          <NumField label="Initial licence" suffix="AED" step={10000} value={value.initialLicence} onChange={(n) => onChange({ ...value, initialLicence: n ?? 0 })} />
          <NumField label="Annual subscription" suffix="AED" step={1000} optional value={value.annualSubscription} onChange={(n) => onChange({ ...value, annualSubscription: n })} />
          <NumField label="Annual maintenance & support" suffix="AED" step={1000} optional value={value.annualMaintenance} onChange={(n) => onChange({ ...value, annualMaintenance: n })} />
          <NumField label="Implementation / integration" suffix="AED" step={10000} optional value={value.implementationCost} onChange={(n) => onChange({ ...value, implementationCost: n })} />
          <p className="text-[11px] text-gold">Capitalisation is not automatic. Accounting treatment requires case-specific review.</p>
        </>
      )}
      {value.kind === "training" && (
        <>
          <NumField label="Planned participants" value={value.plannedParticipants} onChange={(n) => onChange({ ...value, plannedParticipants: n ?? 0 })} />
          <NumField label="Actual enrolment" optional value={value.actualEnrolment} onChange={(n) => onChange({ ...value, actualEnrolment: n })} />
          <NumField label="Cost per planned participant" suffix="AED" step={100} value={value.costPerParticipant} onChange={(n) => onChange({ ...value, costPerParticipant: n ?? 0 })} />
          <NumField label="Planned completions" optional value={value.plannedCompletions} onChange={(n) => onChange({ ...value, plannedCompletions: n })} />
          <NumField label="Actual completions" optional value={value.actualCompletions} onChange={(n) => onChange({ ...value, actualCompletions: n })} />
          <NumField label="Programme duration" suffix="months" optional value={value.durationMonths} onChange={(n) => onChange({ ...value, durationMonths: n })} />
          <NumField label="Planned completion rate" suffix="%" optional value={value.plannedCompletionRatePct} onChange={(n) => onChange({ ...value, plannedCompletionRatePct: n })} />
          <NumField label="Trainer capacity" suffix="people" optional value={value.trainerCapacityFte} onChange={(n) => onChange({ ...value, trainerCapacityFte: n })} />
        </>
      )}
      {value.kind === "pilot" && (
        <>
          <NumField label="Capex estimate" suffix="AED" step={10000} value={value.capexEstimate} onChange={(n) => onChange({ ...value, capexEstimate: n ?? 0 })} />
          <NumField label="Opex estimate" suffix="AED" step={10000} value={value.opexEstimate} onChange={(n) => onChange({ ...value, opexEstimate: n ?? 0 })} />
          <NumField label="Implementation cost" suffix="AED" step={10000} optional value={value.implementationCost} onChange={(n) => onChange({ ...value, implementationCost: n })} />
          <NumField label="Support cost" suffix="AED" step={10000} optional value={value.supportCost} onChange={(n) => onChange({ ...value, supportCost: n })} />
          <NumField label="Change-management cost" suffix="AED" step={10000} optional value={value.changeManagementCost} onChange={(n) => onChange({ ...value, changeManagementCost: n })} />
          <NumField label="Target users" value={value.targetUsers} onChange={(n) => onChange({ ...value, targetUsers: n ?? 0 })} />
          <NumField label="Active users" optional value={value.activeUsers} onChange={(n) => onChange({ ...value, activeUsers: n })} />
          <NumField label="Expected benefits" suffix="AED" step={10000} optional value={value.expectedBenefitAed} onChange={(n) => onChange({ ...value, expectedBenefitAed: n })} />
          <NumField label="Realised benefits" suffix="AED" step={10000} optional value={value.realisedBenefitAed} onChange={(n) => onChange({ ...value, realisedBenefitAed: n })} />
          <TextField
            label="Planned benefit note (not a measured result)"
            value={value.plannedBenefitNote}
            onChange={(plannedBenefitNote) => onChange({ ...value, plannedBenefitNote })}
          />
        </>
      )}
      <p className="text-[11px] text-muted-foreground">
        Recorded amount from these assumptions: <span className="tnum text-foreground">{preview}</span>. Empty optional
        fields stay unrecorded and are not treated as zero.
      </p>
      {workforce && onWorkforceChange && (
        <WorkforceFields roles={workforce} onChange={onWorkforceChange} />
      )}
    </div>
  );
}

function WorkforceFields({ roles, onChange }: { roles: WorkforceRole[]; onChange: (next: WorkforceRole[]) => void }) {
  if (!roles.length) {
    return <p className="text-[11px] text-muted-foreground">No occupation-level workforce template for this type.</p>;
  }
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workforce by occupation</p>
      <p className="text-[11px] text-muted-foreground">
        Additional people required is a planning estimate. Do not treat these figures as labour-market statistics.
      </p>
      {roles.map((role, idx) => (
        <div key={role.id} className="rounded-lg border border-border p-2">
          <p className="text-xs font-medium">{role.occupation}</p>
          <p className="text-[10px] text-muted-foreground">
            {PHASE_LABEL[role.phase]} · {role.tenure}
          </p>
          <div className="mt-2">
            <NumField label="Additional people required" optional step={1} value={role.requiredFte} onChange={(n) => patch(idx, { requiredFte: n })} />
          </div>
        </div>
      ))}
    </div>
  );

  function patch(idx: number, p: Partial<WorkforceRole>) {
    onChange(roles.map((r, i) => (i === idx ? { ...r, ...p } : r)));
  }
}
