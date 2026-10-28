import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { PILLARS, TypeGlyph, journalTotals } from "@/components/gl/identity";
import { useGL } from "@/lib/gl-store";
import {
  CATEGORY_LABEL,
  SPEND_LABEL,
  TYPE_LABEL,
  aed,
  aedOpt,
  formatDisplayDate,
  numOpt,
  type Transaction,
} from "@/lib/greenledger";
import { transactionView } from "@/lib/gl-content";
import { OccupationsTable } from "@/components/gl/OccupationsTable";
import { EsgGauge } from "@/components/gl/EsgGauge";

export const Route = createFileRoute("/report/$txId")({
  head: () => ({
    meta: [
      { title: "Decision Report | MIZAN AI" },
      { name: "description", content: "Integrated decision report for an AI investment review." },
    ],
  }),
  component: Report,
});

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 border-b border-paper-foreground/20 pb-1 text-lg font-semibold">{n}. {children}</h2>;
}

function assumptionRows(tx: Transaction): [string, string][] {
  const a = tx.assumptions;
  const common: [string, string][] = [
    ["Project", tx.projectName],
    ["Type", TYPE_LABEL[tx.type]],
    ["Category", CATEGORY_LABEL[tx.category]],
    ["Spend class", SPEND_LABEL[tx.spendClass]],
    ["Recorded amount", aed(tx.amount)],
    ["Date", formatDisplayDate(tx.isoDate)],
  ];
  if (a.kind === "ppe") {
    return [
      ...common,
      ["Units", numOpt(a.units)],
      ["Useful life", `${numOpt(a.usefulLife)} years`],
      ["Residual value", aedOpt(a.residualValue)],
      ["Annual maintenance", aedOpt(a.annualMaintenance)],
      ["Annual energy cost", aedOpt(a.annualEnergyCost)],
      ["Electricity", `${numOpt(a.annualKwh)} kWh/yr`],
      ["Emission factor", a.emissionsFactorKgPerKwh == null ? "Not recorded" : `${a.emissionsFactorKgPerKwh} ${a.emissionsFactorUnit}`],
    ];
  }
  if (a.kind === "efficiency") {
    return [
      ...common,
      ["Useful life", `${numOpt(a.usefulLife)} years`],
      ["Forecast annual savings", aed(a.annualSavingsForecast)],
      ["Realised annual savings", aedOpt(a.annualSavingsRealised)],
      ["Annual maintenance", aedOpt(a.annualMaintenance)],
      ["Forecast energy reduction", `${numOpt(a.annualKwhReductionForecast)} kWh/yr`],
      ["Horizon", `${numOpt(a.horizonYears)} years`],
    ];
  }
  if (a.kind === "service") {
    return [...common, ["Annual cost", aed(a.annualCost)], ["Term", `${numOpt(a.termYears)} years`], ["Unit cost denominator", numOpt(a.unitsOfWork)]];
  }
  if (a.kind === "software") {
    return [
      ...common,
      ["Initial licence", aed(a.initialLicence)],
      ["Annual subscription", aedOpt(a.annualSubscription)],
      ["Annual maintenance", aedOpt(a.annualMaintenance)],
      ["Implementation", aedOpt(a.implementationCost)],
      ["Capitalisation", a.capitalisationTreatment],
    ];
  }
  if (a.kind === "training") {
    return [
      ...common,
      ["Planned participants", String(a.plannedParticipants)],
      ["Actual enrolment", numOpt(a.actualEnrolment)],
      ["Cost per planned participant", aed(a.costPerParticipant)],
      ["Actual completions", numOpt(a.actualCompletions)],
      ["Planned completion", `${numOpt(a.plannedCompletionRatePct)}% (target)`],
    ];
  }
  return [
    ...common,
    ["Capex estimate", aed(a.capexEstimate)],
    ["Opex estimate", aed(a.opexEstimate)],
    ["Target users", String(a.targetUsers)],
    ["Active users", numOpt(a.activeUsers)],
    ["Expected benefits", aedOpt(a.expectedBenefitAed)],
    ["Realised benefits", aedOpt(a.realisedBenefitAed)],
    ["Benefit note", a.plannedBenefitNote],
  ];
}

