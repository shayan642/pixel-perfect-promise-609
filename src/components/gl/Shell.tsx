import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, LayoutGrid, ListTree, Network, Plus, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { VoiceAssistantTrigger } from "@/components/gl/VoiceAssistant";
import { useGL } from "@/lib/gl-store";

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-secondary"
  }`;
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { reset, transactions } = useGL();
  const fromPath = path.match(/^\/(analysis|report)\/([^/]+)/)?.[2];
  const focusId =
    (fromPath && transactions.some((t) => t.id === fromPath) ? fromPath : transactions[0]?.id) ?? "gpu-compute";

  const crumb = path.startsWith("/create")
    ? "Plan Investment"
    : path.startsWith("/transactions")
      ? "Transaction Explorer"
      : path.startsWith("/analysis")
        ? "Integrated Analysis"
        : path.startsWith("/report")
          ? "Decision Report"
          : "Overview";

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar uae-pattern md:flex print:hidden">
        <div className="px-6 py-6">
          <div className="font-display text-lg font-bold tracking-wide text-foreground">
            MIZAN <span className="text-primary">AI</span>
          </div>
          <p className="mt-0.5 font-arabic text-sm text-gold" lang="ar" dir="rtl">
            ميزان
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Intelligence with Integration.</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <Link to="/" className={navClass(path === "/")}>
            <LayoutGrid className="h-4 w-4" /> Overview
          </Link>
          <Link to="/transactions" className={navClass(path.startsWith("/transactions"))}>
            <ListTree className="h-4 w-4" /> Transaction Explorer
          </Link>
          <Link to="/analysis/$txId" params={{ txId: focusId }} className={navClass(path.startsWith("/analysis"))}>
            <Network className="h-4 w-4" /> Integrated Analysis
          </Link>
          <Link to="/report/$txId" params={{ txId: focusId }} className={navClass(path.startsWith("/report"))}>
            <FileText className="h-4 w-4" /> Decision Report
          </Link>
          <div className="mt-2 flex items-center gap-1">
            <Link
              to="/create"
              className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                path.startsWith("/create") ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
              }`}
            >
              <Plus className="h-4 w-4" /> Plan Investment
            </Link>
            <VoiceAssistantTrigger compact />
          </div>
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button
            onClick={reset}
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset records
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 print:hidden">
          <div className="flex gap-3 overflow-x-auto md:hidden">
            <Link to="/" className={`whitespace-nowrap text-xs ${path === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Overview
            </Link>
            <Link
              to="/transactions"
              className={`whitespace-nowrap text-xs ${path.startsWith("/transactions") ? "text-primary" : "text-muted-foreground"}`}
            >
              Explorer
            </Link>
            <Link
              to="/analysis/$txId"
              params={{ txId: focusId }}
              className={`whitespace-nowrap text-xs ${path.startsWith("/analysis") ? "text-primary" : "text-muted-foreground"}`}
            >
              Analysis
            </Link>
            <Link
              to="/report/$txId"
              params={{ txId: focusId }}
              className={`whitespace-nowrap text-xs ${path.startsWith("/report") ? "text-primary" : "text-muted-foreground"}`}
            >
              Report
            </Link>
            <Link to="/create" className="whitespace-nowrap text-xs text-primary">
              Plan
            </Link>
            <VoiceAssistantTrigger compact />
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            <span className="text-foreground">MIZAN AI</span>
            <span className="mx-2 text-border">/</span>
            {crumb}
            <span className="mx-2 text-border">/</span>
            AI Investment Intelligence · Financial Governance · Sustainability
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
        <footer className="border-t border-border px-6 py-4 print:hidden">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            MIZAN AI is a hackathon concept. It is not an official UAE government system. Figures are illustrative and
            for demonstration only.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      Illustrative
    </span>
  );
}
