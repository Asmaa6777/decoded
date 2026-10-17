/* Context-free grammars for the Theory of Computation visualizers.
   Variables are single uppercase letters, terminals are any other single
   character, and an empty right-hand side (written ε) is the empty string.
   Every function here is pure; the components only replay what it returns. */

import type { Frame } from "@/lib/algorithms";

export type Production = { lhs: string; rhs: string };
export type Grammar = { start: string; productions: Production[] };

export const EPSILON = "ε";

export const isVariable = (c: string) => c >= "A" && c <= "Z";

/**
 * Reads rules like "S -> aSb | ε", one left-hand side per line. "→" works
 * as well as "->". The first rule's left-hand side is the start variable.
 */
export function parseGrammar(text: string): Grammar {
  const productions: Production[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-Z])\s*(?:->|→)\s*(.*)$/);
    if (!m) throw new Error(`Can't read rule "${line}". Write it like S -> aSb | ε`);
    for (const alt of m[2].split("|")) {
      const rhs = alt.replace(/\s+/g, "");
      productions.push({ lhs: m[1], rhs: rhs === EPSILON || rhs === "ε" ? "" : rhs });
    }
  }
  if (!productions.length) throw new Error("The grammar has no rules.");
  return { start: productions[0].lhs, productions };
}

export const showRhs = (rhs: string) => (rhs === "" ? EPSILON : rhs);
export const showRule = (p: Production) => `${p.lhs} → ${showRhs(p.rhs)}`;

export type DerivationStep = {
  /** sentential form after this step */
  form: string;
  /** index into grammar.productions, or -1 for the start symbol */
  rule: number;
  /** where the replaced variable sat in the previous form */
  at: number;
};

/** Shortest terminal string each variable can produce (Infinity if none). */
export function minYield(g: Grammar): Record<string, number> {
  const min: Record<string, number> = {};
  for (const p of g.productions) min[p.lhs] = Infinity;
  const cost = (c: string) => (isVariable(c) ? min[c] ?? Infinity : 1);
  for (let changed = true; changed; ) {
    changed = false;
    for (const p of g.productions) {
      const v = [...p.rhs].reduce((n, c) => n + cost(c), 0);
      if (v < min[p.lhs]) {
        min[p.lhs] = v;
        changed = true;
      }
    }
  }
  return min;
}

/**
 * Breadth-first search over leftmost derivations, so the first hit is a
 * shortest one. A form is pruned when its terminal prefix can't lead to the
 * target, or when its terminals plus the least its variables must still
 * produce already exceed the target's length. `slack` caps how many
 * variables that could vanish may pile up. Returns null if the target
 * isn't derivable within the search budget.
 */
export function leftmostDerivation(
  g: Grammar,
  target: string,
  { maxForms = 40_000, slack = 4 } = {},
): DerivationStep[] | null {
  const min = minYield(g);
  type Node = { form: string; rule: number; at: number; parent: Node | null };
  const root: Node = { form: g.start, rule: -1, at: 0, parent: null };
  const seen = new Set([g.start]);
  const queue: Node[] = [root];

  const viable = (form: string) => {
    let i = 0;
    while (i < form.length && !isVariable(form[i])) {
      if (form[i] !== target[i]) return false;
      i++;
    }
    let least = 0;
    let variables = 0;
    for (const c of form) {
      if (isVariable(c)) {
        least += min[c] ?? Infinity;
        variables++;
      } else least++;
    }
    return least <= target.length && variables <= target.length + slack;
  };

  for (let head = 0; head < queue.length && head < maxForms; head++) {
    const node = queue[head];
    if (node.form === target) {
      const steps: DerivationStep[] = [];
      for (let n: Node | null = node; n; n = n.parent) steps.unshift({ form: n.form, rule: n.rule, at: n.at });
      return steps;
    }
    const at = [...node.form].findIndex(isVariable);
    if (at < 0) continue;
    g.productions.forEach((p, rule) => {
      if (p.lhs !== node.form[at]) return;
      const form = node.form.slice(0, at) + p.rhs + node.form.slice(at + 1);
      if (seen.has(form) || !viable(form)) return;
      seen.add(form);
      queue.push({ form, rule, at, parent: node });
    });
  }
  return null;
}

export type DerivationState = {
  /** every sentential form so far, oldest first */
  forms: string[];
  /** [start, end) of the text the last rule wrote into the newest form */
  inserted: [number, number] | null;
  done: boolean;
  failed: boolean;
};

/** Stepper frames for deriving `target`; `line` indexes grammar.productions. */
export function derivationFrames(g: Grammar, target: string): Frame<DerivationState>[] {
  const steps = leftmostDerivation(g, target);
  const shown = target === "" ? EPSILON : target;
  if (!steps) {
    return [
      {
        state: { forms: [g.start], inserted: null, done: true, failed: true },
        line: -1,
        message: `No derivation of "${shown}" found. It isn't in this grammar's language (or needs a longer search).`,
        stats: { steps: 0 },
      },
    ];
  }
  return steps.map((s, i) => {
    const forms = steps.slice(0, i + 1).map((x) => x.form);
    const last = i === steps.length - 1;
    if (i === 0) {
      return {
        state: { forms, inserted: null, done: last, failed: false },
        line: -1,
        message: `Start from the start variable ${g.start}. Each step replaces the leftmost variable using one rule.`,
        stats: { steps: 0 },
      };
    }
    const p = g.productions[s.rule];
    const replaced = `Replace ${p.lhs} using ${showRule(p)}`;
    return {
      state: { forms, inserted: [s.at, s.at + p.rhs.length], done: last, failed: false },
      line: s.rule,
      message: last
        ? `${replaced}. No variables are left, so "${shown}" is in the language: ${g.start} ⇒* ${shown}.`
        : `${replaced}.`,
      stats: { steps: i },
    };
  });
}

/** The shortest strings a grammar generates, for listing a language's first members. */
export function shortestStrings(g: Grammar, count = 8, maxLen = 8): string[] {
  const out = new Set<string>();
  const seen = new Set([g.start]);
  const queue = [g.start];
  for (let head = 0; head < queue.length && head < 20_000 && out.size < count * 4; head++) {
    const form = queue[head];
    const at = [...form].findIndex(isVariable);
    if (at < 0) {
      out.add(form);
      continue;
    }
    for (const p of g.productions) {
      if (p.lhs !== form[at]) continue;
      const next = form.slice(0, at) + p.rhs + form.slice(at + 1);
      const terminals = [...next].filter((c) => !isVariable(c)).length;
      if (terminals > maxLen || next.length > maxLen + 3 || seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return [...out].sort((a, b) => a.length - b.length || a.localeCompare(b)).slice(0, count);
}
