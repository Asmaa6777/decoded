import { describe, it, expect } from "vitest";
import {
  bitString, classifyDecimalVoltage, classifyLogicVoltage, computeNoiseMargins, counterStep, divisionSteps, evalExpr, evalGate, evaluateParallelSkew,
  floatParts, fromGray, fullAdd, generateRealWaveform, jkNext, latchVersusFlipFlop, LOGIC_FAMILIES, lookaheadCarries, minimizeSop, onesComplement,
  posFromMinterms, rippleAdd, sameFunction, settle, shiftFrames, signedValue, simulateAdc, simulateBusDrivers, sopFromMinterms, toBase, toExcess3, toGray, truthRows, twosComplement,
  type Bit, type NetGate,
} from "@/lib/logic";

const srNor: NetGate[] = [
  { id: "Q", type: "NOR", in: ["R", "Qn"] },
  { id: "Qn", type: "NOR", in: ["Q", "S"] },
];
const last = <T,>(a: T[]) => a[a.length - 1];

describe("gates", () => {
  it("matches every truth table", () => {
    const table: [Parameters<typeof evalGate>[0], number[]][] = [
      ["AND", [0, 0, 0, 1]], ["OR", [0, 1, 1, 1]], ["NAND", [1, 1, 1, 0]], ["NOR", [1, 0, 0, 0]], ["XOR", [0, 1, 1, 0]], ["XNOR", [1, 0, 0, 1]],
    ];
    for (const [g, out] of table) {
      [0, 1, 2, 3].forEach((n) => expect(evalGate(g, [(n >> 1) as Bit, (n & 1) as Bit])).toBe(out[n]));
    }
  });
});

describe("SR latch simulation", () => {
  const start = { S: 0, R: 0, Q: 0, Qn: 1 } as const;
  it("sets in the order the slides give: Q' falls first, then Q rises", () => {
    const { frames, stable } = settle(srNor, { S: 1 }, start);
    expect(stable).toBe(true);
    expect(frames[1]).toMatchObject({ Q: 0, Qn: 0 });
    expect(last(frames)).toMatchObject({ Q: 1, Qn: 0 });
  });
  it("remembers after the input is released", () => {
    const set = last(settle(srNor, { S: 1 }, start).frames);
    expect(last(settle(srNor, { S: 0 }, set).frames)).toMatchObject({ Q: 1, Qn: 0 });
  });
  it("forces both outputs to 0 on S=R=1, then oscillates on release", () => {
    const both = last(settle(srNor, { S: 1, R: 1 }, start).frames);
    expect(both).toMatchObject({ Q: 0, Qn: 0 });
    expect(settle(srNor, { S: 0, R: 0 }, both).stable).toBe(false);
  });
});

describe("number systems, including the worked examples from the notes", () => {
  it("converts", () => {
    expect(toBase(58, 2)).toBe("111010");
    expect(toBase(359, 8)).toBe("547");
    expect(toBase(650, 16)).toBe("28A");
    expect(parseInt("2374", 8)).toBe(1276);
    expect(parseInt("A85", 16)).toBe(2693);
    expect(parseInt("1101101", 2)).toBe(109);
    expect(divisionSteps(58, 2).map((s) => s.digit).reverse().join("")).toBe("111010");
  });
  it("complements", () => {
    expect(bitString(onesComplement(0b10110010, 8), 8)).toBe("01001101");
    expect(bitString(twosComplement(39, 8), 8)).toBe("11011001");
    expect(signedValue(0b11011001, 8)).toBe(-39);
  });
  it("gray and excess-3", () => {
    expect(bitString(toGray(0b10110), 5)).toBe("11101");
    for (let i = 0; i < 32; i++) expect(fromGray(toGray(i))).toBe(i);
    for (let i = 0; i < 15; i++) expect((toGray(i) ^ toGray(i + 1)).toString(2).replace(/0/g, "").length).toBe(1);
    expect(toExcess3(5)).toBe("1000");
  });
  it("reads IEEE 754", () => {
    const p = floatParts(0.15625);
    expect(p.bits).toBe("00111110001000000000000000000000");
    expect(p.exponent - 127).toBe(-3);
    expect(floatParts(-1).sign).toBe(1);
    expect(floatParts(0).kind).toBe("zero");
  });
});

describe("Boolean algebra", () => {
  it("evaluates expressions", () => {
    expect(evalExpr("A'B + (B+C)'", { A: 0, B: 1, C: 0 })).toBe(1);
    expect(evalExpr("AB'", { A: 1, B: 1 })).toBe(0);
  });
  it("confirms the laws", () => {
    expect(sameFunction("A+A'B", "A+B", ["A", "B"])).toBe(true);
    expect(sameFunction("(A+B)(A+C)", "A+BC", ["A", "B", "C"])).toBe(true);
    expect(sameFunction("(AB)'", "A'+B'", ["A", "B"])).toBe(true);
    expect(sameFunction("AB+A(B+C)+B(B+C)", "B+AC", ["A", "B", "C"])).toBe(true);
    expect(sameFunction("A+B", "AB", ["A", "B"])).toBe(false);
  });
  it("writes SOP and POS that match the table", () => {
    const vars = ["A", "B", "C"];
    for (const on of [[3, 4], [0, 1, 2, 7], [5]]) {
      for (const { m, env } of truthRows(vars)) {
        const want = on.includes(m) ? 1 : 0;
        expect(evalExpr(sopFromMinterms(on, vars), env)).toBe(want);
        expect(evalExpr(posFromMinterms(on, vars), env)).toBe(want);
      }
    }
  });
});

