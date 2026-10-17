import { useMemo, useState } from "react";
import { Stepper } from "@/components/mdx/AlgoVisualizers";
import { derivationFrames, isVariable, parseGrammar, shortestStrings, showRule, EPSILON, type DerivationState } from "@/lib/grammar";
import { alphabetOf, firstDifference, firstWords, matcher, parseRe, ReError } from "@/lib/regular";

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
