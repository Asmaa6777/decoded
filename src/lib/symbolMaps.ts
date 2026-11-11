/**
 * Logic behind the "symbol map" visualizers in Computer Architecture:
 * reading a gate symbol from its parts, wiring a 14-pin logic chip,
 * and driving the boxed latch and flip-flop symbols.
 */
import type { Bit } from "@/lib/logic";

/* ------------------------------ Gate anatomy ------------------------------ */

/** The body shape: triangle, flat back (AND), curved back (OR), curved back with a second line (XOR). */
export type GateBody = "buffer" | "and" | "or" | "xor";
export type GateParts = { body: GateBody; inBubbles: boolean; outBubble: boolean };

const not = (b: Bit): Bit => (b ? 0 : 1);

/** Output of a gate drawn with these parts. A buffer only reads `a`. */
export function gateOutput(p: GateParts, a: Bit, b: Bit): Bit {
  const x = p.inBubbles ? not(a) : a;
  const y = p.inBubbles ? not(b) : b;
  let core: Bit;
  if (p.body === "buffer") core = x;
  else if (p.body === "and") core = (x & y) as Bit;
  else if (p.body === "or") core = (x | y) as Bit;
  else core = (x ^ y) as Bit;
  return p.outBubble ? not(core) : core;
}

/** Outputs in truth-table order: AB = 00, 01, 10, 11 (or A = 0, 1 for a one-input gate). */
export function gateTruth(p: GateParts): Bit[] {
  if (p.body === "buffer") return [gateOutput(p, 0, 0), gateOutput(p, 1, 0)];
  return [gateOutput(p, 0, 0), gateOutput(p, 0, 1), gateOutput(p, 1, 0), gateOutput(p, 1, 1)];
}

const BEHAVIOUR: Record<string, string> = {
  "01": "BUFFER",
  "10": "NOT",
  "0001": "AND",
  "0111": "OR",
  "1110": "NAND",
  "1000": "NOR",
  "0110": "XOR",
  "1001": "XNOR",
};

/** Which basic gate this drawing behaves like, judged by its truth table alone. */
export function gateBehaves(p: GateParts): string {
  return BEHAVIOUR[gateTruth(p).join("")];
}

/** The name of the symbol as drawn, the way a datasheet or the lecture chart labels it. */
export function gateSymbolName(p: GateParts): string {
  const { body, inBubbles: i, outBubble: o } = p;
  if (body === "buffer") return i === o ? (i ? "Buffer drawn with two bubbles" : "Buffer") : i ? "Inverter (bubble on the input)" : "Inverter";
  const base = body === "and" ? "AND" : body === "or" ? "OR" : "XOR";
  if (!i) return o ? (base === "XOR" ? "XNOR" : `N${base}`) : base;
  return o ? `Negative-${base} with an output bubble` : `Negative-${base}`;
}

/* ------------------------------ 14-pin chips ------------------------------ */

export type ChipGateKind = "NAND" | "NOR" | "AND" | "OR" | "XOR" | "NOT";
export type ChipGate = { kind: ChipGateKind; inputs: number[]; output: number; label: string };
export type Chip = { id: string; name: string; gates: ChipGate[] };

export const VCC_PIN = 14;
export const GND_PIN = 7;

/** Pin 1 to 3 is gate 1, 4 to 6 gate 2, 8 to 10 gate 3, 11 to 13 gate 4 (inputs, then output). */
const QUAD = (kind: ChipGateKind): ChipGate[] => [
  { kind, inputs: [1, 2], output: 3, label: "1" },
  { kind, inputs: [4, 5], output: 6, label: "2" },
  { kind, inputs: [9, 10], output: 8, label: "3" },
  { kind, inputs: [12, 13], output: 11, label: "4" },
];

export const CHIPS: Chip[] = [
  { id: "7400", name: "Quad 2-input NAND", gates: QUAD("NAND") },
  {
    id: "7402",
    name: "Quad 2-input NOR",
    gates: [
      { kind: "NOR", inputs: [2, 3], output: 1, label: "1" },
      { kind: "NOR", inputs: [5, 6], output: 4, label: "2" },
      { kind: "NOR", inputs: [8, 9], output: 10, label: "3" },
      { kind: "NOR", inputs: [11, 12], output: 13, label: "4" },
    ],
  },
  {
    id: "7404",
    name: "Hex inverter",
    gates: [
      { kind: "NOT", inputs: [1], output: 2, label: "1" },
      { kind: "NOT", inputs: [3], output: 4, label: "2" },
      { kind: "NOT", inputs: [5], output: 6, label: "3" },
      { kind: "NOT", inputs: [9], output: 8, label: "4" },
      { kind: "NOT", inputs: [11], output: 10, label: "5" },
      { kind: "NOT", inputs: [13], output: 12, label: "6" },
    ],
  },
  { id: "7408", name: "Quad 2-input AND", gates: QUAD("AND") },
  { id: "7432", name: "Quad 2-input OR", gates: QUAD("OR") },
  { id: "7486", name: "Quad 2-input XOR", gates: QUAD("XOR") },
];

