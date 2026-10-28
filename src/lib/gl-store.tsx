import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { SEED_TRANSACTIONS, syncAmount, type Transaction } from "./greenledger";
import type { InvestmentVoiceDraft } from "./voice-extract";

interface Store {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updater: (tx: Transaction) => Transaction) => void;
  reset: () => void;
  investmentDraft: InvestmentVoiceDraft | null;
  setInvestmentDraft: (draft: InvestmentVoiceDraft | null) => void;
}

const Ctx = createContext<Store | null>(null);

export function GLProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [investmentDraft, setInvestmentDraft] = useState<InvestmentVoiceDraft | null>(null);
  const value = useMemo<Store>(
    () => ({
      transactions,
      addTransaction: (tx) => setTransactions((xs) => [tx, ...xs]),
      updateTransaction: (id, updater) =>
        setTransactions((xs) => xs.map((t) => (t.id === id ? syncAmount(updater(t)) : t))),
      reset: () => {
        setTransactions(SEED_TRANSACTIONS);
        setInvestmentDraft(null);
      },
      investmentDraft,
      setInvestmentDraft,
    }),
    [transactions, investmentDraft],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGL() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGL outside provider");
  return c;
}

export function useTransaction(id: string) {
  const { transactions, updateTransaction } = useGL();
  const tx = transactions.find((t) => t.id === id);
  return { tx, updateTransaction };
}
