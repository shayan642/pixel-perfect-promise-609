import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AssumptionFields } from "@/components/gl/AssumptionFields";
import {
  CategoryArt,
  CompareBar,
  DetailsBlock,
  PILLARS,
  TypeGlyph,
  journalTotals,
  type PillarId,
} from "@/components/gl/identity";
import { Panel, StatusPill } from "@/components/gl/parts";
import { DemoBadge } from "@/components/gl/Shell";
import { useGL } from "@/lib/gl-store";
import {
  CATEGORY_LABEL,
  TYPE_LABEL,
  aed,
  calcEfficiency,
  calcPpe,
  formatDisplayDate,
  type Transaction,
} from "@/lib/greenledger";
import { transactionView, type View } from "@/lib/gl-content";
import { OccupationsTable } from "@/components/gl/OccupationsTable";
import { EsgGauge } from "@/components/gl/EsgGauge";
import { occupationSupplyDemand, WORKFORCE_DISCLOSURE } from "@/lib/workforce";

export const Route = createFileRoute("/analysis/$txId")({
  head: () => ({
    meta: [
      { title: `Integrated Analysis | MIZAN AI` },
      { name: "description", content: `Accounting, financial, audit, sustainability and workforce analysis.` },
    ],
  }),
  component: Analysis,
});

const tickAed = (n: number) => `${Math.round(n / 1000)}k`;
const chartTip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 },
  formatter: (v: number) => aed(v),
  labelFormatter: (label: string | number) => `Year ${label}`,
};

