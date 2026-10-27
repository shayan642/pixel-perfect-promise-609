import { createFileRoute, Link } from "@tanstack/react-router";
import { TxCard } from "@/components/gl/parts";
import { useGL } from "@/lib/gl-store";
import { TX_META, aed, calcBuilding, calcVehicle, num } from "@/lib/greenledger";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction Explorer — GreenLedger AI" },
      { name: "description", content: "Browse demonstration government transactions and open their connected review." },
      { property: "og:title", content: "Transaction Explorer — GreenLedger AI" },
      { property: "og:description", content: "Browse demonstration transactions." },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const { vehicle, building } = useGL();
  const v = calcVehicle(vehicle);
  const b = calcBuilding(building);
  const rows = [
    { id: "vehicles" as const, amount: vehicle.purchaseCost, dep: v.annualDep, co2: `+${num(v.annualTco2e, 1)} emitted` },
    { id: "building" as const, amount: building.investment, dep: b.annualDep, co2: `−${num(b.annualTco2eAvoided, 1)} avoided` },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="text-3xl font-bold">Transaction Explorer</h1>
      <div className="grid gap-5 lg:grid-cols-2">
        <TxCard id="vehicles" />
        <TxCard id="building" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              {["Reference", "Description", "Amount", "Annual depreciation", "tCO₂e / yr (est.)", ""].map((h) => (
                <th key={h} className="px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="tnum px-5 py-3">{TX_META[r.id].ref}</td>
                <td className="px-5 py-3">{TX_META[r.id].title}</td>
                <td className="tnum px-5 py-3">{aed(r.amount)}</td>
                <td className="tnum px-5 py-3">{aed(r.dep)}</td>
                <td className="tnum px-5 py-3">{r.co2}</td>
                <td className="px-5 py-3 text-right">
                  <Link to="/analysis/$txId" params={{ txId: r.id }} className="text-primary hover:underline">Review →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