describe("K-map minimization", () => {
  const vars3 = ["A", "B", "C"];
  it("reproduces the notes' example: B' + A'C", () => {
    const terms = minimizeSop([5, 3, 1, 0, 4], vars3).map((g) => g.term).sort();
    expect(terms).toEqual(["A'C", "B'"].sort());
  });
  it("always equals the original on random maps", () => {
    const vars4 = ["A", "B", "C", "D"];
    for (let mask = 1; mask < 65536; mask += 811) {
      const on = Array.from({ length: 16 }, (_, m) => m).filter((m) => (mask >> m) & 1);
      const expr = minimizeSop(on, vars4).map((g) => g.term).join("+");
      for (const { m, env } of truthRows(vars4)) expect(evalExpr(expr, env)).toBe(on.includes(m) ? 1 : 0);
    }
  });
  it("handles everything on", () => {
    expect(minimizeSop([0, 1, 2, 3], ["A", "B"])[0].term).toBe("1");
  });
});

describe("adders", () => {
  it("full adder truth table", () => {
    expect(fullAdd(1, 1, 1)).toEqual({ sum: 1, carry: 1 });
    expect(fullAdd(1, 0, 1)).toEqual({ sum: 0, carry: 1 });
  });
  it("ripple equals real addition and the notes' 1100 + 1100 = 11000", () => {
    for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
      const cols = rippleAdd(a, b, 5);
      expect(cols.reduce((s, c) => s + (c.sum << c.index), 0)).toBe(a + b);
    }
  });
  it("look-ahead carries match ripple carries", () => {
    for (let a = 0; a < 32; a += 3) for (let b = 0; b < 32; b += 5) {
      const ripple = rippleAdd(a, b, 5).map((c) => c.carryOut);
      expect(lookaheadCarries(a, b, 5).c.slice(1)).toEqual(ripple);
    }
  });
});

describe("storage", () => {
  it("JK table", () => {
    expect(jkNext(1, { j: 0, k: 0 })).toBe(1);
    expect(jkNext(1, { j: 0, k: 1 })).toBe(0);
    expect(jkNext(0, { j: 1, k: 0 })).toBe(1);
    expect(jkNext(0, { j: 1, k: 1 })).toBe(1);
    expect(jkNext(1, { j: 1, k: 1 })).toBe(0);
  });
  it("a latch follows D while the clock is high and a flip-flop does not", () => {
    const { latch, flop } = latchVersusFlipFlop([0, 1, 1, 1, 0], [1, 1, 0, 1, 0]);
    expect(latch).toEqual([0, 1, 0, 1, 1]);
    expect(flop).toEqual([0, 1, 1, 1, 1]);
  });
  it("shifts and counts", () => {
    expect(shiftFrames(3, [1, 0, 1])[3]).toEqual([1, 0, 1]);
    let b: Bit[] = [0, 0, 0];
    for (let i = 0; i < 5; i++) b = counterStep(b).next;
    expect(b).toEqual([1, 0, 1]);
    expect(counterStep([1, 1, 1]).next).toEqual([0, 0, 0]);
  });
});