export function evalChipGate(kind: ChipGateKind, ins: Bit[]): Bit {
  const [a, b = 0] = ins;
  switch (kind) {
    case "NOT":
      return not(a);
    case "AND":
      return (a & b) as Bit;
    case "OR":
      return (a | b) as Bit;
    case "NAND":
      return not((a & b) as Bit);
    case "NOR":
      return not((a | b) as Bit);
    case "XOR":
      return (a ^ b) as Bit;
  }
}

/** Levels on every output pin, given levels on the input pins (missing pins read as 0). */
export function chipOutputs(chip: Chip, pins: Record<number, Bit>): Record<number, Bit> {
  const out: Record<number, Bit> = {};
  for (const g of chip.gates) out[g.output] = evalChipGate(g.kind, g.inputs.map((p) => pins[p] ?? 0));
  return out;
}

/** What a pin does on this chip, e.g. "input 1A", "output 1Y", "VCC (+5 V)". */
export function pinRole(chip: Chip, pin: number): { role: "vcc" | "gnd" | "in" | "out"; name: string; gate?: ChipGate } {
  if (pin === VCC_PIN) return { role: "vcc", name: "VCC (+5 V)" };
  if (pin === GND_PIN) return { role: "gnd", name: "GND (0 V)" };
  for (const g of chip.gates) {
    if (g.output === pin) return { role: "out", name: `${g.label}Y`, gate: g };
    const i = g.inputs.indexOf(pin);
    if (i >= 0) return { role: "in", name: `${g.label}${"AB"[i]}`, gate: g };
  }
  throw new Error(`pin ${pin} is not on the ${chip.id}`);
}

/* ------------------------- Latch and flip-flop boxes ------------------------- */

export type DeviceId = "sr-nor" | "sr-nand" | "sr-gated" | "d-latch" | "d-ff" | "jk-ff" | "t-ff";
export type DeviceInputs = Record<string, Bit>;
export type DeviceState = { q: Bit; qn: Bit };

export type Device = {
  id: DeviceId;
  name: string;
  /** data pins top to bottom on the left of the box (the clock pin "C" is listed separately) */
  pins: string[];
  /** pins drawn with a bubble: they act when pulled to 0 */
  activeLow?: string[];
  clock: "none" | "level" | "edge";
};

export const DEVICES: Device[] = [
  { id: "sr-nor", name: "SR latch (NOR)", pins: ["S", "R"], clock: "none" },
  { id: "sr-nand", name: "S'R' latch (NAND)", pins: ["S", "R"], activeLow: ["S", "R"], clock: "none" },
  { id: "sr-gated", name: "SR latch with control", pins: ["S", "R"], clock: "level" },
  { id: "d-latch", name: "D latch", pins: ["D"], clock: "level" },
  { id: "d-ff", name: "D flip-flop", pins: ["D"], clock: "edge" },
  { id: "jk-ff", name: "JK flip-flop", pins: ["J", "K"], clock: "edge" },
  { id: "t-ff", name: "T flip-flop", pins: ["T"], clock: "edge" },
];

export const device = (id: DeviceId) => DEVICES.find((d) => d.id === id)!;

const set: DeviceState = { q: 1, qn: 0 };
const reset: DeviceState = { q: 0, qn: 1 };
const flip = (s: DeviceState): DeviceState => ({ q: s.qn, qn: s.q });

/** SR behaviour from active-high set/reset requests; `both` is what the outputs do when both are asserted. */
function srLatch(s: Bit, r: Bit, state: DeviceState, both: Bit): DeviceState {
  if (s && r) return { q: both, qn: both };
  if (s) return set;
  if (r) return reset;
  // releasing the forbidden input one pin at a time lands on whichever pin is still held, above
  return state.q === state.qn ? reset : state;
}

/**
 * The outputs after the pins move from `prev` to `next`.
 * `edge` picks which clock transition an edge-triggered device acts on.
 */
export function deviceStep(
  id: DeviceId,
  prev: { ins: DeviceInputs; c: Bit },
  next: { ins: DeviceInputs; c: Bit },
  state: DeviceState,
  edge: "rising" | "falling" = "rising",
): DeviceState {
  const i = next.ins;
  const fired = edge === "rising" ? !prev.c && next.c : prev.c && !next.c;
  switch (id) {
    case "sr-nor":
      return srLatch(i.S, i.R, state, 0);
    case "sr-nand":
      // the pins are active-low: 0 asks for the action, and both at 0 drives both outputs to 1
      return srLatch(not(i.S), not(i.R), state, 1);
    case "sr-gated":
      // built from NAND gates, as in the lecture figure: S = R = 1 with C = 1 drives both outputs to 1
      return next.c ? srLatch(i.S, i.R, state, 1) : state;
    case "d-latch":
      return next.c ? (i.D ? set : reset) : state;
    case "d-ff":
      return fired ? (i.D ? set : reset) : state;
    case "jk-ff":
      if (!fired) return state;
      if (i.J && i.K) return flip(state);
      if (i.J) return set;
      if (i.K) return reset;
      return state;
    case "t-ff":
      return fired && i.T ? flip(state) : state;
  }
}

/** The D input that turns a D latch or flip-flop into a JK: D = J·Q' + K'·Q. */
export const jkToD = (j: Bit, k: Bit, q: Bit): Bit => ((j & not(q)) | (not(k) & q)) as Bit;
