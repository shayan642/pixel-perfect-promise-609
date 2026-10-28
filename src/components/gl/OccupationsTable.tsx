import { occupationSupplyDemand, WORKFORCE_DISCLOSURE, type OccupationView } from "@/lib/workforce";
import type { WorkforceRole } from "@/lib/workforce";

function peopleLabel(n: number | null) {
  return n == null ? "Not recorded" : String(n);
}

function evidenceClass(o: OccupationView["outlook"]) {
  if (o === "incomplete") return "border-border text-muted-foreground";
  if (o === "shortage") return "border-uae-red/40 bg-uae-red/10 text-uae-red";
  if (o === "surplus") return "border-primary/40 bg-primary/10 text-primary";
  return "border-gold/40 bg-gold/10 text-gold";
}

export function OccupationsTable({ roles, compact }: { roles: WorkforceRole[]; compact?: boolean }) {
  const rows = occupationSupplyDemand(roles);
  if (!rows.length) return null;
  return (
    <div className="space-y-3">
      <p className={compact ? "text-xs opacity-70" : "text-xs text-muted-foreground"}>{WORKFORCE_DISCLOSURE}</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-medium">Occupation</th>
              <th className="px-3 py-2 font-medium">Additional people required</th>
              <th className="px-3 py-2 font-medium">Evidence status</th>
              <th className="px-3 py-2 font-medium">Suggested action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.occupation} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-medium">{row.occupation}</td>
                <td className="tnum px-3 py-2.5">{peopleLabel(row.additionalRequired)}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${evidenceClass(row.outlook)}`}>
                    {row.outlookLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
