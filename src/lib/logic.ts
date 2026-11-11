/* Digital logic: a unit-delay gate simulator plus the number and Boolean
   helpers the Logic Design course animates. Pure functions, no React. */

export type Bit = 0 | 1;
export type GateType = "AND" | "OR" | "NOT" | "BUF" | "NAND" | "NOR" | "XOR" | "XNOR";
export type NetGate = { id: string; type: GateType; in: string[] };
export type Signals = Record<string, Bit>;

export function evalGate(type: GateType, bits: Bit[]): Bit {
  const ones = bits.filter(Boolean).length;
  const all = ones === bits.length;
  const any = ones > 0;
  const odd = ones % 2 === 1;
  switch (type) {
    case "AND": return all ? 1 : 0;
    case "OR": return any ? 1 : 0;
    case "NOT": return bits[0] ? 0 : 1;
    case "BUF": return bits[0];
    case "NAND": return all ? 0 : 1;
    case "NOR": return any ? 0 : 1;
    case "XOR": return odd ? 1 : 0;
    case "XNOR": return odd ? 0 : 1;
  }
}

/** Every gate looks at its inputs as they are now and updates together: one gate delay. */
export function stepNet(gates: NetGate[], values: Signals): Signals {
  const next = { ...values };
  for (const g of gates) next[g.id] = evalGate(g.type, g.in.map((i) => values[i] ?? 0));
  return next;
}

export type Settle = { frames: Signals[]; stable: boolean };

/** Applies inputs and records each gate delay until nothing changes, or `limit` is hit (an oscillation). */
export function settle(gates: NetGate[], inputs: Signals, start: Signals, limit = 10): Settle {
  let cur: Signals = { ...start, ...inputs };
  const frames: Signals[] = [cur];
  for (let i = 0; i < limit; i++) {
    const next = stepNet(gates, cur);
    if (gates.every((g) => next[g.id] === cur[g.id])) return { frames, stable: true };
    frames.push(next);
    cur = next;
  }
  return { frames, stable: false };
}

/* ------------------------------- signals ------------------------------- */

export type LogicFamilyId = "ttl" | "cmos" | "lvcmos" | "mismatched" | "decimal";

export type LogicFamilySpec = {
  id: LogicFamilyId;
  name: string;
  vcc: number;
  voh: number;
  vol: number;
  vih: number;
  vil: number;
  description: string;
};

export const LOGIC_FAMILIES: Record<LogicFamilyId, LogicFamilySpec> = {
  ttl: {
    id: "ttl",
    name: "5V Standard TTL",
    vcc: 5.0,
    voh: 2.4,
    vol: 0.4,
    vih: 2.0,
    vil: 0.8,
    description: "Bipolar transistors. V_OH limited to 2.4 V by internal drops. V_N = 0.4 V.",
  },
  cmos: {
    id: "cmos",
    name: "5V CMOS (74HC)",
    vcc: 5.0,
    voh: 4.4,
    vol: 0.1,
    vih: 3.5,
    vil: 1.5,
    description: "Rail-to-rail CMOS outputs. High noise margins: V_NH = 0.9 V, V_NL = 1.4 V.",
  },
  lvcmos: {
    id: "lvcmos",
    name: "3.3V LVCMOS",
    vcc: 3.3,
    voh: 2.4,
    vol: 0.4,
    vih: 2.0,
    vil: 0.8,
    description: "Low-voltage 3.3 V logic for modern lower power chips. V_N = 0.4 V.",
  },
  mismatched: {
    id: "mismatched",
    name: "TTL Driver → 74HC CMOS Receiver",
    vcc: 5.0,
    voh: 2.4,
    vol: 0.4,
    vih: 3.5,
    vil: 1.5,
    description: "TTL V_OH(2.4 V) < CMOS V_IH(3.5 V)! HIGH signal falls into forbidden region.",
  },
  decimal: {
    id: "decimal",
    name: "10-Level Decimal (0.5 V steps)",
    vcc: 5.0,
    voh: 4.5,
    vol: 0.0,
    vih: 2.75,
    vil: 2.25,
    description: "10 fragile voltage levels (0.5 V spacing). Noise margin is only 0.25 V.",
  },
};

/** Calculates high-level (V_NH), low-level (V_NL), and overall (V_N) noise margins. */
export function computeNoiseMargins(spec: Pick<LogicFamilySpec, "voh" | "vol" | "vih" | "vil">) {
  const vnh = Number((spec.voh - spec.vih).toFixed(3));
  const vnl = Number((spec.vil - spec.vol).toFixed(3));
  const vn = Math.min(vnh, vnl);
  return { vnh, vnl, vn };
}

/** Classifies an incoming receiver voltage as valid 1, valid 0, or forbidden (?). */
export function classifyLogicVoltage(v: number, vih: number, vil: number): "1" | "0" | "?" {
  if (v >= vih) return "1";
  if (v <= vil) return "0";
  return "?";
}

/** For 10-level decimal: checks if a voltage is within the ±0.25 V decision boundary of a digit. */
export function classifyDecimalVoltage(v: number) {
  const clamped = Math.max(0, Math.min(5.0, v));
  const digit = Math.max(0, Math.min(9, Math.round(clamped / 0.5)));
  const nominal = Number((digit * 0.5).toFixed(2));
  const delta = Number(Math.abs(clamped - nominal).toFixed(3));
  const error = delta > 0.25;
  return { digit, nominal, delta, error };
}

