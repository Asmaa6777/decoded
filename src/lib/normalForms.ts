/* Simplifying context-free grammars and converting them to Chomsky Normal
   Form, following the course's Lecture 7: remove Λ-productions (nullable
   variables), remove unit productions, optionally drop useless variables,
   give every terminal in a long rule its own variable T, then break long
   right-hand sides into pairs with new variables V. Right-hand sides are
   symbol lists here, because the new variables (T1, V2, ...) have
   multi-character names. */

import type { Frame } from "@/lib/algorithms";
import type { Grammar } from "@/lib/grammar";

export type Rule = { lhs: string; rhs: string[] };
export type Cfg = { start: string; rules: Rule[] };

export const isVar = (sym: string) => /^[A-Z]/.test(sym);

export function fromGrammar(g: Grammar): Cfg {
  return { start: g.start, rules: g.productions.map((p) => ({ lhs: p.lhs, rhs: [...p.rhs] })) };
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** T1 → T₁, so generated names read like the lecture notes. */
export const showSym = (sym: string) => sym.replace(/\d/g, (d) => SUB[Number(d)]);
export const showRule = (r: Rule) => `${showSym(r.lhs)} → ${r.rhs.length ? r.rhs.map(showSym).join("") : "Λ"}`;
const ruleKey = (r: Rule) => `${r.lhs}→${r.rhs.join(" ")}`;

function dedupe(rules: Rule[]): Rule[] {
  const seen = new Set<string>();
  return rules.filter((r) => (seen.has(ruleKey(r)) ? false : (seen.add(ruleKey(r)), true)));
}

/** Variables that can derive Λ. */
export function nullable(g: Cfg): Set<string> {
  const out = new Set<string>();
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of g.rules) {
      if (!out.has(r.lhs) && r.rhs.every((s) => out.has(s))) {
        out.add(r.lhs);
        changed = true;
      }
    }
  }
  return out;
}

/** Every way of dropping some nullable symbols from a right-hand side, except dropping all. */
function variants(rhs: string[], nulls: Set<string>): string[][] {
  let acc: string[][] = [[]];
  for (const s of rhs) acc = acc.flatMap((v) => (nulls.has(s) ? [[...v, s], v] : [[...v, s]]));
  return acc.filter((v) => v.length > 0);
}

export function removeNull(g: Cfg): Cfg {
  const nulls = nullable(g);
  return { start: g.start, rules: dedupe(g.rules.filter((r) => r.rhs.length > 0).flatMap((r) => variants(r.rhs, nulls).map((rhs) => ({ lhs: r.lhs, rhs })))) };
}

const isUnit = (r: Rule) => r.rhs.length === 1 && isVar(r.rhs[0]);

export function removeUnits(g: Cfg): Cfg {
  const vars = [...new Set(g.rules.map((r) => r.lhs))];
  const out: Rule[] = [];
  for (const a of vars) {
    // Every B reachable from A through unit rules alone (including A itself).
    const reach = new Set([a]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const r of g.rules) {
        if (isUnit(r) && reach.has(r.lhs) && !reach.has(r.rhs[0])) {
          reach.add(r.rhs[0]);
          changed = true;
        }
      }
    }
    for (const b of reach) for (const r of g.rules) if (r.lhs === b && !isUnit(r)) out.push({ lhs: a, rhs: r.rhs });
  }
  return { start: g.start, rules: dedupe(out) };
}

/** Drops variables that can't produce a terminal string, then ones the start can't reach. */
export function removeUseless(g: Cfg): Cfg {
  const generating = new Set<string>();
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of g.rules) {
      if (!generating.has(r.lhs) && r.rhs.every((s) => !isVar(s) || generating.has(s))) {
        generating.add(r.lhs);
        changed = true;
      }
    }
  }
  const productive = g.rules.filter((r) => generating.has(r.lhs) && r.rhs.every((s) => !isVar(s) || generating.has(s)));
  const reachable = new Set([g.start]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of productive) {
      if (!reachable.has(r.lhs)) continue;
      for (const s of r.rhs) {
        if (isVar(s) && !reachable.has(s)) {
          reachable.add(s);
          changed = true;
        }
      }
    }
  }
  return { start: g.start, rules: productive.filter((r) => reachable.has(r.lhs)) };
}

export const CNF_STEPS = [
  "remove Λ-productions: find nullable variables, add every rule with them dropped",
  "remove unit productions A → B: give A all of B's non-unit rules",
  "remove useless variables (optional): ones that generate nothing or can't be reached",
  "in rules of length ≥ 2, replace each terminal a with a new variable T, adding T → a",
  "break A → B1 B2 … Bk (k > 2) into A → B1 V and V → B2 … Bk, repeating until every rule has two",
];

export type CnfState = {
  rules: Rule[];
  /** keys of rules this step added or changed */
  changed: string[];
  note: string | null;
};

