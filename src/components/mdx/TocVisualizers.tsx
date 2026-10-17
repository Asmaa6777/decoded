import { useId, useMemo, useState } from "react";
import { Stepper } from "@/components/mdx/AlgoVisualizers";
import { derivationFrames, findDerivation, isVariable, leftmostDerivations, parseGrammar, parseTree, shortestStrings, showRule, EPSILON, type DerivationState, type Side, type TreeNode } from "@/lib/grammar";
import { alphabetOf, firstDifference, firstWords, matcher, parseRe, ReError } from "@/lib/regular";
import { eliminationFrames, ELIMINATION_STEPS, FINAL, START, tgAccepts, type Tg } from "@/lib/transitionGraph";
import { kleeneBuild, KLEENE_RULES, type Dfa, type KleeneOp, type KleeneState } from "@/lib/kleene";
import { cnfFrames, CNF_STEPS, cyk, fromGrammar, showRule as cnfRule, showSym, type CnfState } from "@/lib/normalForms";
import { BLANK, pdaFrames, type Pda, type PdaState } from "@/lib/pda";
import { cfgToPda } from "@/lib/cfgPda";
import { AutomatonDiagram } from "@/components/mdx/MdxComponents";

/* ============================================================
   Theory of Computation visualizers. Same pattern as the
   algorithm ones: pure frames from src/lib, replayed through the
   shared <Stepper>, with the "source" panel showing the rules or
   table the machine is following.

   Colour language:
     sky  = variables (still to be replaced)
     neon = what the current step just wrote
     mint = finished / accepted
   ============================================================ */

const btn =
  "font-mono text-[11px] uppercase tracking-widest px-3 py-2 border border-border hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm";
const inputCls =
  "font-mono text-sm px-3 py-2 border border-border bg-transparent text-foreground focus:outline-none focus:border-foreground rounded-sm";

function SententialForm({ form, inserted, final }: { form: string; inserted?: [number, number] | null; final?: boolean }) {
  if (form === "") return <span className="text-muted-foreground">{EPSILON}</span>;
  return (
    <>
      {[...form].map((c, i) => {
        const fresh = inserted && i >= inserted[0] && i < inserted[1];
        const cls = isVariable(c) ? "text-sky font-bold" : final ? "text-mint" : "text-foreground";
        return (
          <span key={i} className={`${cls} ${fresh ? "bg-neon/25 rounded-[2px]" : ""}`}>
            {c}
          </span>
        );
      })}
    </>
  );
}