export type DriverMode = "push-pull" | "open-drain";
export type DriverState = "HIGH" | "LOW" | "Hi-Z";

export type BusContentionResult = {
  busVoltage: number;
  busLogic: "HIGH" | "LOW" | "Hi-Z" | "CONTENTION";
  hasContention: boolean;
  currentMa: number;
  summary: string;
};

/** Simulates two output stages tied to a shared bus wire. */
export function simulateBusDrivers(
  mode: DriverMode,
  driverA: DriverState,
  driverB: DriverState,
  pullUpOhms = 10000,
  vcc = 5.0,
): BusContentionResult {
  if (mode === "push-pull") {
    const a = driverA === "Hi-Z" ? "LOW" : driverA;
    const b = driverB === "Hi-Z" ? "LOW" : driverB;
    if ((a === "HIGH" && b === "LOW") || (a === "LOW" && b === "HIGH")) {
      const rRon = 40; // ~20 ohms PMOS + ~20 ohms NMOS
      const currentMa = Number(((vcc / rRon) * 1000).toFixed(0)); // 125 mA
      const busVoltage = Number((vcc / 2).toFixed(1)); // 2.5 V
      return {
        busVoltage,
        busLogic: "CONTENTION",
        hasContention: true,
        currentMa,
        summary: `Bus Contention! Driver A (${a}) and Driver B (${b}) fight. ${currentMa} mA short-circuit current heats transistors!`,
      };
    }
    if (a === "HIGH" && b === "HIGH") {
      return {
        busVoltage: vcc,
        busLogic: "HIGH",
        hasContention: false,
        currentMa: 0,
        summary: "Both push-pull drivers output HIGH (5.0 V). Bus is clean logic 1.",
      };
    }
    return {
      busVoltage: 0.0,
      busLogic: "LOW",
      hasContention: false,
      currentMa: 0,
      summary: "Both push-pull drivers output LOW (0.0 V). Bus is clean logic 0.",
    };
  }

  // Open-drain mode
  const aPulls = driverA === "LOW";
  const bPulls = driverB === "LOW";

  if (aPulls || bPulls) {
    const currentMa = Number(((vcc / pullUpOhms) * 1000).toFixed(2)); // 0.50 mA
    const who = aPulls && bPulls ? "Both drivers" : aPulls ? "Driver A" : "Driver B";
    return {
      busVoltage: 0.0,
      busLogic: "LOW",
      hasContention: false,
      currentMa,
      summary: `${who} pulling LOW to GND. Bus = 0.0 V. Safe pull-up resistor current: ${currentMa} mA.`,
    };
  }

  return {
    busVoltage: vcc,
    busLogic: "HIGH",
    hasContention: false,
    currentMa: 0,
    summary: "Both drivers idle (Hi-Z). External pull-up resistor pulls bus to V_CC (5.0 V, HIGH).",
  };
}

export type AdcSample = {
  timeSec: number;
  analogVoltage: number;
  quantizedLevel: number;
  quantizedVoltage: number;
  binaryCode: string;
  error: number;
};

/** Samples and quantizes an analog signal over time into discrete digital steps. */
export function simulateAdc(
  signalFn: (t: number) => number,
  durationSec: number,
  sampleRateHz: number,
  bitDepth: number,
  vMax = 5.0,
): { samples: AdcSample[]; levels: number; stepVoltage: number } {
  const levels = Math.pow(2, bitDepth);
  const stepVoltage = vMax / levels;
  const numSamples = Math.floor(durationSec * sampleRateHz);
  const dt = 1 / sampleRateHz;
  const samples: AdcSample[] = [];

  for (let i = 0; i <= numSamples; i++) {
    const t = Number((i * dt).toFixed(4));
    const vRaw = signalFn(t);
    const analogVoltage = Number(Math.max(0, Math.min(vMax, vRaw)).toFixed(3));
    const rawLevel = Math.round(analogVoltage / stepVoltage);
    const quantizedLevel = Math.max(0, Math.min(levels - 1, rawLevel));
    const quantizedVoltage = Number((quantizedLevel * stepVoltage).toFixed(3));
    const binaryCode = quantizedLevel.toString(2).padStart(bitDepth, "0");
    const error = Number((analogVoltage - quantizedVoltage).toFixed(3));
    samples.push({
      timeSec: t,
      analogVoltage,
      quantizedLevel,
      quantizedVoltage,
      binaryCode,
      error,
    });
  }

  return { samples, levels, stepVoltage };
}

export type RealPulsePoint = { t: number; v: number };

