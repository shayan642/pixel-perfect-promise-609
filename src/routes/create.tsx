import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FilePenLine, LayoutTemplate } from "lucide-react";
import { AssumptionFields } from "@/components/gl/AssumptionFields";
import { AreaField, Panel, SelectField, TextField } from "@/components/gl/parts";
import { useGL } from "@/lib/gl-store";
import {
  CATEGORY_LABEL,
  INVESTMENT_TEMPLATES,
  SPEND_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  aed,
  analysisCapability,
  buildTransaction,
  defaultAssumptions,
  defaultCategory,
  defaultSpendClass,
  derivedAmount,
  type Assumptions,
  type CategoryId,
  type SpendClass,
  type TxStatus,
  type TxTypeId,
} from "@/lib/greenledger";
import { defaultWorkforce, type WorkforceRole } from "@/lib/workforce";
import { toCreatePrefill } from "@/lib/voice-extract";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Plan Investment | MIZAN AI" },
      { name: "description", content: "Define a proposed investment and review its expected financial and operational impact." },
    ],
  }),
  component: CreateInvestment,
});

type Mode = "choose" | "template" | "manual";

function CreateInvestment() {
  const navigate = useNavigate();
  const { transactions, addTransaction, investmentDraft, setInvestmentDraft } = useGL();
  const [mode, setMode] = useState<Mode>("choose");
  const [draftBanner, setDraftBanner] = useState<string | null>(null);
  const [templateReady, setTemplateReady] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TxTypeId>("gpu_servers");
  const [projectName, setProjectName] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("infrastructure");
  const [spendClass, setSpendClass] = useState<SpendClass>("capex");
  const [entity, setEntity] = useState("Fictional Public Services Authority");
  const [isoDate, setIsoDate] = useState("2026-10-27");
  const [status, setStatus] = useState<TxStatus>("draft");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions("gpu_servers"));
  const [workforce, setWorkforce] = useState<WorkforceRole[]>(defaultWorkforce("gpu_servers"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investmentDraft) return;
    const pre = toCreatePrefill(investmentDraft);
    const fromSample = investmentDraft.source === "sample";
    setType(pre.type);
    setCategory(pre.category);
    setSpendClass(pre.spendClass);
    setProjectName(pre.projectName);
    setTitle(pre.title);
    setPurpose(pre.purpose);
    setDescription(pre.description);
    setAssumptions(pre.assumptions);
    setWorkforce(pre.workforce);
    setStatus("draft");
    setError(null);
    setMode("manual");
    setDraftBanner(
      fromSample
        ? "Prefilling from the illustrative sample idea. Review every field before creating a record."
        : "Prefilling from a locally structured voice draft. Review every field. Uncertain values were left blank.",
    );
    setInvestmentDraft(null);
  }, [investmentDraft, setInvestmentDraft]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INVESTMENT_TEMPLATES;
    return INVESTMENT_TEMPLATES.filter(
      (t) => TYPE_LABEL[t.type].toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q),
    );
  }, [query]);

  function applyTemplate(t: TxTypeId) {
    const tmpl = INVESTMENT_TEMPLATES.find((x) => x.type === t)!;
    const next = defaultAssumptions(t);
    setType(t);
    setCategory(defaultCategory(t));
    setSpendClass(defaultSpendClass(t));
    setProjectName(tmpl.defaultProject);
    setTitle(tmpl.defaultTitle);
    setPurpose(tmpl.defaultPurpose);
    setDescription("");
    setAssumptions(next);
    setWorkforce(defaultWorkforce(t));
    setStatus("draft");
    setError(null);
    setTemplateReady(true);
    setMode("template");
  }

  function startManual() {
    setType("other");
    setCategory("infrastructure");
    setSpendClass("mixed");
    setProjectName("");
    setTitle("");
    setPurpose("");
    setDescription("");
    setAssumptions(defaultAssumptions("other"));
    setWorkforce(defaultWorkforce("other"));
    setError(null);
    setMode("manual");
  }

  function onTypeChange(next: TxTypeId) {
    setType(next);
    setCategory(defaultCategory(next));
    setSpendClass(defaultSpendClass(next));
    setAssumptions(defaultAssumptions(next));
    setWorkforce(defaultWorkforce(next));
  }

  function submit() {
    if (!projectName.trim() || !title.trim()) {
      setError("Project name and transaction name are required.");
      return;
    }
    if (!isoDate) {
      setError("A transaction date is required.");
      return;
    }
    const amount = derivedAmount(assumptions);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Recorded amount must be greater than zero. Check the assumptions for this type.");
      return;
    }
    const tx = buildTransaction({
      existing: transactions,
      type,
      projectName,
      title,
      category,
      spendClass,
      entity,
      isoDate,
      status,
      purpose,
      description,
      assumptions,
      workforce,
    });
    addTransaction(tx);
    navigate({ to: "/analysis/$txId", params: { txId: tx.id } });
  }

  if (mode === "choose") {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Plan Investment</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Define a proposed investment and review its expected financial and operational impact. Planning does not
            approve or commit expenditure.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("template")}
            className="rounded-2xl border border-border bg-card p-6 text-left transition hover:border-primary/60"
          >
            <LayoutTemplate className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Use a predefined template</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select an investment type. Assumptions are filled in for you and remain fully editable before the record
              is created.
            </p>
          </button>
          <button
            type="button"
            onClick={startManual}
            className="rounded-2xl border border-border bg-card p-6 text-left transition hover:border-primary/60"
          >
            <FilePenLine className="h-6 w-6 text-gold" />
            <h2 className="mt-4 text-xl font-semibold">Enter details manually</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter project details yourself. Only project name, transaction name and date are required.
            </p>
          </button>
        </div>
        <Link to="/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to explorer
        </Link>
      </div>
    );
  }

  if (mode === "template" && !templateReady) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <button type="button" onClick={() => setMode("choose")} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All planning options
        </button>
        <h1 className="text-3xl font-bold">Choose a template</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search investment types"
          className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTemplates.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => applyTemplate(t.type)}
              className="rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/60"
            >
              <p className="text-xs uppercase tracking-wider text-gold">{CATEGORY_LABEL[defaultCategory(t.type)]}</p>
              <h2 className="mt-2 font-semibold">{TYPE_LABEL[t.type]}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => {
          if (mode === "template") {
            setTemplateReady(false);
          } else {
            setMode("choose");
          }
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {mode === "template" ? "Choose a different template" : "All planning options"}
      </button>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">
          {mode === "template" ? "Template (still editable)" : "Manual entry"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Review proposed investment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saving adds the proposal to this session only. It does not approve or commit expenditure.
        </p>
        {draftBanner && (
          <p className="mt-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">{draftBanner}</p>
        )}
      </div>

      <Panel title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Project name" required value={projectName} onChange={setProjectName} />
          <TextField label="Transaction / investment name" required value={title} onChange={setTitle} />
          <SelectField
            label="Investment category"
            required
            value={category}
            onChange={setCategory}
            options={(Object.keys(CATEGORY_LABEL) as CategoryId[]).map((k) => ({ value: k, label: CATEGORY_LABEL[k] }))}
          />
          <SelectField
            label="Transaction type"
            required
            value={type}
            onChange={onTypeChange}
            options={(Object.keys(TYPE_LABEL) as TxTypeId[]).map((k) => ({ value: k, label: TYPE_LABEL[k] }))}
          />
          <label className="block">
            <span className="text-xs text-muted-foreground">
              Transaction date <span className="text-gold">*</span>
            </span>
            <input
              type="date"
              value={isoDate}
              onChange={(e) => setIsoDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={(Object.keys(STATUS_LABEL) as TxStatus[]).map((k) => ({ value: k, label: STATUS_LABEL[k] }))}
          />
          <SelectField
            label="Spend classification"
            value={spendClass}
            onChange={setSpendClass}
            options={(Object.keys(SPEND_LABEL) as SpendClass[]).map((k) => ({ value: k, label: SPEND_LABEL[k] }))}
          />
          <TextField label="Entity (fictional)" value={entity} onChange={setEntity} />
        </div>
        <div className="mt-4 grid gap-4">
          <AreaField label="Business purpose" value={purpose} onChange={setPurpose} placeholder="Why is this investment being considered?" />
          <AreaField label="Description (optional)" value={description} onChange={setDescription} />
        </div>
      </Panel>

      <Panel title={`Assumptions: ${TYPE_LABEL[type]}`}>
        <p className="mb-3 text-xs text-muted-foreground">
          Analysis available for this type: {analysisCapability(type) === "pilot" ? "limited envelope only" : analysisCapability(type)}.
          Recorded amount {aed(derivedAmount(assumptions))}.
        </p>
        <AssumptionFields value={assumptions} onChange={setAssumptions} workforce={workforce} onWorkforceChange={setWorkforce} />
      </Panel>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Check className="h-4 w-4" /> Save proposed investment
        </button>
        <Link to="/transactions" className="inline-flex items-center rounded-lg border border-border px-4 py-2.5 text-sm">
          Cancel
        </Link>
      </div>
    </div>
  );
}