function DerivationView({ s }: { s: DerivationState }) {
  const last = s.forms.length - 1;
  return (
    <ol className="flex flex-col gap-1 font-mono text-lg leading-snug">
      {s.forms.map((f, i) => (
        <li key={i} className={`flex items-baseline gap-3 ${i < last ? "opacity-50" : ""}`}>
          <span className="w-5 text-right text-xs text-muted-foreground">{i === 0 ? "" : "⇒"}</span>
          <span className="tracking-wider">
            <SententialForm form={f} inserted={i === last ? s.inserted : null} final={i === last && s.done && !s.failed} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Step through a leftmost derivation of `target`. Both the grammar and the
 * target can be edited; the language's shortest strings are offered as
 * one-click targets.
 */
export function DerivationStepper({
  grammar = "S -> aSb | ε",
  target = "aabb",
  showSide = false,
}: {
  grammar?: string;
  target?: string;
  /** offer a leftmost / rightmost toggle */
  showSide?: boolean;
}) {
  const [side, setSide] = useState<Side>("leftmost");
  const [rulesText, setRulesText] = useState(grammar);
  const [applied, setApplied] = useState({ rules: grammar, target });
  const [targetText, setTargetText] = useState(target);

  const parsed = useMemo(() => {
    try {
      return { g: parseGrammar(applied.rules), error: null as string | null };
    } catch (e) {
      return { g: null, error: (e as Error).message };
    }
  }, [applied.rules]);

  const frames = useMemo(() => (parsed.g ? derivationFrames(parsed.g, applied.target, side) : []), [parsed.g, applied.target, side]);
  const examples = useMemo(() => (parsed.g ? shortestStrings(parsed.g, 6) : []), [parsed.g]);

  const apply = (t = targetText) => {
    const clean = t.replace(/\s+/g, "").replace(EPSILON, "");
    setTargetText(clean);
    setApplied({ rules: rulesText, target: clean });
  };

  const inputs = (
    <div className="flex flex-col gap-3">
      {showSide && (
        <div className="inline-flex self-start border border-border rounded-sm overflow-hidden">
          {(["leftmost", "rightmost"] as Side[]).map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={side === x}
              onClick={() => setSide(x)}
              className={`font-mono text-[11px] uppercase tracking-widest px-3 py-2 transition-colors ${side === x ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-stretch gap-2">
        <textarea
          aria-label="Grammar rules"
          className={`${inputCls} flex-1 min-w-[200px] min-h-[64px] resize-y`}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          spellCheck={false}
        />
        <div className="flex flex-col gap-2">
          <input
            aria-label="String to derive"
            className={`${inputCls} w-40`}
            value={targetText}
            placeholder="ε"
            onChange={(e) => setTargetText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            spellCheck={false}
          />
          <button type="button" className={btn} onClick={() => apply()}>
            Derive
          </button>
        </div>
      </div>
      {examples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="uppercase tracking-widest">in the language:</span>
          {examples.map((x) => (
            <button key={x} type="button" className="px-2 py-1 border border-border rounded-sm hover:border-foreground text-foreground" onClick={() => apply(x)}>
              {x === "" ? EPSILON : x}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">
        One rule per line, uppercase letters are variables, the first rule's variable is the start, and ε is the empty string.
      </p>
    </div>
  );

  if (!parsed.g) {
    return (
      <div className="not-prose my-8 border border-border bg-card rounded-sm p-5 flex flex-col gap-3 text-foreground">
        <div className="eyebrow text-sky">Derivation</div>
        <p className="text-sm text-orange">{parsed.error}</p>
        {inputs}
      </div>
    );
  }

  return (
    <Stepper
      title={side === "leftmost" ? "Leftmost derivation" : "Rightmost derivation"}
      frames={frames}
      code={parsed.g.productions.map(showRule)}
      codeLabel="Rules"
      legend={[
        ["bg-sky", "variable"],
        ["bg-neon", "just written"],
        ["bg-mint", "derived string"],
      ]}
      render={(s) => <DerivationView s={s} />}
      inputs={inputs}
    />
  );
}

/* ---------------------- regular expressions (exam notation) ---------------------- */

function useParsedRe(text: string) {
  return useMemo(() => {
    try {
      return { re: parseRe(text), error: null as string | null };
    } catch (e) {
      return { re: null, error: e instanceof ReError ? e.message : "Couldn't read that expression." };
    }
  }, [text]);
}

const showWord = (w: string) => (w === "" ? EPSILON : w);

/**
 * Type an expression in textbook notation (+ is union) and see its first
 * words in shortlex order, the way exam answers list them, plus a
 * membership check for any word.
 */
export function RegexWords({ initial = "(ab+ba)*aa", count = 14 }: { initial?: string; count?: number }) {
  const [text, setText] = useState(initial);
  const [n, setN] = useState(count);
  const [probe, setProbe] = useState("");
  const { re, error } = useParsedRe(text);

  const words = useMemo(() => (re ? firstWords(re, n) : []), [re, n]);
  const member = useMemo(() => {
    if (!re) return null;
    const w = probe.replace(/\s+/g, "").replace(/[ελΛ]/g, "");
    return { w, ok: matcher(re)(w) };
  }, [re, probe]);

  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="px-5 pt-4 eyebrow text-sky">Language of a regular expression</div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="re-words-input">
            RE =
          </label>
          <input id="re-words-input" className={`${inputCls} flex-1 min-w-[200px]`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <label className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            first
            <select value={n} onChange={(e) => setN(Number(e.target.value))} className="bg-transparent border border-border rounded-sm px-2 py-1.5 text-foreground">
              {[5, 10, 14, 20].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            words
          </label>
        </div>

        {error ? (
          <p className="text-sm text-orange">{error}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 font-mono text-sm">
              {words.map((w, i) => (
                <span key={w} className="px-2 py-1 border border-border rounded-sm">
                  <span className="text-[10px] text-muted-foreground mr-1.5">{i + 1}</span>
                  {showWord(w)}
                </span>
              ))}
              {words.length < n && <span className="px-2 py-1 text-xs text-muted-foreground italic self-center">no more words up to length 14</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="re-words-probe">
                is this word in L?
              </label>
              <input id="re-words-probe" className={`${inputCls} w-44`} value={probe} placeholder="ε" onChange={(e) => setProbe(e.target.value)} spellCheck={false} />
              {member && (
                <span className={`font-mono text-xs uppercase tracking-widest ${member.ok ? "text-mint" : "text-orange"}`}>
                  {member.ok ? "yes, in the language" : "no"}
                </span>
              )}
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Textbook notation: + is union (or), * is zero or more repetitions, writing two things side by side concatenates them, and ε is the empty string.
        </p>
      </div>
    </div>
  );
}

/**
 * An exam-style "write an RE for this language" exercise. The answer is
 * compared against a reference expression on every word up to length 8,
 * and the shortest word they disagree on is shown as the counterexample.
 */
export function ReChallenge({
  prompt,
  answer,
  alphabet = "ab",
  hint,
}: {
  prompt: string;
  /** a correct expression, used only to check the reader's attempt */
  answer: string;
  alphabet?: string;
  hint?: string;
}) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const reference = useMemo(() => parseRe(answer), [answer]);
  const attempt = useParsedRe(checked ?? "a");
  const sigma = useMemo(() => [...alphabet], [alphabet]);

  const result = useMemo(() => {
    if (checked === null) return null;
    if (!attempt.re) return { kind: "error" as const, msg: attempt.error };
    const extra = alphabetOf(attempt.re).filter((c) => !sigma.includes(c));
    if (extra.length) return { kind: "error" as const, msg: `Use only the symbols ${sigma.join(", ")}. Found: ${extra.join(", ")}.` };
    const diff = firstDifference(attempt.re, reference, sigma);
    if (!diff) return { kind: "ok" as const };
    return {
      kind: "wrong" as const,
      msg: diff.inAnswer
        ? `Your expression generates "${showWord(diff.word)}", which isn't in the language.`
        : `Your expression misses "${showWord(diff.word)}", which is in the language.`,
    };
  }, [checked, attempt, reference, sigma]);

  return (
    <div className="not-prose my-6 border border-border bg-card rounded-sm p-5 flex flex-col gap-3 text-foreground">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="eyebrow text-orange">Write the RE</div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Σ = {"{"}{sigma.join(", ")}{"}"}</span>
      </div>
      <p className="text-sm leading-relaxed">{prompt}</p>
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          aria-label="Your regular expression"
          className={`${inputCls} flex-1 min-w-[200px]`}
          value={text}
          placeholder="e.g. (a+b)*bbb"
          onChange={(e) => {
            setText(e.target.value);
            setChecked(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && setChecked(text)}
          spellCheck={false}
        />
        <button type="button" className={btn} onClick={() => setChecked(text)}>
          Check
        </button>
        {hint && (
          <button type="button" className={btn} onClick={() => setShowHint((h) => !h)}>
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
      </div>
      {result && (
        <p aria-live="polite" className={`text-sm ${result.kind === "ok" ? "text-mint" : "text-orange"}`}>
          {result.kind === "ok" ? "Correct. It matches the language on every word up to length 8." : result.msg}
        </p>
      )}
      {showHint && hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* --------------------------- transition graphs --------------------------- */

export type TgNode = { id: string; x: number; y: number };

const edgeKey = (from: string, to: string) => `${from}>${to}`;

/** Draws a transition graph whose edge labels are words or regular expressions. */
function TgSvg({
  nodes,
  edges,
  start,
  final,
  highlight = [],
  removing = null,
  active = [],
}: {
  nodes: TgNode[];
  edges: { from: string; to: string; label: string }[];
  start: string[];
  final: string[];
  highlight?: string[];
  removing?: string | null;
  active?: string[];
}) {
  const reactId = useId().replace(/:/g, "");
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const pad = 70;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad - 20;
  const w = Math.max(...xs) - minX + pad;
  const h = Math.max(...ys) - minY + pad;
  const r = 20;
  // Several labels can land on one edge pair; draw them as one union label.
  const grouped = new Map<string, string[]>();
  for (const e of edges) grouped.set(edgeKey(e.from, e.to), [...(grouped.get(edgeKey(e.from, e.to)) ?? []), e.label]);

  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} width={w} height={h} className="block mx-auto max-w-full h-auto text-foreground" role="img" aria-label="Transition graph">
      <defs>
        {["muted", "neon"].map((tone) => (
          <marker key={tone} id={`${reactId}-${tone}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={tone === "neon" ? "fill-neon" : "fill-muted-foreground"} />
          </marker>
        ))}
      </defs>
      {[...grouped].map(([k, labels]) => {
        const [from, to] = k.split(">");
        const a = pos.get(from);
        const b = pos.get(to);
        if (!a || !b) return null;
        const hot = highlight.includes(k);
        const stroke = hot ? "stroke-neon" : "stroke-muted-foreground";
        const marker = `url(#${reactId}-${hot ? "neon" : "muted"})`;
        const text = labels.map((l) => (l === "" || l === "Λ" || l === "ε" ? "Λ" : l)).join(", ");
        const labelBox = (lx: number, ly: number) => (
          <g>
            <rect x={lx - text.length * 3.6 - 5} y={ly - 9} width={text.length * 7.2 + 10} height={18} rx={3} className="fill-card" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={12} className={`font-mono ${hot ? "fill-neon font-bold" : "fill-current"}`}>
              {text}
            </text>
          </g>
        );
        if (from === to) {
          const d = `M ${a.x - 12} ${a.y - r + 4} C ${a.x - 34} ${a.y - 70}, ${a.x + 34} ${a.y - 70}, ${a.x + 12} ${a.y - r + 4}`;
          return (
            <g key={k}>
              <path d={d} fill="none" className={stroke} strokeWidth={hot ? 2.5 : 1.5} markerEnd={marker} />
              {labelBox(a.x, a.y - 62)}
            </g>
          );
        }
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const bend = grouped.has(edgeKey(to, from)) ? 26 : 0;
        const nx = -uy * bend;
        const ny = ux * bend;
        const sx = a.x + ux * r;
        const sy = a.y + uy * r;
        const ex = b.x - ux * (r + 2);
        const ey = b.y - uy * (r + 2);
        const cx = (sx + ex) / 2 + nx;
        const cy = (sy + ey) / 2 + ny;
        return (
          <g key={k}>
            <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" className={stroke} strokeWidth={hot ? 2.5 : 1.5} markerEnd={marker} />
            {labelBox((sx + ex) / 2 + nx / 2, (sy + ey) / 2 + ny / 2)}
          </g>
        );
      })}
      {nodes.map((n) => {
        const isStart = start.includes(n.id);
        const isFinal = final.includes(n.id);
        const tone = removing === n.id ? "fill-orange/25 stroke-orange" : active.includes(n.id) ? "fill-neon/30 stroke-neon" : isFinal ? "fill-mint/15 stroke-mint" : "fill-card stroke-current";
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={r} strokeWidth={2} className={tone} />
            {isFinal && <circle cx={n.x} cy={n.y} r={r - 4} strokeWidth={1.5} className="fill-none stroke-mint" />}
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={13} className="font-mono font-bold fill-current">
              {n.id}
            </text>
            {(isStart || isFinal) && (
              <text x={n.x} y={n.y + r + 13} textAnchor="middle" fontSize={11} className="font-mono fill-muted-foreground">
                {[isStart ? "start" : "", isFinal ? "final" : ""].filter(Boolean).join(" · ")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Type a word and see whether the TG accepts it, with the accepting path
 * highlighted and the word cut into the pieces each edge consumed.
 */
export function TgRunner({ tg, layout, initial = "abb" }: { tg: Tg; layout: TgNode[]; initial?: string }) {
  const [word, setWord] = useState(initial);
  const clean = word.replace(/\s+/g, "").replace(/[ελΛ]/g, "");
  const path = useMemo(() => tgAccepts(tg, clean), [tg, clean]);
  const pieces = path?.map((e) => (e.label === "" || e.label === "Λ" || e.label === "ε" ? "Λ" : e.label));

  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="px-5 pt-4 eyebrow text-sky">Run the transition graph</div>
      <div className="p-5 overflow-x-auto">
        <TgSvg nodes={layout} edges={tg.edges} start={tg.start} final={tg.final} highlight={path?.map((e) => edgeKey(e.from, e.to)) ?? []} />
      </div>
      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="tg-runner-word">
            word
          </label>
          <input id="tg-runner-word" className={`${inputCls} w-48`} value={word} placeholder="Λ" onChange={(e) => setWord(e.target.value)} spellCheck={false} />
        </div>
        <p aria-live="polite" className="text-sm leading-relaxed">
          {path ? (
            <>
              <span className="text-mint font-semibold">Accepted.</span> Cut it as{" "}
              <span className="font-mono">{pieces!.length ? pieces!.join(" | ") : "Λ"}</span> and follow{" "}
              <span className="font-mono">{[path[0]?.from ?? tg.start.find((s) => tg.final.includes(s)), ...path.map((e) => e.to)].join(" → ")}</span> from a start state to a final state.
            </>
          ) : (
            <>
              <span className="text-orange font-semibold">Rejected.</span> No path from a start state to a final state spells out "{clean || "Λ"}".
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Step through turning a TG into a regular expression by eliminating states. */
export function StateEliminator({ tg, layout, order }: { tg: Tg; layout: TgNode[]; order?: string[] }) {
  const frames = useMemo(() => eliminationFrames(tg, order), [tg, order]);
  const nodes = useMemo(() => {
    const xs = layout.map((n) => n.x);
    const ys = layout.map((n) => n.y);
    const midY = ys.reduce((s, y) => s + y, 0) / ys.length;
    // − to the left, + below the middle, so edges into + never run through another state.
    return [
      { id: START, x: Math.min(...xs) - 130, y: midY },
      ...layout,
      { id: FINAL, x: (Math.min(...xs) + Math.max(...xs)) / 2, y: Math.max(...ys) + 130 },
    ];
  }, [layout]);

  return (
    <Stepper
      title="TG → regular expression"
      frames={frames}
      code={ELIMINATION_STEPS}
      codeLabel="Algorithm"
      legend={[
        ["bg-orange", "being removed"],
        ["bg-neon", "new or changed edge"],
      ]}
      render={(s) => (
        <div className="flex flex-col gap-3">
          <TgSvg
            nodes={nodes.filter((n) => s.states.includes(n.id))}
            edges={s.edges}
            start={[START]}
            final={[FINAL]}
            highlight={s.changed}
            removing={s.removing}
          />
          {s.result && (
            <div className="font-mono text-sm">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px] mr-2">RE =</span>
              <span className="text-mint font-bold">{s.result}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

/* ------------------------- Kleene's theorem builder ------------------------- */

function DfaTable({ name, dfa }: { name: string; dfa: Dfa }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{name}</div>
      <table className="font-mono text-xs border-collapse">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left font-normal" />
            {dfa.alphabet.map((c) => (
              <th key={c} className="px-2 py-1 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((q) => (
            <tr key={q} className="border-t border-border/60">
              <td className={`px-2 py-1 ${dfa.finals.includes(q) ? "text-mint font-bold" : ""}`}>
                {q === dfa.start ? "−" : ""}
                {q}
                {dfa.finals.includes(q) ? "+" : ""}
              </td>
              {dfa.alphabet.map((c) => (
                <td key={c} className="px-2 py-1 text-center">
                  {dfa.delta[q][c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KleeneTable({ s, alphabet }: { s: KleeneState; alphabet: string[] }) {
  return (
    <table className="font-mono text-xs border-collapse min-w-[320px]">
      <thead>
        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
          <th className="px-2 py-1.5 text-left font-normal">new state</th>
          <th className="px-2 py-1.5 text-left font-normal">stands for</th>
          {alphabet.map((c) => (
            <th key={c} className="px-2 py-1.5 font-normal">
              on {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.rows.map((r, i) => (
          <tr key={r.name} className={`border-b border-border/50 ${i === s.current ? "bg-neon/15" : ""}`}>
            <td className={`px-2 py-1.5 font-bold ${r.final ? "text-mint" : ""}`}>
              {r.start ? "−" : ""}
              {r.name}
              {r.final ? "+" : ""}
            </td>
            <td className="px-2 py-1.5 text-muted-foreground">{r.meaning}</td>
            {alphabet.map((c) => (
              <td key={c} className="px-2 py-1.5 text-center">
                {r.next[c] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const OP_LABEL: Record<KleeneOp, string> = { union: "r1 + r2", concat: "r1 r2", star: "r1*" };

/**
 * Build a DFA for r1 + r2, r1r2 or r1* from DFAs for r1 and r2, one table
 * row at a time, then run words on the result.
 */
export function KleeneBuilder({ fa1, fa2, r1, r2, initial = "union" }: { fa1: Dfa; fa2: Dfa; r1: string; r2: string; initial?: KleeneOp }) {
  const [op, setOp] = useState<KleeneOp>(initial);
  const { dfa, frames } = useMemo(() => kleeneBuild(op, fa1, op === "star" ? undefined : fa2), [op, fa1, fa2]);
  const transitions = dfa.states.flatMap((q) => dfa.alphabet.map((c) => ({ from: q, to: dfa.delta[q][c], label: c })));

  return (
    <div className="not-prose my-8 flex flex-col gap-4">
      <div className="border border-border bg-card rounded-sm p-5 flex flex-wrap gap-8 text-foreground">
        <DfaTable name={`FA1 · r1 = ${r1}`} dfa={fa1} />
        <DfaTable name={`FA2 · r2 = ${r2}`} dfa={fa2} />
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">build a DFA for</div>
          <div className="inline-flex border border-border rounded-sm overflow-hidden">
            {(["union", "concat", "star"] as KleeneOp[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOp(o)}
                aria-pressed={op === o}
                className={`font-mono text-[12px] px-3 py-2 transition-colors ${op === o ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}
              >
                {OP_LABEL[o]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">− marks the start state and + marks final states, as in the course notes.</p>
        </div>
      </div>
      <div className="[&>div]:my-0">
        <Stepper
          title={`Kleene: DFA for ${OP_LABEL[op]}`}
          frames={frames}
          code={KLEENE_RULES[op]}
          codeLabel="Rules"
          legend={[
            ["bg-neon", "row being filled"],
            ["bg-mint", "final state"],
          ]}
          render={(s) => <KleeneTable s={s} alphabet={dfa.alphabet} />}
        />
      </div>
      <div className="[&>div]:my-0">
        <AutomatonDiagram key={op} states={dfa.states} alphabet={dfa.alphabet} transitions={transitions} initial={dfa.start} accepting={dfa.finals} />
      </div>
    </div>
  );
}

/* ------------------------------ parse trees ------------------------------ */

type Placed = { label: string; x: number; y: number; children: Placed[] };

/** Leaves get consecutive columns; each parent sits centered above its children. */
function placeTree(t: TreeNode, depth = 0, next = { col: 0 }): Placed {
  if (t.children.length === 0) return { label: t.label, x: next.col++, y: depth, children: [] };
  const children = t.children.map((c) => placeTree(c, depth + 1, next));
  return { label: t.label, x: (children[0].x + children[children.length - 1].x) / 2, y: depth, children };
}

function TreeSvg({ tree }: { tree: TreeNode }) {
  const placed = placeTree(tree);
  const all: Placed[] = [];
  const walk = (n: Placed) => {
    all.push(n);
    n.children.forEach(walk);
  };
  walk(placed);
  const dx = 34;
  const dy = 52;
  const w = (Math.max(...all.map((n) => n.x)) + 1) * dx + 20;
  const h = (Math.max(...all.map((n) => n.y)) + 1) * dy;
  const X = (n: Placed) => n.x * dx + dx / 2 + 10;
  const Y = (n: Placed) => n.y * dy + 22;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block max-w-full h-auto text-foreground" role="img" aria-label="Parse tree">
      {all.flatMap((n) => n.children.map((c, i) => <line key={`${X(n)}-${Y(n)}-${i}`} x1={X(n)} y1={Y(n) + 11} x2={X(c)} y2={Y(c) - 11} className="stroke-muted-foreground" strokeWidth={1.2} />))}
      {all.map((n, i) => {
        const variable = isVariable(n.label);
        return (
          <g key={i}>
            {variable && <circle cx={X(n)} cy={Y(n)} r={12} className="fill-sky/15 stroke-sky" strokeWidth={1.5} />}
            <text x={X(n)} y={Y(n)} textAnchor="middle" dominantBaseline="central" fontSize={13} className={`font-mono ${variable ? "fill-sky font-bold" : n.label === EPSILON ? "fill-muted-foreground" : "fill-mint font-bold"}`}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Draws the parse tree for a word, and a second one if the grammar allows
 * it. Two different trees for the same word prove the grammar is ambiguous.
 */
export function ParseTreeExplorer({ grammar, target }: { grammar: string; target: string }) {
  const g = useMemo(() => parseGrammar(grammar), [grammar]);
  const [word, setWord] = useState(target);
  const clean = word.replace(/\s+/g, "");
  const derivations = useMemo(() => leftmostDerivations(g, clean, 2), [g, clean]);
  const trees = derivations.map((d) => parseTree(g, d));

  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="eyebrow text-sky">Parse trees</div>
        <div className="font-mono text-xs text-muted-foreground">{g.productions.map(showRule).join("   ")}</div>
      </div>
      <div className="p-5 flex flex-wrap gap-8 overflow-x-auto">
        {trees.map((t, i) => (
          <div key={i} className="flex flex-col gap-2">
            {trees.length > 1 && <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">tree {i + 1} · first rule {showRule(g.productions[derivations[i][1].rule])}</div>}
            <TreeSvg tree={t} />
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="parse-tree-word">
            word
          </label>
          <input id="parse-tree-word" className={`${inputCls} w-48`} value={word} onChange={(e) => setWord(e.target.value)} spellCheck={false} />
        </div>
        <p aria-live="polite" className="text-sm leading-relaxed">
          {trees.length === 0 && <span className="text-orange">This grammar doesn't generate "{clean || EPSILON}".</span>}
          {trees.length === 1 && <>One parse tree found. Its leaves, read left to right, spell <span className="font-mono">{clean || EPSILON}</span>.</>}
          {trees.length === 2 && (
            <>
              <span className="text-orange font-semibold">Ambiguous for this word.</span> Two different parse trees produce the same <span className="font-mono">{clean}</span>, so the grammar is ambiguous.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* --------------------------- normal forms (CNF) --------------------------- */

function RuleList({ s }: { s: CnfState }) {
  // Group rules by left-hand side, like A → x | y in the notes.
  const groups = new Map<string, { text: string; hot: boolean }[]>();
  for (const r of s.rules) {
    const k = `${r.lhs}→${r.rhs.join(" ")}`;
    groups.set(r.lhs, [...(groups.get(r.lhs) ?? []), { text: r.rhs.length ? r.rhs.map(showSym).join("") : "Λ", hot: s.changed.includes(k) }]);
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1 font-mono text-sm">
        {[...groups].map(([lhs, alts]) => (
          <li key={lhs} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sky font-bold w-8">{showSym(lhs)}</span>
            <span className="text-muted-foreground">→</span>
            {alts.map((a, i) => (
              <span key={i} className="inline-flex items-baseline gap-2">
                {i > 0 && <span className="text-muted-foreground">|</span>}
                <span className={a.hot ? "bg-neon/25 rounded-[2px] px-1 font-semibold" : ""}>{a.text}</span>
              </span>
            ))}
          </li>
        ))}
      </ul>
      {s.note && <p className="text-xs text-orange leading-relaxed">{s.note}</p>}
    </div>
  );
}

/**
 * Convert an editable grammar to Chomsky Normal Form step by step, then
 * check words against both the original grammar and the CNF one (via CYK).
 */
export function CnfConverter({ grammar }: { grammar: string }) {
  const [text, setText] = useState(grammar);
  const [applied, setApplied] = useState(grammar);
  const [word, setWord] = useState("");

  const parsed = useMemo(() => {
    try {
      const g = parseGrammar(applied);
      return { g, frames: cnfFrames(fromGrammar(g)), error: null as string | null };
    } catch (e) {
      return { g: null, frames: [], error: (e as Error).message };
    }
  }, [applied]);

  const check = useMemo(() => {
    if (!parsed.g || !word.trim()) return null;
    const w = word.replace(/\s+/g, "");
    const cnf = { start: parsed.g.start, rules: parsed.frames.at(-1)!.state.rules };
    return { w, original: findDerivation(parsed.g, w) !== null, cnf: cyk(cnf, w) };
  }, [parsed, word]);

  const inputs = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-stretch gap-2">
        <textarea aria-label="Grammar rules" className={`${inputCls} flex-1 min-w-[200px] min-h-[72px] resize-y`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <button type="button" className={btn} onClick={() => setApplied(text)}>
          Convert
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="cnf-word">
          test a word
        </label>
        <input id="cnf-word" className={`${inputCls} w-40`} value={word} onChange={(e) => setWord(e.target.value)} spellCheck={false} />
        {check && (
          <span className="font-mono text-xs">
            original: <span className={check.original ? "text-mint" : "text-orange"}>{check.original ? "yes" : "no"}</span> · CNF (CYK):{" "}
            <span className={check.cnf ? "text-mint" : "text-orange"}>{check.cnf ? "yes" : "no"}</span>
          </span>
        )}
      </div>
    </div>
  );

  if (!parsed.g) {
    return (
      <div className="not-prose my-8 border border-border bg-card rounded-sm p-5 flex flex-col gap-3 text-foreground">
        <div className="eyebrow text-sky">Chomsky Normal Form</div>
        <p className="text-sm text-orange">{parsed.error}</p>
        {inputs}
      </div>
    );
  }

  return (
    <Stepper
      title="Convert to Chomsky Normal Form"
      frames={parsed.frames}
      code={CNF_STEPS}
      codeLabel="Steps"
      legend={[["bg-neon", "added or changed this step"]]}
      render={(s) => <RuleList s={s} />}
      inputs={inputs}
    />
  );
}

/* ---------------------------- pushdown automata ---------------------------- */

export type PdaLayout = { id: string; x: number; y: number }[];

const PDA_LEGEND = [
  "START: where every run begins",
  "READ: take the next letter (Δ once the input is used up)",
  "POP: take the top of the stack (Δ if the stack is empty)",
  "PUSH x: put x on top of the stack",
  "ACCEPT: the word is accepted",
];
const kindLine: Record<string, number> = { start: 0, read: 1, pop: 2, push: 3, accept: 4, reject: 4 };

function PdaSvg({ pda, layout, current }: { pda: Pda; layout: PdaLayout; current: string }) {
  const reactId = useId().replace(/:/g, "");
  const pos = new Map(layout.map((n) => [n.id, n]));
  const xs = layout.map((n) => n.x);
  const ys = layout.map((n) => n.y);
  const minX = Math.min(...xs) - 60;
  const minY = Math.min(...ys) - 40;
  const w = Math.max(...xs) - minX + 60;
  const h = Math.max(...ys) - minY + 40;
  const pairs = new Set(pda.edges.map((e) => `${e.from}>${e.to}`));
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} width={w} height={h} className="block mx-auto max-w-full h-auto text-foreground" role="img" aria-label="Pushdown automaton">
      <defs>
        <marker id={`${reactId}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
        </marker>
      </defs>
      {pda.edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const bend = pairs.has(`${e.to}>${e.from}`) ? 22 : 0;
        const sx = a.x + ux * 30;
        const sy = a.y + uy * 24;
        const ex = b.x - ux * 34;
        const ey = b.y - uy * 26;
        const cx = (sx + ex) / 2 - uy * bend;
        const cy = (sy + ey) / 2 + ux * bend;
        return (
          <g key={i}>
            <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" className="stroke-muted-foreground" strokeWidth={1.4} markerEnd={`url(#${reactId}-arr)`} />
            {e.label && (
              <g>
                <rect x={(sx + ex) / 2 - uy * bend * 0.5 - 9} y={(sy + ey) / 2 + ux * bend * 0.5 - 9} width={18} height={18} rx={3} className="fill-card" />
                <text x={(sx + ex) / 2 - uy * bend * 0.5} y={(sy + ey) / 2 + ux * bend * 0.5} textAnchor="middle" dominantBaseline="central" fontSize={12} className="font-mono fill-current font-bold">
                  {showSym(e.label)}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {pda.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const hot = n.id === current;
        const tone = hot ? "fill-neon/30 stroke-neon" : n.kind === "accept" ? "fill-mint/15 stroke-mint" : n.kind === "reject" ? "fill-orange/15 stroke-orange" : "fill-card stroke-current";
        const label = n.kind === "push" ? `PUSH ${showSym(n.push ?? "")}` : n.kind.toUpperCase();
        return (
          <g key={n.id}>
            {n.kind === "read" || n.kind === "pop" ? (
              <polygon points={`${p.x},${p.y - 24} ${p.x + 34},${p.y} ${p.x},${p.y + 24} ${p.x - 34},${p.y}`} strokeWidth={hot ? 2.5 : 1.5} className={tone} />
            ) : (
              <rect x={p.x - 36} y={p.y - 15} width={72} height={30} rx={n.kind === "push" ? 2 : 15} strokeWidth={hot ? 2.5 : 1.5} className={tone} />
            )}
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={10} className="font-mono fill-current font-bold">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TapeAndStack({ s, showForm = false }: { s: PdaState; showForm?: boolean }) {
  const cells = [...s.word, BLANK, BLANK];
  return (
    <div className="flex flex-wrap items-end gap-8">
      <div className="flex flex-col gap-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">input tape</div>
        <div className="flex">
          {cells.map((c, i) => (
            <div
              key={i}
              className={`w-8 h-9 flex items-center justify-center font-mono text-sm border-y border-r first:border-l ${
                i === s.config.pos ? "border-neon bg-neon/20 font-bold" : i < s.config.pos ? "border-border text-muted-foreground/50" : "border-border"
              }`}
            >
              {c}
            </div>
          ))}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">read so far: {s.word.slice(0, s.config.pos) || "nothing"}</div>
      </div>
      <div className="flex flex-col gap-1 items-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">stack</div>
        <div className="flex flex-col-reverse min-h-[40px] justify-start">
          {s.config.stack.length === 0 ? (
            <div className="w-10 h-8 flex items-center justify-center font-mono text-xs text-muted-foreground border border-dashed border-border">Δ</div>
          ) : (
            s.config.stack.map((c, i) => (
              <div key={i} className={`w-10 h-8 flex items-center justify-center font-mono text-sm border border-sky ${i === s.config.stack.length - 1 ? "bg-sky/25 font-bold" : "bg-sky/10"}`}>
                {showSym(c)}
              </div>
            ))
          )}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">top ↑</div>
      </div>
      {showForm && (
        <div className={`flex flex-col gap-1 transition-opacity ${s.config.node === "pop" ? "" : "opacity-35"}`}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">read so far + stack, top first</div>
          <div className="font-mono text-lg">
            <span className="text-mint">{s.word.slice(0, s.config.pos)}</span>
            <span className="text-sky font-bold">{[...s.config.stack].reverse().map(showSym).join("")}</span>
            {s.config.pos === 0 && s.config.stack.length === 0 && <span className="text-muted-foreground">Λ</span>}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {s.config.node === "pop" ? "at the POP: one step of the leftmost derivation" : "mid-rule: complete again at the next POP"}
          </div>
        </div>
      )}
    </div>
  );
}

/** Run a word through a flowchart-style PDA and watch the tape and stack. */
export function PdaRunner({
  pda,
  layout,
  initial = "aabb",
  title = "Pushdown automaton",
  showForm = false,
}: {
  pda: Pda;
  layout: PdaLayout;
  initial?: string;
  title?: string;
  /** show read-so-far + stack as a sentential form (for PDAs built from a grammar) */
  showForm?: boolean;
}) {
  const [text, setText] = useState(initial);
  const word = text.replace(/\s+/g, "").replace(/[ΛλεΔ]/g, "");
  const frames = useMemo(() => {
    const kinds = new Map(pda.nodes.map((n) => [n.id, n.kind]));
    return pdaFrames(pda, word).map((f) => ({ ...f, line: kindLine[kinds.get(f.state.config.node) ?? "start"] }));
  }, [pda, word]);

  return (
    <Stepper
      title={title}
      frames={frames}
      code={PDA_LEGEND}
      codeLabel="Boxes"
      legend={[
        ["bg-neon", "current box / head"],
        ["bg-sky", "stack"],
      ]}
      render={(s) => (
        <div className="flex flex-col gap-5">
          <PdaSvg pda={pda} layout={layout} current={s.config.node} />
          <TapeAndStack s={s} showForm={showForm} />
        </div>
      )}
      inputs={
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor={`pda-word-${title}`}>
            word
          </label>
          <input id={`pda-word-${title}`} className={`${inputCls} w-48`} value={text} placeholder="Λ" onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </div>
      }
    />
  );
}

/* ------------------------------- CFG = PDA ------------------------------- */

/**
 * Type a grammar; it is converted to Chomsky Normal Form and turned into
 * the course's PDA (push S, loop on POP), which can then run words.
 */
export function GrammarToPda({ grammar, initial }: { grammar: string; initial: string }) {
  const [text, setText] = useState(grammar);
  const [applied, setApplied] = useState(grammar);
  const built = useMemo(() => {
    try {
      return { ...cfgToPda(parseGrammar(applied)), error: null as string | null };
    } catch (e) {
      return { error: (e as Error).message, pda: null, layout: null, cnf: null };
    }
  }, [applied]);

  return (
    <div className="not-prose my-8 flex flex-col gap-4">
      <div className="border border-border bg-card rounded-sm p-5 flex flex-col gap-3 text-foreground">
        <div className="eyebrow text-sky">Grammar → PDA</div>
        <div className="flex flex-wrap items-stretch gap-2">
          <textarea aria-label="Grammar rules" className={`${inputCls} flex-1 min-w-[200px] min-h-[64px] resize-y`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <button type="button" className={btn} onClick={() => setApplied(text)}>
            Build PDA
          </button>
        </div>
        {built.error ? (
          <p className="text-sm text-orange">{built.error}</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs">
            <span className="uppercase tracking-widest text-[10px] text-muted-foreground">in CNF:</span>
            {built.cnf!.rules.map((r, i) => (
              <span key={i}>{cnfRule(r)}</span>
            ))}
          </div>
        )}
      </div>
      {built.pda && (
        <div className="[&>div]:my-0">
          <PdaRunner key={applied} pda={built.pda} layout={built.layout!} initial={initial} title="PDA built from the grammar" showForm />
        </div>
      )}
    </div>
  );
}