/** Generates points for a real-world clock waveform with finite rise/fall times and ringing. */
export function generateRealWaveform(
  periodNs: number,
  dutyCyclePercent: number,
  riseTimeNs: number,
  fallTimeNs: number,
  ringingAmplitude = 0.15,
  vcc = 3.3,
  numCycles = 2,
  stepsPerCycle = 80,
): RealPulsePoint[] {
  const highNs = (periodNs * dutyCyclePercent) / 100;
  const points: RealPulsePoint[] = [];
  const totalTime = numCycles * periodNs;
  const dt = periodNs / stepsPerCycle;

  for (let t = 0; t <= totalTime; t += dt) {
    const cycleTime = t % periodNs;
    let v = 0;
    if (cycleTime < highNs) {
      if (cycleTime < riseTimeNs) {
        const p = cycleTime / riseTimeNs;
        const s = p * p * (3 - 2 * p);
        v = vcc * s;
      } else {
        const ringTime = cycleTime - riseTimeNs;
        const decay = Math.exp(-ringTime / Math.max(0.5, riseTimeNs * 0.8));
        const ring = Math.sin((ringTime * 2 * Math.PI) / Math.max(0.5, riseTimeNs * 0.9)) * ringingAmplitude * vcc * decay;
        v = Math.min(vcc * 1.25, vcc + ring);
      }
    } else {
      const fallElapsed = cycleTime - highNs;
      if (fallElapsed < fallTimeNs) {
        const p = fallElapsed / fallTimeNs;
        const s = p * p * (3 - 2 * p);
        v = vcc * (1 - s);
      } else {
        const ringTime = fallElapsed - fallTimeNs;
        const decay = Math.exp(-ringTime / Math.max(0.5, fallTimeNs * 0.8));
        const under = Math.sin((ringTime * 2 * Math.PI) / Math.max(0.5, fallTimeNs * 0.9)) * ringingAmplitude * vcc * decay;
        v = Math.max(-0.2 * vcc, 0 - under);
      }
    }
    points.push({ t: Number(t.toFixed(3)), v: Number(v.toFixed(3)) });
  }
  return points;
}

/** Evaluates clock skew across parallel traces at a given clock frequency. */
export function evaluateParallelSkew(
  freqMhz: number,
  lengthDiffMm: number,
  velocityCmPerNs = 15,
  setupTimePs = 80,
) {
  const periodNs = 1000 / freqMhz;
  const periodPs = periodNs * 1000;
  // velocity: 15 cm/ns = 150 mm/ns = 0.15 mm/ps
  const vMmPerPs = velocityCmPerNs / 100;
  const skewPs = Number((lengthDiffMm / vMmPerPs).toFixed(1));
  const skewFraction = Number((skewPs / periodPs).toFixed(4));
  const isReliable = skewPs + setupTimePs < periodPs * 0.25;
  const arrivesNextCycle = skewPs > periodPs * 0.5;

  return {
    freqMhz,
    periodPs,
    periodNs,
    skewPs,
    skewFraction,
    isReliable,
    arrivesNextCycle,
  };
}

/* ---------------------------- number systems --------------------------- */

const DIGITS = "0123456789ABCDEF";

export type DivisionStep = { value: number; quotient: number; remainder: number; digit: string };

/** Repeated division: the remainders, read bottom-up, are the digits. */
export function divisionSteps(n: number, base: number): DivisionStep[] {
  const out: DivisionStep[] = [];
  let v = Math.max(0, Math.floor(n));
  do {
    const remainder = v % base;
    const quotient = Math.floor(v / base);
    out.push({ value: v, quotient, remainder, digit: DIGITS[remainder] });
    v = quotient;
  } while (v > 0);
  return out;
}

export const toBase = (n: number, base: number) => n.toString(base).toUpperCase();
export const fromBase = (s: string, base: number) => parseInt(s, base);

/** Place-value breakdown of an integer written in `base`, most significant digit first. */
export function placeValues(s: string, base: number) {
  const clean = s.toUpperCase();
  return [...clean].map((ch, i) => {
    const power = clean.length - 1 - i;
    const digit = DIGITS.indexOf(ch);
    return { ch, digit, power, weight: base ** power, value: digit * base ** power };
  });
}

/** Repeated multiplication by 2 for a fraction between 0 and 1. */
export function fractionBits(f: number, max = 8) {
  const out: { value: number; product: number; bit: Bit }[] = [];
  let v = f;
  for (let i = 0; i < max && v > 0; i++) {
    const product = v * 2;
    const bit: Bit = product >= 1 ? 1 : 0;
    out.push({ value: v, product, bit });
    v = product - bit;
  }
  return out;
}

export const bitsOf = (n: number, width: number): Bit[] =>
  Array.from({ length: width }, (_, i) => (((n >>> (width - 1 - i)) & 1) as Bit));
export const bitsToNumber = (bits: Bit[]) => bits.reduce<number>((a, b) => a * 2 + b, 0);
export const bitString = (n: number, width: number) => bitsOf(n, width).join("");

export const onesComplement = (n: number, width: number) => ~n & (2 ** width - 1);
export const twosComplement = (n: number, width: number) => (onesComplement(n, width) + 1) & (2 ** width - 1);
/** The value a bit pattern stands for when read as two's complement. */
export const signedValue = (n: number, width: number) => (n >= 2 ** (width - 1) ? n - 2 ** width : n);
export const signMagnitude = (v: number, width: number) => (v < 0 ? 2 ** (width - 1) : 0) | Math.abs(v);

export const toGray = (n: number) => n ^ (n >> 1);
export function fromGray(g: number) {
  let n = g;
  for (let s = g >> 1; s > 0; s >>= 1) n ^= s;
  return n;
}
export const toBcd = (n: number) => [...String(n)].map((d) => bitString(Number(d), 4));
export const toExcess3 = (d: number) => bitString(d + 3, 4);

