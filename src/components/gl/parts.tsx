import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import vehiclesImg from "@/assets/vehicles.jpg";
import buildingImg from "@/assets/building.jpg";
import { TX_META, aed, type TxId } from "@/lib/greenledger";
import { useGL } from "@/lib/gl-store";
import { DemoBadge } from "./Shell";

export const TX_IMG: Record<TxId, string> = { vehicles: vehiclesImg, building: buildingImg };

export function TxCard({ id }: { id: TxId }) {
  const m = TX_META[id];
  const { vehicle, building } = useGL();
  const amount = id === "vehicles" ? vehicle.purchaseCost : building.investment;
  return (
    <Link
      to="/analysis/$txId"
      params={{ txId: id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/60 sm:flex-row"
    >
      <img src={TX_IMG[id]} alt={m.title} width={1280} height={768} className="h-48 w-full object-cover sm:h-auto sm:w-56" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <span className="tnum text-xs text-muted-foreground">{m.ref}</span>
          <DemoBadge />
        </div>
        <h3 className="text-xl font-semibold">{m.title}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Entity</dt><dd>{m.entity}</dd>
          <dt className="text-muted-foreground">Amount</dt><dd className="tnum">{aed(amount)}</dd>
          <dt className="text-muted-foreground">Status</dt><dd className="text-gold">Under review</dd>
        </dl>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open complete review <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function NumField({
  label, value, onChange, step = 1, suffix,
}: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-input bg-background focus-within:border-primary">
        <input
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="tnum w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}
