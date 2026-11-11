import { describe, expect, it } from "vitest";
import {
  CHIPS,
  chipOutputs,
  deviceStep,
  gateBehaves,
  gateSymbolName,
  jkToD,
  pinRole,
  type DeviceState,
} from "@/lib/symbolMaps";
import type { Bit } from "@/lib/logic";

describe("gate anatomy", () => {
  it("reads the plain shapes", () => {
    expect(gateBehaves({ body: "and", inBubbles: false, outBubble: false })).toBe("AND");
    expect(gateBehaves({ body: "or", inBubbles: false, outBubble: true })).toBe("NOR");
    expect(gateBehaves({ body: "xor", inBubbles: false, outBubble: true })).toBe("XNOR");
    expect(gateBehaves({ body: "buffer", inBubbles: false, outBubble: true })).toBe("NOT");
  });

  it("finds De Morgan's twins: negative-AND is NOR, negative-OR is NAND", () => {
    expect(gateBehaves({ body: "and", inBubbles: true, outBubble: false })).toBe("NOR");
    expect(gateBehaves({ body: "or", inBubbles: true, outBubble: false })).toBe("NAND");
    expect(gateBehaves({ body: "and", inBubbles: true, outBubble: true })).toBe("OR");
    expect(gateSymbolName({ body: "and", inBubbles: true, outBubble: false })).toBe("Negative-AND");
  });

  it("an inverter can carry its bubble on either side", () => {
    expect(gateBehaves({ body: "buffer", inBubbles: true, outBubble: false })).toBe("NOT");
    expect(gateBehaves({ body: "buffer", inBubbles: true, outBubble: true })).toBe("BUFFER");
  });
});

describe("14-pin chips", () => {
  const chip = (id: string) => CHIPS.find((c) => c.id === id)!;

  it("uses every signal pin exactly once and leaves 7 and 14 for power", () => {
    for (const c of CHIPS) {
      const used = c.gates.flatMap((g) => [...g.inputs, g.output]).sort((a, b) => a - b);
      expect(used, c.id).toEqual([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13]);
    }
  });

  it("evaluates the 7400 NANDs", () => {
    const out = chipOutputs(chip("7400"), { 1: 1, 2: 1, 4: 1 });
    expect(out[3]).toBe(0);
    expect(out[6]).toBe(1);
    expect(out[8]).toBe(1);
  });

  it("puts the 7402 outputs before their inputs", () => {
    expect(pinRole(chip("7402"), 1)).toMatchObject({ role: "out", name: "1Y" });
    expect(chipOutputs(chip("7402"), {})[13]).toBe(1);
  });

  it("names the power pins", () => {
    expect(pinRole(chip("7404"), 14).role).toBe("vcc");
    expect(pinRole(chip("7404"), 7).role).toBe("gnd");
  });
});

describe("latch and flip-flop boxes", () => {
  const q0: DeviceState = { q: 0, qn: 1 };
  const step = (id: Parameters<typeof deviceStep>[0], ins: Record<string, Bit>, c0: Bit, c1: Bit, s = q0, edge?: "rising" | "falling") =>
    deviceStep(id, { ins, c: c0 }, { ins, c: c1 }, s, edge);

  it("NOR latch: S=R=1 drives both outputs to 0", () => {
    expect(step("sr-nor", { S: 1, R: 1 }, 0, 0)).toEqual({ q: 0, qn: 0 });
    expect(step("sr-nor", { S: 1, R: 0 }, 0, 0)).toEqual({ q: 1, qn: 0 });
  });

  it("NAND latch acts on 0s and drives both outputs to 1 when both are 0", () => {
    expect(step("sr-nand", { S: 0, R: 1 }, 0, 0)).toEqual({ q: 1, qn: 0 });
    expect(step("sr-nand", { S: 1, R: 1 }, 0, 0, { q: 1, qn: 0 })).toEqual({ q: 1, qn: 0 });
    expect(step("sr-nand", { S: 0, R: 0 }, 0, 0)).toEqual({ q: 1, qn: 1 });
  });

  it("D latch follows D while C is high; D flip-flop only on the edge", () => {
    expect(step("d-latch", { D: 1 }, 1, 1)).toEqual({ q: 1, qn: 0 });
    expect(step("d-ff", { D: 1 }, 1, 1)).toEqual(q0);
    expect(step("d-ff", { D: 1 }, 0, 1)).toEqual({ q: 1, qn: 0 });
    expect(step("d-ff", { D: 1 }, 1, 0, q0, "falling")).toEqual({ q: 1, qn: 0 });
  });

  it("JK toggles on 11 and T toggles on 1", () => {
    expect(step("jk-ff", { J: 1, K: 1 }, 0, 1)).toEqual({ q: 1, qn: 0 });
    expect(step("t-ff", { T: 1 }, 0, 1, { q: 1, qn: 0 })).toEqual(q0);
    expect(step("t-ff", { T: 0 }, 0, 1)).toEqual(q0);
  });

  it("D = JQ' + K'Q reproduces the JK table", () => {
    for (const q of [0, 1] as Bit[]) {
      expect(jkToD(0, 0, q)).toBe(q);
      expect(jkToD(1, 0, q)).toBe(1);
      expect(jkToD(0, 1, q)).toBe(0);
      expect(jkToD(1, 1, q)).toBe(q ? 0 : 1);
    }
  });
});