function Report() {
  const txId = Route.useParams().txId;
  const { transactions } = useGL();
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) throw notFound();
  const v = transactionView(tx);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          {transactions.map((t) => (
            <Link
              key={t.id}
              to="/report/$txId"
              params={{ txId: t.id }}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                t.id === tx.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {t.short}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <Link to="/analysis/$txId" params={{ txId: tx.id }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Edit assumptions
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      <article className="rounded-2xl bg-paper p-8 text-paper-foreground shadow-2xl sm:p-12 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-primary pb-4 print-break">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">MIZAN AI · <span lang="ar">ميزان</span> · Decision Report</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
              <TypeGlyph type={tx.type} className="h-6 w-6 text-primary" />
              {tx.projectName}
            </h1>
            <p className="mt-1 text-sm opacity-70">
              {tx.title} · {tx.ref} · {tx.entity} · {formatDisplayDate(tx.isoDate)}
            </p>
            <p className="tnum mt-3 text-2xl font-semibold">{aed(tx.amount)}</p>
          </div>
          <span className="rounded border border-gold/50 px-2 py-1 text-[10px] uppercase tracking-wider">Illustrative figures</span>
        </header>

        <H n={1}>Executive summary</H>
        <p className="tnum text-sm">{v.summary}</p>
        <p className="mt-2 text-sm">{tx.purpose}</p>
        <p className="mt-2 text-xs opacity-70">{v.capabilityNote}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => {
            const finding =
              p.id === "accounting"
                ? v.integrated.accounting
                : p.id === "financial"
                  ? v.integrated.financial
                  : p.id === "audit"
                    ? v.integrated.audit
                    : p.id === "sustainability"
                      ? v.integrated.climate
                      : (v.integrated.workforce ?? v.workforce?.headline);
            return (
              <div key={p.id} className="print-break rounded border border-paper-foreground/15 p-3 text-sm">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider opacity-60">
                  <p.icon className="h-3.5 w-3.5" /> {p.label}
                </p>
                <p className="tnum mt-1 text-xs">{finding}</p>
              </div>
            );
          })}
        </div>

        <H n={2}>Accounting treatment</H>
        <p className="mb-2 text-sm font-medium">{v.accounting.standard}</p>
        <div className="mt-4 space-y-4">
          {v.accounting.journals.map((j) => {
            const tot = journalTotals(j.lines);
            return (
              <table key={j.label} className="print-break w-full text-sm">
                <caption className="mb-1 text-left text-xs font-semibold uppercase tracking-wider">{j.label}</caption>
                <thead>
                  <tr className="text-left text-[11px] opacity-60">
                    <th className="py-1">Account</th>
                    <th className="py-1 text-right">Debit</th>
                    <th className="py-1 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {j.lines.map((l) => (
                    <tr key={l.account} className="border-t border-paper-foreground/15">
                      <td className={`py-1 ${l.cr ? "pl-6" : ""}`}>
                        {l.cr ? "Cr " : "Dr "}
                        {l.account}
                      </td>
                      <td className="tnum w-36 py-1 text-right">{l.dr ? aed(l.dr) : "—"}</td>
                      <td className="tnum w-36 py-1 text-right">{l.cr ? aed(l.cr) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-paper-foreground/40">
                    <td className="py-1 font-medium">Totals</td>
                    <td className="tnum py-1 text-right">{aed(tot.dr)}</td>
                    <td className="tnum py-1 text-right">{aed(tot.cr)}</td>
                  </tr>
                </tbody>
              </table>
            );
          })}
        </div>
        <ul className="tnum mt-4 space-y-1 text-sm">
          {v.accounting.statements.map((s) => (
            <li key={s.statement}>
              <strong>{s.statement}:</strong> {s.effect}
            </li>
          ))}
        </ul>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Recognition notes</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {v.accounting.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </details>

        <H n={3}>Financial metrics</H>
        <table className="w-full text-sm">
          <tbody>
            {v.financial.map((f) => (
              <tr key={f.label} className="border-t border-paper-foreground/15">
                <td className="py-1.5 pr-4 opacity-70">{f.label}</td>
                <td className="tnum py-1.5 text-right font-medium">{f.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Assumptions used</summary>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {assumptionRows(tx).map(([k, val]) => (
                <tr key={k} className="border-t border-paper-foreground/15">
                  <td className="py-1 pr-4 opacity-70">{k}</td>
                  <td className="tnum py-1 text-right">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        <H n={4}>Audit risks and suggested procedures</H>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs opacity-60">
              <th className="py-1 pr-3">Risk</th>
              <th className="py-1 pr-3">Control test</th>
              <th className="py-1">Substantive procedure</th>
            </tr>
          </thead>
          <tbody>
            {v.audit.items.map((a) => (
              <tr key={a.risk} className="border-t border-paper-foreground/15 align-top">
                <td className="py-1.5 pr-3 font-medium">{a.risk}</td>
                <td className="py-1.5 pr-3">{a.control}</td>
                <td className="tnum py-1.5">{a.substantive}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {v.audit.exceptions.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <H n={5}>Sustainability estimates and limitations</H>
        {v.sustainability.notice && <p className="mb-3 text-sm">{v.sustainability.notice}</p>}
        <div className="grid gap-2 sm:grid-cols-3">
          {v.sustainability.headline.map((h) => (
            <div key={h.label} className="rounded border border-paper-foreground/15 p-2 text-sm">
              <p className="text-[11px] opacity-60">{h.label}</p>
              <p className="tnum font-medium">{h.value}</p>
              {h.hint && <p className="mt-1 text-[11px] opacity-70">{h.hint}</p>}
            </div>
          ))}
        </div>
        <ul className="tnum mt-3 list-disc space-y-1 pl-5 text-sm">
          {[...v.sustainability.method, ...v.sustainability.reporting, ...v.sustainability.limitations].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div className="mt-4">
          <EsgGauge tx={tx} compact />
        </div>

        <H n={6}>Human capital and workforce readiness</H>
        <p className="text-sm">{v.workforce?.headline}</p>
        {v.workforce && v.workforce.roles.length > 0 && (
          <div className="mt-3">
            <OccupationsTable roles={v.workforce.roles.map((r) => r.role)} compact />
          </div>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {(v.workforce?.recommendations ?? []).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <H n={7}>Recommended actions and unresolved questions</H>
        <div className="grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold">Recommended actions</p>
            <ol className="list-decimal space-y-1 pl-5">
              {[...v.recommendations, ...v.audit.actions].map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-1 font-semibold">Unresolved questions</p>
            <ol className="list-decimal space-y-1 pl-5">
              {v.questions.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </div>
        </div>

        <footer className="mt-10 hidden border-t border-paper-foreground/20 pt-3 text-[11px] opacity-60 print:block">
          MIZAN AI is a hackathon concept. It is not an official UAE government system. Figures are illustrative and
          for demonstration only.
        </footer>
      </article>
    </div>
  );
}
