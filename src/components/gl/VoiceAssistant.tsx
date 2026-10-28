import { useNavigate } from "@tanstack/react-router";
import { Eraser, ListTree, Mic, PencilLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGL } from "@/lib/gl-store";
import {
  SAMPLE_IDEA_LABEL,
  SAMPLE_IDEA_TRANSCRIPT,
  draftSummary,
  emptyDraft,
  filledFieldCount,
  structureTranscript,
  type InvestmentVoiceDraft,
} from "@/lib/voice-extract";

type ListenState = "idle" | "listening" | "processing" | "unsupported" | "denied" | "error";

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechResultEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

function speechCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceAssistantTrigger({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open voice investment assistant"
        title="Voice investment assistant"
        className={
          compact
            ? "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            : "inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm text-primary hover:bg-primary/20"
        }
      >
        <Mic className="h-4 w-4" />
        {compact ? <span className="sr-only">Voice assistant</span> : <span className="hidden sm:inline">Voice</span>}
      </button>
      <VoiceAssistantDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function VoiceAssistantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { setInvestmentDraft } = useGL();
  const recRef = useRef<SpeechRec | null>(null);
  const listeningRef = useRef(false);
  const [listen, setListen] = useState<ListenState>("idle");
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [draft, setDraft] = useState<InvestmentVoiceDraft | null>(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    if (!open) {
      listeningRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      setListen((s) => (s === "listening" ? "idle" : s));
      setInterim("");
    }
  }, [open]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function stopRec() {
    listeningRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListen((s) => (s === "listening" ? "idle" : s));
    setInterim("");
  }

  function toggleListen() {
    const Ctor = speechCtor();
    if (!Ctor) {
      setListen("unsupported");
      setStatus("This browser does not support SpeechRecognition. Use Try sample idea, or type the transcript.");
      return;
    }
    if (listeningRef.current) {
      stopRec();
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-AE";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let finals = "";
      let live = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i];
        if (!row) continue;
        const piece = row[0]?.transcript ?? "";
        if (row.isFinal) finals += piece;
        else live += piece;
      }
      if (finals) {
        setTranscript((prev) => `${prev}${prev ? " " : ""}${finals.trim()}`.trim());
        setIsSample(false);
        setDraft(null);
      }
      setInterim(live);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setListen("denied");
        setStatus("Microphone permission was denied. You can type a transcript or try the sample idea.");
      } else if (ev.error === "no-speech") {
        setStatus("No speech was heard. Try again, or use the sample idea.");
      } else {
        setListen("error");
        setStatus(`Recognition error (${ev.error}). Type the idea, or use the sample.`);
      }
      listeningRef.current = false;
    };
    rec.onend = () => {
      if (listeningRef.current) {
        try {
          rec.start();
        } catch {
          listeningRef.current = false;
          setListen("idle");
        }
      } else {
        setListen("idle");
        setInterim("");
      }
    };
    try {
      rec.start();
      recRef.current = rec;
      listeningRef.current = true;
      setListen("listening");
      setStatus("Listening. Speak an investment idea, then Structure idea.");
    } catch {
      setListen("error");
      setStatus("Could not start the microphone. Check browser permissions.");
    }
  }

  function onTranscriptChange(value: string) {
    setTranscript(value);
    setIsSample(false);
    setDraft(null);
  }

  function clearAll() {
    stopRec();
    setTranscript("");
    setInterim("");
    setDraft(null);
    setIsSample(false);
    setStatus("");
    setListen(speechCtor() ? "idle" : "unsupported");
  }

  function loadSample() {
    stopRec();
    setTranscript(SAMPLE_IDEA_TRANSCRIPT);
    setInterim("");
    setIsSample(true);
    setDraft(null);
    setStatus("Loaded an illustrative sample. This is not speech input.");
  }

  function structure() {
    stopRec();
    setListen("processing");
    const source = isSample ? "sample" : "speech";
    const next = structureTranscript(transcript.trim() || interim.trim(), source);
    if (!next.transcript) {
      setDraft(emptyDraft(source));
      setListen("idle");
      setStatus("Nothing to structure. Speak, type, or load the sample idea.");
      return;
    }
    setDraft(next);
    setListen("idle");
    const n = filledFieldCount(next);
    setStatus(
      n === 0
        ? "Transcript kept, but no form fields were identifiable. Complete them on the create form."
        : `Structured ${n} identifiable field${n === 1 ? "" : "s"} locally. Blank fields still need your input. No live model is used.`,
    );
  }

  function reviewDraft() {
    const source = isSample ? "sample" : transcript.trim() ? "speech" : "typed";
    const payload = draft ?? structureTranscript(transcript.trim(), source);
    if (!payload.transcript) {
      setStatus("Add a transcript before opening the investment form.");
      return;
    }
    setInvestmentDraft(payload);
    onOpenChange(false);
    void navigate({ to: "/create" });
  }

  const rows = draft ? draftSummary(draft) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Voice investment assistant</DialogTitle>
          <DialogDescription>
            Speak or type an investment idea, edit the transcript, then structure it into the Plan Investment form.
            Recognition stays in the browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <button
            type="button"
            onClick={toggleListen}
            aria-pressed={listen === "listening"}
            className={`flex h-20 w-20 items-center justify-center rounded-full border transition ${
              listen === "listening"
                ? "border-primary bg-primary/20 text-primary"
                : listen === "error" || listen === "denied"
                  ? "border-uae-red/50 bg-uae-red/10 text-uae-red"
                  : "border-border bg-secondary text-foreground hover:border-primary/50"
            }`}
          >
            <Mic className={`h-7 w-7 ${listen === "listening" ? "animate-pulse" : ""}`} />
          </button>
          <p className="text-xs text-muted-foreground">
            {listen === "listening"
              ? "Listening"
              : listen === "processing"
                ? "Structuring locally"
                : listen === "unsupported"
                  ? "Speech recognition unavailable"
                  : listen === "denied"
                    ? "Microphone blocked"
                    : listen === "error"
                      ? "Recognition error"
                      : "Microphone idle"}
          </p>
        </div>

        {status && <p className="rounded-lg border border-white/10 bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{status}</p>}

        {isSample && (
          <p className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
            {SAMPLE_IDEA_LABEL}. This is not speech input.
          </p>
        )}

        <label className="block">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <PencilLine className="h-3.5 w-3.5" /> Transcript
          </span>
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            rows={5}
            placeholder="Speak, type, or load the sample idea…"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {interim ? <p className="mt-1 text-xs italic text-primary/80">{interim}</p> : null}
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={structure}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <ListTree className="h-4 w-4" /> Structure idea
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center rounded-lg border border-gold/40 px-3 py-2 text-sm text-gold hover:bg-gold/10"
          >
            Try sample idea
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Eraser className="h-4 w-4" /> Clear
          </button>
        </div>

        {draft && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-sand">Draft fields (review required)</p>
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`max-w-[60%] text-right ${row.value ? "" : "text-gold"}`}>
                  {row.value || "Needs input"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={reviewDraft}
          className="inline-flex w-full items-center justify-center rounded-lg border border-primary/50 bg-primary/15 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/25"
        >
          Review Investment Draft
        </button>
      </DialogContent>
    </Dialog>
  );
}
