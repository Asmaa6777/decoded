/* CFG = PDA, the direction the course builds by hand (Lecture 9): from a
   grammar in Chomsky Normal Form, make a PDA that simulates leftmost
   derivations on its stack. Push S, then loop on one central POP:
     - popping X with a rule X → YZ pushes Z and then Y (so Y is on top),
     - popping X with a rule X → a reads a from the input,
     - popping Δ (empty stack) and then reading Δ (input used up) accepts.
   At every moment, the input read so far followed by the stack (top first)
   is a sentential form of a leftmost derivation. */

import type { Grammar } from "@/lib/grammar";
import { fromGrammar, isVar, nullable, toCnf, type Cfg } from "@/lib/normalForms";
import type { Pda, PdaEdge, PdaNode } from "@/lib/pda";

export type PdaLayout = { id: string; x: number; y: number }[];

export function cnfToPda(cnf: Cfg, acceptsEmpty: boolean): { pda: Pda; layout: PdaLayout } {
  const nodes: PdaNode[] = [
    { id: "start", kind: "start" },
    { id: "pushS", kind: "push", push: cnf.start },
    { id: "pop", kind: "pop" },
    { id: "readEnd", kind: "read" },
    { id: "accept", kind: "accept" },
  ];
  const edges: PdaEdge[] = [
    { from: "start", to: "pushS" },
    { from: "pushS", to: "pop" },
    { from: "pop", to: "readEnd", label: "Δ" },
    { from: "readEnd", to: "accept", label: "Δ" },
  ];
  const layout: PdaLayout = [
    { id: "start", x: 0, y: -250 },
    { id: "pushS", x: 0, y: -135 },
    { id: "pop", x: 0, y: 0 },
    { id: "readEnd", x: 0, y: 150 },
    { id: "accept", x: 0, y: 245 },
  ];

  if (acceptsEmpty) {
    // Λ is in the language: a second way out of START that accepts only the empty word.
    nodes.push({ id: "readEmpty", kind: "read" }, { id: "acceptEmpty", kind: "accept" });
    edges.push({ from: "start", to: "readEmpty" }, { from: "readEmpty", to: "acceptEmpty", label: "Δ" });
    layout.push({ id: "readEmpty", x: 190, y: -250 }, { id: "acceptEmpty", x: 330, y: -250 });
  }

  // One ring slot per binary rule (two PUSH boxes) and per variable with terminal rules (one READ box).
  const binary = cnf.rules.filter((r) => r.rhs.length === 2);
  const readVars = [...new Set(cnf.rules.filter((r) => r.rhs.length === 1 && !isVar(r.rhs[0])).map((r) => r.lhs))];
  const slots = binary.length + readVars.length;
  // Spread slots over the right side (-50°..50°) then the left side (130°..230°).
  const angleOf = (i: number) => {
    const right = Math.ceil(slots / 2);
    const [from, to, k, n] = i < right ? [-50, 50, i, right] : [130, 230, i - right, slots - right];
    return ((from + (n === 1 ? (to - from) / 2 : ((to - from) * k) / (n - 1))) * Math.PI) / 180;
  };
  const at = (angle: number, r: number) => ({ x: Math.round(Math.cos(angle) * r), y: Math.round(Math.sin(angle) * r) });

  binary.forEach((r, i) => {
    const a = angleOf(i);
    const z = `push${i}z`;
    const y = `push${i}y`;
    nodes.push({ id: z, kind: "push", push: r.rhs[1] }, { id: y, kind: "push", push: r.rhs[0] });
    edges.push({ from: "pop", to: z, label: r.lhs }, { from: z, to: y }, { from: y, to: "pop" });
    const spread = slots > 6 ? 0.12 : 0.17;
    layout.push({ id: z, ...at(a - spread, 250) }, { id: y, ...at(a + spread, 250) });
  });

  readVars.forEach((v, j) => {
    const id = `read_${v}`;
    nodes.push({ id, kind: "read" });
    edges.push({ from: "pop", to: id, label: v });
    for (const r of cnf.rules) if (r.lhs === v && r.rhs.length === 1) edges.push({ from: id, to: "pop", label: r.rhs[0] });
    layout.push({ id, ...at(angleOf(binary.length + j), 210) });
  });

  return { pda: { nodes, edges }, layout };
}

/** Converts any CFG to CNF and builds the PDA for it. */
export function cfgToPda(g: Grammar) {
  const cfg = fromGrammar(g);
  const cnf = toCnf(cfg);
  return { cnf, ...cnfToPda(cnf, nullable(cfg).has(cfg.start)) };
}
