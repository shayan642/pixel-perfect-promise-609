import { createFileRoute } from "@tanstack/react-router";
import { Calculator, LineChart, ShieldCheck, Leaf } from "lucide-react";
import { TxCard, Panel } from "@/components/gl/parts";
import { useGL } from "@/lib/gl-store";
import { calcBuilding, calcVehicle, aed, num } from "@/lib/greenledger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreenLedger AI — Overview" },
      { name: "description", content: "Connected accounting, financial, audit and climate analysis for UAE government transactions (hackathon demo)." },
      { property: "og:title", content: "GreenLedger AI — Overview" },
      { property: "og:description", content: "One transaction. Four perspectives. Better decisions." },
    ],
  }),
  component: Overview,
});

const PERSPECTIVES = [
  { icon: Calculator, t: "Accounting", d: "Recognition, depreciation and journal entries under IAS 16." },
  { icon: LineChart, t: "Financial impact", d: "Cash, expense and carrying-value effects, calculated live." },
  { icon: ShieldCheck, t: "Audit & controls", d: "Risks, control tests and substantive procedures." },
  { icon: Leaf, t: "Climate impact", d: "Estimated emissions with IFRS S1/S2 reporting context." },
];

function Overview() {
  const { vehicle, building } = useGL();
  const v = calcVehicle(vehicle);
  const b = calcBuilding(building);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 uae-pattern lg:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Connected Financial Intelligence</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight lg:text-5xl">
          One transaction. Four perspectives. <span className="text-primary">Better decisions.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A concept platform for UAE government entities that links accounting, financial impact, audit and
          sustainability into a single transaction review.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Transactions in review", "2"],
          ["Combined capital outlay", aed(vehicle.purchaseCost + building.investment)],
          ["Annual depreciation", aed(v.annualDep + b.annualDep)],
          ["Net annual tCO₂e (est.)", num(v.annualTco2e - b.annualTco2eAvoided, 1)],
        ].map(([l, val]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="tnum mt-2 text-xl font-medium">{val}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Demonstration transactions</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <TxCard id="vehicles" />
          <TxCard id="building" />
        </div>
      </div>

      <Panel title="Integrated intelligence">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERSPECTIVES.map((p) => (
            <div key={p.t} className="rounded-xl bg-secondary p-4">
              <p.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">{p.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
