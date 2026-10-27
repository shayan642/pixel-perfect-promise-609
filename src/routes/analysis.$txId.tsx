import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, FileText, Calculator, LineChart, ShieldCheck, Leaf } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart as RLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import { NumField, Panel, TX_IMG } from "@/components/gl/parts";
import { DemoBadge } from "@/components/gl/Shell";
import { useGL } from "@/lib/gl-store";
import { TX_META, aed, calcBuilding, calcVehicle, type TxId } from "@/lib/greenledger";
import { buildingView, vehicleView, type View } from "@/lib/gl-content";

export const Route = createFileRoute("/analysis/$txId")({
  beforeLoad: ({ params }) => {
    if (params.txId !== "vehicles" && params.txId !== "building") throw notFound();
  },
  head: ({ params }) => {
    const t = params.txId === "building" ? TX_META.building.title : TX_META.vehicles.title;
    return {
      meta: [
        { title: `${t} — Integrated Analysis | GreenLedger AI` },
        { name: "description", content: `Accounting, financial, audit and climate analysis for ${t} (synthetic demo).` },
        { property: "og:title", content: `${t} — Integrated Analysis` },
        { property: "og:description", content: "One transaction. Four perspectives." },
      ],
    };
  },
  component: Analysis,
});

const TABS = [
  { id: "accounting", label: "Accounting", icon: Calculator },
  { id: "financial", label: "Financial Impact", icon: LineChart },
  { id: "audit", label: "Audit & Controls", icon: ShieldCheck },
  { id: "sustainability", label: "Sustainability", icon: Leaf },
] as const;
type Tab = (typeof TABS)[number]["id"];

const tickAed = (n: number) => `${Math.round(n / 1000)}k`;
const chartTip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }, formatter: (v: number) => aed(v) };

