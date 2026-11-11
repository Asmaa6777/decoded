import { describe, it, expect } from "vitest";
import {
  bitString, classifyDecimalVoltage, classifyLogicVoltage, computeBooleanDual, computeNoiseMargins, counterStep, divisionSteps, evalExpr, evalGate, evaluateParallelSkew,
  expandRadixToBinary, floatParts, fromGray, fullAdd, fullSubtractor, generateRealWaveform, groupBinaryBits, halfSubtractor, jkNext, latchVersusFlipFlop, LOGIC_FAMILIES, lookaheadCarries,
  minimizeKMap, minimizeSop, onesComplement, posFromMinterms, rippleAdd, sameFunction, settle, shiftFrames, signedValue, signExtend, simulate7SegmentDecoder, simulateAdc, simulateAdderSubtractor, simulateBcdAdder,
  simulateBusDrivers, simulateCascadeDelay, simulateCmosGate, simulateDecoder, simulateFastCarries, simulateMagnitudeComparator, simulateMuxFunction, simulateMuxTree16to1, simulateParity, simulatePriorityEncoder, simulateSignedArithmetic, simulateStatic1Hazard, sopFromMinterms, toBase, toExcess3, toGray, truthRows, twosComplement,
  calculateTimingBudget, simulate74LS163, simulateCoincidentMemory, simulateCounterGlitch, simulateDebouncer, simulateFlipFlopConversion, simulateMemoryExpansion, simulateRaceAround, simulateRingJohnson, simulateUniversalShiftRegister,
  UNIVERSAL_CIRCUITS, type Bit, type NetGate,
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
  it("simulates CMOS switch networks and detects shoot-through current", () => {
    // CMOS NOT
    const notLow = simulateCmosGate("NOT", { A: 0 });
    expect(notLow.outputState).toBe("HIGH");
    expect(notLow.outputBit).toBe(1);
    expect(notLow.pullUpConnected).toBe(true);
    expect(notLow.pullDownConnected).toBe(false);

    const notHigh = simulateCmosGate("NOT", { A: 5.0 });
    expect(notHigh.outputState).toBe("LOW");
    expect(notHigh.outputBit).toBe(0);

    // Intermediate voltage (shoot-through)
    const notShoot = simulateCmosGate("NOT", { A: 2.5 });
    expect(notShoot.outputState).toBe("SHOOT_THROUGH");
    expect(notShoot.outputBit).toBe("X");

    // CMOS NAND: parallel pull-up, series pull-down
    expect(simulateCmosGate("NAND", { A: 0, B: 0 }).outputBit).toBe(1);
    expect(simulateCmosGate("NAND", { A: 0, B: 5.0 }).outputBit).toBe(1);
    expect(simulateCmosGate("NAND", { A: 5.0, B: 0 }).outputBit).toBe(1);
    expect(simulateCmosGate("NAND", { A: 5.0, B: 5.0 }).outputBit).toBe(0);

    // CMOS NOR: series pull-up, parallel pull-down
    expect(simulateCmosGate("NOR", { A: 0, B: 0 }).outputBit).toBe(1);
    expect(simulateCmosGate("NOR", { A: 0, B: 5.0 }).outputBit).toBe(0);
    expect(simulateCmosGate("NOR", { A: 5.0, B: 0 }).outputBit).toBe(0);
    expect(simulateCmosGate("NOR", { A: 5.0, B: 5.0 }).outputBit).toBe(0);
  });
  it("simulates cascaded propagation delay with alternating edge polarities (Problem 1)", () => {
    const stages = [
      { label: "Inverter", gate: "NOT" as const, tpHL: 3, tpLH: 4 },
      { label: "AND Gate", gate: "AND" as const, tpHL: 6, tpLH: 8, staticInputs: [1 as Bit] },
      { label: "NOR Gate", gate: "NOR" as const, tpHL: 5, tpLH: 7, staticInputs: [0 as Bit] },
    ];

    // Primary input 0 -> 1:
    // Inverter: 0 -> 1 in => 1 -> 0 out (falling), tpHL = 3 ns
    // AND: 1 -> 0 in => 1 -> 0 out (falling), tpHL = 6 ns
    // NOR: 1 -> 0 in => 0 -> 1 out (rising), tpLH = 7 ns
    // Total = 3 + 6 + 7 = 16 ns
    const resRising = simulateCascadeDelay(stages, "0to1");
    expect(resRising.totalDelayNs).toBe(16);
    expect(resRising.stages[0].delayParameter).toBe("tpHL");
    expect(resRising.stages[1].delayParameter).toBe("tpHL");
    expect(resRising.stages[2].delayParameter).toBe("tpLH");

    // Primary input 1 -> 0:
    // Inverter: 1 -> 0 in => 0 -> 1 out (rising), tpLH = 4 ns
    // AND: 0 -> 1 in => 0 -> 1 out (rising), tpLH = 8 ns
    // NOR: 0 -> 1 in => 1 -> 0 out (falling), tpHL = 5 ns
    // Total = 4 + 8 + 5 = 17 ns
    const resFalling = simulateCascadeDelay(stages, "1to0");
    expect(resFalling.totalDelayNs).toBe(17);
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
  it("groups binary bits into octal and hex with outward padding", () => {
    // Worked example from m1-01: (10110110101.101011)_2
    const hex = groupBinaryBits("10110110101.101011", 4);
    expect(hex.resultString).toBe("5B5.AC");
    expect(hex.intPadCount).toBe(1); // 1 leading zero added to leftmost group
    expect(hex.fracPadCount).toBe(2); // 2 trailing zeros added to rightmost group
    expect(hex.integerGroups.map((g) => g.digit).join("")).toBe("5B5");
    expect(hex.fractionalGroups.map((g) => g.digit).join("")).toBe("AC");

    const oct = groupBinaryBits("10110110101.101011", 3);
    expect(oct.resultString).toBe("2665.53");
    expect(oct.intPadCount).toBe(1);
    expect(oct.fracPadCount).toBe(0);

    // Expansion test
    const expandedHex = expandRadixToBinary("5B5.AC", 4);
    expect(expandedHex.fullBinary).toBe("010110110101.10101100");
    const expandedOct = expandRadixToBinary("173.2", 3);
    expect(expandedOct.fullBinary).toBe("001111011.010");
  });
  it("simulates signed arithmetic and overflow detection V = C_{n-1} ^ C_n", () => {
    // 4-bit addition: positive overflow (+5 + +4 = -7, V=1)
    const posOverflow = simulateSignedArithmetic(5, 4, 4, "add");
    expect(posOverflow.signedResult).toBe(-7);
    expect(posOverflow.carryInMsb).toBe(1);
    expect(posOverflow.carryOutMsb).toBe(0);
    expect(posOverflow.overflow).toBe(true);

    // 4-bit addition: negative overflow (-6 + -5 = +5, V=1)
    const negOverflow = simulateSignedArithmetic(-6, -5, 4, "add");
    expect(negOverflow.signedResult).toBe(5);
    expect(negOverflow.carryInMsb).toBe(0);
    expect(negOverflow.carryOutMsb).toBe(1);
    expect(negOverflow.overflow).toBe(true);

    // 4-bit addition: opposite signs never overflow (+5 + -3 = +2, V=0)
    const oppSigns = simulateSignedArithmetic(5, -3, 4, "add");
    expect(oppSigns.signedResult).toBe(2);
    expect(oppSigns.overflow).toBe(false);

    // 8-bit addition: worked case (+42 + +19 = +61)
    const sum8 = simulateSignedArithmetic(42, 19, 8, "add");
    expect(sum8.signedResult).toBe(61);
    expect(sum8.overflow).toBe(false);

    // 8-bit subtraction: M >= N (42 - 19 = 23, Cout=1 discarded, V=0)
    const subPos = simulateSignedArithmetic(42, 19, 8, "sub");
    expect(subPos.signedResult).toBe(23);
    expect(subPos.carryOut).toBe(1);
    expect(subPos.overflow).toBe(false);

    // 8-bit subtraction: M < N (19 - 42 = -23, Cout=0, V=0)
    const subNeg = simulateSignedArithmetic(19, 42, 8, "sub");
    expect(subNeg.signedResult).toBe(-23);
    expect(subNeg.carryOut).toBe(0);
    expect(subNeg.overflow).toBe(false);

    // 8-bit exam problem: 80 + 70 = 150 -> overflows to -106
    const examProblem = simulateSignedArithmetic(80, 70, 8, "add");
    expect(examProblem.signedResult).toBe(-106);
    expect(examProblem.carryInMsb).toBe(1);
    expect(examProblem.carryOutMsb).toBe(0);
    expect(examProblem.overflow).toBe(true);
  });
  it("sign extension preserves negative value while zero extension corrupts it", () => {
    // 4-bit +5 (0101) to 8-bit
    const extPos = signExtend(5, 4, 8);
    expect(extPos.signedValExtended).toBe(5);
    expect(extPos.zeroExtendedVal).toBe(5);
    expect(extPos.preserved).toBe(true);

    // 4-bit -5 (1011) to 8-bit
    const extNeg = signExtend(-5, 4, 8);
    expect(extNeg.signedValExtended).toBe(-5);
    expect(extNeg.signExtendedBits.join("")).toBe("11111011");
    // Zero extension turns -5 into +11!
    expect(extNeg.zeroExtendedVal).toBe(11);
    expect(extNeg.zeroExtendedBits.join("")).toBe("00001011");
    expect(extNeg.preserved).toBe(true);
  });
  it("simulates two-stage BCD adder with Boolean correction C = K + Z3*Z2 + Z3*Z1", () => {
    // 7 + 8 = 15 -> Z = 1111, K = 0, C = 1 (Z3*Z2=1), +6 -> sum 5, carry 1
    const bcd1 = simulateBcdAdder(7, 8, 0);
    expect(bcd1.stage1Sum).toBe(15);
    expect(bcd1.binaryCarryK).toBe(0);
    expect(bcd1.termZ3Z2).toBe(1);
    expect(bcd1.needsCorrection).toBe(true);
    expect(bcd1.finalBcdDigit).toBe(5);
    expect(bcd1.bcdCarryOut).toBe(1);
    expect(bcd1.totalDecimal).toBe(15);

    // 8 + 8 = 16 -> Z = 0000, binary carry K = 1, C = 1, +6 -> sum 6, carry 1
    const bcd2 = simulateBcdAdder(8, 8, 0);
    expect(bcd2.stage1Sum).toBe(16);
    expect(bcd2.binaryCarryK).toBe(1);
    expect(bcd2.needsCorrection).toBe(true);
    expect(bcd2.finalBcdDigit).toBe(6);
    expect(bcd2.bcdCarryOut).toBe(1);
    expect(bcd2.totalDecimal).toBe(16);

    // 4 + 3 = 7 -> Z = 0111, K = 0, C = 0 -> sum 7, carry 0
    const bcd3 = simulateBcdAdder(4, 3, 0);
    expect(bcd3.stage1Sum).toBe(7);
    expect(bcd3.needsCorrection).toBe(false);
    expect(bcd3.finalBcdDigit).toBe(7);
    expect(bcd3.bcdCarryOut).toBe(0);
    expect(bcd3.totalDecimal).toBe(7);

    // 9 + 9 + 1 = 19 -> Z = 0011, K = 1, C = 1 -> sum 9, carry 1
    const bcd4 = simulateBcdAdder(9, 9, 1);
    expect(bcd4.stage1Sum).toBe(19);
    expect(bcd4.binaryCarryK).toBe(1);
    expect(bcd4.finalBcdDigit).toBe(9);
    expect(bcd4.bcdCarryOut).toBe(1);
    expect(bcd4.totalDecimal).toBe(19);
  });
  it("simulates parity generation and demonstrates why 2-bit errors pass undetected", () => {
    // ASCII 'C' = 01000011 (binary 7-bit 1000011 has three 1s)
    const charCBits: Bit[] = [1, 0, 0, 0, 0, 1, 1];
    const evenParity = simulateParity(charCBits, "even", []);
    expect(evenParity.onesInData).toBe(3);
    expect(evenParity.parityBit).toBe(1); // 3 + 1 = 4 (even)
    expect(evenParity.transmittedWord).toEqual([1, 0, 0, 0, 0, 1, 1, 1]);
    expect(evenParity.errorDetected).toBe(false);

    // 1-bit flip on bit 0: received 00000111 has three 1s -> Parity error detected!
    const singleBitError = simulateParity(charCBits, "even", [0]);
    expect(singleBitError.errorDetected).toBe(true);
    expect(singleBitError.silentCorruption).toBe(false);

    // 2-bit flip on bit 0 and bit 1: received 01000111 has four 1s -> SILENT CORRUPTION!
    const doubleBitError = simulateParity(charCBits, "even", [0, 1]);
    expect(doubleBitError.errorDetected).toBe(false);
    expect(doubleBitError.silentCorruption).toBe(true);

    // Odd parity test
    const oddParity = simulateParity(charCBits, "odd", []);
    expect(oddParity.parityBit).toBe(0); // 3 + 0 = 3 (odd)
    expect(oddParity.errorDetected).toBe(false);
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
  it("computes Boolean dual expressions according to the Principle of Duality", () => {
    // Huntington laws and identities
    expect(computeBooleanDual("x + xy")).toBe("x(x + y)");
    expect(computeBooleanDual("x + x'y")).toBe("x(x' + y)");
    expect(computeBooleanDual("xy + x'z + yz")).toBe("(x + y)(x' + z)(y + z)");
    expect(computeBooleanDual("(x + y)'")).toBe("(xy)'");
    expect(computeBooleanDual("(A + B)(A + C)")).toBe("AB + AC");
    expect(computeBooleanDual("x + 0 = x")).toBe("x1 = x");
    expect(computeBooleanDual("x + 1 = 1")).toBe("x0 = 0");
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
  it("identifies Essential Prime Implicants and distinguished minterms (Problem 1)", () => {
    // F(A, B, C, D) = sum m(0, 2, 5, 7, 8, 10, 14, 15)
    const res = minimizeKMap(["A", "B", "C", "D"], [0, 2, 5, 7, 8, 10, 14, 15], [], "SOP");
    const primeTerms = res.primes.map((p) => p.term).sort();
    expect(primeTerms).toEqual(["ABC", "ACD'", "A'BD", "BCD", "B'D'"].sort());

    const essTerms = res.essentials.map((p) => p.term).sort();
    expect(essTerms).toEqual(["A'BD", "B'D'"].sort());

    // Corner quad B'D' covers distinguished minterms 0, 2, 8
    const bd = res.essentials.find((p) => p.term === "B'D'");
    expect(bd?.distinguishedMinterms.sort((a, b) => a - b)).toEqual([0, 2, 8]);

    // Pair A'BD covers distinguished minterm 5
    const abd = res.essentials.find((p) => p.term === "A'BD");
    expect(abd?.distinguishedMinterms).toEqual([5]);

    // Chosen minimal SOP
    expect(res.chosen.map((p) => p.term)).toEqual(["A'BD", "ABC", "B'D'"]);
    expect(res.minimalExpr).toBe("A'BD + ABC + B'D'");
  });
  it("minimizes with Don't Cares and verifies POS mode (Problem 2)", () => {
    // F(w, x, y, z) = sum m(1, 3, 7, 11, 15) + sum d(0, 2, 5)
    const resSop = minimizeKMap(["w", "x", "y", "z"], [1, 3, 7, 11, 15], [0, 2, 5], "SOP");
    expect(resSop.chosen.length).toBe(2);
    expect(resSop.chosen.map((p) => p.term)).toContain("yz");
    const otherTerm = resSop.chosen.find((p) => p.term !== "yz")?.term;
    expect(["w'x'", "w'z"]).toContain(otherTerm);

    // Product of Sums (POS) mode
    const resPos = minimizeKMap(["w", "x", "y", "z"], [1, 3, 7, 11, 15], [0, 2, 5], "POS");
    // Covering 0-cells with useful don't cares yields product of maxterms
    expect(resPos.chosen.length).toBeGreaterThan(0);
    // Verify each row in truth table evaluates correctly for both SOP and POS
    for (let m = 0; m < 16; m++) {
      if ([0, 2, 5].includes(m)) continue; // don't care
      const want = [1, 3, 7, 11, 15].includes(m) ? 1 : 0;
      const env: Record<string, Bit> = {
        w: ((m >> 3) & 1) as Bit,
        x: ((m >> 2) & 1) as Bit,
        y: ((m >> 1) & 1) as Bit,
        z: (m & 1) as Bit,
      };
      expect(evalExpr(resSop.minimalExpr, env)).toBe(want);
      expect(evalExpr(resPos.minimalExpr, env)).toBe(want);
    }
  });
});

describe("timing hazards", () => {
  it("detects static-1 glitch without consensus and verifies complete elimination with consensus", () => {
    const trace = simulateStatic1Hazard();
    // At t=0,1: F = 1
    expect(trace[0].fWithoutConsensus).toBe(1);
    expect(trace[1].fWithoutConsensus).toBe(1);

    // Glitch occurs during delay overlap at t=3,4
    expect(trace[3].isGlitch).toBe(true);
    expect(trace[3].fWithoutConsensus).toBe(0);
    expect(trace[4].isGlitch).toBe(true);
    expect(trace[4].fWithoutConsensus).toBe(0);

    // With consensus term BC, every single step remains solidly 1
    trace.forEach((step) => {
      expect(step.fWithConsensus).toBe(1);
    });
  });
});

describe("universal gates", () => {
  it("synthesizes all basic gates from NAND, including the 4-gate minimal XOR", () => {
    const builds = UNIVERSAL_CIRCUITS.NAND;
    expect(builds.NOT.gateCount).toBe(1);
    expect(builds.AND.gateCount).toBe(2);
    expect(builds.OR.gateCount).toBe(3);
    expect(builds.NOR.gateCount).toBe(4);
    expect(builds.XOR.gateCount).toBe(4); // minimal 4-gate
    expect(builds.XNOR.gateCount).toBe(5);

    // Verify truth tables for all input combinations
    for (const a of [0, 1] as Bit[]) {
      expect(builds.NOT.simulate({ A: a }).output).toBe(a ? 0 : 1);
      for (const b of [0, 1] as Bit[]) {
        const inp = { A: a, B: b };
        expect(builds.AND.simulate(inp).output).toBe(evalGate("AND", [a, b]));
        expect(builds.OR.simulate(inp).output).toBe(evalGate("OR", [a, b]));
        expect(builds.NOR.simulate(inp).output).toBe(evalGate("NOR", [a, b]));
        expect(builds.XOR.simulate(inp).output).toBe(evalGate("XOR", [a, b]));
        expect(builds.XNOR.simulate(inp).output).toBe(evalGate("XNOR", [a, b]));
      }
    }
  });

  it("synthesizes all basic gates from NOR, including the 4-gate minimal XNOR", () => {
    const builds = UNIVERSAL_CIRCUITS.NOR;
    expect(builds.NOT.gateCount).toBe(1);
    expect(builds.OR.gateCount).toBe(2);
    expect(builds.AND.gateCount).toBe(3);
    expect(builds.NAND.gateCount).toBe(4);
    expect(builds.XNOR.gateCount).toBe(4); // minimal 4-gate
    expect(builds.XOR.gateCount).toBe(5);

    for (const a of [0, 1] as Bit[]) {
      expect(builds.NOT.simulate({ A: a }).output).toBe(a ? 0 : 1);
      for (const b of [0, 1] as Bit[]) {
        const inp = { A: a, B: b };
        expect(builds.OR.simulate(inp).output).toBe(evalGate("OR", [a, b]));
        expect(builds.AND.simulate(inp).output).toBe(evalGate("AND", [a, b]));
        expect(builds.NAND.simulate(inp).output).toBe(evalGate("NAND", [a, b]));
        expect(builds.XNOR.simulate(inp).output).toBe(evalGate("XNOR", [a, b]));
        expect(builds.XOR.simulate(inp).output).toBe(evalGate("XOR", [a, b]));
      }
    }
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

describe("combinational building blocks (Module 3)", () => {
  it("simulates 4-bit parallel adder-subtractor, flags, and overflow (m3-01 Problem 2)", () => {
    // Case A: (+3) - (+6) = -3
    // A = 0011 (3), B = 0110 (6), Mode = SUB (M=1)
    const subCaseA = simulateAdderSubtractor(3, 6, "SUB", 4);
    expect(subCaseA.m).toBe(1);
    expect(subCaseA.bEffective).toEqual([1, 0, 0, 1]); // 0110 ^ 1111 = 1001
    expect(subCaseA.sumBits).toEqual([1, 0, 1, 1]); // LSB first: 1101_2
    expect(subCaseA.sumSigned).toBe(-3);
    expect(subCaseA.flags.overflow).toBe(false);
    expect(subCaseA.flags.carry).toBe(0); // C4 = 0

    // Case B: (+5) - (-4) = +9 -> overflow -7 in 4-bit signed
    // A = 0101 (5), B = 1100 (-4), Mode = SUB (M=1)
    const subCaseB = simulateAdderSubtractor(5, 12, "SUB", 4);
    expect(subCaseB.sumBits).toEqual([1, 0, 0, 1]); // 1001_2 = -7
    expect(subCaseB.sumSigned).toBe(-7);
    expect(subCaseB.flags.overflow).toBe(true);
    expect(subCaseB.carries[3]).toBe(1); // C3 = 1
    expect(subCaseB.carries[4]).toBe(0); // C4 = 0

    // Addition positive overflow: +7 (0111) + +2 (0010) = +9 -> -7
    const addOverflow = simulateAdderSubtractor(7, 2, "ADD", 4);
    expect(addOverflow.sumSigned).toBe(-7);
    expect(addOverflow.flags.overflow).toBe(true);

    // Addition negative overflow: -6 (1010) + -5 (1011) = -11 -> +5
    const addNegOverflow = simulateAdderSubtractor(10, 11, "ADD", 4);
    expect(addNegOverflow.sumSigned).toBe(5);
    expect(addNegOverflow.flags.overflow).toBe(true);
    expect(addNegOverflow.flags.carry).toBe(1); // C4 = 1

    // Zero flag test: 4 + 12 = 16 = 0 (mod 16)
    const zeroTest = simulateAdderSubtractor(4, 12, "ADD", 4);
    expect(zeroTest.flags.zero).toBe(true);
  });

  it("simulates half and full subtractors", () => {
    // Half subtractor: D = A ^ B, Bout = A' B
    expect(halfSubtractor(0, 0)).toEqual({ diff: 0, borrowOut: 0 });
    expect(halfSubtractor(0, 1)).toEqual({ diff: 1, borrowOut: 1 });
    expect(halfSubtractor(1, 0)).toEqual({ diff: 1, borrowOut: 0 });
    expect(halfSubtractor(1, 1)).toEqual({ diff: 0, borrowOut: 0 });

    // Full subtractor: D = A ^ B ^ Bin, Bout = A'B + (A^B)' Bin
    expect(fullSubtractor(0, 1, 1)).toMatchObject({ diff: 0, borrowOut: 1 });
    expect(fullSubtractor(1, 1, 1)).toMatchObject({ diff: 1, borrowOut: 1 });
    expect(fullSubtractor(1, 0, 0)).toMatchObject({ diff: 1, borrowOut: 0 });
  });

  it("analyzes carry lookahead, generate/propagate, and carry skip bypass (m3-02)", () => {
    // A = 1011 (11), B = 0111 (7), C0 = 1 (matching m3-02 Problem 2)
    const cla = simulateFastCarries(11, 7, 1, 4);
    expect(cla.generates).toEqual([1, 1, 0, 0]); // G0=1, G1=1, G2=0, G3=0
    expect(cla.propagates).toEqual([0, 0, 1, 1]); // P0=0, P1=0, P2=1, P3=1
    expect(cla.claCarries[1]).toBe(1); // C1 = G0 + P0*C0 = 1
    expect(cla.claCarries[2]).toBe(1); // C2 = G1 + P1*G0 + ... = 1

    // Carry Skip test: When all P_i = 1 (e.g. A = 1010, B = 0101 -> P = [1,1,1,1])
    const skipTest = simulateFastCarries(10, 5, 1, 4);
    expect(skipTest.blockPropagate).toBe(1);
    expect(skipTest.skipAnalysis.canSkip).toBe(true);
    expect(skipTest.skipAnalysis.skipDelaySteps).toBe(2); // bypasses 8 ripple delays!
  });

  it("simulates 4-bit magnitude comparator and cascading (m3-03)", () => {
    // A = 13 (1101), B = 11 (1011): bit 2 decides (A2=1, B2=0)
    const compA = simulateMagnitudeComparator(13, 11, 4);
    expect(compA.gt).toBe(1);
    expect(compA.eq).toBe(0);
    expect(compA.lt).toBe(0);
    expect(compA.decidingBit).toBe(2);

    // Equality: A = B = 9 (1001)
    const compEq = simulateMagnitudeComparator(9, 9, 4);
    expect(compEq.eq).toBe(1);
    expect(compEq.gt).toBe(0);
    expect(compEq.lt).toBe(0);

    // Cascaded tie-breaker: 4 bits match, but I(A<B)=1 from lower nibble
    const compCascade = simulateMagnitudeComparator(9, 9, 4, { gt: 0, eq: 0, lt: 1 });
    expect(compCascade.lt).toBe(1);
    expect(compCascade.decidingBit).toBe("CASCADED");
  });

  it("simulates 74LS138 decoder, enable gating, and NAND logic synthesis (m3-03 Problem 1)", () => {
    // CBA = 101 (5), enabled: Y5' = 0, others = 1
    const decActive = simulateDecoder(5, 3, { g1: 1, g2a_n: 0, g2b_n: 0 }, true);
    expect(decActive.enabled).toBe(true);
    expect(decActive.outputs[5]).toBe(0);
    expect(decActive.outputs[0]).toBe(1);
    expect(decActive.outputs[4]).toBe(1);

    // Disabled chip: G1 = 0 -> all active-LOW outputs forced to 1
    const decDisabled = simulateDecoder(5, 3, { g1: 0, g2a_n: 0, g2b_n: 0 }, true);
    expect(decDisabled.enabled).toBe(false);
    expect(decDisabled.outputs.every((o) => o === 1)).toBe(true);

    // Function synthesis: F = sum m(1, 2, 4, 7) via NAND gate (Difference of full subtractor)
    const decSynth = simulateDecoder(1, 3, { g1: 1, g2a_n: 0, g2b_n: 0 }, true, [1, 2, 4, 7]);
    expect(decSynth.synthesis?.output).toBe(1); // address 1 is in minterms -> output = 1
    const decSynthOff = simulateDecoder(3, 3, { g1: 1, g2a_n: 0, g2b_n: 0 }, true, [1, 2, 4, 7]);
    expect(decSynthOff.synthesis?.output).toBe(0); // address 3 not in minterms -> output = 0
  });

  it("simulates BCD to 7-segment decoder across common-cathode and common-anode", () => {
    // Digit 0: common cathode -> a,b,c,d,e,f = 1, g = 0
    const seg0 = simulate7SegmentDecoder(0, "common-cathode");
    expect(seg0.isValidBcd).toBe(true);
    expect(seg0.segments).toEqual({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 0 });

    // Digit 8: all 7 segments illuminated
    const seg8 = simulate7SegmentDecoder(8, "common-cathode");
    expect(seg8.segments).toEqual({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1 });

    // Common anode inverts logic levels: active-LOW illumination
    const seg0Anode = simulate7SegmentDecoder(0, "common-anode");
    expect(seg0Anode.segments.g).toBe(1); // unlit is HIGH (1)
    expect(seg0Anode.segments.a).toBe(0); // lit is LOW (0)
  });

  it("simulates 8-to-3 priority encoder with cascading signals (74LS148)", () => {
    // Inputs D7..D0. Active-LOW mode: inputs 0, 3, 5 are asserted (0).
    // D5 is the highest active. Code should be 5 (101_2), inverted for active-LOW = 010_2.
    const inputs: Bit[] = [0, 1, 1, 0, 1, 0, 1, 1]; // index 0, 3, 5 are 0
    const enc = simulatePriorityEncoder(inputs, true, 0);
    expect(enc.enabled).toBe(true);
    expect(enc.highestActiveIndex).toBe(5);
    expect(enc.valid).toBe(1);
    expect(enc.gs_n).toBe(0); // Group Select active
    expect(enc.eo_n).toBe(1); // EO inactive (it had data)

    // All inputs inactive (all 1 in active-LOW)
    const allIdle: Bit[] = [1, 1, 1, 1, 1, 1, 1, 1];
    const encIdle = simulatePriorityEncoder(allIdle, true, 0);
    expect(encIdle.highestActiveIndex).toBe(-1);
    expect(encIdle.gs_n).toBe(1);
    expect(encIdle.eo_n).toBe(0); // EO asserts (0) to wake up lower-priority cascaded chip!
  });

  it("synthesizes arbitrary Boolean functions using Shannon's expansion on a MUX (m3-04 Problem 1)", () => {
    // Majority voter F = sum m(3, 5, 6, 7) decomposed around C
    const muxMajority = simulateMuxFunction([3, 5, 6, 7], "C");
    expect(muxMajority.allOutputsMatch).toBe(true);
    expect(muxMajority.table[0].derivedInput).toBe("0"); // S1S0 = 00 -> 0
    expect(muxMajority.table[1].derivedInput).toBe("C"); // S1S0 = 01 -> C
    expect(muxMajority.table[2].derivedInput).toBe("C"); // S1S0 = 10 -> C
    expect(muxMajority.table[3].derivedInput).toBe("1"); // S1S0 = 11 -> 1
  });

  it("simulates 16-to-1 MUX tree from five 4-to-1 MUXes (m3-04 Problem 3)", () => {
    // 16 data inputs: let channel 13 be 1, all others 0
    const inputs: Bit[] = Array.from({ length: 16 }, (_, i) => (i === 13 ? 1 : 0) as Bit);
    // Select address 13 (S3S2S1S0 = 1101)
    const tree = simulateMuxTree16to1(inputs, [1, 1, 0, 1]);
    expect(tree.globalAddress).toBe(13);
    expect(tree.output).toBe(1);
    expect(tree.correct).toBe(true);
    // Tier 1 MUX 3 selected channel 1 (I13), Tier 2 MUX selected channel 3 (MUX 3)
    expect(tree.tier1[3].output).toBe(1);
    expect(tree.tier2.selectedChannelIndex).toBe(3);
  });

  describe("sequential logic and memory (Module 4)", () => {
    it("simulates switch debouncing with cross-coupled NAND latch", () => {
      // Position A: /S = 0, /R = 1 -> Q = 1
      const debA = simulateDebouncer("A", true);
      expect(debA.s_n).toBe(0);
      expect(debA.r_n).toBe(1);
      expect(debA.q).toBe(1);
      expect(debA.q_n).toBe(0);
      // All bounces retain Q = 1
      debA.bounces.slice(1).forEach((b) => expect(b.q).toBe(1));

      // Position B: /S = 1, /R = 0 -> Q = 0
      const debB = simulateDebouncer("B", true);
      expect(debB.s_n).toBe(1);
      expect(debB.r_n).toBe(0);
      expect(debB.q).toBe(0);
      expect(debB.q_n).toBe(1);
      debB.bounces.slice(1).forEach((b) => expect(b.q).toBe(0));

      // In-flight: both pull-up to 1
      const inFlight = simulateDebouncer("in-flight", false);
      expect(inFlight.s_n).toBe(1);
      expect(inFlight.r_n).toBe(1);
    });

    it("simulates race-around feedback oscillation in transparent latches", () => {
      // Narrow pulse (1ns < 2ns loop): no toggle
      const narrow = simulateRaceAround(1.0, 2.0);
      expect(narrow.latchToggles).toBe(0);
      expect(narrow.latchFinal).toBe(0);
      expect(narrow.latchOscillated).toBe(false);

      // Single toggle window (2ns = 1 * 2ns): 1 toggle
      const single = simulateRaceAround(2.0, 2.0);
      expect(single.latchToggles).toBe(1);
      expect(single.latchFinal).toBe(1);
      expect(single.latchOscillated).toBe(false);

      // Wide pulse (7ns = 3 toggles: 0 -> 1 -> 0 -> 1)
      const wide = simulateRaceAround(7.0, 2.0);
      expect(wide.latchToggles).toBe(3);
      expect(wide.latchFinal).toBe(1);
      expect(wide.latchOscillated).toBe(true);

      // Edge-triggered flip-flop triggers once regardless of pulse width
      expect(wide.flopFinal).toBe(1);
    });

    it("synthesizes and verifies flip-flop conversions (m4-03)", () => {
      // D to JK: D = J Q' + K' Q
      const dToJk = simulateFlipFlopConversion("D", "JK");
      expect(dToJk.equation).toBe("D = J·Q' + K'·Q");
      expect(dToJk.isFullyVerified).toBe(true);

      // D to T: D = T ^ Q
      const dToT = simulateFlipFlopConversion("D", "T");
      expect(dToT.equation).toBe("D = T ⊕ Q");

      // JK to D: J = D, K = D'
      const jkToD = simulateFlipFlopConversion("JK", "D");
      expect(jkToD.equation).toBe("J = D, K = D'");

      // T to D: T = D ^ Q
      const tToD = simulateFlipFlopConversion("T", "D");
      expect(tToD.equation).toBe("T = D ⊕ Q");
    });

    it("evaluates synchronous datapath timing constraints, setup/hold slack, and clock frequency", () => {
      // Problem 6 from m4-03: t_cq = 3ns, t_comb = 5ns, t_su = 2ns, t_h = 1.5ns
      const timing = calculateTimingBudget({
        t_cq: 3,
        t_comb_max: 5,
        t_comb_min: 1,
        t_su: 2,
        t_h: 1.5,
        clockFreqMHz: 100, // T = 10ns
      });
      expect(timing.t_min).toBe(10);
      expect(timing.f_max_MHz).toBe(100);
      expect(timing.setupSlack).toBe(0);
      expect(timing.setupPass).toBe(true);
      expect(timing.holdSlack).toBe(2.5); // (3 + 1) - 1.5 = 2.5ns
      expect(timing.holdPass).toBe(true);
      expect(timing.status).toBe("pass");

      // Too fast clock (125 MHz = 8ns period): violates setup time
      const fast = calculateTimingBudget({
        t_cq: 3,
        t_comb_max: 5,
        t_comb_min: 1,
        t_su: 2,
        t_h: 1.5,
        clockFreqMHz: 125,
      });
      expect(fast.setupPass).toBe(false);
      expect(fast.status).toBe("setup-violation");
    });

    it("simulates 74LS194 universal shift register across all four modes (m4-04)", () => {
      // Hold mode: S1S0 = 00
      const hold = simulateUniversalShiftRegister([1, 0, 1, 0], {
        s1: 0, s0: 0, sir: 1, sil: 0, parallelIn: [0, 1, 1, 1], clr_n: 1,
      });
      expect(hold.nextState).toEqual([1, 0, 1, 0]);

      // Shift Right: S1S0 = 01 with SIR = 1 -> [1, 1, 0, 1]
      const shiftRight = simulateUniversalShiftRegister([1, 0, 1, 0], {
        s1: 0, s0: 1, sir: 1, sil: 0, parallelIn: [0, 1, 1, 1], clr_n: 1,
      });
      expect(shiftRight.nextState).toEqual([1, 1, 0, 1]);

      // Shift Left: S1S0 = 10 with SIL = 0 -> [0, 1, 0, 0]
      const shiftLeft = simulateUniversalShiftRegister([1, 0, 1, 0], {
        s1: 1, s0: 0, sir: 1, sil: 0, parallelIn: [0, 1, 1, 1], clr_n: 1,
      });
      expect(shiftLeft.nextState).toEqual([0, 1, 0, 0]);

      // Parallel Load: S1S0 = 11 -> [0, 1, 1, 1]
      const load = simulateUniversalShiftRegister([1, 0, 1, 0], {
        s1: 1, s0: 1, sir: 1, sil: 0, parallelIn: [0, 1, 1, 1], clr_n: 1,
      });
      expect(load.nextState).toEqual([0, 1, 1, 1]);

      // Active-LOW Clear forces [0, 0, 0, 0]
      const clear = simulateUniversalShiftRegister([1, 1, 1, 1], {
        s1: 0, s0: 0, sir: 0, sil: 0, parallelIn: [1, 1, 1, 1], clr_n: 0,
      });
      expect(clear.nextState).toEqual([0, 0, 0, 0]);
    });

    it("simulates Ring and Johnson counters, Gray code single-bit transitions, and self-correction (m4-04 Problem 2)", () => {
      // Ring counter: 1000 -> 0100 -> 0010 -> 0001 -> 1000
      let ringState: [Bit, Bit, Bit, Bit] = [1, 0, 0, 0];
      const ringStates: string[] = [];
      for (let i = 0; i < 4; i++) {
        const res = simulateRingJohnson("ring", ringState);
        expect(res.isValidState).toBe(true);
        ringStates.push(ringState.join(""));
        ringState = res.nextState;
      }
      expect(ringStates).toEqual(["1000", "0100", "0010", "0001"]);
      expect(ringState).toEqual([1, 0, 0, 0]);

      // Johnson counter: 8 valid states, single-bit Gray transition between each
      let jState: [Bit, Bit, Bit, Bit] = [0, 0, 0, 0];
      const jStates: string[] = [];
      for (let i = 0; i < 8; i++) {
        const res = simulateRingJohnson("johnson", jState);
        expect(res.isValidState).toBe(true);
        expect(res.stateIndex).toBe(i);
        jStates.push(jState.join(""));
        // Check single-bit change
        const diffBits = res.previousState.filter((b, idx) => b !== res.nextState[idx]).length;
        expect(diffBits).toBe(1);
        jState = res.nextState;
      }
      expect(jState).toEqual([0, 0, 0, 0]); // returns to start

      // Invalid state 0101 self-correction
      const illegal = simulateRingJohnson("johnson", [0, 1, 0, 1], true);
      expect(illegal.isValidState).toBe(false);
      // Advances toward recovery
      expect(illegal.nextState).toBeDefined();
    });

    it("simulates ripple counter propagation delays and transient decoding glitches (m4-05)", () => {
      // Transition 7 (0111) -> 8 (1000)
      const glitch = simulateCounterGlitch(7, 8, 2);
      expect(glitch.intermediateSteps.length).toBe(5); // 7 -> 6 -> 4 -> 0 -> 8
      expect(glitch.intermediateSteps[1].state).toBe(6);
      expect(glitch.intermediateSteps[2].state).toBe(4);
      expect(glitch.intermediateSteps[3].state).toBe(0);
      expect(glitch.intermediateSteps[4].state).toBe(8);
      // Glitch detected on state 0 decoder
      expect(glitch.glitchDetectedOnDecoder).toBe(true);
      expect(glitch.glitchDurationNs).toBe(2);
      expect(glitch.rippleMaxDelayNs).toBe(8); // 4 bits * 2ns
      expect(glitch.syncDelayNs).toBe(2); // synchronous switches in 1 * t_pd
    });

    it("simulates 74LS163 synchronous counter and Modulo-N truncated reset (m4-05 Problem 2)", () => {
      // Normal counting: 0 -> 1 -> 2
      const step1 = simulate74LS163(0, { clr_n: 1, load_n: 1, enp: 1, ent: 1 });
      expect(step1.nextState).toBe(1);

      // Modulo-12 counter: state 11 (1011_2) triggers synchronous clear -> next is 0
      const mod12At11 = simulate74LS163(11, {
        clr_n: 1, load_n: 1, enp: 1, ent: 1, modN: 12, truncationMode: "sync-clear",
      });
      expect(mod12At11.decodingConditionMet).toBe(true);
      expect(mod12At11.nextState).toBe(0);
      expect(mod12At11.truncatedReset).toBe(true);

      // Max count 15 with ENT=1 asserts RCO
      const at15 = simulate74LS163(15, { clr_n: 1, load_n: 1, enp: 1, ent: 1 });
      expect(at15.rco).toBe(1);
    });

    it("simulates 2D coincident memory matrix and gate count reduction (m4-06)", () => {
      const initialMatrix: Bit[][] = [
        [0, 1, 0, 0],
        [1, 1, 0, 1],
        [0, 0, 1, 0],
        [1, 0, 0, 1],
      ];
      // Read cell (row 1, col 3) -> should be 1
      const readRes = simulateCoincidentMemory(initialMatrix, { rowAddr: 1, colAddr: 3 });
      expect(readRes.readData).toBe(1);
      expect(readRes.linearAddress).toBe(7); // 1 * 4 + 3

      // Write cell (row 2, col 1) with data 1
      const writeRes = simulateCoincidentMemory(initialMatrix, {
        rowAddr: 2, colAddr: 1, writeEnable: 1, dataIn: 1,
      });
      expect(writeRes.readData).toBe(1);
      expect(writeRes.matrix[2][1]).toBe(1);

      // Gate reduction: 16 cells in 1D needs 16 gates; 2D needs 4+4=8 gates (50% reduction)
      expect(readRes.gateCount1D).toBe(16);
      expect(readRes.gateCount2D).toBe(8);
      expect(readRes.gateReductionPercent).toBe(50);
    });

    it("simulates modular memory expansion across 4K address space (m4-06 Problem 1)", () => {
      // 4K x 8 built from four 1K x 8 chips
      // Address 0x250 (Bank 0): /CS0 = 0, others 1
      const bank0 = simulateMemoryExpansion(0x250);
      expect(bank0.bankIndex).toBe(0);
      expect(bank0.chipSelects).toEqual([0, 1, 1, 1]);
      expect(bank0.busOutputs[0]).not.toBe("Hi-Z");
      expect(bank0.busOutputs[1]).toBe("Hi-Z");
      expect(bank0.busOutputs[2]).toBe("Hi-Z");
      expect(bank0.busOutputs[3]).toBe("Hi-Z");

      // Address 0x680 (Bank 1: 0x400-0x7FF): /CS1 = 0
      const bank1 = simulateMemoryExpansion(0x680);
      expect(bank1.bankIndex).toBe(1);
      expect(bank1.chipSelects).toEqual([1, 0, 1, 1]);

      // Address 0xA20 (Bank 2: 0x800-0xBFF): /CS2 = 0
      const bank2 = simulateMemoryExpansion(0xA20);
      expect(bank2.bankIndex).toBe(2);
      expect(bank2.chipSelects).toEqual([1, 1, 0, 1]);

      // Address 0xF10 (Bank 3: 0xC00-0xFFF): /CS3 = 0
      const bank3 = simulateMemoryExpansion(0xF10);
      expect(bank3.bankIndex).toBe(3);
      expect(bank3.chipSelects).toEqual([1, 1, 1, 0]);
    });
  });
});


