import { useMemo, useState } from "react";
import { Stepper } from "@/components/mdx/AlgoVisualizers";
import { derivationFrames, isVariable, parseGrammar, shortestStrings, showRule, EPSILON, type DerivationState } from "@/lib/grammar";

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
