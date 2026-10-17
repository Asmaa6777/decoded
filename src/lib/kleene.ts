/* The constructive half of Kleene's theorem: given DFAs for r1 and r2,
   build DFAs for r1 + r2, r1r2 and r1*. Each new state stands for a
   combination of old ones, built breadth first from the start, so the
   frames read like the hand-built transition tables in exam answers. */

import type { Frame } from "@/lib/algorithms";

export type Dfa = {
  states: string[];
  alphabet: string[];
  start: string;
  finals: string[];
  /** delta[state][symbol] = next state; every entry must be present */
  delta: Record<string, Record<string, string>>;
};

export type KleeneOp = "union" | "concat" | "star";

export function runDfa(d: Dfa, word: string): boolean {
  let s = d.start;
  for (const c of word) {
    const next = d.delta[s]?.[c];
    if (next === undefined) return false;
    s = next;
  }
  return d.finals.includes(s);
}

export type KleeneRow = {
  name: string;
  /** what the new state stands for, e.g. "x1 or y2" */
  meaning: string;
  next: Record<string, string>;
  final: boolean;
  start: boolean;
};

export type KleeneState = {
  rows: KleeneRow[];
  /** index of the row being filled this step, or -1 */
  current: number;
  done: boolean;
};

export const KLEENE_RULES: Record<KleeneOp, string[]> = {
  union: [
    "start: z1 = (start of FA1, start of FA2)",
    "on each letter, move both halves: (x, y) → (δ1(x), δ2(y))",
    "a pair seen for the first time becomes a new state z",
    "z is final if x is final in FA1 OR y is final in FA2",
  ],
  concat: [
    "start: z1 = start of FA1 (plus start of FA2 if FA1's start is final)",
    "on each letter, move the FA1 part and every FA2 state in the set",
    "whenever the FA1 part lands on a final state, add FA2's start to the set",
    "z is final if its set contains a final state of FA2",
  ],
  star: [
    "start: a new z1 standing for FA1's start, final because Λ is in r*",
    "on each letter, move every FA1 state in the set",
    "whenever a move lands on a final state, also add FA1's start (begin a new repetition)",
    "z is final if its set contains a final state of FA1 (z1 is final by rule 1)",
  ],
};

type Key = string;

function build(
  alphabet: string[],
  init: { key: Key; meaning: string; final: boolean },
  step: (key: Key, c: string) => { key: Key; meaning: string; final: boolean },
  ruleFor: (phase: "start" | "fill" | "new" | "final") => number,
): { dfa: Dfa; frames: Frame<KleeneState>[] } {
  const names = new Map<Key, string>([[init.key, "z1"]]);
  const rows: KleeneRow[] = [{ name: "z1", meaning: init.meaning, next: {}, final: init.final, start: true }];
  const frames: Frame<KleeneState>[] = [];
  const snap = (current: number, done = false) => ({ rows: rows.map((r) => ({ ...r, next: { ...r.next } })), current, done });

  frames.push({
    state: snap(0),
    line: ruleFor("start"),
    message: `Start with z1 = ${init.meaning}${init.final ? ", which is final" : ""}.`,
    stats: { states: 1 },
  });

  const keys = [init.key];
  for (let i = 0; i < keys.length; i++) {
    for (const c of alphabet) {
      const target = step(keys[i], c);
      let name = names.get(target.key);
      const isNew = !name;
      if (!name) {
        name = `z${names.size + 1}`;
        names.set(target.key, name);
        keys.push(target.key);
        rows.push({ name, meaning: target.meaning, next: {}, final: target.final, start: false });
      }
      rows[i].next[c] = name;
      frames.push({
        state: snap(i),
        line: isNew ? (target.final ? ruleFor("final") : ruleFor("new")) : ruleFor("fill"),
        message: isNew
          ? `From ${rows[i].name} on ${c}: ${target.meaning} is new, so call it ${name}${target.final ? ". It's final" : ""}.`
          : `From ${rows[i].name} on ${c}: ${target.meaning} is ${name}, which we already have.`,
        stats: { states: rows.length },
      });
    }
  }
  frames.push({
    state: snap(-1, true),
    line: ruleFor("final"),
    message: `Every state has an edge for every letter, so the machine is complete: ${rows.length} states, final ones ${rows.filter((r) => r.final).map((r) => r.name).join(", ") || "none"}.`,
    stats: { states: rows.length },
  });

  const dfa: Dfa = {
    states: rows.map((r) => r.name),
    alphabet,
    start: "z1",
    finals: rows.filter((r) => r.final).map((r) => r.name),
    delta: Object.fromEntries(rows.map((r) => [r.name, r.next])),
  };
  return { dfa, frames };
}

const setKey = (xs: Iterable<string>, order: string[]) => [...new Set(xs)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
const showSet = (xs: string[]) => (xs.length ? xs.join(" or ") : "∅");

export function kleeneBuild(op: KleeneOp, a: Dfa, b?: Dfa): { dfa: Dfa; frames: Frame<KleeneState>[] } {
  const alphabet = a.alphabet;
  const line = (phase: "start" | "fill" | "new" | "final") => ({ start: 0, fill: 1, new: 2, final: 3 })[phase];

  if (op === "union") {
    if (!b) throw new Error("union needs two machines");
    const mk = (x: string, y: string) => ({ key: `${x}|${y}`, meaning: `${x} or ${y}`, final: a.finals.includes(x) || b.finals.includes(y) });
    return build(alphabet, mk(a.start, b.start), (k, c) => {
      const [x, y] = k.split("|");
      return mk(a.delta[x][c], b.delta[y][c]);
    }, line);
  }

  if (op === "concat") {
    if (!b) throw new Error("concatenation needs two machines");
    const mk = (x: string, ys: string[]) => {
      const set = setKey(a.finals.includes(x) ? [...ys, b.start] : ys, b.states);
      return { key: `${x}|${set.join(",")}`, meaning: showSet([x, ...set]), final: set.some((y) => b.finals.includes(y)) };
    };
    return build(alphabet, mk(a.start, []), (k, c) => {
      const [x, rest] = k.split("|");
      const ys = rest ? rest.split(",") : [];
      return mk(a.delta[x][c], ys.map((y) => b.delta[y][c]));
    }, line);
  }

  // star: sets of FA1 states; z1 is a special start that is final for Λ.
  const mk = (xs: string[]) => {
    const withRestart = xs.some((x) => a.finals.includes(x)) ? [...xs, a.start] : xs;
    const set = setKey(withRestart, a.states);
    return { key: set.join(","), meaning: showSet(set), final: set.some((x) => a.finals.includes(x)) };
  };
  const init = { key: "START", meaning: `${a.start} (the new start)`, final: true };
  return build(alphabet, init, (k, c) => {
    const xs = k === "START" ? [a.start] : k ? k.split(",") : [];
    return mk(xs.map((x) => a.delta[x][c]));
  }, line);
}
