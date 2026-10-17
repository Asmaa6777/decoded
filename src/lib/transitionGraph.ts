/* Transition graphs (TGs) in the textbook sense: edges are labelled with
   whole words (or Λ for the empty word), there may be several start states,
   and a word is accepted if it can be cut into pieces that follow some path
   from a start state to a final state. A generalized TG labels edges with
   regular expressions instead; eliminating states one at a time turns any
   TG into a single expression, which is half of Kleene's theorem. */

import type { Frame } from "@/lib/algorithms";
import { parseRe, showRe, type Re } from "@/lib/regular";

export type TgEdge = { from: string; to: string; label: string };
export type Tg = { states: string[]; start: string[]; final: string[]; edges: TgEdge[] };

const EMPTY = new Set(["", "Λ", "λ", "ε"]);
const wordOf = (label: string) => (EMPTY.has(label) ? "" : label);

/**
 * Finds an accepting path for `word`, breadth first so the path uses as few
 * edges as possible. Returns the edges taken, or null if the TG rejects it.
 */
export function tgAccepts(tg: Tg, word: string): TgEdge[] | null {
  type Node = { state: string; pos: number; edge: TgEdge | null; parent: Node | null };
  const seen = new Set<string>();
  const queue: Node[] = tg.start.map((state) => ({ state, pos: 0, edge: null, parent: null }));
  queue.forEach((n) => seen.add(`${n.state}@0`));
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head];
    if (n.pos === word.length && tg.final.includes(n.state)) {
      const path: TgEdge[] = [];
      for (let x: Node | null = n; x?.edge; x = x.parent) path.unshift(x.edge);
      return path;
    }
    for (const e of tg.edges) {
      if (e.from !== n.state) continue;
      const w = wordOf(e.label);
      if (!word.startsWith(w, n.pos)) continue;
      const key = `${e.to}@${n.pos + w.length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: e.to, pos: n.pos + w.length, edge: e, parent: n });
    }
  }
  return null;
}

/* ---------- regular-expression algebra with light simplification ---------- */

const EPS: Re = { t: "eps" };
const same = (a: Re, b: Re) => showRe(a) === showRe(b);

export function reUnion(a: Re | null, b: Re | null): Re | null {
  if (!a) return b;
  if (!b) return a;
  if (same(a, b)) return a;
  return { t: "union", a, b };
}

export function reConcat(a: Re, b: Re): Re {
  if (a.t === "eps") return b;
  if (b.t === "eps") return a;
  return { t: "concat", a, b };
}

export function reStar(a: Re | null): Re {
  if (!a || a.t === "eps") return EPS;
  if (a.t === "star") return a;
  return { t: "star", a };
}

const labelRe = (label: string): Re => (EMPTY.has(label) ? EPS : parseRe(label));

/* ---------- state elimination ---------- */

export const START = "−";
export const FINAL = "+";

export type GtgEdge = { from: string; to: string; label: string };

export type EliminationState = {
  states: string[];
  edges: GtgEdge[];
  /** the state being removed in this step */
  removing: string | null;
  /** edges this step created or changed, as "from>to" keys */
  changed: string[];
  result: string | null;
};

export const ELIMINATION_STEPS = [
  "add a new start − and a new final +, joined to the old ones by Λ-edges",
  "merge parallel edges p → s labelled r1 and r2 into one labelled r1 + r2",
  "pick a state q (not − or +) to remove",
  "for each path p → q → s: new label = in · (loop on q)* · out",
  "when only − and + are left, the label on − → + is the regular expression",
];

type Edges = Map<string, Re>;
const key = (from: string, to: string) => `${from}>${to}`;

function snapshot(states: string[], edges: Edges, removing: string | null, changed: string[], result: string | null): EliminationState {
  return {
    states: [...states],
    edges: [...edges].map(([k, re]) => {
      const [from, to] = k.split(">");
      return { from, to, label: showRe(re) };
    }),
    removing,
    changed,
    result,
  };
}

/**
 * Frames for turning a TG into a regular expression. `order` lists the
 * states to eliminate; by default they go in the order the TG lists them.
 */
export function eliminationFrames(tg: Tg, order: string[] = tg.states): Frame<EliminationState>[] {
  const frames: Frame<EliminationState>[] = [];
  let states = [START, ...tg.states, FINAL];
  const edges: Edges = new Map();
  const add = (from: string, to: string, re: Re) => edges.set(key(from, to), reUnion(edges.get(key(from, to)) ?? null, re)!);

  // Step 0: the raw TG plus a unique start and final.
  for (const s of tg.start) add(START, s, EPS);
  for (const s of tg.final) add(s, FINAL, EPS);
  const raw = new Map<string, number>();
  for (const e of tg.edges) raw.set(key(e.from, e.to), (raw.get(key(e.from, e.to)) ?? 0) + 1);
  frames.push({
    state: snapshot(states, new Map([...edges, ...tg.edges.map((e) => [key(e.from, e.to), labelRe(e.label)] as [string, Re])]), null, [], null),
    line: 0,
    message: `Add a new start state − with Λ-edges into ${tg.start.join(", ")}, and a new final state + with Λ-edges out of ${tg.final.join(", ")}. Now there is exactly one way in and one way out.`,
    stats: { states: tg.states.length },
  });

  for (const e of tg.edges) add(e.from, e.to, labelRe(e.label));
  const merged = [...raw].filter(([, n]) => n > 1).map(([k]) => k);
  if (merged.length) {
    frames.push({
      state: snapshot(states, edges, null, merged, null),
      line: 1,
      message: `Merge parallel edges: two edges between the same pair of states become one edge labelled with their union.`,
      stats: { states: tg.states.length },
    });
  }

  for (const q of order) {
    if (!states.includes(q)) continue;
    const loop = edges.get(key(q, q)) ?? null;
    const ins = [...edges].filter(([k]) => k.endsWith(`>${q}`) && !k.startsWith(`${q}>`));
    const outs = [...edges].filter(([k]) => k.startsWith(`${q}>`) && !k.endsWith(`>${q}`));
    frames.push({
      state: snapshot(states, edges, q, [], null),
      line: 2,
      message: `Remove ${q}. It has ${ins.length} edge${ins.length === 1 ? "" : "s"} in, ${outs.length} out${loop ? `, and a loop labelled ${showRe(loop)}` : ", and no loop"}.`,
      stats: { states: states.length - 2 },
    });

    const changed: string[] = [];
    for (const [ik, inRe] of ins) {
      const p = ik.split(">")[0];
      for (const [ok, outRe] of outs) {
        const s = ok.split(">")[1];
        add(p, s, reConcat(reConcat(inRe, reStar(loop)), outRe));
        changed.push(key(p, s));
      }
    }
    for (const k of [...edges.keys()]) if (k.startsWith(`${q}>`) || k.endsWith(`>${q}`)) edges.delete(k);
    states = states.filter((s) => s !== q);
    frames.push({
      state: snapshot(states, edges, null, changed, null),
      line: 3,
      message: changed.length
        ? `Bypass ${q}: each path p → ${q} → s becomes one edge labelled (in)(loop)*(out), joined with + to any edge p → s that was already there.`
        : `${q} had no path through it, so removing it changes nothing else.`,
      stats: { states: states.length - 2 },
    });
  }

  const final = edges.get(key(START, FINAL)) ?? null;
  const result = final ? showRe(final) : "∅";
  frames.push({
    state: snapshot(states, edges, null, [key(START, FINAL)], result),
    line: 4,
    message: final ? `Only − and + are left. The label on the edge between them is the answer: ${result}.` : `No edge joins − to +, so the TG accepts nothing: the language is empty.`,
    stats: { states: 0 },
  });
  return frames;
}

/** The final regular expression, or null if the language is empty. */
export function tgToRe(tg: Tg, order?: string[]): string | null {
  const last = eliminationFrames(tg, order).at(-1)!;
  return last.state.result === "∅" ? null : last.state.result;
}
