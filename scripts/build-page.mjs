/**
 * Generates the revamped portfolio page from reports/inventory.json.
 *
 * Counts, links and project records come from the manifest rather than from
 * memory, so the page and the evidence report cannot disagree. Writes
 * index.new.html; promoting it over index.html is a separate, deliberate step.
 */
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("reports/inventory.json", "utf8"));
const built = new Date().toISOString().slice(0, 10);

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Five flagship systems. Repository URLs are fixed by the brief. */
const FLAGSHIP = [
  {
    key: "footnote", name: "Footnote", kicker: "An auditable research assistant for SEC annual reports",
    problem: "A language model will answer questions about a company's filings fluently and give no way to check the figures. In finance, a plausible wrong number costs more than no answer.",
    system: "Routes each question to validated SQL over XBRL figures, hybrid search over 10-K text, or both. Every change is computed in code, every figure, calculation and quotation is re-verified before release, and questions the filings cannot support are refused.",
    built: "The EDGAR ingestion and page-level lineage, the router and LangGraph pipeline, the verifier, a 72-question evaluation, and a browser build that runs the full Python pipeline on GitHub Pages with no server.",
    matters: "Every number arrives with the statement and page it came from, and the system says so when it does not know.",
    flow: ["SEC EDGAR", "PostgreSQL + pgvector", "Router", "SQL / hybrid retrieval", "Verifier", "Cited answer"],
    stack: ["Python", "PostgreSQL", "pgvector", "FastAPI", "LangGraph", "Pyodide"],
    metrics: [
      { label: "Correct", value: "98.6%", note: "71 of 72 hand-written questions across eight categories", provenance: "measured" },
      { label: "Refusals", value: "100%", note: "precision and recall on the 18 questions that should be declined", provenance: "measured" },
      { label: "Corpus", value: "81 reports", note: "10-K filings from 15 companies, 97.1% of figures traced to the printed page", provenance: "measured" }
    ],
    source: "https://github.com/pablowilliams/footnote",
    live: "https://pablowilliams.github.io/footnote/", liveNote: "",
    liveLabel: "Live demo",
    liveAria: "Open the Footnote live demo in a new tab. The first visit downloads about 120 MB and takes up to a minute",
    caseStudy: "https://pablowilliams.github.io/footnote/docs/case-study.html",
    shot: {
      src: "assets/previews/footnote.webp", width: 1400, height: 954,
      alt: "A Footnote answer marked verified: Apple's revenue rose from $383.3 billion in fiscal 2023 to $416.2 billion in fiscal 2025, with each figure cited to the consolidated statement of operations and page of the 10-K.",
      caption: "A verified answer, each figure cited to its statement and page"
    }
  },
  {
    key: "longstop", name: "Longstop", kicker: "Failed-merger detection in SEC filings",
    problem: "A merger that quietly dies leaves no announcement. The evidence is scattered across 8-K exhibits and proxy fields that disagree with each other.",
    system: "Builds a deal dataset from SEC EDGAR, runs an 8-K rules engine over the filings, and reconciles proxy fields that contradict one another before anything is counted.",
    built: "The EDGAR ingestion, the rules engine, the ambiguity resolution and the reconciliation logic.",
    matters: "A dataset you can audit deal by deal, rather than a number you have to trust.",
    flow: ["SEC EDGAR", "Deal extraction", "8-K rules engine", "Ambiguity resolution", "Reconciled dataset"],
    stack: ["Python", "SQL", "SEC EDGAR", "NLP"],
    metrics: [
      { label: "Deals", value: "10,051", note: "dataset built from filings", provenance: "measured" },
      { label: "Resolved", value: "437", note: "ambiguous filings, 216 unrelated contracts removed", provenance: "measured" },
      { label: "Reconciliation", value: "16% to 43%", note: "proxy-field agreement after the rules engine", provenance: "measured" }
    ],
    source: "https://github.com/pablowilliams/longstop",
    live: "https://pablowilliams.github.io/longstop/", liveNote: ""
  },
  {
    key: "touchstone", name: "Touchstone", kicker: "An assistant that refuses unverified numbers",
    problem: "An assistant that invents one figure is worse than no assistant, because nobody can tell which figure it was.",
    system: "Computes every quantitative claim from a system of record and reconciles it against source evidence before release. Where a figure cannot be grounded, it abstains and names what was missing.",
    built: "The retrieval stack, the evidence gate, the deterministic verifier and the adversarial test harness that attacks it.",
    matters: "Hallucinated figures become structurally impossible rather than merely unlikely.",
    flow: ["Question", "Routing", "Hybrid retrieval", "Evidence gate", "Deterministic verifier", "Answer or abstain"],
    stack: ["Python", "FastAPI", "RAG", "pytest"],
    metrics: [
      { label: "Attacks blocked", value: "59 of 59", note: "adversarial attempts to slip an ungrounded figure through", provenance: "measured" },
      { label: "Unsupported claims", value: "0", note: "across 146 evaluation questions", provenance: "measured" },
      { label: "Corpus", value: "214 docs", note: "24 funds, 12 metrics in the registry", provenance: "measured" }
    ],
    source: "https://github.com/pablowilliams/touchstone", live: "", liveNote: "source only"
  },
  {
    key: "signalops", name: "SignalOps", kicker: "Data incidents caught before dashboards drift",
    problem: "By the time a dashboard looks wrong, the decisions made from it have already happened.",
    system: "Detects data incidents upstream of reporting, scoring each one against a planted-truth holdout so the detector is measured rather than assumed.",
    built: "The detection pipeline, the planted-truth evaluation and the episode-level scoring that replaced raw alert counts.",
    matters: "False alarms fell far enough that the alerts are worth reading.",
    flow: ["Pipeline telemetry", "Detector ensemble", "Episode scoring", "Incident queue", "Evidence"],
    stack: ["Python", "dbt", "FastAPI", "Next.js"],
    metrics: [
      { label: "Precision", value: "87.9%", note: "on a synthetic planted-truth holdout", provenance: "measured" },
      { label: "Recall / F1", value: "93.5% / 90.6%", note: "same holdout", provenance: "measured" },
      { label: "False alarms", value: "111 to 4", note: "false-positive episodes after episode scoring", provenance: "measured" }
    ],
    source: "https://github.com/pablowilliams/signalops",
    live: "https://pablowilliams.github.io/signalops/", liveNote: ""
  },
  {
    key: "stratum-analytics", name: "Stratum Analytics", kicker: "Risk explained across a family-office portfolio",
    problem: "Risk reporting tends to produce a number without the chain of reasoning that would let anyone argue with it.",
    system: "A 59-model warehouse over a simulated portfolio, with controls that catch bad trades before they reach a report, and VaR explained back to its inputs.",
    built: "The warehouse models, the control suite and the reporting layer.",
    matters: "Every risk figure can be traced back to the trades that produced it.",
    flow: ["Trade and position data", "59-model warehouse", "Control suite", "VaR and exposure", "Report"],
    stack: ["Tableau", "SQL", "Python", "DuckDB", "VaR"],
    metrics: [
      { label: "Models", value: "59", note: "warehouse models over a simulated portfolio", provenance: "measured" },
      { label: "Errors caught", value: "16 of 16", note: "planted trade errors, zero false alarms", provenance: "measured" },
      { label: "Portfolio", value: "EUR 755m", note: "simulated, not a real book", provenance: "synthetic" }
    ],
    source: "https://github.com/pablowilliams/stratum-analytics",
    live: "https://pablowilliams.github.io/stratum-analytics/", liveNote: ""
  }
];

const GROUPS = [
  { id: "flagship", label: "Flagship" },
  { id: "live", label: "Live apps" },
  { id: "research", label: "Research" },
  { id: "terminal", label: "Terminals" },
  { id: "monograph", label: "Monographs" },
  { id: "essay", label: "Essays" }
];

const DOMAINS = ["AI/ML", "Data Engineering", "Quantitative Finance", "Risk/Operations", "Frontend", "Research"];

