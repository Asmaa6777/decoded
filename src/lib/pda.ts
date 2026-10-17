/* Pushdown automata drawn as flowcharts, the way the course textbook does:
   START, READ (take the next input letter, or Δ once the input is used up),
   POP (take the top of the stack, or Δ if it's empty), PUSH, ACCEPT and
   REJECT. Edges out of READ and POP are labelled with the symbol they
   expect; a missing edge means the machine crashes, which rejects. The
   machine may be nondeterministic, so acceptance means some path reaches
   ACCEPT, and the simulator searches all of them breadth first. */

import type { Frame } from "@/lib/algorithms";

export const BLANK = "Δ";

export type PdaNodeKind = "start" | "read" | "pop" | "push" | "accept" | "reject";
export type PdaNode = { id: string; kind: PdaNodeKind; push?: string };
export type PdaEdge = { from: string; to: string; label?: string };
export type Pda = { nodes: PdaNode[]; edges: PdaEdge[] };

export type PdaConfig = {
  node: string;
  /** letters of the input already read */
  pos: number;
  /** bottom of the stack first; symbols may be longer than one character (T1, V2) */
  stack: string[];
  /** what the last move did, for captions */
  did: string;
};

/**
 * An accepting run for `word` (the list of configurations from START to
 * ACCEPT), or null if every path crashes, rejects or runs past the limits.
 */
export function runPda(pda: Pda, word: string, { maxConfigs = 50_000, maxStack = word.length * 2 + 6 } = {}): PdaConfig[] | null {
  const byId = new Map(pda.nodes.map((n) => [n.id, n]));
  const out = (id: string, label?: string) => pda.edges.filter((e) => e.from === id && (label === undefined || e.label === label));
  const start = pda.nodes.find((n) => n.kind === "start");
  if (!start) throw new Error("A PDA needs a START node.");

  type Node = PdaConfig & { parent: Node | null };
  const key = (c: PdaConfig) => `${c.node}|${c.pos}|${c.stack.join(" ")}`;
  const queue: Node[] = [{ node: start.id, pos: 0, stack: [], did: "start", parent: null }];
  const seen = new Set([key(queue[0])]);

  for (let head = 0; head < queue.length && head < maxConfigs; head++) {
    const c = queue[head];
    const n = byId.get(c.node)!;
    if (n.kind === "accept") {
      const path: PdaConfig[] = [];
      for (let x: Node | null = c; x; x = x.parent) path.unshift({ node: x.node, pos: x.pos, stack: x.stack, did: x.did });
      return path;
    }
    if (n.kind === "reject") continue;

    const next: PdaConfig[] = [];
    if (n.kind === "start") {
      for (const e of out(n.id)) next.push({ node: e.to, pos: c.pos, stack: c.stack, did: "begin" });
    } else if (n.kind === "read") {
      const letter = c.pos < word.length ? word[c.pos] : BLANK;
      for (const e of out(n.id, letter)) next.push({ node: e.to, pos: letter === BLANK ? c.pos : c.pos + 1, stack: c.stack, did: `read ${letter}` });
    } else if (n.kind === "pop") {
      const top = c.stack.length ? c.stack[c.stack.length - 1] : BLANK;
      for (const e of out(n.id, top)) next.push({ node: e.to, pos: c.pos, stack: c.stack.slice(0, -1), did: `pop ${top}` });
    } else if (n.kind === "push") {
      if (c.stack.length < maxStack) for (const e of out(n.id)) next.push({ node: e.to, pos: c.pos, stack: [...c.stack, n.push ?? ""], did: `push ${n.push}` });
    }
    for (const x of next) {
      if (seen.has(key(x))) continue;
      seen.add(key(x));
      queue.push({ ...x, parent: c });
    }
  }
  return null;
}

export type PdaState = {
  config: PdaConfig;
  word: string;
  accepted: boolean | null;
};

const caption = (c: PdaConfig) => {
  if (c.did === "start") return "Start. The stack is empty and the head is on the first letter.";
  if (c.did === "begin") return "Leave START.";
  if (c.did.startsWith("read")) {
    const s = c.did.slice(5);
    return s === BLANK ? "READ finds Δ: the input is used up." : `READ takes the next letter, ${s}, and follows the edge labelled ${s}.`;
  }
  if (c.did.startsWith("pop")) {
    const s = c.did.slice(4);
    return s === BLANK ? "POP finds Δ: the stack is empty." : `POP removes ${s} from the top of the stack and follows the edge labelled ${s}.`;
  }
  if (c.did.startsWith("push")) return `PUSH puts ${c.did.slice(5)} on top of the stack.`;
  return c.did;
};

/** Stepper frames replaying an accepting run, or one frame explaining the rejection. */
export function pdaFrames(pda: Pda, word: string): Frame<PdaState>[] {
  const path = runPda(pda, word);
  if (!path) {
    return [
      {
        state: { config: { node: pda.nodes.find((n) => n.kind === "start")!.id, pos: 0, stack: [], did: "start" }, word, accepted: false },
        line: -1,
        message: `No path reaches ACCEPT for "${word || "Λ"}": every possible run crashes on a missing edge or reaches REJECT. The word is rejected.`,
        stats: { steps: 0 },
      },
    ];
  }
  return path.map((c, i) => {
    const last = i === path.length - 1;
    return {
      state: { config: c, word, accepted: last ? true : null },
      line: -1,
      message: last ? `${caption(c)} ACCEPT reached, so "${word || "Λ"}" is accepted.` : caption(c),
      stats: { steps: i, stack: c.stack.length },
    };
  });
}
