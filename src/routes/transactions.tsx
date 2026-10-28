import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TypeGlyph } from "@/components/gl/identity";
import { VoiceAssistantTrigger } from "@/components/gl/VoiceAssistant";
import { StatusPill } from "@/components/gl/parts";
import { useGL } from "@/lib/gl-store";
import {
  CATEGORY_LABEL,
  SPEND_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  aed,
  formatDisplayDate,
  portfolio,
  type CategoryId,
  type TxStatus,
} from "@/lib/greenledger";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction Explorer | MIZAN AI" },
      { name: "description", content: "Review financial records available for analysis." },
      { property: "og:title", content: "Transaction Explorer | MIZAN AI" },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const { transactions } = useGL();
  const p = portfolio(transactions);
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [status, setStatus] = useState<TxStatus | "all">("all");
  const rows = useMemo(
    () =>
      transactions.filter((t) => (category === "all" || t.category === category) && (status === "all" || t.status === status)),
    [transactions, category, status],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction Register</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Financial records available for review. These entries can be opened in Integrated Analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Plan Investment
          </Link>
          <VoiceAssistantTrigger compact />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-muted-foreground">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
            className="ml-2 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="all">All</option>
            {(Object.keys(CATEGORY_LABEL) as CategoryId[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TxStatus | "all")}
            className="ml-2 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="all">All</option>
            {(Object.keys(STATUS_LABEL) as TxStatus[]).map((k) => (
              <option key={k} value={k}>
                {STATUS_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <p className="self-center text-xs text-muted-foreground">{rows.length} records</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recorded prototype transactions</p>
          <p className="tnum mt-1 text-lg">{aed(p.total)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{p.count} records in this session</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Capital expenditure (classified)</p>
          <p className="tnum mt-1 text-lg">{aed(p.capex)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Operating expenditure (classified)</p>
          <p className="tnum mt-1 text-lg">{aed(p.opex)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Spend class</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="tnum px-4 py-3">{t.ref}</td>
                <td className="px-4 py-3">
                  <div>{t.projectName}</div>
                  <div className="text-xs text-muted-foreground">{t.title}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <TypeGlyph type={t.type} className="h-3.5 w-3.5 text-gold" />
                    {TYPE_LABEL[t.type]}
                  </span>
                </td>
                <td className="tnum px-4 py-3 text-right">{aed(t.amount)}</td>
                <td className="px-4 py-3">{SPEND_LABEL[t.spendClass]}</td>
                <td className="px-4 py-3">{formatDisplayDate(t.isoDate)}</td>
                <td className="px-4 py-3">
                  <StatusPill status={t.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to="/analysis/$txId" params={{ txId: t.id }} className="text-primary hover:underline">
                    View Analysis
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