/** Classify a migrated project into one group and one domain, from its own fields. */
/** @param {any} p */
function classify(p) {
  const t = `${p.title} ${p.category} ${p.subtitle ?? ""} ${(p.tags ?? []).join(" ")} ${p.stack.join(" ")}`.toLowerCase();
  let group = p.kind === "live" ? "live" : "research";
  if (/terminal|monte carlo/.test(t)) group = "terminal";
  else if (/monograph/.test(t)) group = "monograph";
  else if (/essay|interactive essay/.test(t)) group = "essay";
  let domain = "Research";
  if (/risk|fraud|incident|anomaly|ops|operation|compliance/.test(t)) domain = "Risk/Operations";
  else if (/pipeline|dbt|airflow|duckdb|etl|warehouse|sql|postgres/.test(t)) domain = "Data Engineering";
  else if (/equity|portfolio|volatility|option|trading|market|credit|bankrupt|valuation|alpha|execution/.test(t)) domain = "Quantitative Finance";
  else if (/react|three\.js|webgl|webgpu|browser|frontend|visualis|dashboard/.test(t)) domain = "Frontend";
  else if (/llm|rag|transformer|bert|model|learning|nlp|embedding|agent|neural/.test(t)) domain = "AI/ML";
  return { group, domain };
}

/** Merge records that exist in more than one legacy section into one canonical project. */
/** @param {any[]} list */
function dedupe(list) {
  /** @type {Map<string, any>} */
  const byKey = new Map();
  for (const p of list) {
    const prior = byKey.get(p.key);
    if (!prior) { byKey.set(p.key, { ...p, aliases: [] }); continue; }
    // the live card carries richer evidence, so it wins the base record
    const base = prior.kind === "live" ? prior : p;
    const other = prior.kind === "live" ? p : prior;
    byKey.set(p.key, {
      ...base,
      summary: base.summary.length >= other.summary.length ? base.summary : other.summary,
      stack: [...new Set([...base.stack, ...other.stack])],
      live: base.live || other.live,
      source: base.source || other.source,
      aliases: [...new Set([...(prior.aliases ?? []), other.ref].filter(Boolean))]
    });
  }
  return [...byKey.values()];
}

const projects = dedupe(data.projects).map((p) => ({ ...p, ...classify(p) }));
const flagshipKeys = new Set(FLAGSHIP.map((f) => f.key));
const indexed = projects.filter((p) => !flagshipKeys.has(p.key));

const counts = {
  total: indexed.length + FLAGSHIP.length,
  flagship: FLAGSHIP.length,
  migrated: indexed.length,
  live: indexed.filter((p) => p.live).length + FLAGSHIP.filter((f) => f.live).length,
  source: indexed.filter((p) => p.source).length + FLAGSHIP.length,
  credentials: data.credentials.length,
  issuers: data.counts.issuers
};

