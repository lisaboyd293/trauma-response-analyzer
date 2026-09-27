import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleAlert,
  Compass,
  Download,
  ExternalLink,
  HeartHandshake,
  Loader2,
  MessageCircleHeart,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WifiOff,
  Waves,
} from "lucide-react";

type Analysis = inferRouterOutputs<AppRouter>["trauma"]["analyze"];

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const examples = [
  "When someone is upset with me, I immediately go quiet, feel far away, and cannot find words. Afterwards I feel exhausted.",
  "I get a racing heart and scan every room for exits when plans change suddenly, even when I know I am safe.",
  "After a difficult conversation I avoid messages, sleep lightly, and replay the interaction for hours.",
];

function SectionLabel({ icon: Icon, eyebrow, title }: { icon: typeof Brain; eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-dark">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="mt-1 font-display text-[1.38rem] leading-tight text-ink">{title}</h3>
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: NonNullable<Analysis>["citations"][number]; index: number }) {
  return (
    <a className="source-card group" href={source.url} target="_blank" rel="noreferrer">
      <div className="flex items-start gap-3">
        <span className="source-index">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="source-type">{source.type}</span>
            <ExternalLink size={12} className="text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="font-medium leading-snug text-ink">{source.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{source.publisher}</p>
        </div>
      </div>
    </a>
  );
}