export type FloatParts = { sign: Bit; exponent: number; fraction: number; bits: string; value: number; kind: "zero" | "normal" | "subnormal" | "infinity" | "nan" };

/** Reads a number the way IEEE 754 single precision stores it. */
export function floatParts(value: number): FloatParts {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  const u = view.getUint32(0);
  const exponent = (u >>> 23) & 0xff;
  const fraction = u & 0x7fffff;
  const kind = exponent === 255 ? (fraction ? "nan" : "infinity") : exponent === 0 ? (fraction ? "subnormal" : "zero") : "normal";
  return { sign: (u >>> 31) as Bit, exponent, fraction, bits: u.toString(2).padStart(32, "0"), value: view.getFloat32(0), kind };
}

export type BitGroup = {
  rawBits: string;
  paddedBits: string;
  digit: string;
  paddingCount: number;
  position: "integer" | "fractional";
  distanceFromRadix: number;
};

export type GroupedBinaryResult = {
  groupSize: 3 | 4;
  baseName: "octal" | "hex";
  radix: 8 | 16;
  integerGroups: BitGroup[];
  fractionalGroups: BitGroup[];
  resultString: string;
  intPadCount: number;
  fracPadCount: number;
  originalBinary: string;
};

/**
 * Groups binary digits outward from the radix point into chunks of 3 (octal) or 4 (hex),
 * padding leftmost integer digits with leading zeros and rightmost fractional digits with trailing zeros.
 */
export function groupBinaryBits(binaryInput: string, groupSize: 3 | 4): GroupedBinaryResult {
  const clean = binaryInput.replace(/[^01.]/g, "");
  const [rawInt = "", rawFrac = ""] = clean.split(".");
  const intStr = rawInt.length > 0 ? rawInt : "0";
  const fracStr = clean.includes(".") ? rawFrac : "";

  const intPadCount = (groupSize - (intStr.length % groupSize)) % groupSize;
  const paddedInt = "0".repeat(intPadCount) + intStr;
  const numIntGroups = paddedInt.length / groupSize;
  const integerGroups: BitGroup[] = [];

  for (let g = 0; g < numIntGroups; g++) {
    const chunk = paddedInt.slice(g * groupSize, (g + 1) * groupSize);
    const distanceFromRadix = numIntGroups - 1 - g;
    const paddedInThisGroup = g === 0 ? intPadCount : 0;
    const rawBits = chunk.slice(paddedInThisGroup);
    const digitVal = parseInt(chunk, 2);
    integerGroups.push({
      rawBits,
      paddedBits: chunk,
      digit: DIGITS[digitVal],
      paddingCount: paddedInThisGroup,
      position: "integer",
      distanceFromRadix,
    });
  }

  const fractionalGroups: BitGroup[] = [];
  let fracPadCount = 0;
  if (fracStr.length > 0) {
    fracPadCount = (groupSize - (fracStr.length % groupSize)) % groupSize;
    const paddedFrac = fracStr + "0".repeat(fracPadCount);
    const numFracGroups = paddedFrac.length / groupSize;

    for (let g = 0; g < numFracGroups; g++) {
      const chunk = paddedFrac.slice(g * groupSize, (g + 1) * groupSize);
      const distanceFromRadix = g;
      const paddedInThisGroup = g === numFracGroups - 1 ? fracPadCount : 0;
      const rawBits = chunk.slice(0, chunk.length - paddedInThisGroup);
      const digitVal = parseInt(chunk, 2);
      fractionalGroups.push({
        rawBits,
        paddedBits: chunk,
        digit: DIGITS[digitVal],
        paddingCount: paddedInThisGroup,
        position: "fractional",
        distanceFromRadix,
      });
    }
  }

  const intDigits = integerGroups.map((g) => g.digit).join("");
  const fracDigits = fractionalGroups.map((g) => g.digit).join("");
  const resultString = fracDigits ? `${intDigits}.${fracDigits}` : intDigits;

  return {
    groupSize,
    baseName: groupSize === 3 ? "octal" : "hex",
    radix: groupSize === 3 ? 8 : 16,
    integerGroups,
    fractionalGroups,
    resultString,
    intPadCount,
    fracPadCount,
    originalBinary: clean,
  };
}

/** Expands octal or hex digits into 3-bit or 4-bit binary groups. */
export function expandRadixToBinary(inputStr: string, groupSize: 3 | 4) {
  const clean = inputStr.toUpperCase().replace(groupSize === 3 ? /[^0-7.]/g : /[^0-9A-F.]/g, "");
  const [rawInt = "", rawFrac = ""] = clean.split(".");
  const intStr = rawInt.length > 0 ? rawInt : "0";
  const fracStr = clean.includes(".") ? rawFrac : "";

  const intGroups = [...intStr].map((ch) => ({
    digit: ch,
    bits: parseInt(ch, groupSize === 3 ? 8 : 16).toString(2).padStart(groupSize, "0"),
  }));
  const fracGroups = [...fracStr].map((ch) => ({
    digit: ch,
    bits: parseInt(ch, groupSize === 3 ? 8 : 16).toString(2).padStart(groupSize, "0"),
  }));

  const fullBinary = `${intGroups.map((g) => g.bits).join("")}${fracGroups.length ? "." + fracGroups.map((g) => g.bits).join("") : ""}`;

  return {
    groupSize,
    radix: groupSize === 3 ? 8 : 16,
    intGroups,
    fracGroups,
    fullBinary,
  };
}