// --- styles ----------------------------------------------------------------
const css = `
:root{
  --bg:#050505; --surface:#0d0d0f; --raised:#121215;
  --text:#f3f3ef; --muted:#9a9a96; --faint:#6a6a66;
  --line:rgba(255,255,255,.11); --line-soft:rgba(255,255,255,.06);
  --accent:#5ce8b6; --alert:#ee765f; --ok:#5ce8b6;
  /* Cyber UI Lab theme: phosphor (a green CRT phosphor, kept close to the site accent) */
  --phos:#7dffb4; --phos-dim:rgba(125,255,180,.55); --phos-glow:0 0 6px rgba(125,255,180,.55),0 0 18px rgba(92,232,182,.25);
  --phos-line:rgba(125,255,180,.28);
  --sans:"Inter","Helvetica Neue",Helvetica,Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  --r:4px; --maxw:1280px; --pad:clamp(16px,4vw,40px);
  --t:180ms cubic-bezier(.2,.6,.2,1);
}
*,*::before,*::after{box-sizing:border-box}
html{color-scheme:dark;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.55 var(--sans);
  -webkit-font-smoothing:antialiased;overflow-x:hidden}
h1,h2,h3,h4{margin:0;font-weight:560;letter-spacing:-.01em;line-height:1.15}
p{margin:0 0 .85em}
a{color:inherit}
.mono{font-family:var(--mono);font-size:.78rem;letter-spacing:.02em}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--pad)}
.prose{max-width:66ch}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}

.skip-link{position:absolute;left:8px;top:-60px;z-index:99;background:var(--accent);color:#04201a;
  padding:10px 16px;border-radius:var(--r);font-weight:600;transition:top var(--t)}
.skip-link:focus{top:8px}

/* header */
.hdr{position:sticky;top:0;z-index:60;background:rgba(5,5,5,.86);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--line-soft)}
.hdr-in{display:flex;align-items:center;gap:20px;height:56px;max-width:var(--maxw);
  margin:0 auto;padding:0 var(--pad)}
.brand{font-weight:600;letter-spacing:-.01em;text-decoration:none;white-space:nowrap}
.hdr-now{color:var(--faint);border-left:1px solid var(--line);padding-left:20px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-nav{margin-left:auto;display:flex;align-items:center;gap:6px}
.hdr-nav a,.btn-ghost{color:var(--muted);text-decoration:none;font-size:.86rem;padding:7px 11px;
  border-radius:var(--r);border:1px solid transparent;background:none;cursor:pointer;
  font-family:inherit;transition:color var(--t),border-color var(--t)}
.hdr-nav a:hover,.btn-ghost:hover{color:var(--text);border-color:var(--line)}
@media (max-width:860px){.hdr-now{display:none}.hdr-nav a[data-opt]{display:none}}
@media (max-width:560px){.hdr-in{gap:10px}.hdr-nav{gap:2px}.hdr-nav a{padding:7px 8px;font-size:.8rem}
  .hdr-nav a[href="#systems"]{display:none}}
@media (max-width:380px){.hdr-nav a[href="#index"]{display:none}}

/* hero */
#ambient{position:fixed;inset:0;z-index:-2;pointer-events:none}
#ambient canvas{display:block;width:100%;height:100%;opacity:.5}
.grid-bg{position:fixed;inset:0;z-index:-3;pointer-events:none;
  background-image:linear-gradient(rgba(92,232,182,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(92,232,182,.045) 1px,transparent 1px);
  background-size:68px 68px;
  mask-image:radial-gradient(ellipse 95% 62% at 50% 0%,#000 35%,transparent 78%);
  -webkit-mask-image:radial-gradient(ellipse 95% 62% at 50% 0%,#000 35%,transparent 78%)}
.glow{position:fixed;top:-28vh;left:50%;transform:translateX(-50%);width:100vw;height:78vh;z-index:-4;
  pointer-events:none;background:radial-gradient(ellipse at center,rgba(92,232,182,.075),transparent 68%)}
.clock{position:absolute;top:26px;right:var(--pad);font-family:var(--mono);font-size:.72rem;
  color:var(--faint);letter-spacing:.08em}
.term{border:1px solid var(--line);border-radius:6px;background:rgba(10,12,11,.82);
  backdrop-filter:blur(6px);overflow:hidden;font-family:var(--mono);font-size:.78rem;max-width:430px}
.term-bar{display:flex;align-items:center;gap:7px;padding:9px 12px;border-bottom:1px solid var(--line-soft);
  background:rgba(255,255,255,.02)}
.term-bar i{width:9px;height:9px;border-radius:50%;display:block}
.term-bar .t{margin-left:8px;color:var(--faint);font-size:.7rem}
.term-body{padding:13px 14px;display:grid;gap:5px;color:var(--muted);line-height:1.6;overflow-wrap:anywhere}
.term-body .p{color:var(--accent)}
.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:end}
.hero-grid>*{min-width:0}
@media (max-width:980px){.hero-grid{grid-template-columns:1fr}.term{max-width:none}.clock{display:none}}
.hero{position:relative;padding:clamp(56px,11vh,120px) 0 clamp(40px,7vh,72px);border-bottom:1px solid var(--line-soft)}
.eyebrow{color:var(--accent);text-transform:uppercase;letter-spacing:.14em;font-size:.7rem;
  font-family:var(--mono);margin-bottom:22px}
.hero h1{font-size:clamp(2rem,5.4vw,3.5rem);letter-spacing:-.025em;max-width:19ch;margin-bottom:22px}
.hero-sub{font-size:clamp(1rem,1.9vw,1.14rem);color:var(--muted);max-width:60ch;margin-bottom:28px}
.scramble{display:inline-block}
/* X-01 decrypting headline: glyph cells keep the final character's width, so nothing reflows */
.scramble .dw{display:inline-block;white-space:nowrap}
.scramble .dc{display:inline-block;text-align:center;height:1.15em;line-height:1.15;vertical-align:top}
.scramble .dw{vertical-align:top}
.scramble .dc.live{color:var(--phos);text-shadow:var(--phos-glow);font-family:var(--mono);font-weight:400}
.scramble .dc.lock{animation:lockin .28s ease-out}
@keyframes lockin{from{color:var(--phos);text-shadow:var(--phos-glow)}to{color:inherit;text-shadow:none}}
.hero h1{cursor:default}

/* B-03 perspective grid floor: CSS only, confined to the hero, behind its content */
.grid-floor{position:absolute;left:0;right:0;bottom:0;height:58%;overflow:hidden;pointer-events:none;z-index:0;
  perspective:300px;perspective-origin:50% 0;
  -webkit-mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.65) 45%,transparent 100%);
          mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.65) 45%,transparent 100%)}
.grid-floor::before{content:"";position:absolute;left:-60%;right:-60%;top:0;height:220%;
  transform:rotateX(66deg);transform-origin:50% 0;opacity:.55;
  background-image:linear-gradient(var(--phos-line) 1px,transparent 1px),
    linear-gradient(90deg,var(--phos-line) 1px,transparent 1px);
  background-size:64px 64px;animation:floor-run 7s linear infinite}
.grid-floor::after{content:"";position:absolute;left:0;right:0;top:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--phos-dim) 30%,var(--phos-dim) 70%,transparent);
  box-shadow:0 0 22px 3px rgba(125,255,180,.18)}
.grid-floor.paused::before{animation-play-state:paused}
@keyframes floor-run{to{background-position:0 64px}}
.hero>.wrap{position:relative;z-index:1}
.hero>.clock{z-index:1}
.cap-line{font-family:var(--mono);color:var(--faint);font-size:.82rem;margin-bottom:30px;min-height:1.4em}
.cap-line b{color:var(--accent);font-weight:400}
.caret{display:inline-block;width:7px;background:var(--accent);margin-left:2px;
  animation:blink 1.1s steps(2) infinite}
@keyframes blink{50%{opacity:0}}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:34px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 17px;border-radius:var(--r);
  border:1px solid var(--line);text-decoration:none;font-size:.9rem;background:var(--surface);
  transition:border-color var(--t),background var(--t);min-height:44px}
.btn:hover{border-color:var(--accent);background:var(--raised)}
.btn-primary{background:var(--accent);color:#04201a;border-color:var(--accent);font-weight:600}
.btn-primary:hover{background:#7ff0c8;border-color:#7ff0c8}
.status{display:flex;flex-wrap:wrap;gap:8px 22px;font-family:var(--mono);font-size:.74rem;color:var(--faint)}
.status b{color:var(--muted);font-weight:400}
.dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ok);margin-right:7px;
  vertical-align:1px;animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{50%{opacity:.35}}

/* evidence strip */
.evidence{border-bottom:1px solid var(--line-soft);background:var(--surface)}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:1px;
  background:var(--line-soft)}
.ev-cell{background:var(--surface);padding:20px var(--pad)}
.ev-n{font-family:var(--mono);font-size:clamp(1.3rem,3vw,1.75rem);letter-spacing:-.02em;display:block}
.ev-l{color:var(--faint);font-size:.73rem;text-transform:uppercase;letter-spacing:.1em;margin-top:5px;display:block}
.flap{display:inline-block}

/* sections */
.sec{padding:clamp(48px,8vh,88px) 0;border-bottom:1px solid var(--line-soft)}
.sec-head{display:flex;align-items:baseline;gap:16px;margin-bottom:12px;flex-wrap:wrap}
.sec-head h2{font-size:clamp(1.35rem,3vw,1.75rem)}
.sec-n{font-family:var(--mono);color:var(--faint);font-size:.72rem;letter-spacing:.1em}
.sec-intro{color:var(--muted);max-width:62ch;margin-bottom:36px}

/* flagship */
.flag{border:1px solid var(--line);border-radius:6px;background:var(--surface);
  margin-bottom:20px;position:relative;transition:border-color var(--t)}
.flag:hover,.flag:focus-within{border-color:rgba(92,232,182,.4)}
.flag::before,.flag::after{content:"";position:absolute;width:13px;height:13px;opacity:0;
  transition:opacity var(--t);pointer-events:none;border-color:var(--accent);border-style:solid}
.flag::before{top:-1px;left:-1px;border-width:1px 0 0 1px}
.flag::after{bottom:-1px;right:-1px;border-width:0 1px 1px 0}
.flag:hover::before,.flag:hover::after,.flag:focus-within::before,.flag:focus-within::after{opacity:1}
.flag-top{display:grid;grid-template-columns:1fr auto;gap:18px;padding:24px 24px 0;align-items:start}
.flag h3{font-size:1.3rem;margin-bottom:5px}
.flag-kick{color:var(--accent);font-family:var(--mono);font-size:.74rem;text-transform:uppercase;
  letter-spacing:.09em;margin-bottom:11px}
.flag-links{display:flex;gap:8px;flex-wrap:wrap}
.flag-body{padding:14px 24px 24px;display:grid;gap:22px;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}
@media (max-width:860px){.flag-body{grid-template-columns:1fr}.flag-top{grid-template-columns:1fr}}
.lab{font-family:var(--mono);font-size:.68rem;text-transform:uppercase;letter-spacing:.11em;
  color:var(--faint);display:block;margin-bottom:6px}
.flag-block+.flag-block{margin-top:16px}
.flag-block p{color:var(--muted);margin:0}
.flag-block p strong{color:var(--text);font-weight:500}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:1px;
  background:var(--line-soft);border:1px solid var(--line-soft);border-radius:var(--r);overflow:hidden}
.metric{background:var(--raised);padding:13px}
.metric dt{font-family:var(--mono);font-size:.66rem;text-transform:uppercase;letter-spacing:.09em;color:var(--faint)}
.metric dd{margin:4px 0 0;font-size:1rem;font-weight:500}
.metric .note{display:block;color:var(--faint);font-size:.73rem;margin-top:5px;line-height:1.4}
.prov{display:inline-block;font-family:var(--mono);font-size:.6rem;text-transform:uppercase;
  letter-spacing:.09em;padding:2px 6px;border-radius:2px;border:1px solid var(--line);
  color:var(--faint);margin-top:7px}
.prov[data-p="measured"]{color:var(--ok);border-color:rgba(92,232,182,.35)}
.prov[data-p="synthetic"]{color:var(--alert);border-color:rgba(238,118,95,.35)}
.flag-shot{margin:18px 0 0;border:1px solid var(--line-soft);border-radius:var(--r);overflow:hidden;background:var(--surface)}
.flag-shot img{display:block;width:100%;height:auto}
.flag-shot figcaption{color:var(--faint);padding:8px 12px;border-top:1px solid var(--line-soft);font-size:.7rem}
.flow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;list-style:none;padding:0;margin:0}
.flow li{font-family:var(--mono);font-size:.72rem;padding:6px 10px;border:1px solid var(--line-soft);
  border-radius:2px;background:var(--raised);color:var(--muted)}
.flow li+li::before{content:"→";color:var(--faint);margin-right:9px;margin-left:-3px}
.chips{display:flex;flex-wrap:wrap;gap:6px;list-style:none;padding:0;margin:0}
.chips li{font-family:var(--mono);font-size:.71rem;color:var(--muted);padding:4px 9px;
  border:1px solid var(--line-soft);border-radius:2px}
.tagline{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:.68rem;
  text-transform:uppercase;letter-spacing:.08em;padding:3px 8px;border-radius:2px;border:1px solid var(--line)}
.tagline[data-s="live"]{color:var(--ok);border-color:rgba(92,232,182,.35)}
.tagline[data-s="restricted"]{color:var(--alert);border-color:rgba(238,118,95,.35)}
.tagline[data-s="source only"]{color:var(--faint)}
`;