function AnalysisView({ analysis, onReset }: { analysis: NonNullable<Analysis>; onReset: () => void }) {
  return (
    <section id="reflection" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-20 sm:px-8">
      <div className="result-shell">
        <div className="result-topline">
          <div className="flex items-center gap-2 text-sage-dark">
            <Sparkles size={16} />
            <span className="eyebrow !text-sage-dark">Your reflection</span>
          </div>
          <button type="button" className="quiet-button" onClick={onReset}>
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        <div className="grid gap-8 border-b border-line px-6 py-8 sm:px-10 lg:grid-cols-[1fr_260px] lg:gap-14 lg:py-10">
          <div>
            <p className="eyebrow text-sage-dark">A possible pattern, not a verdict</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl leading-[1.08] text-ink sm:text-4xl">{analysis.framing}</h2>
            <p className="mt-5 max-w-2xl text-[1.02rem] leading-8 text-ink-soft">{analysis.summary}</p>
          </div>
          <div className="rounded-2xl bg-sand/55 p-5">
            <p className="eyebrow">Keep in mind</p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">A short reflection can point toward useful questions, but it cannot establish a diagnosis or explain every cause.</p>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-ink-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-sage-dark" /> Grounded in clinical and scholarly sources</div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-line px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:py-10">
            <SectionLabel icon={Waves} eyebrow="01 · Nervous system context" title={analysis.nervousSystemContext.heading} />
            <p className="text-[0.98rem] leading-7 text-ink-soft">{analysis.nervousSystemContext.body}</p>
            <div className="mt-6 space-y-3">
              {analysis.nervousSystemContext.cues.map((cue) => <div key={cue} className="soft-bullet"><span className="dot" />{cue}</div>)}
            </div>
          </div>
          <div className="border-b border-line px-6 py-8 sm:px-10 lg:py-10">
            <SectionLabel icon={Compass} eyebrow="02 · Pattern matching" title={analysis.patternMatching.heading} />
            <p className="text-[0.98rem] leading-7 text-ink-soft">{analysis.patternMatching.body}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {analysis.patternMatching.possiblePatterns.map((pattern) => (
                <div key={pattern.label} className="rounded-2xl border border-sage/20 bg-sage/8 p-4">
                  <p className="text-sm font-semibold text-ink">{pattern.label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{pattern.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="border-b border-line px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:py-10">
            <SectionLabel icon={Brain} eyebrow="03 · Nuance & variables" title="Context changes the meaning" />
            <div className="space-y-4">
              {analysis.nuanceVariables.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-ink-soft"><Check size={16} className="mt-1 shrink-0 text-sage-dark" />{item}</div>)}
            </div>
          </div>
          <div className="px-6 py-8 sm:px-10 lg:py-10">
            <SectionLabel icon={HeartHandshake} eyebrow="04 · Safe next steps" title="Small, steady ways forward" />
            <div className="space-y-3">
              {analysis.nextSteps.selfReflection.map((item) => <div key={item} className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-ink-soft">{item}</div>)}
            </div>
            <div className="mt-5 rounded-2xl border border-terracotta/20 bg-terracotta/8 p-4 text-sm leading-6 text-ink-soft">{analysis.nextSteps.professionalSupport}</div>
            <div className="mt-3 flex gap-2 text-xs leading-5 text-ink-muted"><CircleAlert size={14} className="mt-0.5 shrink-0 text-terracotta" />{analysis.nextSteps.urgentSupport}</div>
          </div>
        </div>

        <div className="border-t border-line bg-[#fbfaf7] px-6 py-8 sm:px-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow">Source grounding</p><h3 className="mt-1 font-display text-2xl text-ink">Where this reflection came from</h3></div>
            <p className="max-w-md text-right text-xs leading-5 text-ink-muted">{analysis.sourceNote}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{analysis.citations.map((source, index) => <SourceCard key={`${source.url}-${index}`} source={source} index={index} />)}</div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [experience, setExperience] = useState("");
  const [context, setContext] = useState("");
  const [analysis, setAnalysis] = useState<NonNullable<Analysis> | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const analyze = trpc.trauma.analyze.useMutation({
    onSuccess: (result) => {
      setAnalysis(result);
      window.setTimeout(() => document.getElementById("reflection")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    },
    onError: (error) => toast.error(error.message || "We couldn't complete the reflection. Please try again."),
  });
  const charCount = useMemo(() => experience.length, [experience]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setIsInstalled(mediaQuery.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const clearInstallPrompt = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    const updateOnline = () => setIsOnline(navigator.onLine);

    updateInstalled();
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") toast.success("Stillpoint is ready on your home screen.");
    setInstallPrompt(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (experience.trim().length < 20) {
      toast.error("A little more context will help us respond gently and specifically.");
      return;
    }
    analyze.mutate({ experience: experience.trim(), context: context.trim() || undefined });
  };

  const reset = () => {
    setAnalysis(null);
    setExperience("");
    setContext("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-cream text-ink">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-3" aria-label="Stillpoint home">
          <span className="brand-mark"><Waves size={17} /></span>
          <span className="font-display text-lg tracking-tight">stillpoint</span>
        </a>
        <div className="hidden items-center gap-6 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted sm:flex"><span>Educational tool</span><span className="h-1 w-1 rounded-full bg-sage" /><span>Not a diagnosis</span></div>
        <div className="header-actions">
          {!isInstalled && installPrompt && <button type="button" className="install-button" onClick={installApp}><Download size={14} /> Install</button>}
          <a className="header-link" href="#how-it-works">How it works <ArrowUpRight size={14} /></a>
        </div>
      </header>
      {!isOnline && <div className="offline-banner"><WifiOff size={14} /> Offline mode: the app shell is available, but reflections need a connection.</div>}

      <main>
        <section className="hero-grid mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sage/25 bg-sage/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark"><span className="pulse-dot" /> A pause for understanding</div>
            <h1 className="max-w-3xl font-display text-[3.3rem] leading-[0.98] tracking-[-0.04em] text-ink sm:text-[4.8rem] lg:text-[5.7rem]">What might my <span className="text-sage-dark">system</span> be trying to do?</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-ink-soft sm:text-xl">Explore a reaction with care. Stillpoint uses trauma-informed psychoeducation and current literature to help you notice patterns—without turning a question into a label.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-ink-muted"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-sage-dark" /> Probabilistic by design</span><span className="flex items-center gap-2"><BookOpen size={16} className="text-sage-dark" /> Source grounded</span></div>
          </div>
          <div className="hero-note mt-12 lg:mt-20">
            <div className="mb-5 flex items-center justify-between"><span className="eyebrow">Before we begin</span><span className="small-orbit"><MessageCircleHeart size={15} /></span></div>
            <p className="font-display text-[1.7rem] leading-tight text-ink">You do not have to prove that something was “bad enough” to be curious about your response.</p>
            <div className="mt-7 space-y-3 border-t border-ink/10 pt-5 text-sm leading-6 text-ink-soft"><p>We will look at possible nervous-system patterns, the context around them, and gentle next steps.</p><p className="text-ink-muted">This tool does not diagnose, assess immediate safety, or replace a clinician.</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="analyzer-card">
            <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
              <div className="border-b border-line bg-sand/45 p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-10">
                <p className="eyebrow">A quiet starting point</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink">Share what you noticed.</h2>
                <p className="mt-4 text-sm leading-6 text-ink-soft">You can describe a situation, body sensation, emotion, thought, or what happened afterward. There is no “right” way to write it.</p>
                <div className="mt-8 space-y-5" id="how-it-works">
                  {[{ n: "01", title: "You describe", body: "A moment or pattern in your own words." }, { n: "02", title: "We cross-check", body: "Clinical guidance and scholarly records are prioritized." }, { n: "03", title: "You receive", body: "A gentle, structured reflection with sources." }].map((step) => <div key={step.n} className="flex gap-4"><span className="step-number">{step.n}</span><div><p className="text-sm font-semibold text-ink">{step.title}</p><p className="mt-1 text-sm leading-5 text-ink-muted">{step.body}</p></div></div>)}
                </div>
              </div>
              <form className="p-6 sm:p-9 lg:p-10" onSubmit={submit}>
                <label htmlFor="experience" className="eyebrow">Your experience</label>
                <textarea id="experience" value={experience} onChange={(event) => setExperience(event.target.value)} maxLength={4500} placeholder="For example: When plans change suddenly, I feel a wave of panic, start scanning for problems, and then want to cancel everything…" className="reflection-input mt-3 min-h-48 w-full resize-y" />
                <div className="mt-2 flex justify-between text-xs text-ink-muted"><span>Try to include what happened before, during, and after.</span><span>{charCount}/4500</span></div>
                <label htmlFor="context" className="mt-7 block eyebrow">Anything else that feels relevant <span className="normal-case tracking-normal text-ink-muted">(optional)</span></label>
                <input id="context" value={context} onChange={(event) => setContext(event.target.value)} maxLength={600} placeholder="Frequency, sleep, current stress, or what helps you recover" className="reflection-input mt-3 w-full" />
                <div className="mt-6 flex flex-wrap gap-2">{examples.map((example) => <button key={example} type="button" className="example-chip" onClick={() => setExperience(example)}>{example.slice(0, 34)}…</button>)}</div>
                <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xs text-xs leading-5 text-ink-muted">Your reflection is not saved by this prototype. Topic signals may be used to retrieve relevant literature.</p><button type="submit" className="primary-button" disabled={analyze.isPending}>{analyze.isPending ? <><Loader2 size={16} className="animate-spin" /> Looking gently…</> : <>Explore this pattern <ChevronRight size={17} /></>}</button></div>
              </form>
            </div>
          </div>
        </section>

        {!analysis && <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8"><div className="grid gap-4 md:grid-cols-3"><div className="mini-card"><span className="mini-icon"><Waves size={17} /></span><h3>Body first</h3><p>Notice sensations as information, not evidence that you are doing something wrong.</p></div><div className="mini-card"><span className="mini-icon"><BookOpen size={17} /></span><h3>Sources matter</h3><p>Each reflection is anchored in clinical organizations and scholarly search results.</p></div><div className="mini-card"><span className="mini-icon"><HeartHandshake size={17} /></span><h3>Gentle next steps</h3><p>Receive small, optional ideas and clear reminders about professional support.</p></div></div></section>}
        {analysis && <AnalysisView analysis={analysis} onReset={reset} />}
      </main>

      <footer className="border-t border-line px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs leading-5 text-ink-muted sm:flex-row sm:items-center sm:justify-between"><span>stillpoint · a trauma-informed educational prototype</span><span>For reflection, not diagnosis. If you are in immediate danger, contact local emergency services.</span></div></footer>
    </div>
  );
}
