import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, LineChart, Network, Plus, Users } from "lucide-react";
import { PILLARS } from "@/components/gl/identity";
import { VoiceAssistantTrigger } from "@/components/gl/VoiceAssistant";
import { Panel, StatusPill, TxCard } from "@/components/gl/parts";
import { useGL } from "@/lib/gl-store";
import { CATEGORY_LABEL, aed, portfolio, type CategoryId, type Transaction } from "@/lib/greenledger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MIZAN AI | Overview" },
      { name: "description", content: "Intelligence with Integration. Financial analysis, audit, sustainability and workforce readiness for public-sector investment decisions." },
      { property: "og:title", content: "MIZAN AI | Overview" },
      { property: "og:description", content: "AI Investment Intelligence · Financial Governance · Sustainability" },
    ],
  }),
  component: Overview,
});

const UAE_2031 = [
  { t: "Forward Society", icon: Users, tone: "text-gold", d: "Workforce intelligence and skills alignment for public-sector AI programmes." },
  { t: "Forward Economy", icon: LineChart, tone: "text-primary", d: "Investment analysis and financial intelligence to support value-for-money decisions." },
  { t: "Forward Diplomacy", icon: Globe2, tone: "text-sand", d: "Part of the broader national vision. MIZAN does not deliver diplomatic functions." },
  { t: "Forward Ecosystem", icon: Network, tone: "text-teal", d: "Connected data, governance and institutional collaboration across investment reviews." },
];

const PILLAR_BLURB: Record<string, string> = {
  accounting: "Recognition, journals and statement effects where the type supports them.",
  financial: "Investment cost, operating cost, TCO or payback, with cash and non-cash kept distinct.",
  audit: "Risks, evidence status and unresolved review items.",
  sustainability: "Electricity and emissions only when activity data and a factor are recorded.",
  workforce: "Additional people required for delivery, with evidence status where supply data is unavailable.",
};

function Overview() {
  const { transactions } = useGL();
  const p = portfolio(transactions);
  const infra = transactions.filter((t) => t.category === "infrastructure");
  const adoption = transactions.filter((t) => t.category === "adoption");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 mizan-hero lg:p-12">
        <div className="pointer-events-none absolute inset-y-8 right-8 hidden w-px bg-gradient-to-b from-transparent via-uae-red/50 to-transparent lg:block" />
        <p className="text-[11px] uppercase tracking-[0.28em] text-sand">
          AI Investment Intelligence · Financial Governance · Sustainability
        </p>
        <p className="font-arabic mt-5 text-4xl font-semibold leading-none text-gold lg:text-5xl" lang="ar" dir="rtl">
          ميزان
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white lg:text-6xl">
          MIZAN <span className="text-primary">AI</span>
        </h1>
        <p className="mt-3 text-xl font-medium text-primary lg:text-2xl">Intelligence with Integration.</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 lg:text-base">
          MIZAN AI brings financial analysis, audit and governance, sustainability and workforce readiness into one
          review so public-sector leaders can judge whether an investment is sound, governable and deliverable.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Plan an Investment
          </Link>
          <Link to="/transactions" className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10">
            Explore Transactions
          </Link>
          <VoiceAssistantTrigger compact />
          <span className="inline-flex items-center rounded-full border border-uae-red/40 bg-uae-red/10 px-3 py-1 text-[11px] tracking-wide text-sand">
            Aligned with We the UAE 2031
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">The transformation already underway</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Abu Dhabi Government strategy commitments and targets. These are not MIZAN AI results.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <p className="tnum font-display text-3xl font-semibold tracking-tight">AED 13 billion</p>
            <p className="mt-3 text-sm font-medium">Digital strategy investment</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Backing the Abu Dhabi Government Digital Strategy 2025 to 2027. This figure supports the broader digital
              programme, not an AI-only budget.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <p className="tnum font-display text-3xl font-semibold tracking-tight">200+</p>
            <p className="mt-3 text-sm font-medium">AI solutions planned</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Planned for deployment across Abu Dhabi Government services. This is a target, not a count of solutions
              already live.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <p className="tnum font-display text-3xl font-semibold tracking-tight">2027</p>
            <p className="mt-3 text-sm font-medium">AI-native government target</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Target year for Abu Dhabi's ambition to become an AI-native government across its digital services.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Source: Abu Dhabi Department of Government Enablement,{" "}
          <a
            href="https://www.dge.gov.ae/en/news/adg-digital-strategy"
            className="text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Digital Strategy announcement
          </a>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/80 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sand">National vision context</p>
            <h2 className="mt-1 text-lg font-semibold">We the UAE 2031</h2>
          </div>
          <p className="max-w-md text-[11px] text-muted-foreground">
            Illustrative alignment only. Not an official government programme.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {UAE_2031.map((item) => (
            <div key={item.t} className="rounded-xl border border-white/10 bg-secondary/30 p-4">
              <item.icon className={`h-4 w-4 ${item.tone}`} />
              <p className="mt-3 text-sm font-medium">{item.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Prototype investment mix">
          <p className="mb-3 text-[11px] text-muted-foreground">
            Analytics from this session's synthetic records. Not official government spending.
          </p>
          <BarRow label={CATEGORY_LABEL.infrastructure} amount={p.infrastructure} total={p.total} count={p.infraCount} />
          <BarRow label={CATEGORY_LABEL.adoption} amount={p.adoption} total={p.total} count={p.adoptionCount} />
        </Panel>
        <Panel title="Prototype status breakdown">
          <p className="mb-3 text-[11px] text-muted-foreground">
            Record status in this prototype only. Not an official pipeline.
          </p>
          <ul className="space-y-2 text-sm">
            {p.byStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between gap-3">
                <StatusPill status={s.status} />
                <span className="tnum text-muted-foreground">{s.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <CategoryBlock id="infrastructure" items={infra} />
      <CategoryBlock id="adoption" items={adoption} />

      <Panel title="Five analytical pillars">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/40 p-4">
              <item.icon className={`h-5 w-5 ${item.tone}`} />
              <p className="mt-3 font-medium">{item.full}</p>
              <p className="mt-1 text-sm text-muted-foreground">{PILLAR_BLURB[item.id]}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function BarRow({ label, amount, total, count }: { label: string; amount: number; total: number; count: number }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tnum text-muted-foreground">
          {aed(amount)} · {count} records
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CategoryBlock({ id, items }: { id: CategoryId; items: Transaction[] }) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">{CATEGORY_LABEL[id]}</h2>
        <Link to="/create" className="text-sm text-primary hover:underline">
          Plan investment
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((tx) => (
          <TxCard key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}