const css2 = `
/* project index */
.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px}
.search{flex:1 1 260px;display:flex;align-items:center;gap:9px;background:var(--surface);
  border:1px solid var(--line);border-radius:var(--r);padding:0 12px;min-width:0;min-height:44px}
.search input{flex:1;background:none;border:0;color:var(--text);font:inherit;font-size:.92rem;
  padding:11px 0;min-width:0}
.search input:focus{outline:none}
.search:focus-within{border-color:var(--accent)}
.kbd{font-family:var(--mono);font-size:.68rem;color:var(--faint);border:1px solid var(--line);
  border-radius:3px;padding:2px 6px;white-space:nowrap}
@media (max-width:420px){.search .kbd{display:none}}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.fchip{font:inherit;font-size:.8rem;color:var(--muted);background:var(--surface);cursor:pointer;
  border:1px solid var(--line);border-radius:var(--r);padding:7px 12px;min-height:36px;
  transition:color var(--t),border-color var(--t),background var(--t)}
.fchip:hover{color:var(--text);border-color:var(--muted)}
.fchip[aria-pressed="true"]{color:#04201a;background:var(--accent);border-color:var(--accent);font-weight:560}
.resultbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;
  color:var(--faint);font-family:var(--mono);font-size:.75rem;margin-bottom:22px;
  padding-bottom:12px;border-bottom:1px solid var(--line-soft)}
.grp{margin-bottom:34px}
.grp-h{font-family:var(--mono);font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;
  color:var(--faint);padding-bottom:9px;margin-bottom:14px;border-bottom:1px solid var(--line-soft)}
.cards{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
[data-density="list"] .cards{grid-template-columns:1fr;gap:0}
[data-density="list"] .card{border-radius:0;border-left:0;border-right:0;border-top:0;padding:14px 2px}
[data-density="list"] .card p{display:none}
[data-density="list"] .card .chips{display:none}
.card{border:1px solid var(--line-soft);border-radius:var(--r);background:var(--surface);
  padding:16px;display:flex;flex-direction:column;gap:9px;transition:border-color var(--t)}
.card:hover,.card:focus-within{border-color:var(--line)}
.card-top{display:flex;align-items:baseline;gap:10px;justify-content:space-between}
.card h3{font-size:.98rem;font-weight:540}
.card h3 button{all:unset;cursor:pointer}
.card h3 button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.card-ref{font-family:var(--mono);font-size:.67rem;color:var(--faint);white-space:nowrap}
.card p{color:var(--muted);font-size:.86rem;margin:0;display:-webkit-box;-webkit-line-clamp:3;
  -webkit-box-orient:vertical;overflow:hidden}
.card-foot{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-top:auto;padding-top:4px}
.card-foot a{font-family:var(--mono);font-size:.72rem;color:var(--accent);text-decoration:none;
  border-bottom:1px solid transparent;transition:border-color var(--t)}
.card-foot a:hover{border-color:currentColor}
.empty{color:var(--muted);padding:34px 0;text-align:center}

/* detail drawer */
dialog.drawer{border:0;padding:0;background:none;max-width:none;max-height:none;width:100%;height:100%;margin:0}
dialog.drawer::backdrop{background:rgba(0,0,0,.72)}
.drawer-in{position:fixed;inset:0 0 0 auto;width:min(560px,100%);background:var(--surface);
  border-left:1px solid var(--line);padding:26px;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
.drawer-top{display:flex;justify-content:space-between;align-items:start;gap:14px}
.drawer h3{font-size:1.25rem}
.drawer .close{all:unset;cursor:pointer;color:var(--muted);border:1px solid var(--line);
  border-radius:var(--r);padding:8px 13px;font-size:.84rem;min-height:40px;display:inline-flex;align-items:center}
.drawer .close:hover{color:var(--text);border-color:var(--muted)}

/* timeline, matrix, lists */
.tl{list-style:none;padding:0;margin:0;border-left:1px solid var(--line)}
.tl li{position:relative;padding:0 0 26px 22px}
.tl li::before{content:"";position:absolute;left:-4px;top:7px;width:7px;height:7px;border-radius:50%;
  background:var(--bg);border:1px solid var(--muted)}
.tl li:first-child::before{background:var(--accent);border-color:var(--accent)}
.tl .when{font-family:var(--mono);font-size:.72rem;color:var(--faint);display:block;margin-bottom:3px}
.tl h3{font-size:1rem;margin-bottom:2px}
.tl .where{color:var(--muted);font-size:.88rem;display:block;margin-bottom:7px}
.tl p{color:var(--muted);font-size:.9rem;max-width:62ch;margin:0}
.matrix{width:100%;border-collapse:collapse;font-size:.88rem}
.matrix caption{text-align:left;color:var(--faint);font-family:var(--mono);font-size:.72rem;
  padding-bottom:10px}
.matrix th,.matrix td{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line-soft);
  vertical-align:top}
.matrix th{font-family:var(--mono);font-size:.7rem;text-transform:uppercase;letter-spacing:.09em;
  color:var(--faint);font-weight:400;white-space:nowrap}
.matrix td:first-child{color:var(--text);font-weight:500;white-space:nowrap}
.matrix td a{color:var(--accent);text-decoration:none}
.matrix td a:hover{text-decoration:underline}
.scroll-x{overflow-x:auto;width:100%;max-width:100%;min-width:0;contain:inline-size;-webkit-overflow-scrolling:touch}
.scroll-x .matrix{min-width:540px}
@media (max-width:600px){
  .scroll-x .matrix{min-width:100%;table-layout:fixed}
  .matrix th,.matrix td,.matrix td:first-child{white-space:normal;overflow-wrap:anywhere}
}
details.shelf{border:1px solid var(--line-soft);border-radius:var(--r);background:var(--surface);
  padding:14px 16px;margin-bottom:10px}
details.shelf summary{cursor:pointer;font-weight:500;list-style:none;display:flex;
  justify-content:space-between;gap:12px;align-items:center;min-height:32px}
details.shelf summary::-webkit-details-marker{display:none}
details.shelf summary::after{content:"+";color:var(--faint);font-family:var(--mono)}
details.shelf[open] summary::after{content:"\\2212"}
.cert-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:14px}
.cert{border:1px solid var(--line-soft);border-radius:var(--r);padding:13px;background:var(--raised)}
.cert h4{font-size:.9rem;font-weight:520;margin-bottom:4px}
.cert .meta{color:var(--faint);font-family:var(--mono);font-size:.71rem;display:block}
.cert a{color:var(--accent);font-size:.78rem;text-decoration:none;margin-top:7px;display:inline-block}
.langs{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  list-style:none;padding:0;margin:0}
.langs li{display:flex;justify-content:space-between;gap:12px;border:1px solid var(--line-soft);
  border-radius:var(--r);padding:11px 13px;background:var(--surface)}
.langs .lvl{font-family:var(--mono);font-size:.74rem;color:var(--faint)}

/* contact + footer */
.contact-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(215px,1fr))}
.contact-grid a,.copy{display:flex;flex-direction:column;gap:4px;border:1px solid var(--line);
  border-radius:var(--r);padding:16px;background:var(--surface);text-decoration:none;
  transition:border-color var(--t);min-height:44px;font:inherit;cursor:pointer;text-align:left;color:inherit}
.contact-grid a:hover,.copy:hover{border-color:var(--accent)}
.contact-grid .k{font-family:var(--mono);font-size:.68rem;text-transform:uppercase;
  letter-spacing:.1em;color:var(--faint)}
.contact-grid .v{font-size:.95rem;word-break:break-word}
.foot{padding:26px 0 44px;color:var(--faint);font-family:var(--mono);font-size:.72rem;
  display:flex;flex-wrap:wrap;gap:8px 20px}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important}
  .dot,.caret{animation:none}
  .grid-floor::before{animation:none}
}
@media print{
  .hdr,.skip-link,.actions,.toolbar,.filters,.resultbar,.drawer,.foot,.grid-floor{display:none!important}
  body{background:#fff;color:#000;font-size:11pt}
  .sec,.hero,.evidence{border-color:#ccc}
  .card,.flag,.cert,.metric{border-color:#bbb;background:#fff;break-inside:avoid}
  a[href^="http"]::after{content:" (" attr(href) ")";font-size:9pt;color:#444;word-break:break-all}
  .card p{display:block;-webkit-line-clamp:none;overflow:visible}
}
`;

