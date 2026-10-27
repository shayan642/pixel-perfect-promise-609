import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer, ArrowLeft } from "lucide-react";
import { useGL } from "@/lib/gl-store";
import { TX_META, aed, type TxId } from "@/lib/greenledger";
import { buildingView, vehicleView } from "@/lib/gl-content";

export const Route = createFileRoute("/report/$txId")({
  beforeLoad: ({ params }) => {
    if (params.txId !== "vehicles" && params.txId !== "building") throw notFound();
  },
  head: ({ params }) => {
    const t = params.txId === "building" ? TX_META.building.title : TX_META.vehicles.title;
    return {
      meta: [
        { title: `Decision Report: ${t} | GreenLedger AI` },
        { name: "description", content: `Print-ready integrated decision report for ${t} (synthetic demo).` },
        { property: "og:title", content: `Decision Report: ${t}` },
        { property: "og:description", content: "Accounting, financial, audit and sustainability in one report." },
      ],
    };
  },
  component: Report,
});

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 border-b border-paper-foreground/20 pb-1 text-lg font-semibold">{n}. {children}</h2>;
}

function Report() {
  const txId = Route.useParams().txId as TxId;
  const { vehicle, building } = useGL();
  const v = txId === "vehicles" ? vehicleView(vehicle) : buildingView(building);
  const m = TX_META[txId];
  const assumptions: [string, string][] =
    txId === "vehicles"
      ? [["Purchase cost", aed(vehicle.purchaseCost)], ["Vehicles", String(vehicle.vehicles)], ["Useful life", `${vehicle.usefulLife} years`], ["Residual value", aed(vehicle.residualValue)], ["Annual maintenance", aed(vehicle.annualMaintenance)], ["Annual fuel", aed(vehicle.annualFuel)], ["Distance / vehicle", `${vehicle.annualKmPerVehicle.toLocaleString()} km`], ["Emissions factor", `${vehicle.emissionsFactorKgPerKm} kgCO₂e/km (illustrative)`]]
      : [["Investment", aed(building.investment)], ["Useful life", `${building.usefulLife} years`], ["Annual savings", aed(building.annualSavings)], ["Annual maintenance", aed(building.annualMaintenance)], ["Energy reduction", `${building.annualKwhReduction.toLocaleString()} kWh/yr`], ["Grid factor", `${building.emissionsFactorKgPerKwh} kgCO₂e/kWh (illustrative)`], ["Horizon", `${building.horizonYears} years`]];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2">
          {(["vehicles", "building"] as const).map((id) => (
            <Link key={id} to="/report/$txId" params={{ txId: id }} className={`rounded-full border px-4 py-1.5 text-sm ${id === txId ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{TX_META[id].short}</Link>
          ))}
        </div>
        <div className="flex gap-2">
          <Link to="/analysis/$txId" params={{ txId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Edit assumptions</Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Printer className="h-4 w-4" />Print / Save PDF</button>
        </div>
      </div>

      <article className="rounded-2xl bg-paper p-8 text-paper-foreground shadow-2xl sm:p-12 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-primary pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">GreenLedger AI · Decision Report</p>
            <h1 className="mt-2 text-2xl font-bold">{m.title}</h1>
            <p className="mt-1 text-sm opacity-70">{m.ref} · {m.entity} · {m.date}</p>
          </div>
          <span className="rounded border border-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">Synthetic Demo Data</span>
        </header>

        <H n={1}>Transaction summary</H>
        <p className="tnum text-sm">{v.summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(v.integrated).map(([k, t]) => (
            <div key={k} className="rounded border border-paper-foreground/15 p-3 text-sm"><p className="text-[11px] uppercase tracking-wider opacity-60">{k}</p><p className="tnum">{t}</p></div>
          ))}
        </div>

        <H n={2}>Accounting treatment</H>
        <p className="mb-2 text-sm font-medium">{v.accounting.standard}</p>
        <ul className="tnum list-disc space-y-1 pl-5 text-sm">{v.accounting.points.map((p) => <li key={p}>{p}</li>)}</ul>
        <div className="mt-4 space-y-4">
          {v.accounting.journals.map((j) => (
            <table key={j.label} className="w-full text-sm">
              <caption className="mb-1 text-left text-xs font-semibold uppercase tracking-wider">{j.label}</caption>
              <tbody>{j.lines.map((l) => (
                <tr key={l.account} className="border-t border-paper-foreground/15">
                  <td className={`py-1 ${l.cr ? "pl-6" : ""}`}>{l.cr ? "Cr " : "Dr "}{l.account}</td>
                  <td className="tnum w-36 py-1 text-right">{l.dr ? aed(l.dr) : ""}</td>
                  <td className="tnum w-36 py-1 text-right">{l.cr ? aed(l.cr) : ""}</td>
                </tr>
              ))}</tbody>
            </table>
          ))}
        </div>
        <ul className="tnum mt-4 space-y-1 text-sm">{v.accounting.statements.map((s) => <li key={s.statement}><strong>{s.statement}:</strong> {s.effect}</li>)}</ul>

        <H n={3}>Financial calculations and assumptions</H>
        <div className="grid gap-6 sm:grid-cols-2">
          <table className="text-sm"><tbody>{assumptions.map(([k, val]) => <tr key={k} className="border-t border-paper-foreground/15"><td className="py-1 pr-4 opacity-70">{k}</td><td className="tnum py-1 text-right">{val}</td></tr>)}</tbody></table>
          <table className="text-sm"><tbody>{v.financial.map((f) => <tr key={f.label} className="border-t border-paper-foreground/15"><td className="py-1 pr-4 opacity-70">{f.label}</td><td className="tnum py-1 text-right font-medium">{f.value}</td></tr>)}</tbody></table>
        </div>

        <H n={4}>Audit risks and suggested procedures</H>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs opacity-60"><th className="py-1 pr-3">Risk</th><th className="py-1 pr-3">Control test</th><th className="py-1">Substantive procedure</th></tr></thead>
          <tbody>{v.audit.items.map((a) => <tr key={a.risk} className="border-t border-paper-foreground/15 align-top"><td className="py-1.5 pr-3 font-medium">{a.risk}</td><td className="py-1.5 pr-3">{a.control}</td><td className="tnum py-1.5">{a.substantive}</td></tr>)}</tbody>
        </table>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{v.audit.exceptions.map((e) => <li key={e}>{e}</li>)}</ul>

        <H n={5}>Sustainability estimates and limitations</H>
        <div className="grid gap-2 sm:grid-cols-4">{v.sustainability.headline.map((h) => <div key={h.label} className="rounded border border-paper-foreground/15 p-2 text-sm"><p className="text-[11px] opacity-60">{h.label}</p><p className="tnum font-medium">{h.value}</p></div>)}</div>
        <ul className="tnum mt-3 list-disc space-y-1 pl-5 text-sm">{[...v.sustainability.method, ...v.sustainability.reporting, ...v.sustainability.limitations].map((x) => <li key={x}>{x}</li>)}</ul>

        <H n={6}>Recommended actions and unresolved questions</H>
        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          <div><p className="mb-1 font-semibold">Recommended actions</p><ol className="list-decimal space-y-1 pl-5">{[...v.recommendations, ...v.audit.actions].map((r) => <li key={r}>{r}</li>)}</ol></div>
          <div><p className="mb-1 font-semibold">Unresolved questions</p><ol className="list-decimal space-y-1 pl-5">{v.questions.map((r) => <li key={r}>{r}</li>)}</ol></div>
        </div>

        <footer className="mt-10 border-t border-paper-foreground/20 pt-3 text-[11px] opacity-60">
          Hackathon concept. All figures are synthetic and illustrative; they do not represent actual UAE government expenditure or verified environmental outcomes. No audit has been performed. Actual accounting treatment depends on the applicable framework, policies and facts.
        </footer>
      </article>
    </div>
  );
}
