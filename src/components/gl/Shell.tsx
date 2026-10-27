import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, ListTree, Network, FileText, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useGL } from "@/lib/gl-store";

const NAV = [
  { label: "Overview", to: "/", icon: LayoutGrid, match: (p: string) => p === "/" },
  { label: "Transaction Explorer", to: "/transactions", icon: ListTree, match: (p: string) => p.startsWith("/transactions") },
  { label: "Integrated Analysis", to: "/analysis/vehicles", icon: Network, match: (p: string) => p.startsWith("/analysis") },
  { label: "Decision Report", to: "/report/vehicles", icon: FileText, match: (p: string) => p.startsWith("/report") },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { reset } = useGL();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar uae-pattern md:flex print:hidden">
        <div className="px-6 py-6">
          <div className="font-display text-lg font-bold tracking-wide text-foreground">
            GREENLEDGER <span className="text-primary">AI</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">One transaction. Four perspectives.</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((n) => {
            const active = n.match(path);
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button
            onClick={reset}
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo assumptions
          </button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Hackathon concept. Not an existing UAE government system. All figures are synthetic.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 print:hidden">
          <div className="flex gap-3 overflow-x-auto md:hidden">
            {NAV.map((n) => (
              <Link key={n.label} to={n.to} className={`whitespace-nowrap text-xs ${n.match(path) ? "text-gold" : "text-muted-foreground"}`}>
                {n.label}
              </Link>
            ))}
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            Workspace / <span className="text-foreground">{NAV.find((n) => n.match(path))?.label}</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs text-gold">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> Synthetic Demo Data
          </span>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold">
      Synthetic Demo Data
    </span>
  );
}