// --- fragments -------------------------------------------------------------
/** @param {string} href @param {string} label @param {string} aria @param {string} [cls] */
const extLink = (href, label, aria, cls = "btn") =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(aria)}">${esc(label)}</a>`;

/** @param {string} n @param {string} label */
const flapNumber = (n, label) =>
  `<div class="ev-cell"><span class="ev-n flap" data-flap="${esc(n)}">${esc(n)}</span><span class="ev-l">${esc(label)}</span></div>`;

/** @param {any} f @param {number} i */
function flagshipCard(f, i) {
  const status = f.live ? (f.liveNote === "restricted" ? "restricted" : "live") : "source only";
  const links = [
    f.caseStudy ? extLink(f.caseStudy, "Case study", `Read the ${f.name} case study in a new tab`) : "",
    f.live ? extLink(f.live, f.liveLabel ?? "Open app", f.liveAria ?? `Open the ${f.name} application in a new tab`) : "",
    extLink(f.source, "Source", `View the ${f.name} source repository on GitHub in a new tab`)
  ].filter(Boolean).join("");
  return `
<article class="flag" id="system-${esc(f.key)}">
  <div class="flag-top">
    <div>
      <p class="flag-kick">${esc(String(i + 1).padStart(2, "0"))} / ${esc(f.kicker)}</p>
      <h3>${esc(f.name)}</h3>
      <p class="tagline" data-s="${esc(status)}">${esc(status === "live" ? "Live" : status === "restricted" ? "Live, access restricted" : "Source only")}</p>
    </div>
    <div class="flag-links">${links}</div>
  </div>
  <div class="flag-body">
    <div>
      <div class="flag-block"><span class="lab">Problem</span><p>${esc(f.problem)}</p></div>
      <div class="flag-block"><span class="lab">System</span><p>${esc(f.system)}</p></div>
      <div class="flag-block"><span class="lab">What I built</span><p>${esc(f.built)}</p></div>
      <div class="flag-block"><span class="lab">Why it matters</span><p><strong>${esc(f.matters)}</strong></p></div>
      <div class="flag-block"><span class="lab">Architecture</span>
        <ol class="flow">${f.flow.map((/** @type {string} */ s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </div>${f.shot ? `
      <figure class="flag-shot"><img src="${esc(f.shot.src)}" width="${esc(f.shot.width)}" height="${esc(f.shot.height)}" loading="lazy" decoding="async" alt="${esc(f.shot.alt)}"><figcaption class="mono">${esc(f.shot.caption)}</figcaption></figure>` : ""}
    </div>
    <div>
      <div class="flag-block"><span class="lab">Evidence</span>
        <dl class="metrics">${f.metrics.map((/** @type {any} */ m) => `
          <div class="metric"><dt>${esc(m.label)}</dt><dd>${esc(m.value)}
            <span class="note">${esc(m.note)}</span>
            <span class="prov" data-p="${esc(m.provenance)}">${esc(m.provenance)}</span></dd></div>`).join("")}
        </dl>
      </div>
      <div class="flag-block"><span class="lab">Stack</span>
        <ul class="chips">${f.stack.map((/** @type {string} */ s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>
      <div class="flag-block"><span class="lab">Role</span><p>Sole designer and engineer.</p></div>
    </div>
  </div>
</article>`;
}

/** @param {any} p */
function projectCard(p) {
  const links = [
    p.live ? `<a href="${esc(p.live)}" target="_blank" rel="noopener noreferrer" aria-label="Open the ${esc(p.title)} demo in a new tab">Live</a>` : "",
    p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer" aria-label="View the ${esc(p.title)} source on GitHub in a new tab">Source</a>` : ""
  ].filter(Boolean).join("");
  return `
${(p.aliases ?? []).map((/** @type {string} */ a) => `<span class="sr-only" id="legacy-${esc(String(a).toLowerCase().replace(/[^a-z0-9]+/g, "-"))}"></span>`).join("")}
<article class="card" id="p-${esc(p.key)}" data-group="${esc(p.group)}" data-domain="${esc(p.domain)}"
  data-live="${p.live ? "1" : "0"}" data-source="${p.source ? "1" : "0"}"
  data-text="${esc(`${p.title} ${p.category} ${p.subtitle ?? ""} ${p.summary} ${p.stack.join(" ")}`.toLowerCase())}">
  <div class="card-top">
    <h3><button type="button" data-open="${esc(p.key)}">${esc(p.title)}</button></h3>
    <span class="card-ref">${esc(p.ref || p.domain)}</span>
  </div>
  <p>${esc(p.summary)}</p>
  <ul class="chips">${p.stack.slice(0, 4).map((/** @type {string} */ s) => `<li>${esc(s)}</li>`).join("")}</ul>
  <div class="card-foot">${links}</div>
</article>`;
}

/** @type {[string,string,string[],string][]} */
const CAPABILITIES = [
  ["Production AI", "Retrieval, routing and grounding for assistants that answer over documents, with verification in front of the answer.", [], "Touchstone, QuantiFire IR assistant"],
  ["Data engineering", "Pipelines, warehouse modelling and the data-quality checks that stop bad rows reaching a report.", [], "SignalOps, PipelinePulse, Stratum Analytics"],
  ["ML evaluation", "Golden sets, planted-truth holdouts, calibration and significance testing wired into CI.", [], "SignalOps, Calibration-Optimised Equity"],
  ["Quantitative analysis", "Equity research, portfolio construction, VaR and execution modelling.", [], "Calibration-Optimised Equity, Stratum Analytics"],
  ["Frontend systems", "Interfaces that make a model inspectable, including work that runs entirely in the browser.", [], "Attention Lens, SignalOps"],
  ["Technical communication", "Architecture documents, decision records and written evidence a non-specialist can follow.", [], "Touchstone dossier, 150+ investment notes"]
];

const SKILLS = [
  ["Languages", ["Python", "SQL", "R", "JavaScript", "TypeScript"]],
  ["AI and data", ["PyTorch", "scikit-learn", "XGBoost", "pandas", "LangGraph", "RAG", "BM25", "PostgreSQL", "DuckDB", "dbt"]],
  ["Engineering and BI", ["FastAPI", "Docker", "pytest", "GitHub Actions", "n8n", "Whisper", "React", "Tableau", "Power BI"]]
];

const EXPERIENCE = [
  { when: "May 2026 to present", role: "Applied AI Engineering Intern", org: "QuantiFire Ltd, London",
    body: "Developed a prototype investor-relations assistant with 1,143 automated tests, routing questions across vector search, BM25, text-to-SQL and knowledge-graph traversal over roughly 950,000 records across 23 tables. Designed an 8-lens verification workflow that calculates quantitative claims as SQL aggregates, reconciles each value to source evidence and abstains when support is insufficient, reaching 96.5% accuracy on a 200-question evaluation set." },
  { when: "Sep 2025 to Sep 2026", role: "MSc Business Analytics", org: "University College London",
    body: "Completed September 2026 with a 72% average, final classification pending. Machine Learning, NLP, Predictive Analytics and Operations Analytics." },
  { when: "Sep 2023 to May 2026", role: "Data Analyst", org: "APJ Kapital, London",
    body: "Built PostgreSQL pipelines and Tableau dashboards across more than 100,000 market and portfolio records, giving weekly investment reviews a consistent view of P&L, sector allocation and factor exposure for 30+ equities. Automated a daily market digest in n8n, and produced more than 150 investment notes and buy, hold and sell recommendations." },
  { when: "May 2022 to Oct 2022", role: "AI Investment Programming Intern", org: "MDOTM, Milan",
    body: "Delivered customer-segmentation and investment-modelling tools in Python and R, and built a repeatable price-and-fundamentals preparation pipeline for ML forecasting inside a 40-person team whose platform went on to win two international fintech awards." },
  { when: "Sep 2021 to Jul 2025", role: "BSc Business Analytics, minor in Accounting and Finance", org: "Lancaster University",
    body: "Upper Second-Class Honours. Data Mining, Databases, Simulation and Decision Analysis." }
];

