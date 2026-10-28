import {
  assessEsgRisk,
  esgLevelLabel,
  ESG_QUALIFIER,
  type EsgAssessment,
  type EsgBand,
  type EsgFactorLevel,
} from "@/lib/esg";
import type { Transaction } from "@/lib/greenledger";

const BANDS: { id: EsgBand; label: string; color: string }[] = [
  { id: "low", label: "Low", color: "var(--chart-1)" },
  { id: "moderate", label: "Moderate", color: "var(--gold)" },
  { id: "high", label: "High", color: "var(--destructive)" },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((180 - deg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

function needleDeg(level: EsgBand) {
  if (level === "low") return 30;
  if (level === "moderate") return 90;
  return 150;
}

function levelTone(level: EsgFactorLevel) {
  if (level === "low") return "text-primary";
  if (level === "moderate") return "text-gold";
  if (level === "high") return "text-destructive";
  return "text-muted-foreground";
}

function GaugeGraphic({ assessment }: { assessment: EsgAssessment }) {
  const cx = 120;
  const cy = 108;
  const r = 88;
  const overall = assessment.overall;
  const rated = overall !== "insufficient";
  const tip = overall === "insufficient" ? null : polar(cx, cy, r - 14, needleDeg(overall));

  return (
    <svg viewBox="0 0 240 132" className="mx-auto h-32 w-full max-w-[280px]" role="img" aria-label={`Estimated ESG risk: ${esgLevelLabel(assessment.overall)}`}>
      {BANDS.map((band, i) => {
        const start = i * 60;
        const end = start + 60;
        return (
          <path
            key={band.id}
            d={arcPath(cx, cy, r, start, end)}
            fill="none"
            stroke={band.color}
            strokeWidth={14}
            strokeLinecap="butt"
            opacity={rated && assessment.overall !== band.id ? 0.35 : 0.95}
          />
        );
      })}
      {BANDS.map((band, i) => {
        const mid = polar(cx, cy, r + 16, i * 60 + 30);
        return (
          <text key={band.id} x={mid.x} y={mid.y} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
            {band.label}
          </text>
        );
      })}
      {tip && (
        <g>
          <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--foreground)" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={5} fill="var(--foreground)" />
        </g>
      )}
    </svg>
  );
}

export function EsgGauge({ tx, compact = false }: { tx: Transaction; compact?: boolean }) {
  const assessment = assessEsgRisk(tx);
  return (
    <section className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Estimated ESG risk</p>
        <p className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {ESG_QUALIFIER}
        </p>
      </div>
      <div className={`mt-3 grid gap-5 ${compact ? "" : "lg:grid-cols-[minmax(0,220px)_1fr] lg:items-center"}`}>
        <div className="text-center">
          <GaugeGraphic assessment={assessment} />
          <p className={`mt-1 text-lg font-semibold ${levelTone(assessment.overall)}`}>{esgLevelLabel(assessment.overall)}</p>
          <p className="text-[11px] text-muted-foreground">Not an official rating or performance score</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{assessment.rationale}</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {assessment.factors.map((f) => (
              <li key={f.id} className="flex gap-3 px-3 py-2.5">
                <div className="w-28 shrink-0">
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className={`text-[11px] ${levelTone(f.level)}`}>{esgLevelLabel(f.level)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{f.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