function Analysis() {
  const txId = Route.useParams().txId;
  const { transactions, updateTransaction } = useGL();
  const tx = transactions.find((t) => t.id === txId);
  const [tab, setTab] = useState<PillarId>("financial");
  const [stage, setStage] = useState(0);
  if (!tx) throw notFound();
  const view = transactionView(tx);
  const selected = PILLARS.find((p) => p.id === tab)!;
  const activeStage = view.trace[stage] ?? view.trace[0];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {transactions.map((t) => (
          <Link
            key={t.id}
            to="/analysis/$txId"
            params={{ txId: t.id }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              t.id === tx.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <TypeGlyph type={t.type} className="h-3.5 w-3.5" />
            {t.short}
          </Link>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card uae-pattern">
        <div className="flex flex-col md:flex-row">
          <CategoryArt category={tx.category} type={tx.type} className="h-36 w-full md:h-auto md:w-56" />
          <div className="flex flex-1 flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tnum text-xs text-muted-foreground">{tx.ref}</span>
                <DemoBadge />
                <StatusPill status={tx.status} />
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[tx.category]}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold lg:text-3xl">{tx.projectName}</h1>
              <p className="text-sm text-muted-foreground">{tx.title}</p>
              <p className="text-xs text-muted-foreground">
                {tx.entity} · {formatDisplayDate(tx.isoDate)} · {TYPE_LABEL[tx.type]}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Recorded envelope</p>
                <p className="tnum text-3xl font-semibold text-gold">{aed(tx.amount)}</p>
              </div>
              <Link
                to="/report/$txId"
                params={{ txId: tx.id }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FileText className="h-4 w-4" /> Generate Decision Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Investment lifecycle</p>
        <div className="flex gap-0 overflow-x-auto">
          {view.trace.map((s, i) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setStage(i)}
              className={`relative min-w-[7.5rem] flex-1 border px-3 py-3 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i === stage ? "border-primary bg-primary/10" : "border-border"
              } ${i === 0 ? "rounded-l-xl" : ""} ${i === view.trace.length - 1 ? "rounded-r-xl" : "border-r-0"}`}
            >
              <p className="tnum text-[10px] uppercase tracking-wider text-gold">
                {i + 1}. {s.step}
              </p>
              <p className="tnum mt-1 line-clamp-2 text-xs text-foreground">{s.detail}</p>
            </button>
          ))}
        </div>
        {activeStage && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{activeStage.step}: </span>
            {activeStage.detail}
          </p>
        )}
      </section>

      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Five-pillar executive summary</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => {
            const finding =
              p.id === "accounting"
                ? view.integrated.accounting
                : p.id === "financial"
                  ? view.integrated.financial
                  : p.id === "audit"
                    ? view.integrated.audit
                    : p.id === "sustainability"
                      ? view.integrated.climate
                      : (view.integrated.workforce ?? view.workforce?.headline ?? "Unavailable");
            const metric = pillarMetric(p.id, view, tx);
            const on = tab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTab(p.id)}
                className={`rounded-2xl border p-4 text-left transition-colors hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  on ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <p className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${p.tone}`}>
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </p>
                <p className="tnum mt-2 text-lg font-medium">{metric}</p>
                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{finding}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className={`flex items-center gap-2 font-display text-lg font-semibold ${selected.tone}`}>
              <selected.icon className="h-5 w-5" />
              {selected.full}
            </h2>
          </div>
          {tab === "accounting" && <AccountingTab view={view} tx={tx} />}
          {tab === "financial" && <FinancialTab view={view} tx={tx} />}
          {tab === "audit" && <AuditTab view={view} />}
          {tab === "sustainability" && <SustainTab view={view} tx={tx} />}
          {tab === "workforce" && <WorkforceTab view={view} />}
        </div>
        <Panel title="Live assumptions" className="h-fit lg:sticky lg:top-6">
          <p className="mb-3 text-[11px] text-muted-foreground">Edits update every pillar and the decision report in this session.</p>
          <AssumptionFields
            value={tx.assumptions}
            onChange={(assumptions) => updateTransaction(tx.id, (current) => ({ ...current, assumptions }))}
            workforce={tx.workforce}
            onWorkforceChange={(workforce) => updateTransaction(tx.id, (current) => ({ ...current, workforce }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function pillarMetric(id: PillarId, view: View, tx: Transaction): string {
  if (id === "financial") return aed(tx.amount);
  if (id === "accounting") {
    const first = view.financial.find((f) => /depreciation|amortisation|expense|opex/i.test(f.label));
    return first?.value ?? (view.accounting.journals.length ? `${view.accounting.journals.length} journals` : "Review");
  }
  if (id === "audit") {
    const flags = view.audit.exceptions.filter((e) => e.startsWith("Flag") || e.startsWith("Unresolved")).length;
    return flags ? `${flags} review flag${flags > 1 ? "s" : ""}` : `${view.audit.items.length} risks`;
  }
  if (id === "sustainability") return view.sustainability.headline[0]?.value ?? "Not calculated";
  const people = view.workforce ? occupationSupplyDemand(view.workforce.roles.map((r) => r.role)) : [];
  const need = people.reduce((n, r) => n + (r.additionalRequired ?? 0), 0);
  if (!people.length) return "Incomplete";
  return `${need} people`;
}

export function JournalTable({ j }: { j: View["accounting"]["journals"][number] }) {
  const t = journalTotals(j.lines);
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <p className="border-b border-border bg-secondary/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
        {j.label}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-muted-foreground">
            <th className="px-3 py-1.5 font-medium">Account</th>
            <th className="px-3 py-1.5 text-right font-medium">Debit</th>
            <th className="px-3 py-1.5 text-right font-medium">Credit</th>
          </tr>
        </thead>
        <tbody>
          {j.lines.map((l) => (
            <tr key={l.account} className="border-t border-border">
              <td className={`px-3 py-1.5 ${l.cr ? "pl-8 text-muted-foreground" : "font-medium"}`}>{l.account}</td>
              <td className="tnum px-3 py-1.5 text-right">{l.dr ? aed(l.dr) : "—"}</td>
              <td className="tnum px-3 py-1.5 text-right">{l.cr ? aed(l.cr) : "—"}</td>
            </tr>
          ))}
          <tr className="border-t border-gold/40 bg-secondary/30 text-xs">
            <td className="px-3 py-1.5 font-medium">Totals</td>
            <td className="tnum px-3 py-1.5 text-right">{aed(t.dr)}</td>
            <td className="tnum px-3 py-1.5 text-right">{aed(t.cr)}</td>
          </tr>
        </tbody>
      </table>
      <p className={`px-3 py-1.5 text-[11px] ${t.balanced ? "text-primary" : "text-gold"}`}>
        {t.balanced ? "Debits equal credits on this illustrative entry." : "Debits and credits do not match. Review the source amounts."}
      </p>
    </div>
  );
}

function AccountingTab({ view, tx }: { view: View; tx: Transaction }) {
  const a = view.accounting;
  const ppe = tx.assumptions.kind === "ppe" ? calcPpe(tx.assumptions) : null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{a.standard}</p>
      {a.journals.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">{a.journals.map((j) => <JournalTable key={j.label} j={j} />)}</div>
      ) : (
        <Panel>
          <p className="text-sm text-muted-foreground">
            Journals are not auto-posted for this investment type. Split the envelope into contracts before recognising assets.
          </p>
        </Panel>
      )}
      {ppe && ppe.schedule.length > 0 && (
        <Panel title="Carrying value (illustrative)">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={ppe.schedule}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={tickAed} />
                <Tooltip {...chartTip} />
                <Bar dataKey="closing" name="Carrying amount" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dep" name="Depreciation (non-cash)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {a.statements.map((s) => (
          <div key={s.statement} className="rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-xs font-medium text-gold">{s.statement}</p>
            <p className="tnum mt-1 text-sm">{s.effect}</p>
          </div>
        ))}
      </div>
      <DetailsBlock title="Recognition notes and methodology">
        <ul className="space-y-2">
          {a.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs">Actual treatment depends on the applicable accounting framework, entity policies and facts.</p>
      </DetailsBlock>
    </div>
  );
}

function FinancialTab({ view, tx }: { view: View; tx: Transaction }) {
  const ppe = tx.assumptions.kind === "ppe" ? calcPpe(tx.assumptions) : null;
  const eff = tx.assumptions.kind === "efficiency" ? calcEfficiency(tx.assumptions) : null;
  const life = tx.assumptions.kind === "ppe" ? tx.assumptions.usefulLife : null;
  const tcoMax = ppe?.tcoGross ?? tx.amount;
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
      {ppe && ppe.tcoGross != null && tx.assumptions.kind === "ppe" && (
        <Panel title="Investment versus recurring cash (illustrative TCO)">
          <div className="space-y-3">
            <CompareBar label="Acquisition (cash, year 0)" value={tx.assumptions.purchaseCost} max={tcoMax} bar="bg-gold" display={aed(tx.assumptions.purchaseCost)} />
            {ppe.annualOpex != null && life != null && (
              <CompareBar label="Lifetime cash operating cost" value={ppe.annualOpex * life} max={tcoMax} bar="bg-teal" display={aed(ppe.annualOpex * life)} />
            )}
            <CompareBar label="TCO gross" value={ppe.tcoGross} max={tcoMax} bar="bg-primary" display={aed(ppe.tcoGross)} />
            {ppe.tcoNet != null && (
              <CompareBar
                label="TCO net of residual (end-of-life assumption)"
                value={ppe.tcoNet}
                max={tcoMax}
                bar="bg-sand"
                display={aed(ppe.tcoNet)}
              />
            )}
          </div>
        </Panel>
      )}
      {ppe?.schedule && ppe.schedule.length > 0 && (
        <Panel title="Multi-year carrying amount and cash opex">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ppe.schedule}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={tickAed} />
                <Tooltip {...chartTip} />
                <Bar dataKey="closing" name="Closing carrying amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opex" name="Cash opex" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      {eff?.cumulative && eff.cumulative.length > 0 && (
        <Panel title="Cumulative net cash and carrying amount">
          <div className="h-64">
            <ResponsiveContainer>
              <RLineChart data={eff.cumulative}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" tickFormatter={(y) => `Y${y}`} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={tickAed} />
                <Tooltip {...chartTip} />
                <ReferenceLine y={0} stroke="var(--gold)" strokeDasharray="4 4" />
                <Line dataKey="cumulative" name="Cumulative net savings (forecast)" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line dataKey="carrying" name="Carrying amount" stroke="var(--gold)" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      <p className="text-xs text-muted-foreground">Depreciation is non-cash where an asset model applies. Forecast benefits are not realised results.</p>
    </div>
  );
}

function AuditTab({ view }: { view: View }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {view.audit.exceptions.map((e) => {
          const flag = e.startsWith("Flag") || e.startsWith("Unresolved");
          return (
            <div key={e} className={`rounded-xl border p-4 ${flag ? "border-gold/50 bg-gold/5" : "border-border bg-card"}`}>
              <p className="text-[10px] uppercase tracking-wider text-gold">{flag ? "Review item" : "Status"}</p>
              <p className="mt-1 text-sm">{e}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        {view.audit.items.map((a) => (
          <div key={a.risk} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{a.risk}</p>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-sand">Control test</p>
                <p className="mt-1 text-muted-foreground">{a.control}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-teal">Substantive procedure</p>
                <p className="tnum mt-1 text-muted-foreground">{a.substantive}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Panel title="Actions">
        <ul className="space-y-2 text-sm">
          {view.audit.actions.map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-primary">→</span>
              {e}
            </li>
          ))}
        </ul>
      </Panel>
      <p className="text-xs text-muted-foreground">Suggested procedures only. No audit has been performed and no fraud is implied.</p>
    </div>
  );
}

function SustainTab({ view, tx }: { view: View; tx: Transaction }) {
  const s = view.sustainability;
  return (
    <div className="space-y-4">
      <EsgGauge tx={tx} />
      {s.notice && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground">{s.notice}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {s.headline.map((h) => (
          <div key={h.label} className="rounded-2xl border border-primary/30 bg-card p-4">
            <p className="text-xs text-muted-foreground">{h.label}</p>
            <p className="tnum mt-1 text-2xl font-medium text-primary">{h.value}</p>
            <p className="mt-1 text-[11px] text-gold">{h.hint ?? "Estimate · not measured"}</p>
          </div>
        ))}
      </div>
      <DetailsBlock title="Method, reporting context and limitations">
        <ul className="space-y-2">
          {[...s.method, ...s.reporting, ...s.limitations].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </DetailsBlock>
    </div>
  );
}

function WorkforceTab({ view }: { view: View }) {
  const w = view.workforce;
  if (!w || w.roles.length === 0) {
    return (
      <Panel title="Workforce readiness">
        <p className="text-sm">{w?.headline ?? "Workforce assessment unavailable."}</p>
        <p className="mt-3 text-xs text-muted-foreground">{WORKFORCE_DISCLOSURE}</p>
      </Panel>
    );
  }
  const rows = occupationSupplyDemand(w.roles.map((r) => r.role));
  const required = rows.reduce((n, r) => n + (r.additionalRequired ?? 0), 0);
  return (
    <div className="space-y-4">
      <p className="text-base font-medium">{w.headline}</p>
      <div className="rounded-xl border border-border bg-card p-4 sm:max-w-xs">
        <p className="text-xs text-muted-foreground">Additional people required</p>
        <p className="tnum mt-1 text-lg">{required}</p>
      </div>
      <Panel title="Occupation staffing plan">
        <OccupationsTable roles={w.roles.map((r) => r.role)} />
      </Panel>
      <Panel title="Suggested next steps">
        <ul className="space-y-2 text-sm">
          {w.recommendations.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-primary">→</span>
              {r}
            </li>
          ))}
        </ul>
      </Panel>
      {(w.missing.length > 0 || w.issues.length > 0) && (
        <DetailsBlock title="Missing inputs and issues">
          <ul className="space-y-1">
            {[...w.missing, ...w.issues].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </DetailsBlock>
      )}
    </div>
  );
}
