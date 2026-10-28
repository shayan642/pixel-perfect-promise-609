import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  aed,
  formatDisplayDate,
  type Transaction,
} from "@/lib/greenledger";
import { CategoryArt, TypeGlyph } from "./identity";

export function TxCard({ tx }: { tx: Transaction }) {
  return (
    <Link
      to="/analysis/$txId"
      params={{ txId: tx.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row"
    >
      <CategoryArt category={tx.category} type={tx.type} className="h-36 w-full sm:h-auto sm:w-40" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tnum text-xs text-muted-foreground">{tx.ref}</span>
          <StatusPill status={tx.status} />
        </div>
        <h3 className="text-lg font-semibold leading-snug">{tx.projectName}</h3>
        <p className="text-sm text-muted-foreground">{tx.title}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="flex items-center gap-1.5">
            <TypeGlyph type={tx.type} className="h-3.5 w-3.5 text-gold" />
            {TYPE_LABEL[tx.type]}
          </dd>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="tnum">{aed(tx.amount)}</dd>
          <dt className="text-muted-foreground">Category</dt>
          <dd>{CATEGORY_LABEL[tx.category]}</dd>
        </dl>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
          View Analysis <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function StatusPill({ status }: { status: Transaction["status"] }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {STATUS_LABEL[status]}
    </span>
  );
}

export function NumField({
  label,
  value,
  onChange,
  step = 1,
  suffix,
  optional,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  step?: number;
  suffix?: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">
        {label}
        {optional && <span className="text-[10px] text-muted-foreground"> (optional)</span>}
      </span>
      <div className="mt-1 flex items-center rounded-lg border border-input bg-background focus-within:border-primary">
        <input
          type="number"
          step={step}
          value={value == null || !Number.isFinite(value) ? "" : value}
          onChange={(e) => {
            if (e.target.value === "") onChange(optional ? null : 0);
            else onChange(Number(e.target.value));
          }}
          placeholder={optional ? "Not recorded" : undefined}
          className="tnum w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-card p-5 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

export function MetaLine({ tx }: { tx: Transaction }) {
  return (
    <p className="text-sm text-muted-foreground">
      {tx.entity} · {formatDisplayDate(tx.isoDate)} · {CATEGORY_LABEL[tx.category]}
    </p>
  );
}