const LANGUAGES = [["Italian", "Native"], ["English", "Native"], ["Spanish", "Fluent"]];

const grouped = GROUPS.filter((g) => g.id !== "flagship")
  .map((g) => ({ ...g, items: indexed.filter((p) => p.group === g.id) }))
  .filter((g) => g.items.length);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pablo Williams, applied AI engineer and data analyst</title>
<meta name="description" content="Applied AI engineer and data analyst in London. Production agents, anomaly detection, graph analysis, ranking systems and quantitative research, with the evidence for each.">
<link rel="canonical" href="https://pablowilliams.github.io/">
<meta property="og:type" content="profile">
<meta property="og:title" content="Pablo Williams, applied AI engineer and data analyst">
<meta property="og:description" content="Production agents, anomaly detection, graph analysis, ranking systems and quantitative research, with the evidence for each.">
<meta property="og:url" content="https://pablowilliams.github.io/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Pablo Williams, applied AI engineer and data analyst">
<meta name="twitter:description" content="Production agents, anomaly detection, graph analysis, ranking systems and quantitative research.">
<meta name="theme-color" content="#050505">
<style>${css}${css2}</style>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org", "@type": "Person", name: "Pablo Williams",
  jobTitle: "Applied AI Engineer", url: "https://pablowilliams.github.io/",
  address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
  email: "mailto:pablowilliams119@gmail.com",
  sameAs: ["https://github.com/pablowilliams", "https://linkedin.com/in/pablowilliams"],
  knowsLanguage: LANGUAGES.map(([n]) => n),
  alumniOf: [{ "@type": "CollegeOrUniversity", name: "University College London" },
             { "@type": "CollegeOrUniversity", name: "Lancaster University" }]
})}</script>
</head>
<body data-density="grid">
<a class="skip-link" href="#main">Skip to content</a>
<div class="glow" aria-hidden="true"></div>
<div class="grid-bg" aria-hidden="true"></div>
<div id="ambient" aria-hidden="true"></div>

<header class="hdr">
  <div class="hdr-in">
    <a class="brand" href="#top">Pablo Williams</a>
    <span class="hdr-now mono" id="hdr-now" aria-live="off"></span>
    <nav class="hdr-nav" aria-label="Primary">
      <a href="#systems">Systems</a>
      <a href="#index">Projects</a>
      <a href="#experience" data-opt>Experience</a>
      <a href="PWCV.pdf">CV</a>
      <a href="#contact">Contact</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="grid-floor" aria-hidden="true"></div>
  <p class="clock mono" id="clock" aria-hidden="true"></p>
  <div class="wrap">
    <p class="eyebrow">Applied AI &amp; data systems / London</p>
    <h1><span class="scramble" data-final="I build AI and data systems that turn messy evidence into decisions.">I build AI and data systems that turn messy evidence into decisions.</span></h1>
    <p class="hero-sub">Applied AI engineer and data analyst. I work across production agents, anomaly detection, graph analysis, ranking systems and quantitative research, then build the interface that makes the result usable.</p>
    <p class="cap-line" aria-hidden="true"><span id="cap"></span><span class="caret">&nbsp;</span></p>
    <div class="hero-grid">
      <div>
        <div class="actions">
          <a class="btn btn-primary" href="#systems">See the work</a>
          <a class="btn" href="PWCV.pdf">Download CV</a>
          <a class="btn" href="mailto:pablowilliams119@gmail.com">Email Pablo</a>
        </div>
      </div>
      <div class="term">
        <div class="term-bar">
          <i style="background:#5ce8b6"></i><i style="background:#e8d05c"></i><i style="background:#5ce8b6;opacity:.5"></i>
          <span class="t">pablo@quantifire</span>
        </div>
        <div class="term-body">
          <div><span class="p">$</span> ls ~/projects</div>
          <div>${counts.total} shipped &middot; ${counts.live} live &middot; ${counts.source} with source</div>
          <div><span class="p">$</span> cat verification.log</div>
          <div>59/59 adversarial attempts blocked</div>
          <div>0 unsupported claims across 146 questions</div>
        </div>
      </div>
    </div>
    <p class="status">
      <span><span class="dot"></span>London, UK</span>
      <span><b>Role</b> Applied AI Engineering Intern, QuantiFire</span>
      <span><b>Open to</b> AI engineering and quantitative roles</span>
      <span><b>Updated</b> ${built}</span>
    </p>
  </div>
</section>

<section class="evidence" aria-label="Portfolio evidence, generated from the site inventory">
  <div class="ev-grid">
    ${flapNumber(String(counts.total), "Projects")}
    ${flapNumber(String(counts.flagship), "Flagship systems")}
    ${flapNumber(String(counts.live), "With a live demo")}
    ${flapNumber(String(counts.source), "With public source")}
    ${flapNumber(String(counts.credentials), "Certificates")}
    ${flapNumber(String(counts.issuers), "Issuers")}
  </div>
</section>

<section class="sec" id="systems">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">01</span><h2>Selected systems</h2></div>
    <p class="sec-intro">Five systems, each with the problem it answers, what I built, and what the evidence actually shows. Every figure says where it came from.</p>
    ${FLAGSHIP.map(flagshipCard).join("")}
  </div>
</section>