describe("signals and physical logic", () => {
  it("computes noise margins matching standard logic family specifications", () => {
    const ttl = computeNoiseMargins(LOGIC_FAMILIES.ttl);
    expect(ttl.vnh).toBe(0.4);
    expect(ttl.vnl).toBe(0.4);
    expect(ttl.vn).toBe(0.4);

    const cmos = computeNoiseMargins(LOGIC_FAMILIES.cmos);
    expect(cmos.vnh).toBe(0.9);
    expect(cmos.vnl).toBe(1.4);
    expect(cmos.vn).toBe(0.9);

    const lvcmos = computeNoiseMargins(LOGIC_FAMILIES.lvcmos);
    expect(lvcmos.vnh).toBe(0.4);
    expect(lvcmos.vnl).toBe(0.4);
    expect(lvcmos.vn).toBe(0.4);

    // Mismatched: TTL output directly driving CMOS input
    const mismatched = computeNoiseMargins(LOGIC_FAMILIES.mismatched);
    expect(mismatched.vnh).toBe(-1.1); // 2.4 - 3.5 = -1.1 V (fails into forbidden zone)
    expect(mismatched.vn).toBe(-1.1);
  });

  it("classifies input voltages across valid and forbidden regions", () => {
    // 5V TTL thresholds: VIH = 2.0 V, VIL = 0.8 V
    expect(classifyLogicVoltage(2.5, 2.0, 0.8)).toBe("1");
    expect(classifyLogicVoltage(2.0, 2.0, 0.8)).toBe("1");
    expect(classifyLogicVoltage(0.4, 2.0, 0.8)).toBe("0");
    expect(classifyLogicVoltage(0.8, 2.0, 0.8)).toBe("0");
    expect(classifyLogicVoltage(1.4, 2.0, 0.8)).toBe("?");
  });

  it("checks 10-level decimal fragility", () => {
    // Digit 3 nominal voltage is 1.5 V
    const nominal3 = classifyDecimalVoltage(1.5);
    expect(nominal3.digit).toBe(3);
    expect(nominal3.error).toBe(false);

    // Small spike within margin (0.24 V -> 1.74 V) stays digit 3
    const smallSpike = classifyDecimalVoltage(1.74);
    expect(smallSpike.digit).toBe(3);
    expect(smallSpike.error).toBe(false);

    // Spike of 0.26 V crosses the 1.75 V threshold into digit 4!
    const flipSpike = classifyDecimalVoltage(1.76);
    expect(flipSpike.digit).toBe(4);
  });

  it("simulates bus contention and open-drain wired-AND connections", () => {
    // Push-pull fighting causes bus contention and 125 mA surge
    const contention = simulateBusDrivers("push-pull", "HIGH", "LOW");
    expect(contention.hasContention).toBe(true);
    expect(contention.busLogic).toBe("CONTENTION");
    expect(contention.currentMa).toBe(125);

    // Push-pull agreeing works cleanly
    const pushPullHigh = simulateBusDrivers("push-pull", "HIGH", "HIGH");
    expect(pushPullHigh.hasContention).toBe(false);
    expect(pushPullHigh.busLogic).toBe("HIGH");
    expect(pushPullHigh.currentMa).toBe(0);

    // Open-drain wired-AND: either driver pulling LOW safely pulls bus LOW without contention
    const openDrainPull = simulateBusDrivers("open-drain", "LOW", "Hi-Z");
    expect(openDrainPull.hasContention).toBe(false);
    expect(openDrainPull.busLogic).toBe("LOW");
    expect(openDrainPull.busVoltage).toBe(0);
    expect(openDrainPull.currentMa).toBe(0.5);

    // Open-drain idle: pull-up resistor pulls bus to V_CC (HIGH)
    const openDrainIdle = simulateBusDrivers("open-drain", "Hi-Z", "Hi-Z");
    expect(openDrainIdle.hasContention).toBe(false);
    expect(openDrainIdle.busLogic).toBe("HIGH");
    expect(openDrainIdle.busVoltage).toBe(5.0);
    expect(openDrainIdle.currentMa).toBe(0);
  });

  it("simulates ADC sampling and quantization", () => {
    // 1-bit ADC (2 levels, step = 2.5 V)
    const adc1 = simulateAdc((t) => (t < 0.5 ? 1.0 : 4.0), 1.0, 2, 1, 5.0);
    expect(adc1.levels).toBe(2);
    expect(adc1.stepVoltage).toBe(2.5);
    expect(adc1.samples[0].binaryCode).toBe("0");
    expect(adc1.samples[1].binaryCode).toBe("1");

    // 3-bit ADC (8 levels, step = 0.625 V)
    const adc3 = simulateAdc(() => 2.5, 0.5, 4, 3, 5.0);
    expect(adc3.levels).toBe(8);
    expect(adc3.stepVoltage).toBe(0.625);
    expect(adc3.samples[0].quantizedLevel).toBe(4);
    expect(adc3.samples[0].binaryCode).toBe("100");
  });

  it("generates real clock waveforms with finite rise/fall times", () => {
    const pts = generateRealWaveform(10, 50, 1.5, 1.5, 0.1, 3.3, 1, 40);
    expect(pts.length).toBeGreaterThan(30);
    expect(pts[0].v).toBe(0);
    // At t=0.5, voltage is rising
    const risingPt = pts.find((p) => p.t >= 0.75 && p.t <= 1.5);
    expect(risingPt?.v).toBeGreaterThan(0);
  });

  it("evaluates parallel bus clock skew matching exam problem 3", () => {
    // 33 MHz, 30 mm difference: 200 ps skew is <1% of 30.3 ns period
    const slowBus = evaluateParallelSkew(33, 30);
    expect(slowBus.skewPs).toBe(200);
    expect(slowBus.periodNs).toBeCloseTo(30.3, 1);
    expect(slowBus.skewFraction).toBeLessThan(0.01);
    expect(slowBus.isReliable).toBe(true);

    // 2500 MHz (2.5 GHz), 30 mm difference: 200 ps skew is 50% of 400 ps period!
    const fastBus = evaluateParallelSkew(2500, 30);
    expect(fastBus.skewPs).toBe(200);
    expect(fastBus.periodPs).toBe(400);
    expect(fastBus.skewFraction).toBe(0.5);
    expect(fastBus.isReliable).toBe(false);
  });
});