/** Stepper frames converting `input` to Chomsky Normal Form; the last frame holds the result. */
export function cnfFrames(input: Cfg): Frame<CnfState>[] {
  const frames: Frame<CnfState>[] = [];
  const push = (g: Cfg, line: number, message: string, changed: Rule[] = [], note: string | null = null) =>
    frames.push({
      state: { rules: g.rules.map((r) => ({ lhs: r.lhs, rhs: [...r.rhs] })), changed: changed.map(ruleKey), note },
      line,
      message,
      stats: { rules: g.rules.length },
    });
  const added = (before: Cfg, after: Cfg) => {
    const old = new Set(before.rules.map(ruleKey));
    return after.rules.filter((r) => !old.has(ruleKey(r)));
  };

  let g = input;
  push(g, -1, "The grammar we start from.");

  const nulls = nullable(g);
  const noNull = removeNull(g);
  push(
    noNull,
    0,
    nulls.size
      ? `Nullable: ${[...nulls].map(showSym).join(", ")}. Delete the Λ-rules and, wherever a nullable variable appears, add a copy of the rule without it.`
      : "No variable is nullable, so there are no Λ-productions to remove.",
    added(g, noNull),
    nulls.has(g.start) ? "The start variable was nullable, so Λ itself is no longer generated. CNF describes the language without Λ." : null,
  );
  g = noNull;

  const noUnit = removeUnits(g);
  const units = g.rules.filter(isUnit);
  push(
    noUnit,
    1,
    units.length
      ? `Unit productions: ${units.map(showRule).join(", ")}. Replace each by the non-unit rules of the variable it points to.`
      : "There are no unit productions.",
    added(g, noUnit),
  );
  g = noUnit;

  const useful = removeUseless(g);
  const dropped = [...new Set(g.rules.map((r) => r.lhs))].filter((v) => !useful.rules.some((r) => r.lhs === v));
  push(useful, 2, dropped.length ? `Useless variables: ${dropped.map(showSym).join(", ")}. Drop them and every rule that mentions them.` : "Every variable is useful, so nothing to drop.");
  g = useful;

  // Step 4: a variable per terminal, used only inside rules of length >= 2.
  const tFor = new Map<string, string>();
  let rules = g.rules.map((r) => ({ lhs: r.lhs, rhs: [...r.rhs] }));
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.rhs.length < 2 || r.rhs.every(isVar)) continue;
    const created: Rule[] = [];
    r.rhs = r.rhs.map((s) => {
      if (isVar(s)) return s;
      if (!tFor.has(s)) {
        const t = `T${tFor.size + 1}`;
        tFor.set(s, t);
        created.push({ lhs: t, rhs: [s] });
      }
      return tFor.get(s)!;
    });
    rules = [...rules, ...created];
    push({ start: g.start, rules }, 3, `Rewrite ${showRule(r)} so it mentions only variables${created.length ? `, adding ${created.map(showRule).join(", ")}` : ""}.`, [r, ...created]);
  }

  // Step 5: binarize.
  let v = 0;
  const out: Rule[] = [];
  for (const r of rules) {
    if (r.rhs.length <= 2) {
      out.push(r);
      continue;
    }
    const chain: Rule[] = [];
    let lhs = r.lhs;
    let rest = r.rhs;
    while (rest.length > 2) {
      const name = `V${++v}`;
      chain.push({ lhs, rhs: [rest[0], name] });
      lhs = name;
      rest = rest.slice(1);
    }
    chain.push({ lhs, rhs: rest });
    out.push(...chain);
    push(
      { start: g.start, rules: [...out, ...rules.slice(rules.indexOf(r) + 1)] },
      4,
      `${showSym(r.lhs)} → ${r.rhs.map(showSym).join("")} has ${r.rhs.length} symbols. Split it into ${chain.map(showRule).join(", ")}.`,
      chain,
    );
  }
  const done: Cfg = { start: g.start, rules: out };
  push(done, 4, "Every rule is now A → BC or A → a. The grammar is in Chomsky Normal Form.", [], null);
  return frames;
}

export function toCnf(g: Cfg): Cfg {
  const last = cnfFrames(g).at(-1)!;
  return { start: g.start, rules: last.state.rules };
}

export function isCnf(g: Cfg): boolean {
  return g.rules.every((r) => (r.rhs.length === 2 && r.rhs.every(isVar)) || (r.rhs.length === 1 && !isVar(r.rhs[0])));
}

/**
 * The CYK algorithm: decides whether a CNF grammar generates a non-empty
 * word in O(n³) by filling a table of which variables derive each substring.
 */
export function cyk(g: Cfg, word: string): boolean {
  const n = word.length;
  if (n === 0) return false;
  const table: Set<string>[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => new Set<string>()));
  for (let i = 0; i < n; i++) for (const r of g.rules) if (r.rhs.length === 1 && r.rhs[0] === word[i]) table[i][i].add(r.lhs);
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      for (let k = i; k < j; k++) {
        for (const r of g.rules) {
          if (r.rhs.length === 2 && table[i][k].has(r.rhs[0]) && table[k + 1][j].has(r.rhs[1])) table[i][j].add(r.lhs);
        }
      }
    }
  }
  return table[0][n - 1].has(g.start);
}

/** Greibach Normal Form check: every rule is A → a followed by zero or more variables. */
export function isGnf(g: Cfg): boolean {
  return g.rules.every((r) => r.rhs.length >= 1 && !isVar(r.rhs[0]) && r.rhs.slice(1).every(isVar));
}