<section class="sec" id="capabilities">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">02</span><h2>Capabilities</h2></div>
    <p class="sec-intro">Each capability names the work that evidences it, rather than sitting in a tag cloud.</p>
    <div class="scroll-x">
      <table class="matrix">
        <caption>Capability mapped to the projects that demonstrate it</caption>
        <thead><tr><th scope="col">Capability</th><th scope="col">What it covers</th><th scope="col">Evidence</th></tr></thead>
        <tbody>${CAPABILITIES.map(([c, d, , ev]) => `<tr><td>${esc(c)}</td><td>${esc(d)}</td><td>${esc(ev)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </div>
</section>
`;

const html2 = `
<section class="sec" id="index">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">03</span><h2>Project index</h2></div>
    <p class="sec-intro">Every project migrated from the previous site, ${counts.migrated} of them, searchable and filterable. Nothing was dropped.</p>
    <div class="toolbar">
      <div class="search">
        <span class="mono" aria-hidden="true">/</span>
        <label class="sr-only" for="q">Search projects</label>
        <input id="q" type="search" placeholder="Search projects, stacks and domains" autocomplete="off" spellcheck="false">
        <span class="kbd" aria-hidden="true">/ or Ctrl K</span>
      </div>
      <button class="fchip" type="button" id="density" aria-pressed="false">List view</button>
    </div>
    <div class="filters" role="group" aria-label="Filter by domain">
      <button class="fchip" type="button" data-domain="all" aria-pressed="true">All domains</button>
      ${DOMAINS.map((d) => `<button class="fchip" type="button" data-domain="${esc(d)}" aria-pressed="false">${esc(d)}</button>`).join("")}
    </div>
    <div class="filters" role="group" aria-label="Filter by availability">
      <button class="fchip" type="button" data-flag="live" aria-pressed="false">Live only</button>
      <button class="fchip" type="button" data-flag="source" aria-pressed="false">Has source</button>
    </div>
    <div class="resultbar">
      <span id="count" role="status" aria-live="polite">${counts.migrated} projects</span>
      <button class="btn-ghost" type="button" id="reset">Reset filters</button>
    </div>
    <div id="results">
      ${grouped.map((g) => `
      <div class="grp" data-grp="${esc(g.id)}">
        <h3 class="grp-h">${esc(g.label)} <span data-grpcount>${g.items.length}</span></h3>
        <div class="cards">${g.items.map(projectCard).join("")}</div>
      </div>`).join("")}
    </div>
    <p class="empty" id="empty" hidden>No project matches that filter. <button class="btn-ghost" type="button" data-reset>Clear filters</button></p>
  </div>
</section>

<section class="sec" id="experience">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">04</span><h2>Experience and education</h2></div>
    <ol class="tl">
      ${EXPERIENCE.map((e) => `<li>
        <span class="when">${esc(e.when)}</span>
        <h3>${esc(e.role)}</h3>
        <span class="where">${esc(e.org)}</span>
        <p>${esc(e.body)}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>

<section class="sec" id="credentials">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">05</span><h2>Credentials and languages</h2></div>
    <p class="sec-intro">${counts.credentials} certificates across ${counts.issuers} issuers, each verifiable at source.</p>
    ${[...new Set(data.credentials.map((/** @type {any} */ c) => c.organisation))].map((org) => {
      const items = data.credentials.filter((/** @type {any} */ c) => c.organisation === org);
      return `<details class="shelf">
        <summary>${esc(org)} <span class="mono">${items.length}</span></summary>
        <div class="cert-grid">${items.map((/** @type {any} */ c) => `<div class="cert">
          <h4>${esc(c.title)}</h4>
          <span class="meta">${esc(c.date)}${c.id ? ` &middot; ID ${esc(c.id)}` : ""}</span>
          ${c.verify ? `<a href="${esc(c.verify)}" target="_blank" rel="noopener noreferrer" aria-label="Verify ${esc(c.title)} from ${esc(org)}, opens in a new tab">Verify</a>` : ""}
        </div>`).join("")}</div>
      </details>`;
    }).join("")}
    <h3 class="grp-h" style="margin-top:26px">Languages</h3>
    <ul class="langs">${LANGUAGES.map(([n, l]) => `<li><span>${esc(n)}</span><span class="lvl">${esc(l)}</span></li>`).join("")}</ul>
  </div>
</section>

<section class="sec" id="contact">
  <div class="wrap">
    <div class="sec-head"><span class="sec-n">06</span><h2>Contact</h2></div>
    <p class="sec-intro">Open to AI engineering, applied ML and quantitative roles in London.</p>
    <div class="contact-grid">
      <button class="copy" type="button" id="copy" data-email="pablowilliams119@gmail.com">
        <span class="k">Email</span><span class="v" id="copy-v">pablowilliams119@gmail.com</span>
      </button>
      <a href="mailto:pablowilliams119@gmail.com"><span class="k">Mail client</span><span class="v">Open a new message</span></a>
      <a href="https://github.com/pablowilliams" target="_blank" rel="noopener noreferrer" aria-label="Pablo Williams on GitHub, opens in a new tab"><span class="k">GitHub</span><span class="v">github.com/pablowilliams</span></a>
      <a href="https://linkedin.com/in/pablowilliams" target="_blank" rel="noopener noreferrer" aria-label="Pablo Williams on LinkedIn, opens in a new tab"><span class="k">LinkedIn</span><span class="v">linkedin.com/in/pablowilliams</span></a>
      <a href="PWCV.pdf"><span class="k">CV</span><span class="v">Download PDF</span></a>
    </div>
  </div>
</section>
</main>

<footer class="foot wrap">
  <span>Static site, no trackers, no runtime database.</span>
  <span>Built ${built} from the repository inventory.</span>
  <span>WCAG 2.2 AA intent, keyboard first, reduced motion respected.</span>
</footer>

<dialog class="drawer" id="drawer" aria-label="Project detail">
  <div class="drawer-in">
    <div class="drawer-top">
      <div><span class="lab" id="d-ref"></span><h3 id="d-title"></h3></div>
      <button class="close" type="button" id="d-close">Close</button>
    </div>
    <p class="lab">Summary</p><p id="d-sum" style="color:var(--muted)"></p>
    <p class="lab">Stack</p><ul class="chips" id="d-stack"></ul>
    <div class="flag-links" id="d-links"></div>
  </div>
</dialog>
`;

const js = `
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* X-01 decrypting headline (Cyber UI Lab, phosphor theme).
   Characters resolve in a shuffled order rather than left to right, each cycling
   through glyphs before it locks. Every glyph cell is fixed to the width of its
   final character, so the line never reflows. Runs once on load in about 650 ms
   and can be replayed by hovering over the headline, at most once every 4 s.
   Assistive technology reads the final sentence throughout; reduced motion skips it. */
(() => {
  const el = $(".scramble");
  if (!el || reduced) return;
  const final = el.dataset.final || el.textContent;
  // Plain letters, digits and a little punctuation: no katakana or other hacker-film glyphs.
  const pool = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+/<=>?";
  const DUR = 650, COOLDOWN = 4000;
  let running = false, last = -Infinity;

  const run = () => {
    if (running || performance.now() - last < COOLDOWN) return;
    running = true; last = performance.now();
    el.setAttribute("aria-label", final);
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    // Words stay unbreakable, so the animated line wraps exactly where the final text does.
    const cells = [];
    final.split(" ").forEach((word, w) => {
      if (w) { visual.append(" "); cells.push(null); }
      const box = document.createElement("span");
      box.className = "dw";
      for (const ch of word) {
        const c = document.createElement("span");
        c.className = "dc"; c.textContent = ch;
        box.append(c); cells.push(c);
      }
      visual.append(box);
    });
    el.textContent = "";
    el.append(visual);
    // Fix each cell to its final character's width before any glyph is drawn.
    cells.forEach((c) => { if (c) c.style.width = c.getBoundingClientRect().width + "px"; });
    const order = cells.map((_, i) => i).filter((i) => cells[i]);
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    // Each character locks at a time drawn from its place in the shuffled order.
    const lockAt = new Map(order.map((idx, k) => [idx, (0.25 + 0.75 * (k / order.length)) * DUR]));
    const start = performance.now();
    let lastSwap = 0;
    const tick = (now) => {
      const t = now - start;
      const swap = now - lastSwap > 45; // change glyphs at ~22 fps so they read as flicker, not noise
      if (swap) lastSwap = now;
      for (const [idx, at] of lockAt) {
        const c = cells[idx];
        if (t >= at) {
          if (!c.classList.contains("lock")) { c.textContent = final[idx]; c.classList.remove("live"); c.classList.add("lock"); }
        } else if (swap) {
          c.textContent = pool[(Math.random() * pool.length) | 0];
          c.classList.add("live");
        }
      }
      if (t < DUR + 300 && running) requestAnimationFrame(tick);
      else finish();
    };
    const finish = () => {
      if (!running) return;
      el.textContent = final; el.removeAttribute("aria-label"); running = false;
    };
    requestAnimationFrame(tick);
    // Browsers pause animation frames in background tabs; never leave the headline scrambled.
    setTimeout(finish, DUR + 800);
  };

  run();
  const h1 = el.closest("h1");
  h1?.addEventListener("mouseenter", run);
})();

/* B-03 perspective grid floor: pause the CSS animation while the hero is off-screen */
(() => {
  const floor = $(".grid-floor");
  if (!floor || reduced || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([e]) => floor.classList.toggle("paused", !e.isIntersecting)).observe(floor);
  document.addEventListener("visibilitychange", () => floor.classList.toggle("paused", document.hidden));
})();

/* X-02 capability line, three phrases, one cycle, then stop */
(() => {
  const el = $("#cap");
  if (!el) return;
  const phrases = ["retrieval and grounding", "anomaly detection and ranking", "evaluation you can audit"];
  if (reduced) { el.textContent = phrases.join(" / "); $(".caret")?.remove(); return; }
  let p = 0, i = 0, del = false;
  const step = () => {
    const w = phrases[p];
    i += del ? -1 : 1;
    el.textContent = w.slice(0, i);
    if (!del && i === w.length) {
      if (p === phrases.length - 1) { $(".caret")?.style.setProperty("animation", "none"); return; }
      setTimeout(() => { del = true; step(); }, 1100); return;
    }
    if (del && i === 0) { del = false; p++; }
    setTimeout(step, del ? 22 : 48);
  };
  step();
})();

/* X-04 split-flap, flips once when the strip first enters view */
(() => {
  const cells = $$("[data-flap]");
  if (!cells.length || reduced || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const target = parseInt(e.target.dataset.flap, 10);
      if (!Number.isFinite(target)) continue;
      let n = 0;
      const steps = Math.min(16, target);
      const iv = setInterval(() => {
        n += Math.max(1, Math.round(target / steps));
        if (n >= target) { n = target; clearInterval(iv); }
        e.target.textContent = String(n);
      }, 34);
    }
  }, { threshold: .4 });
  cells.forEach((c) => io.observe(c));
})();