export type SignedArithmeticResult = {
  a: number;
  b: number;
  operation: "add" | "sub";
  width: 4 | 8;
  aSigned: number;
  bSigned: number;
  aBits: Bit[];
  bBits: Bit[];
  bEffBits: Bit[];
  bEffTwosComplement: Bit[];
  columns: AddColumn[];
  sumBits: Bit[];
  carryInMsb: Bit;
  carryOutMsb: Bit;
  overflow: boolean;
  carryOut: Bit;
  unsignedSum: number;
  signedResult: number;
  expectedTrueResult: number;
  overflowReason: string;
};

/**
 * Simulates signed two's complement addition or subtraction column by column,
 * extracting the carry into MSB (C_{n-1}) and carry out (C_n) to evaluate V = C_{n-1} ^ C_n.
 */
export function simulateSignedArithmetic(
  a: number,
  b: number,
  width: 4 | 8,
  operation: "add" | "sub" = "add",
): SignedArithmeticResult {
  const minVal = -(2 ** (width - 1));
  const maxVal = 2 ** (width - 1) - 1;

  const aClamped = Math.max(minVal, Math.min(maxVal, a));
  const bClamped = Math.max(minVal, Math.min(maxVal, b));

  const aMasked = aClamped < 0 ? aClamped + 2 ** width : aClamped;
  const bMasked = bClamped < 0 ? bClamped + 2 ** width : bClamped;

  const aBits = bitsOf(aMasked, width);
  const bBits = bitsOf(bMasked, width);

  let bEffMasked = bMasked;
  if (operation === "sub") {
    bEffMasked = (~bMasked + 1) & (2 ** width - 1);
  }
  const bEffBits = bitsOf(bEffMasked, width);
  const bEffTwosComp = bitsOf((~bMasked + 1) & (2 ** width - 1), width);

  const cols = rippleAdd(aMasked, bEffMasked, width, 0);
  const sumBits = cols.map((c) => c.sum);

  const msbCol = cols[width - 1];
  const carryInMsb = msbCol.carryIn;
  const carryOutMsb = msbCol.carryOut;

  const overflow = carryInMsb !== carryOutMsb;
  const carryOut = carryOutMsb;

  const unsignedSum = cols.reduce((acc, c) => acc + (c.sum << c.index), 0);
  const signedResult = signedValue(unsignedSum, width);
  const expectedTrueResult = operation === "add" ? aClamped + bClamped : aClamped - bClamped;

  let overflowReason = "";
  if (overflow) {
    if (aClamped > 0 && (operation === "add" ? bClamped > 0 : bClamped < 0) && signedResult < 0) {
      overflowReason = `Positive + Positive gave Negative (${signedResult}). The true result ${expectedTrueResult} exceeds maximum +${maxVal}.`;
    } else if (aClamped < 0 && (operation === "add" ? bClamped < 0 : bClamped > 0) && signedResult >= 0) {
      overflowReason = `Negative + Negative gave Positive (${signedResult}). The true result ${expectedTrueResult} is below minimum ${minVal}.`;
    } else {
      overflowReason = `Signed overflow: true result ${expectedTrueResult} outside [${minVal}, +${maxVal}].`;
    }
  } else {
    overflowReason = `Result ${signedResult} fits within [${minVal}, +${maxVal}]. No signed overflow.`;
  }

  return {
    a: aClamped,
    b: bClamped,
    operation,
    width,
    aSigned: aClamped,
    bSigned: bClamped,
    aBits,
    bBits,
    bEffBits,
    bEffTwosComplement: bEffTwosComp,
    columns: cols,
    sumBits,
    carryInMsb,
    carryOutMsb,
    overflow,
    carryOut,
    unsignedSum,
    signedResult,
    expectedTrueResult,
    overflowReason,
  };
}

/** Demonstrates sign extension preserving signed value vs zero extension corrupting it. */
export function signExtend(val: number, fromWidth: number, toWidth: number) {
  const minVal = -(2 ** (fromWidth - 1));
  const maxVal = 2 ** (fromWidth - 1) - 1;
  const clamped = Math.max(minVal, Math.min(maxVal, val));
  const rawBits = bitsOf(clamped < 0 ? clamped + 2 ** fromWidth : clamped, fromWidth);
  const signBit = rawBits[0];

  const signExtendedBits = [...Array(toWidth - fromWidth).fill(signBit), ...rawBits];
  const zeroExtendedBits = [...Array(toWidth - fromWidth).fill(0 as Bit), ...rawBits];

  const rawSignExtVal = bitsToNumber(signExtendedBits);
  const signedValExtended = signedValue(rawSignExtVal, toWidth);
  const zeroExtendedVal = bitsToNumber(zeroExtendedBits);

  return {
    originalValue: clamped,
    signBit,
    rawBits,
    signExtendedBits,
    zeroExtendedBits,
    signedValExtended,
    zeroExtendedVal,
    preserved: signedValExtended === clamped,
  };
}

