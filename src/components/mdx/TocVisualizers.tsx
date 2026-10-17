import { useId, useMemo, useState } from "react";
import { Stepper } from "@/components/mdx/AlgoVisualizers";
import { derivationFrames, isVariable, parseGrammar, shortestStrings, showRule, EPSILON, type DerivationState } from "@/lib/grammar";
import { alphabetOf, firstDifference, firstWords, matcher, parseRe, ReError } from "@/lib/regular";
import { eliminationFrames, ELIMINATION_STEPS, FINAL, START, tgAccepts, type Tg } from "@/lib/transitionGraph";

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
export function DerivationStepper({ grammar = "S -> aSb | ε", target = "aabb" }: { grammar?: string; target?: string }) {
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

  const frames = useMemo(() => (parsed.g ? derivationFrames(parsed.g, applied.target) : []), [parsed.g, applied.target]);
  const examples = useMemo(() => (parsed.g ? shortestStrings(parsed.g, 6) : []), [parsed.g]);

  const apply = (t = targetText) => {
    const clean = t.replace(/\s+/g, "").replace(EPSILON, "");
    setTargetText(clean);
    setApplied({ rules: rulesText, target: clean });
  };

  const inputs = (
    <div className="flex flex-col gap-3">
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
      title="Leftmost derivation"
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