/* UTC clock */
(() => {
  const el = document.getElementById("clock");
  if (!el) return;
  const tick = () => { el.textContent = new Date().toISOString().slice(11, 19) + " UTC"; };
  tick();
  if (!reduced) setInterval(tick, 1000);
})();

/* ambient constellation. Ornamental: removed entirely under reduced motion,
   on small screens and when the device reports few cores. */
(() => {
  const host = document.getElementById("ambient");
  if (!host) return;
  const weak = (navigator.hardwareConcurrency ?? 8) < 4;
  if (reduced || weak || innerWidth < 760 || !("requestAnimationFrame" in window)) { host.remove(); return; }
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { alpha: true });
  if (!ctx) { host.remove(); return; }
  host.append(c);

  let w = 0, h = 0, dpr = 1, nodes = [], raf = 0, running = true;
  const LINK = 168;

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.6);
    w = host.clientWidth; h = host.clientHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(74, Math.round((w * h) / 20000));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
      r: Math.random() * 1.7 + .7
    }));
  };

  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        ctx.strokeStyle = "rgba(92,232,182," + (0.22 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(92,232,182,.62)";
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); }
    raf = requestAnimationFrame(frame);
  };

  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const start = () => { if (running) return; running = true; raf = requestAnimationFrame(frame); };

  size(); frame();
  addEventListener("resize", () => { size(); }, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  // pause once the hero has scrolled away; nothing animates off-screen
  if ("IntersectionObserver" in window) {
    const hero = document.querySelector(".hero");
    if (hero) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
  }
})();

/* header current-section readout */
(() => {
  const out = $("#hdr-now");
  const secs = $$("main section[id]");
  if (!out || !secs.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!vis) return;
    const h = vis.target.querySelector("h1,h2");
    if (!h) return;
    const fixed = h.querySelector("[data-final]")?.dataset.final ?? h.dataset.final;
    out.textContent = (fixed ?? h.textContent).trim();
  }, { threshold: [.25, .6] });
  secs.forEach((s) => io.observe(s));
})();

/* project index: search, filters, density, URL state */
(() => {
  const q = $("#q"), count = $("#count"), empty = $("#empty");
  if (!q) return;
  const cards = $$(".card");
  const state = { q: "", domain: "all", live: false, source: false };

  const read = () => {
    const u = new URLSearchParams(location.search);
    state.q = u.get("q") ?? "";
    state.domain = u.get("domain") ?? "all";
    state.live = u.get("live") === "1";
    state.source = u.get("source") === "1";
    q.value = state.q;
  };
  const write = () => {
    const u = new URLSearchParams();
    if (state.q) u.set("q", state.q);
    if (state.domain !== "all") u.set("domain", state.domain);
    if (state.live) u.set("live", "1");
    if (state.source) u.set("source", "1");
    const s = u.toString();
    history.replaceState(null, "", s ? "?" + s + location.hash : location.pathname + location.hash);
  };
  const apply = () => {
    const needle = state.q.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) {
      const ok = (!needle || c.dataset.text.includes(needle))
        && (state.domain === "all" || c.dataset.domain === state.domain)
        && (!state.live || c.dataset.live === "1")
        && (!state.source || c.dataset.source === "1");
      c.hidden = !ok;
      if (ok) shown++;
    }
    for (const g of $$(".grp")) {
      const n = $$(".card", g).filter((c) => !c.hidden).length;
      g.hidden = n === 0;
      const badge = $("[data-grpcount]", g);
      if (badge) badge.textContent = String(n);
    }
    count.textContent = shown + (shown === 1 ? " project" : " projects");
    empty.hidden = shown !== 0;
    $$("[data-domain]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.domain === state.domain)));
    $("[data-flag='live']")?.setAttribute("aria-pressed", String(state.live));
    $("[data-flag='source']")?.setAttribute("aria-pressed", String(state.source));
    write();
  };

  let t;
  q.addEventListener("input", () => { state.q = q.value; clearTimeout(t); t = setTimeout(apply, 110); });
  $$("[data-domain]").forEach((b) => b.addEventListener("click", () => { state.domain = b.dataset.domain; apply(); }));
  $$("[data-flag]").forEach((b) => b.addEventListener("click", () => { state[b.dataset.flag] = !state[b.dataset.flag]; apply(); }));
  const reset = () => { state.q = ""; q.value = ""; state.domain = "all"; state.live = false; state.source = false; apply(); };
  $("#reset")?.addEventListener("click", reset);
  $("[data-reset]")?.addEventListener("click", reset);

  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key.toLowerCase() === "k" && !typing && !e.metaKey && !e.ctrlKey)) {
      e.preventDefault(); q.focus(); q.select();
    }
    if (e.key === "Escape" && document.activeElement === q) { reset(); q.blur(); }
  });

  const d = $("#density");
  const saved = (() => { try { return localStorage.getItem("pw-density"); } catch { return null; } })();
  const setDensity = (v) => {
    document.body.dataset.density = v;
    d.textContent = v === "list" ? "Grid view" : "List view";
    d.setAttribute("aria-pressed", String(v === "list"));
    try { localStorage.setItem("pw-density", v); } catch {}
  };
  if (saved) setDensity(saved);
  d?.addEventListener("click", () => setDensity(document.body.dataset.density === "list" ? "grid" : "list"));

  read(); apply();
})();

/* detail drawer, focus-safe, deep-linkable */
(() => {
  const dlg = $("#drawer");
  if (!dlg || !dlg.showModal) return;
  let opener = null;
  const open = (key) => {
    const card = document.getElementById("p-" + key);
    if (!card) return;
    opener = document.activeElement;
    $("#d-ref").textContent = $(".card-ref", card)?.textContent ?? "";
    $("#d-title").textContent = $("h3", card)?.textContent ?? "";
    $("#d-sum").textContent = $("p", card)?.textContent ?? "";
    $("#d-stack").innerHTML = $(".chips", card)?.innerHTML ?? "";
    $("#d-links").innerHTML = [...($(".card-foot", card)?.querySelectorAll("a") ?? [])]
      .map((a) => '<a class="btn" href="' + a.href + '" target="_blank" rel="noopener noreferrer">' + a.textContent + '</a>').join("");
    dlg.showModal();
    history.replaceState(null, "", "#p-" + key);
    $("#d-close").focus();
  };
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => open(b.dataset.open)));
  const close = () => { dlg.close(); };
  $("#d-close").addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => { opener?.focus(); });
  if (location.hash.startsWith("#p-")) open(location.hash.slice(3));
})();

/* copy email, with the mailto link alongside as the no-JS route */
(() => {
  const b = $("#copy"), v = $("#copy-v");
  b?.addEventListener("click", async () => {
    const original = v.textContent;
    try { await navigator.clipboard.writeText(b.dataset.email); v.textContent = "Copied to clipboard"; }
    catch { v.textContent = b.dataset.email; }
    setTimeout(() => { v.textContent = original; }, 1800);
  });
})();
`;

writeFileSync("index.new.html", `${html}${html2}<script type="module">${js}</script>\n</body>\n</html>\n`);
console.log("wrote index.new.html");
console.log("projects on page:", counts.total, "| migrated:", counts.migrated, "| groups:", grouped.map((g) => `${g.label}:${g.items.length}`).join(", "));