export type BcdAdderResult = {
  digitA: number;
  digitB: number;
  carryIn: Bit;
  aBits: Bit[];
  bBits: Bit[];
  stage1Sum: number;
  stage1Bits: Bit[];
  binaryCarryK: Bit;
  termK: Bit;
  termZ3Z2: Bit;
  termZ3Z1: Bit;
  needsCorrection: boolean;
  correctionCode: Bit[];
  correctedBits: Bit[];
  finalBcdDigit: number;
  bcdCarryOut: Bit;
  totalDecimal: number;
  reason: string;
};

/**
 * Simulates a two-stage BCD adder with Boolean correction logic C = K + Z3*Z2 + Z3*Z1
 * injecting 0110_2 when correction is required.
 */
export function simulateBcdAdder(digitA: number, digitB: number, carryIn: Bit = 0): BcdAdderResult {
  const a = Math.max(0, Math.min(9, Math.floor(digitA)));
  const b = Math.max(0, Math.min(9, Math.floor(digitB)));
  const cin = carryIn ? 1 : 0;

  const aBits = bitsOf(a, 4);
  const bBits = bitsOf(b, 4);

  const stage1Sum = a + b + cin;
  const binaryCarryK: Bit = stage1Sum >= 16 ? 1 : 0;
  const zVal = stage1Sum % 16;
  const stage1Bits = bitsOf(zVal, 4);
  const [z3, z2, z1] = stage1Bits;

  const termK: Bit = binaryCarryK;
  const termZ3Z2: Bit = z3 && z2 ? 1 : 0;
  const termZ3Z1: Bit = z3 && z1 ? 1 : 0;
  const needsCorrection = Boolean(termK || termZ3Z2 || termZ3Z1);
  const bcdCarryOut: Bit = needsCorrection ? 1 : 0;

  const correctionCode: Bit[] = needsCorrection ? [0, 1, 1, 0] : [0, 0, 0, 0];
  const correctedSumVal = (zVal + (needsCorrection ? 6 : 0)) % 16;
  const correctedBits = bitsOf(correctedSumVal, 4);
  const finalBcdDigit = correctedSumVal;
  const totalDecimal = bcdCarryOut * 10 + finalBcdDigit;

  let reason = "";
  if (binaryCarryK) {
    reason = `Binary carry K=1 occurred (stage 1 sum ${stage1Sum} ≥ 16). Adder wrapped modulo 16. Adding 6 (0110₂) advances to the next decade.`;
  } else if (needsCorrection) {
    reason = `Intermediate sum ${stage1Sum} falls into the forbidden range (10 to 15, 1010₂-1111₂). Adding 6 (0110₂) skips 6 invalid states and carries 1.`;
  } else {
    reason = `Sum ${stage1Sum} is a valid BCD digit (≤ 9) with K=0. No correction needed (+0000₂).`;
  }

  return {
    digitA: a,
    digitB: b,
    carryIn: cin as Bit,
    aBits,
    bBits,
    stage1Sum,
    stage1Bits,
    binaryCarryK,
    termK,
    termZ3Z2,
    termZ3Z1,
    needsCorrection,
    correctionCode,
    correctedBits,
    finalBcdDigit,
    bcdCarryOut,
    totalDecimal,
    reason,
  };
}

export type ParityResult = {
  dataBits: Bit[];
  mode: "even" | "odd";
  onesInData: number;
  parityBit: Bit;
  transmittedWord: Bit[];
  flippedIndices: number[];
  receivedWord: Bit[];
  onesInReceived: number;
  receiverSyndromeValid: boolean;
  errorDetected: boolean;
  actualErrorsCount: number;
  silentCorruption: boolean;
  diagnostic: string;
};

/**
 * Simulates parity generation (even/odd), channel bit-flipping noise,
 * and receiver parity checking (demonstrating why single errors are detected but double errors pass).
 */
export function simulateParity(
  dataBits: Bit[],
  mode: "even" | "odd" = "even",
  flippedIndices: number[] = [],
): ParityResult {
  const cleanData = dataBits.slice(0, 7).map((b) => (b ? 1 : 0) as Bit);
  while (cleanData.length < 7) cleanData.push(0);

  const onesInData = cleanData.filter(Boolean).length;
  let parityBit: Bit = 0;
  if (mode === "even") {
    parityBit = onesInData % 2 === 1 ? 1 : 0;
  } else {
    parityBit = onesInData % 2 === 0 ? 1 : 0;
  }

  const transmittedWord: Bit[] = [...cleanData, parityBit];
  const receivedWord = [...transmittedWord];
  for (const idx of flippedIndices) {
    if (idx >= 0 && idx < receivedWord.length) {
      receivedWord[idx] = (receivedWord[idx] ? 0 : 1) as Bit;
    }
  }

  const onesInReceived = receivedWord.filter(Boolean).length;
  const receiverSyndromeValid = mode === "even" ? onesInReceived % 2 === 0 : onesInReceived % 2 === 1;
  const errorDetected = !receiverSyndromeValid;
  const actualErrorsCount = flippedIndices.length;
  const silentCorruption = actualErrorsCount > 0 && !errorDetected;

  let diagnostic = "";
  if (silentCorruption) {
    diagnostic = `CRITICAL SILENT FAILURE: ${actualErrorsCount} bits flipped (even number of errors), so the parity check passed unnoticed. The received byte is corrupt! Parity cannot detect even numbers of bit errors.`;
  } else if (errorDetected) {
    diagnostic = `PARITY ERROR DETECTED: Parity check failed (received ${onesInReceived} 1s in ${mode} parity mode). Hardware flags error and halts/retransmits.`;
  } else {
    diagnostic = `CLEAN: Received ${onesInReceived} 1s, satisfying ${mode} parity requirements. No errors detected.`;
  }

  return {
    dataBits: cleanData,
    mode,
    onesInData,
    parityBit,
    transmittedWord,
    flippedIndices,
    receivedWord,
    onesInReceived,
    receiverSyndromeValid,
    errorDetected,
    actualErrorsCount,
    silentCorruption,
    diagnostic,
  };
}