function Analysis() {
  const txId = Route.useParams().txId as TxId;
  const { vehicle, building, setVehicle, setBuilding } = useGL();
  const [tab, setTab] = useState<Tab>("accounting");
  const view = txId === "vehicles" ? vehicleView(vehicle) : buildingView(building);
  const m = TX_META[txId];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["vehicles", "building"] as const).map((id) => (
          <Link key={id} to="/analysis/$txId" params={{ txId: id }}
            className={`rounded-full border px-4 py-1.5 text-sm ${id === txId ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {TX_META[id].short}
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card md:flex-row">
        <img src={TX_IMG[txId]} alt={m.title} width={1280} height={768} className="h-40 w-full object-cover md:h-auto md:w-72" />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex items-center gap-2"><span className="tnum text-xs text-muted-foreground">{m.ref}</span><DemoBadge /></div>
          <h1 className="text-2xl font-bold">{m.title}</h1>
          <p className="text-sm text-muted-foreground">{view.summary}</p>
          <div className="mt-auto">
            <Link to="/report/$txId" params={{ txId }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <FileText className="h-4 w-4" /> Generate Decision Report
            </Link>
          </div>
        </div>
      </section>

      <Panel title="Connected trace">
        <ol className="flex flex-wrap items-stretch gap-2">
          {view.trace.map((s, i) => (
            <li key={s.step} className="flex items-center gap-2">
              <div className="rounded-xl border border-border bg-secondary px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gold">{i + 1}. {s.step}</p>
                <p className="tnum mt-0.5 text-xs">{s.detail}</p>
              </div>
              {i < view.trace.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
            </li>
          ))}
        </ol>
      </Panel>

      <Integrated view={view} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Panel title="Assumptions" className="h-fit lg:sticky lg:top-6">
          <div className="space-y-3">
            {txId === "vehicles" ? (
              <>
                <NumField label="Purchase cost" suffix="AED" step={10000} value={vehicle.purchaseCost} onChange={(n) => setVehicle({ ...vehicle, purchaseCost: n })} />
                <NumField label="Number of vehicles" value={vehicle.vehicles} onChange={(n) => setVehicle({ ...vehicle, vehicles: n })} />
                <NumField label="Useful life" suffix="years" value={vehicle.usefulLife} onChange={(n) => setVehicle({ ...vehicle, usefulLife: n })} />
                <NumField label="Residual value" suffix="AED" step={10000} value={vehicle.residualValue} onChange={(n) => setVehicle({ ...vehicle, residualValue: n })} />
                <NumField label="Annual maintenance" suffix="AED" step={5000} value={vehicle.annualMaintenance} onChange={(n) => setVehicle({ ...vehicle, annualMaintenance: n })} />
                <NumField label="Annual fuel cost" suffix="AED" step={5000} value={vehicle.annualFuel} onChange={(n) => setVehicle({ ...vehicle, annualFuel: n })} />
                <NumField label="Annual distance per vehicle" suffix="km" step={1000} value={vehicle.annualKmPerVehicle} onChange={(n) => setVehicle({ ...vehicle, annualKmPerVehicle: n })} />
                <NumField label="Emissions factor (illustrative)" suffix="kgCO₂e/km" step={0.01} value={vehicle.emissionsFactorKgPerKm} onChange={(n) => setVehicle({ ...vehicle, emissionsFactorKgPerKm: n })} />
              </>
            ) : (
              <>
                <NumField label="Initial investment" suffix="AED" step={10000} value={building.investment} onChange={(n) => setBuilding({ ...building, investment: n })} />
                <NumField label="Useful life" suffix="years" value={building.usefulLife} onChange={(n) => setBuilding({ ...building, usefulLife: n })} />
                <NumField label="Annual energy-cost savings" suffix="AED" step={5000} value={building.annualSavings} onChange={(n) => setBuilding({ ...building, annualSavings: n })} />
                <NumField label="Annual maintenance" suffix="AED" step={1000} value={building.annualMaintenance} onChange={(n) => setBuilding({ ...building, annualMaintenance: n })} />
                <NumField label="Energy reduction" suffix="kWh/yr" step={10000} value={building.annualKwhReduction} onChange={(n) => setBuilding({ ...building, annualKwhReduction: n })} />
                <NumField label="Grid emissions factor (illustrative)" suffix="kgCO₂e/kWh" step={0.01} value={building.emissionsFactorKgPerKwh} onChange={(n) => setBuilding({ ...building, emissionsFactorKgPerKwh: n })} />
                <NumField label="Analysis horizon" suffix="years" value={building.horizonYears} onChange={(n) => setBuilding({ ...building, horizonYears: n })} />
              </>
            )}
            <p className="pt-2 text-[11px] text-muted-foreground">Synthetic Demo Data. Changes update every perspective and the decision report.</p>
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 sm:grid-cols-4">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
          {tab === "accounting" && <AccountingTab view={view} />}
          {tab === "financial" && <FinancialTab view={view} txId={txId} />}
          {tab === "audit" && <AuditTab view={view} />}
          {tab === "sustainability" && <SustainTab view={view} />}
        </div>
      </div>
    </div>
  );
}

function Integrated({ view }: { view: View }) {
  const items = [
    ["Financial", view.integrated.financial, LineChart],
    ["Accounting", view.integrated.accounting, Calculator],
    ["Key audit risks", view.integrated.audit, ShieldCheck],
    ["Sustainability", view.integrated.climate, Leaf],
  ] as const;
  return (
    <Panel title="Integrated impact summary">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([l, t, Icon]) => (
          <div key={l} className="rounded-xl border-l-2 border-primary bg-secondary p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{l}</p>
            <p className="tnum mt-2 text-sm">{t}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function JournalTable({ j }: { j: View["accounting"]["journals"][number] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gold">{j.label}</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs opacity-70"><th className="py-1 font-medium">Account</th><th className="py-1 text-right font-medium">Dr</th><th className="py-1 text-right font-medium">Cr</th></tr></thead>
        <tbody>
          {j.lines.map((l) => (
            <tr key={l.account} className="border-t border-border">
              <td className={`py-1.5 ${l.cr ? "pl-6" : ""}`}>{l.account}</td>
              <td className="tnum py-1.5 text-right">{l.dr ? aed(l.dr) : ""}</td>
              <td className="tnum py-1.5 text-right">{l.cr ? aed(l.cr) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountingTab({ view }: { view: View }) {
  const a = view.accounting;
  return (
    <div className="space-y-4">
      <Panel title={a.standard}>
        <ul className="space-y-2 text-sm">{a.points.map((p) => <li key={p} className="tnum flex gap-2"><span className="text-primary">•</span>{p}</li>)}</ul>
      </Panel>
      <Panel title="Illustrative journal entries">
        <div className="grid gap-5 xl:grid-cols-3">{a.journals.map((j) => <JournalTable key={j.label} j={j} />)}</div>
      </Panel>
      <Panel title="Effects on financial statements">
        <div className="grid gap-3 md:grid-cols-3">{a.statements.map((s) => (
          <div key={s.statement} className="rounded-xl bg-secondary p-4"><p className="text-sm font-medium">{s.statement}</p><p className="tnum mt-1 text-sm text-muted-foreground">{s.effect}</p></div>
        ))}</div>
      </Panel>
      <p className="text-xs text-muted-foreground">Actual treatment depends on the applicable accounting framework, entity policies and transaction facts.</p>
    </div>
  );
}

function FinancialTab({ view, txId }: { view: View; txId: TxId }) {
  const { vehicle, building } = useGL();
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {view.financial.map((f) => (
          <div key={f.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className="tnum mt-1 text-lg">{f.value}</p>
            {f.hint && <p className="mt-1 text-[11px] text-gold">{f.hint}</p>}
          </div>
        ))}
      </div>
      {txId === "vehicles" ? (
        <Panel title="Carrying amount and annual cash operating cost">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={calcVehicle(vehicle).schedule}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={tickAed} />
                <Tooltip {...chartTip} />
                <Bar dataKey="closing" name="Closing carrying amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dep" name="Depreciation (non-cash)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opex" name="Cash opex" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : (
        <Panel title="Cumulative net cash position and carrying amount">
          <div className="h-72">
            <ResponsiveContainer>
              <RLineChart data={calcBuilding(building).cumulative}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={tickAed} />
                <Tooltip {...chartTip} />
                <ReferenceLine y={0} stroke="var(--gold)" strokeDasharray="4 4" />
                <Line dataKey="cumulative" name="Cumulative net savings" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line dataKey="carrying" name="Carrying amount" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      <p className="text-xs text-muted-foreground">Depreciation is shown as a non-cash expense and is excluded from cash flow totals. Figures are illustrative.</p>
    </div>
  );
}

function AuditTab({ view }: { view: View }) {
  return (
    <div className="space-y-4">
      <Panel title="Risks and suggested procedures">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 pr-4 font-medium">Risk</th><th className="py-2 pr-4 font-medium">Control test</th><th className="py-2 font-medium">Substantive procedure</th></tr></thead>
            <tbody>{view.audit.items.map((a) => (
              <tr key={a.risk} className="border-t border-border align-top">
                <td className="py-2.5 pr-4 font-medium">{a.risk}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">{a.control}</td>
                <td className="tnum py-2.5 text-muted-foreground">{a.substantive}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Identified exceptions"><ul className="space-y-2 text-sm">{view.audit.exceptions.map((e) => <li key={e} className="flex gap-2"><span className="text-gold">!</span>{e}</li>)}</ul></Panel>
        <Panel title="Recommended actions"><ul className="space-y-2 text-sm">{view.audit.actions.map((e) => <li key={e} className="flex gap-2"><span className="text-primary">→</span>{e}</li>)}</ul></Panel>
      </div>
      <p className="text-xs text-muted-foreground">Suggested procedures only. No audit has been performed and no fraud is implied.</p>
    </div>
  );
}

function SustainTab({ view }: { view: View }) {
  const s = view.sustainability;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {s.headline.map((h) => (
          <div key={h.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{h.label}</p><p className="tnum mt-1 text-lg text-primary">{h.value}</p><p className="mt-1 text-[11px] text-gold">Estimate</p>
          </div>
        ))}
      </div>
      <Panel title="Calculation method"><ul className="tnum space-y-2 text-sm">{s.method.map((x) => <li key={x}>{x}</li>)}</ul></Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Reporting context (IFRS S1 / S2)"><ul className="space-y-2 text-sm">{s.reporting.map((x) => <li key={x}>{x}</li>)}</ul></Panel>
        <Panel title="Data limitations"><ul className="space-y-2 text-sm text-muted-foreground">{s.limitations.map((x) => <li key={x}>{x}</li>)}</ul></Panel>
      </div>
    </div>
  );
}
