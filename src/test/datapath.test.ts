import { describe, it, expect } from "vitest";
import {
  shiftRegisterStep,
  traceSerialShift,
  simulateRippleStep,
  simulateSynchronousStep,
} from "@/lib/datapath";

describe("datapath simulation logic", () => {
  it("shifts bits correctly in a 4-bit register", () => {
    // Start with 0000
    const state = [0, 0, 0, 0];
    const r1 = shiftRegisterStep(state, 1, "right");
    expect(r1.bits).toEqual([1, 0, 0, 0]);
    expect(r1.serialOut).toBe(0);

    const r2 = shiftRegisterStep(r1.bits, 0, "right");
    expect(r2.bits).toEqual([0, 1, 0, 0]);
    expect(r2.serialOut).toBe(0);

    const r3 = shiftRegisterStep(r2.bits, 1, "right");
    expect(r3.bits).toEqual([1, 0, 1, 0]);
    expect(r3.serialOut).toBe(0);

    const r4 = shiftRegisterStep(r3.bits, 1, "right");
    expect(r4.bits).toEqual([1, 1, 0, 1]);
    expect(r4.serialOut).toBe(0);

    // 5th clock: the original bit 0 from step 1 leaves as serial out
    const r5 = shiftRegisterStep(r4.bits, 0, "right");
    expect(r5.bits).toEqual([0, 1, 1, 0]);
    expect(r5.serialOut).toBe(1);
  });

  it("traces serial bit streams exactly", () => {
    const trace = traceSerialShift([1, 0, 1, 1], 4);
    expect(trace).toHaveLength(4);
    expect(trace[0].state).toEqual([1, 0, 0, 0]);
    expect(trace[3].state).toEqual([1, 1, 0, 1]);
  });

  it("simulates ripple counter settling time and glitches", () => {
    // 0111 (7) -> 1000 (8): passes through 6, 4, 0, then 8
    const trans = simulateRippleStep(7, 4, 10);
    expect(trans.from).toBe(7);
    expect(trans.to).toBe(8);
    expect(trans.glitchStates).toEqual([6, 4, 0, 8]);
    expect(trans.settleTimeNs).toBe(40);

    // 0010 (2) -> 0011 (3): only LSB flips, no ripple
    const trans2 = simulateRippleStep(2, 4, 10);
    expect(trans2.glitchStates).toEqual([3]);
    expect(trans2.settleTimeNs).toBe(10);
  });

  it("simulates synchronous counter carry excitation correctly", () => {
    // At state 3 (011 binary: A0=1, A1=1, A2=0)
    // T0 = 1, T1 = A0 = 1, T2 = A1 & A0 = 1
    // Next state: all flip to 4 (100) in 1 clock with zero intermediate glitch
    const step = simulateSynchronousStep(3, 3);
    expect(step.from).toBe(3);
    expect(step.to).toBe(4);
    expect(step.tInputs).toEqual([1, 1, 1]);
    expect(step.nextBits).toEqual([0, 0, 1]);

    // At state 4 (100 binary: A0=0, A1=0, A2=1)
    // T0 = 1, T1 = 0, T2 = 0 -> next state 5 (101)
    const step4 = simulateSynchronousStep(4, 3);
    expect(step4.to).toBe(5);
    expect(step4.tInputs).toEqual([1, 0, 0]);
  });
});