/* ------------------------------ arithmetic ----------------------------- */

export type AddColumn = { index: number; a: Bit; b: Bit; carryIn: Bit; sum: Bit; carryOut: Bit };

export function fullAdd(a: Bit, b: Bit, c: Bit) {
  return { sum: (a ^ b ^ c) as Bit, carry: (((a & b) | ((a ^ b) & c)) as Bit) };
}

/** Column by column from the least significant bit, the way a ripple-carry adder works. */
export function rippleAdd(a: number, b: number, width: number, carryIn: Bit = 0): AddColumn[] {
  const out: AddColumn[] = [];
  let c = carryIn;
  for (let i = 0; i < width; i++) {
    const x = ((a >> i) & 1) as Bit;
    const y = ((b >> i) & 1) as Bit;
    const { sum, carry } = fullAdd(x, y, c);
    out.push({ index: i, a: x, b: y, carryIn: c, sum, carryOut: carry });
    c = carry;
  }
  return out;
}

/** Number of stages a carry has to travel through before the answer is valid. */
export const rippleDelay = (cols: AddColumn[]) => {
  let longest = 0;
  let run = 0;
  for (const c of cols) {
    run = c.carryOut && c.a !== c.b ? run + 1 : c.carryOut ? 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
};

/** Each stage's carry from its generate and propagate signals, without waiting on the stage below. */
export function lookaheadCarries(a: number, b: number, width: number, c0: Bit = 0) {
  const g = Array.from({ length: width }, (_, i) => (((a >> i) & (b >> i) & 1) as Bit));
  const p = Array.from({ length: width }, (_, i) => ((((a >> i) | (b >> i)) & 1) as Bit));
  const c: Bit[] = [c0];
  for (let i = 0; i < width; i++) {
    let v: number = g[i];
    for (let j = 0; j < i; j++) {
      let t: number = g[j];
      for (let k = j + 1; k <= i; k++) t &= p[k];
      v |= t;
    }
    let t0: number = c0;
    for (let k = 0; k <= i; k++) t0 &= p[k];
    c.push(((v | t0) as Bit));
  }
  return { g, p, c };
}

/* ---------------------------- Boolean algebra -------------------------- */

/** Evaluates a Boolean expression written with ' + · and juxtaposition, e.g. "A'B + (B+C)'". */
export function evalExpr(expr: string, env: Record<string, Bit>): Bit {
  const s = expr.replace(/\s+/g, "");
  let i = 0;
  const parseOr = (): Bit => {
    let v = parseAnd();
    while (s[i] === "+") {
      i++;
      const r = parseAnd();
      v = (v | r) as Bit;
    }
    return v;
  };
  const parseAnd = (): Bit => {
    let v = parseUnary();
    while (i < s.length && (s[i] === "." || s[i] === "(" || /[A-Z01]/.test(s[i]))) {
      if (s[i] === ".") i++;
      const r = parseUnary();
      v = (v & r) as Bit;
    }
    return v;
  };
  const parseUnary = (): Bit => {
    let v: Bit;
    if (s[i] === "(") {
      i++;
      v = parseOr();
      i++;
    } else if (s[i] === "0" || s[i] === "1") {
      v = Number(s[i++]) as Bit;
    } else {
      v = env[s[i++]] ?? 0;
    }
    while (s[i] === "'") {
      i++;
      v = (v ? 0 : 1) as Bit;
    }
    return v;
  };
  return parseOr();
}

export function truthRows(vars: string[]) {
  const n = vars.length;
  return Array.from({ length: 2 ** n }, (_, m) => {
    const env: Record<string, Bit> = {};
    vars.forEach((v, i) => (env[v] = ((m >> (n - 1 - i)) & 1) as Bit));
    return { m, env };
  });
}

export const sameFunction = (a: string, b: string, vars: string[]) =>
  truthRows(vars).every(({ env }) => evalExpr(a, env) === evalExpr(b, env));

/** Sum of products: one AND term for every row where the output is 1. */
export function sopFromMinterms(minterms: number[], vars: string[]) {
  const n = vars.length;
  if (!minterms.length) return "0";
  if (minterms.length === 2 ** n) return "1";
  return [...minterms]
    .sort((a, b) => a - b)
    .map((m) => vars.map((v, i) => (((m >> (n - 1 - i)) & 1) ? v : `${v}'`)).join(""))
    .join(" + ");
}

/** Product of sums: one OR term for every row where the output is 0. */
export function posFromMinterms(minterms: number[], vars: string[]) {
  const n = vars.length;
  const zeros = Array.from({ length: 2 ** n }, (_, m) => m).filter((m) => !minterms.includes(m));
  if (!zeros.length) return "1";
  if (zeros.length === 2 ** n) return "0";
  return zeros.map((m) => `(${vars.map((v, i) => (((m >> (n - 1 - i)) & 1) ? `${v}'` : v)).join(" + ")})`).join("");
}

/* -------------------------------- K-maps ------------------------------- */

export type Implicant = { cells: number[]; term: string };

const GRAY2 = [0, 1, 3, 2];

/** Where minterm m sits on the map: row bits are the first variables, column bits the rest. */
export function kmapLayout(n: 2 | 3 | 4) {
  const rowBits = n === 4 ? 2 : 1;
  const colBits = n - rowBits;
  const rows = rowBits === 2 ? GRAY2 : [0, 1];
  const cols = colBits === 2 ? GRAY2 : [0, 1];
  return { rowBits, colBits, rows, cols, cell: (r: number, c: number) => (rows[r] << colBits) | cols[c] };
}

function termOf(mask: number, value: number, vars: string[]) {
  const n = vars.length;
  const parts: string[] = [];
  vars.forEach((v, i) => {
    const bit = 1 << (n - 1 - i);
    if (!(mask & bit)) parts.push(value & bit ? v : `${v}'`);
  });
  return parts.join("") || "1";
}

/** All maximal rectangles of 1s (Quine–McCluskey), then a smallest set that covers every 1. */
export function minimizeSop(minterms: number[], vars: string[]): Implicant[] {
  const n = vars.length;
  const on = [...new Set(minterms)];
  if (!on.length) return [];
  type Cube = { value: number; mask: number };
  let current: Cube[] = on.map((m) => ({ value: m, mask: 0 }));
  const primes: Cube[] = [];
  while (current.length) {
    const used = new Set<number>();
    const next = new Map<string, Cube>();
    current.forEach((a, i) =>
      current.forEach((b, j) => {
        if (j <= i || a.mask !== b.mask) return;
        const diff = a.value ^ b.value;
        if (diff && !(diff & (diff - 1))) {
          used.add(i);
          used.add(j);
          const cube = { value: a.value & ~diff, mask: a.mask | diff };
          next.set(`${cube.value}/${cube.mask}`, cube);
        }
      }),
    );
    current.forEach((c, i) => !used.has(i) && primes.push(c));
    current = [...next.values()];
  }
  const covers = (c: Cube) => on.filter((m) => (m & ~c.mask) === c.value);
  // the smallest cover by brute force; maps here have at most 16 cells and few primes
  const k = primes.length;
  let best: Cube[] | null = null;
  const cost = (set: Cube[]) => set.length * 100 + set.reduce((s, c) => s + (n - popcount(c.mask)), 0);
  for (let pick = 1; pick < 2 ** k; pick++) {
    const set = primes.filter((_, i) => (pick >> i) & 1);
    if (best && cost(set) >= cost(best)) continue;
    const covered = new Set(set.flatMap(covers));
    if (on.every((m) => covered.has(m))) best = set;
  }
  return (best ?? primes).map((c) => ({
    cells: Array.from({ length: 2 ** n }, (_, m) => m).filter((m) => (m & ~c.mask) === c.value),
    term: termOf(c.mask, c.value, vars),
  }));
}

function popcount(x: number) {
  let c = 0;
  for (let v = x; v; v &= v - 1) c++;
  return c;
}

/* ----------------------------- storage logic --------------------------- */

export type JkInput = { j: Bit; k: Bit };

export function jkNext(q: Bit, { j, k }: JkInput): Bit {
  if (j && k) return (q ? 0 : 1) as Bit;
  if (j) return 1;
  if (k) return 0;
  return q;
}

/** Output of a level-sensitive D latch and an edge-triggered D flip-flop over the same waveforms. */
export function latchVersusFlipFlop(clk: Bit[], d: Bit[], start: Bit = 0) {
  let l = start;
  let f = start;
  const latch: Bit[] = [];
  const flop: Bit[] = [];
  clk.forEach((c, i) => {
    if (c) l = d[i];
    if (c && !(clk[i - 1] ?? 0)) f = d[i];
    latch.push(l);
    flop.push(f);
  });
  return { latch, flop };
}

/** The state of an n-bit shift register after each clock edge. */
export function shiftFrames(width: number, input: Bit[], start?: Bit[]) {
  const frames: Bit[][] = [start ?? (Array(width).fill(0) as Bit[])];
  for (const b of input) frames.push([b, ...frames[frames.length - 1].slice(0, width - 1)]);
  return frames;
}

/** A ripple up-counter: each stage toggles when the stage before it falls from 1 to 0. */
export function counterStep(bits: Bit[]) {
  const next = [...bits];
  const toggled: number[] = [];
  for (let i = next.length - 1; i >= 0; i--) {
    next[i] = (next[i] ? 0 : 1) as Bit;
    toggled.push(i);
    if (next[i] === 1) break;
  }
  return { next, toggled };
}
