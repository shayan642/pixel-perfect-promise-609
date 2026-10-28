import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Calculator,
  Cloud,
  Cpu,
  Fan,
  GraduationCap,
  Landmark,
  Leaf,
  LineChart,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { CategoryId, TxTypeId } from "@/lib/greenledger";

export type PillarId = "accounting" | "financial" | "audit" | "sustainability" | "workforce";

export const PILLARS: {
  id: PillarId;
  label: string;
  full: string;
  icon: LucideIcon;
  tone: string;
  bar: string;
}[] = [
  { id: "accounting", label: "Accounting", full: "Accounting & Financial Reporting", icon: Calculator, tone: "text-sand", bar: "bg-sand" },
  { id: "financial", label: "Financial", full: "Financial Performance & Value for Money", icon: LineChart, tone: "text-primary", bar: "bg-primary" },
  { id: "audit", label: "Audit", full: "Audit, Governance & Risk", icon: ShieldCheck, tone: "text-uae-red", bar: "bg-uae-red" },
  { id: "sustainability", label: "Sustainability", full: "Sustainability & Resource Efficiency", icon: Leaf, tone: "text-teal", bar: "bg-teal" },
  { id: "workforce", label: "Workforce", full: "Human Capital & Workforce Readiness", icon: Users, tone: "text-gold", bar: "bg-gold" },
];

const TYPE_ICONS: Record<TxTypeId, LucideIcon> = {
  gpu_servers: Server,
  dc_cooling: Fan,
  cloud_ai: Cloud,
  software_licence: AppWindow,
  workforce_training: GraduationCap,
  ai_pilot: Landmark,
  adoption_programme: Users,
  other: Cpu,
};

export function typeIcon(type: TxTypeId) {
  return TYPE_ICONS[type];
}

export function TypeGlyph({
  type,
  className = "h-4 w-4",
}: {
  type: TxTypeId;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type];
  return <Icon className={className} aria-hidden />;
}

export function CategoryArt({
  category,
  type,
  className = "",
}: {
  category: CategoryId;
  type: TxTypeId;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type];
  const infra = category === "infrastructure";
  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden uae-pattern ${
        infra ? "bg-[#0d241f] text-primary" : "bg-[#241c12] text-gold"
      } ${className}`}
      aria-hidden
    >
      <div className={`absolute inset-6 rounded-xl border ${infra ? "border-primary/20" : "border-gold/25"}`} />
      <div className={`absolute inset-10 rounded-lg border ${infra ? "border-primary/10" : "border-gold/15"}`} />
      <Icon className={`relative h-12 w-12 ${infra ? "text-primary" : "text-gold"}`} strokeWidth={1.25} />
      <p className="relative mt-3 px-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/70">
        {infra ? "Infrastructure" : "Adoption"}
      </p>
    </div>
  );
}

export function DetailsBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:content-none hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center justify-between gap-3">
          {title}
          <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
          <span className="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

export function CompareBar({
  label,
  value,
  max,
  bar = "bg-primary",
  display,
}: {
  label: string;
  value: number;
  max: number;
  bar?: string;
  display: string;
}) {
  const pct = max > 0 ? Math.min(100, (Math.max(0, value) / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tnum text-foreground">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function journalTotals(lines: { dr?: number; cr?: number }[]) {
  const dr = lines.reduce((s, l) => s + (l.dr ?? 0), 0);
  const cr = lines.reduce((s, l) => s + (l.cr ?? 0), 0);
  return { dr, cr, balanced: Math.abs(dr - cr) < 0.5 };
}
