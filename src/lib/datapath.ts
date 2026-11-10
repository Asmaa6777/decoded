/**
 * Core simulation logic for datapath building blocks:
 * shift registers, ripple counters with propagation delay glitches,
 * and synchronous binary counters with carry logic.
 */

export interface ShiftResult {
  bits: number[];
  serialOut: number;
}

export function shiftRegisterStep(
  currentBits: number[],
  serialIn: number,
  direction: "left" | "right" = "right"
): ShiftResult {
  const n = currentBits.length;
  if (direction === "right") {
    // Shifts right: bit 0 is MSB, bit n-1 is LSB.
    // serialIn enters at index 0, index n-1 leaves.
    const serialOut = currentBits[n - 1];
    const nextBits = [serialIn, ...currentBits.slice(0, n - 1)];
    return { bits: nextBits, serialOut };
  } else {
    // Shifts left: bit n-1 is MSB, bit 0 is LSB.
    // serialIn enters at index n-1, index 0 leaves.
    const serialOut = currentBits[0];
    const nextBits = [...currentBits.slice(1), serialIn];
    return { bits: nextBits, serialOut };
  }
}

export function traceSerialShift(
  inputSequence: number[],
  stages: number = 4
): { clock: number; input: number; state: number[]; serialOut: number }[] {
  let state = new Array(stages).fill(0);
  const trace: { clock: number; input: number; state: number[]; serialOut: number }[] = [];

  for (let i = 0; i < inputSequence.length; i++) {
    const input = inputSequence[i];
    const res = shiftRegisterStep(state, input, "right");
    state = res.bits;
    trace.push({
      clock: i + 1,
      input,
      state: [...state],
      serialOut: res.serialOut,
    });
  }

  return trace;
}

export interface RippleTransition {
  from: number;
  to: number;
  glitchStates: number[];
  settleTimeNs: number;
}

/**
 * Simulates a 4-bit ripple counter where each stage is clocked by Q of previous stage.
 * Each flip-flop has a propagation delay tpd (default 10ns).
 * Transition e.g. 7 (0111) -> 8 (1000):
 * Stage 0 flips 1->0 at 10ns (state becomes 0110 = 6)
 * Stage 1 flips 1->0 at 20ns (state becomes 0100 = 4)
 * Stage 2 flips 1->0 at 30ns (state becomes 0000 = 0)
 * Stage 3 flips 0->1 at 40ns (state becomes 1000 = 8)
 */
export function simulateRippleStep(
  currentVal: number,
  bits: number = 4,
  tpdNs: number = 10
): RippleTransition {
  const mask = (1 << bits) - 1;
  const nextVal = (currentVal + 1) & mask;
  const glitchStates: number[] = [];

  // Determine stage toggles
  const curBits: number[] = [];
  for (let b = 0; b < bits; b++) {
    curBits.push((currentVal >> b) & 1);
  }

  const intermediate = [...curBits];
  let stage = 0;
  while (stage < bits) {
    const oldBit = intermediate[stage];
    intermediate[stage] = oldBit ^ 1;
    let intermediateVal = 0;
    for (let b = 0; b < bits; b++) {
      intermediateVal |= intermediate[b] << b;
    }
    glitchStates.push(intermediateVal);

    // If flip-flop output fell from 1 to 0 (falling edge), it triggers next stage
    if (oldBit === 1) {
      stage++;
    } else {
      break;
    }
  }

  return {
    from: currentVal,
    to: nextVal,
    glitchStates,
    settleTimeNs: glitchStates.length * tpdNs,
  };
}

export interface SynchronousStepResult {
  from: number;
  to: number;
  tInputs: number[];
  nextBits: number[];
}

/**
 * 3-bit or 4-bit synchronous binary counter using T flip-flops.
 * T0 = 1
 * T1 = A0
 * T2 = A1 AND A0
 * T3 = A2 AND A1 AND A0
 */
export function simulateSynchronousStep(currentVal: number, bits: number = 3): SynchronousStepResult {
  const currentBits: number[] = [];
  for (let b = 0; b < bits; b++) {
    currentBits.push((currentVal >> b) & 1);
  }

  const tInputs: number[] = [];
  let carry = 1;
  for (let b = 0; b < bits; b++) {
    tInputs.push(carry);
    carry = carry & currentBits[b];
  }

  const nextBits: number[] = [];
  for (let b = 0; b < bits; b++) {
    nextBits.push(currentBits[b] ^ tInputs[b]);
  }

  let nextVal = 0;
  for (let b = 0; b < bits; b++) {
    nextVal |= nextBits[b] << b;
  }

  return {
    from: currentVal,
    to: nextVal,
    tInputs,
    nextBits,
  };
}
