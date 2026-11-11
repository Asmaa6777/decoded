import { useEffect, useMemo, useState } from "react";
import { btn, inputCls, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import type { Frame } from "@/lib/algorithms";
import {
  bitString, bitsOf, bitsToNumber, CascadeStageConfig, classifyDecimalVoltage, classifyLogicVoltage, CmosGateType, computeBooleanDual,
  computeNoiseMargins, counterStep, divisionSteps, evalExpr, evalGate, evaluateParallelSkew,
  expandRadixToBinary, floatParts, fractionBits, generateRealWaveform, groupBinaryBits, jkNext, kmapLayout, KMapImplicant, latchVersusFlipFlop,
  LOGIC_FAMILIES, lookaheadCarries, minimizeKMap, minimizeSop, onesComplement, placeValues, posFromMinterms, rippleAdd, sameFunction, shiftFrames,
  signedValue, signExtend, simulateAdc, simulateBcdAdder, simulateBusDrivers, simulateCascadeDelay, simulateCmosGate, simulateParity,
  simulateSignedArithmetic, simulateStatic1Hazard, sopFromMinterms, TargetOperation, toBase, toBcd, toExcess3, toGray, truthRows, twosComplement,
  type Bit, type DriverMode, type DriverState, type LogicFamilyId, UNIVERSAL_CIRCUITS, UniversalGateFamily,
} from "@/lib/logic";

const BIT_ON: Record<string, string> = { mint: "border-mint bg-mint/20", neon: "border-neon bg-neon/20", sky: "border-sky bg-sky/20" };

const Bits = ({ value, tone = "mint" }: { value: string; tone?: string }) => (
  <span className="inline-flex gap-0.5 font-mono">
    {[...value].map((b, i) => (
      <span key={i} className={`w-6 h-7 flex items-center justify-center rounded-[2px] border text-[13px] ${b === "1" ? `${BIT_ON[tone]} font-bold` : "border-border text-muted-foreground"}`}>{b}</span>
    ))}
  </span>
);

/* ------------------------------- signals ------------------------------- */

const adcSignal = (t: number, type: string) => {
  if (type === "sine") return 2.5 + 2.0 * Math.sin(t * 2 * Math.PI * 1.5);
  return 0.5 + 4.0 * (t % 1.0);
};

const NOISE_WOBBLE = [-0.4, 0.7, -0.8, 0.3, 0.9, -0.6, 0.5, -0.7];

/** Visualizes continuous analog voltages converted to discrete binary levels (ADC). */
export function AdcSampler() {
  const [bitDepth, setBitDepth] = useState<number>(1);
  const [sampleRate, setSampleRate] = useState<number>(16);
  const [signalType] = useState<string>("sine");

  const { samples, levels, stepVoltage } = useMemo(
    () => simulateAdc((t) => adcSignal(t, signalType), 1.0, sampleRate, bitDepth, 5.0),
    [signalType, sampleRate, bitDepth],
  );

  const W = 480;
  const H = 190;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (t: number) => padL + t * plotW;
  const toY = (v: number) => padT + (1 - v / 5.0) * plotH;

  // Generate smooth analog path
  const analogPoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const v = adcSignal(t, signalType);
    analogPoints.push(`${toX(t).toFixed(1)},${toY(v).toFixed(1)}`);
  }

  // Generate quantized staircase path
  const stairPoints: string[] = [];
  samples.forEach((s, i) => {
    const x = toX(s.timeSec);
    const y = toY(s.quantizedVoltage);
    const nextX = i < samples.length - 1 ? toX(samples[i + 1].timeSec) : toX(1.0);
    if (i === 0) stairPoints.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    stairPoints.push(`H${nextX.toFixed(1)}`);
    if (i < samples.length - 1) {
      const nextY = toY(samples[i + 1].quantizedVoltage);
      stairPoints.push(`V${nextY.toFixed(1)}`);
    }
  });

  return (
    <Panel title="Analog to digital: sampling and quantization">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">depth</span>
          <Toggle
            value={String(bitDepth)}
            options={[
              ["1", "1-bit (2 levels)"],
              ["2", "2-bit (4 levels)"],
              ["3", "3-bit (8 levels)"],
              ["4", "4-bit (16 levels)"],
            ]}
            onChange={(v) => setBitDepth(Number(v))}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">rate</span>
          <Toggle
            value={String(sampleRate)}
            options={[
              ["8", "8 Hz"],
              ["16", "16 Hz"],
              ["32", "32 Hz"],
            ]}
            onChange={(v) => setSampleRate(Number(v))}
          />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-sm border border-border bg-background/60" aria-label="ADC Sampling and Quantization Diagram">
        {/* Horizontal voltage / quantization grid lines */}
        {Array.from({ length: Math.min(17, levels + 1) }, (_, i) => {
          const v = i * stepVoltage;
          if (v > 5.0) return null;
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeDasharray="2,3" className="text-border/60" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[9px]">{v.toFixed(1)}V</text>
            </g>
          );
        })}

        {/* Continuous analog curve */}
        <polyline fill="none" strokeWidth={2} className="stroke-sky/60" points={analogPoints.join(" ")} />

        {/* Quantized staircase curve */}
        <path d={stairPoints.join(" ")} fill="none" strokeWidth={2.2} className="stroke-mint" />

        {/* Sample points */}
        {samples.map((s, i) => (
          <circle key={i} cx={toX(s.timeSec)} cy={toY(s.quantizedVoltage)} r={3.2} className="fill-mint stroke-background stroke-[1.5]" />
        ))}

        {/* Axis labels */}
        <text x={padL + 4} y={padT + 12} className="fill-sky font-mono text-[10px]">smooth analog signal</text>
        <text x={padL + 4} y={padT + 24} className="fill-mint font-mono text-[10px]">quantized digital output ({levels} levels, step = {stepVoltage.toFixed(2)} V)</text>
      </svg>

      <div className="space-y-1.5 font-mono text-[12px]">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground mr-1">binary stream:</span>
          <div className="flex flex-wrap gap-1">
            {samples.slice(0, 16).map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded-[2px] border border-mint/40 bg-mint/10 text-mint text-[11px] font-bold">
                {s.binaryCode}
              </span>
            ))}
            {samples.length > 16 && <span className="text-muted-foreground text-[11px]">+{samples.length - 16} more</span>}
          </div>
        </div>
        <p className="text-muted-foreground text-[12px] leading-relaxed">
          {bitDepth === 1
            ? "1-bit binary uses just two wide zones separated by a single threshold at 2.5 V. Noise can fluctuate by over 2 V without flipping the bit."
            : `${bitDepth}-bit encoding packs ${levels} levels only ${stepVoltage.toFixed(2)} V apart. A tiny noise spike of ±${(stepVoltage / 2).toFixed(2)} V alters the reading, requiring shielded analog circuitry.`}
        </p>
      </div>
    </Panel>
  );
}

/** Interactive noise margins and logic family thresholds. */
export function VoltageBands() {
  const [family, setFamily] = useState<LogicFamilyId>("lvcmos");
  const [noise, setNoise] = useState(0.25);
  const [pattern] = useState<"alt" | "high" | "low">("alt");

  const spec = LOGIC_FAMILIES[family];
  const margins = useMemo(() => computeNoiseMargins(spec), [spec]);

  const cleanBits = useMemo(() => {
    if (pattern === "high") return [1, 1, 1, 1, 1, 1, 1, 1];
    if (pattern === "low") return [0, 0, 0, 0, 0, 0, 0, 0];
    return [0, 1, 0, 1, 1, 0, 1, 0];
  }, [pattern]);

  const samples = useMemo(() => {
    if (family === "decimal") {
      return cleanBits.map((_, i) => {
        const nominal = i * 0.5;
        const noisy = Math.max(0, Math.min(5.0, nominal + NOISE_WOBBLE[i] * noise * 2.0));
        const res = classifyDecimalVoltage(noisy);
        return {
          sent: String(i),
          noisy,
          read: String(res.readDigit),
          status: res.readDigit === i ? "correct" : "flipped",
        };
      });
    }

    return cleanBits.map((b, i) => {
      const vTransmitted = b === 1 ? spec.voh : spec.vol;
      const noisy = Math.max(0, Math.min(spec.vcc, vTransmitted + NOISE_WOBBLE[i] * noise * spec.vcc * 0.6));
      const readVal = classifyLogicVoltage(noisy, spec.vih, spec.vil);
      let status: "correct" | "forbidden" | "flipped" = "correct";
      if (readVal === "?") status = "forbidden";
      else if (readVal !== String(b)) status = "flipped";
      return {
        sent: String(b),
        noisy,
        read: readVal,
        status,
      };
    });
  }, [family, spec, cleanBits, noise]);

  const W = 480;
  const H = 190;
  const vMax = spec.vcc;
  const sy = (x: number) => H - (x / vMax) * (H - 24) - 12;

  return (
    <Panel title="Logic levels, noise margins, and threshold bands">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
        <span className="text-muted-foreground">family</span>
        <Toggle
          value={family}
          options={[
            ["lvcmos", "3.3V LVCMOS"],
            ["ttl", "5V TTL"],
            ["cmos", "5V CMOS"],
            ["mismatched", "TTL → CMOS Mismatch"],
            ["decimal", "10-Level Decimal"],
          ]}
          onChange={(v) => setFamily(v as LogicFamilyId)}
        />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-sm border border-border bg-background/60" aria-label="Voltage bands and noise margin diagram">
        {family !== "decimal" ? (
          <>
            {/* Valid HIGH band */}
            <rect x={0} y={sy(vMax)} width={W} height={sy(spec.vih) - sy(vMax)} className="fill-mint/10" />
            {/* Forbidden / Indeterminate band */}
            <rect x={0} y={sy(spec.vih)} width={W} height={sy(spec.vil) - sy(spec.vih)} className="fill-orange/15" />
            {/* Valid LOW band */}
            <rect x={0} y={sy(spec.vil)} width={W} height={H - 12 - sy(spec.vil)} className="fill-sky/10" />

            {/* Threshold boundary lines */}
            <line x1={0} y1={sy(spec.vih)} x2={W} y2={sy(spec.vih)} stroke="currentColor" strokeDasharray="3,3" className="text-orange" strokeWidth={1.2} />
            <line x1={0} y1={sy(spec.vil)} x2={W} y2={sy(spec.vil)} stroke="currentColor" strokeDasharray="3,3" className="text-orange" strokeWidth={1.2} />

            {/* Labels */}
            <text x={8} y={sy(vMax) + 14} className="fill-mint font-mono text-[10px] font-bold">
              HIGH: ≥ {spec.vih} V (reads 1) · V_OH(min) = {spec.voh} V
            </text>
            <text x={8} y={sy((spec.vih + spec.vil) / 2) + 4} className="fill-orange font-mono text-[10px] font-bold">
              Forbidden region ({spec.vil} V to {spec.vih} V)
            </text>
            <text x={8} y={H - 16} className="fill-sky font-mono text-[10px] font-bold">
              LOW: ≤ {spec.vil} V (reads 0) · V_OL(max) = {spec.vol} V
            </text>
          </>
        ) : (
          <>
            {/* 10 Decimal bands */}
            {Array.from({ length: 10 }, (_, i) => {
              const yNom = sy(i * 0.5);
              return (
                <g key={i}>
                  <rect x={0} y={sy((i + 0.5) * 0.5)} width={W} height={sy(Math.max(0, (i - 0.5) * 0.5)) - sy((i + 0.5) * 0.5)} className={i % 2 === 0 ? "fill-sky/5" : "fill-mint/5"} />
                  <line x1={0} y1={yNom} x2={W} y2={yNom} stroke="currentColor" strokeDasharray="2,3" className="text-border" strokeWidth={1} />
                  <text x={8} y={yNom + 3} className="fill-foreground font-mono text-[9px]">Digit {i}: {(i * 0.5).toFixed(1)} V (margin ±0.25 V)</text>
                </g>
              );
            })}
          </>
        )}

        {/* Voltage trace */}
        <polyline
          fill="none"
          strokeWidth={2.2}
          className="stroke-foreground"
          points={samples.map((s, i) => `${36 + i * 54},${sy(s.noisy)}`).join(" ")}
        />

        {/* Sample dots */}
        {samples.map((s, i) => {
          const cx = 36 + i * 54;
          const cy = sy(s.noisy);
          const fill = s.status === "correct" ? "fill-mint" : s.status === "forbidden" ? "fill-orange" : "fill-orange stroke-red-500 stroke-2";
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={4.5} className={fill} />
              <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-bold">{s.noisy.toFixed(2)}V</text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground mr-1">sent</span>
          <div className="flex gap-1.5">
            {samples.map((s, i) => (
              <span key={i} className="w-6 text-center text-muted-foreground">{s.sent}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground mr-1">received</span>
          <div className="flex gap-1.5">
            {samples.map((s, i) => {
              const cls = s.status === "correct" ? "text-mint font-bold" : s.status === "forbidden" ? "text-orange font-bold" : "text-destructive font-bold";
              return (
                <span key={i} className={`w-6 text-center ${cls}`}>{s.read}</span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
          <span>noise level</span>
          <input
            type="range"
            min={0}
            max={family === "decimal" ? 0.35 : 0.8}
            step={0.02}
            value={noise}
            onChange={(e) => setNoise(Number(e.target.value))}
            aria-label="Noise level"
            className="flex-1 accent-[hsl(var(--orange))]"
          />
          <span className="w-16 text-right text-foreground">±{(noise * (family === "decimal" ? 2.0 : spec.vcc * 0.6)).toFixed(2)} V</span>
        </label>

        {family !== "decimal" ? (
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px]">
            <span>V_NH = V_OH - V_IH = <strong className={margins.vnh < 0 ? "text-orange" : "text-mint"}>{margins.vnh.toFixed(2)} V</strong></span>
            <span>V_NL = V_IL - V_OL = <strong className="text-mint">{margins.vnl.toFixed(2)} V</strong></span>
            <span>Overall Margin V_N = <strong className={margins.vn < 0 ? "text-orange" : "text-mint"}>{margins.vn.toFixed(2)} V</strong></span>
          </div>
        ) : (
          <div className="font-mono text-[12px] text-orange">
            Decimal margin is only ±0.25 V between adjacent digits! Any noise spike exceeding 0.25 V instantly flips a digit.
          </div>
        )}

        {family === "mismatched" && (
          <div className="p-2 rounded border border-orange/40 bg-orange/10 font-mono text-[11px] text-orange">
            Warning: Standard 5V TTL driver guarantees V_OH(min) = 2.4 V, but 74HC CMOS receiver requires V_IH(min) = 3.5 V. Transmitted logic 1 falls squarely into the CMOS forbidden zone without a 74HCT interface chip!
          </div>
        )}
      </div>
    </Panel>
  );
}

/** Interactive demonstration of Push-Pull bus contention vs Open-Drain wired-AND. */
export function BusContentionVisualizer() {
  const [mode, setMode] = useState<DriverMode>("push-pull");
  const [driverA, setDriverA] = useState<DriverState>("HIGH");
  const [driverB, setDriverB] = useState<DriverState>("LOW");

  const sim = useMemo(
    () => simulateBusDrivers(mode, driverA, driverB, 10000, 5.0),
    [mode, driverA, driverB],
  );

  const W = 480;
  const H = 160;

  return (
    <Panel title="Push-pull bus contention vs open-drain wired-AND">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">architecture</span>
          <Toggle
            value={mode}
            options={[
              ["push-pull", "Push-Pull (Totem Pole)"],
              ["open-drain", "Open-Drain with Pull-Up"],
            ]}
            onChange={(v) => {
              setMode(v as DriverMode);
              if (v === "open-drain") {
                setDriverA("Hi-Z");
                setDriverB("Hi-Z");
              } else {
                setDriverA("HIGH");
                setDriverB("LOW");
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 font-mono text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Driver A:</span>
          {mode === "push-pull" ? (
            <Toggle
              value={driverA}
              options={[
                ["HIGH", "HIGH (5V)"],
                ["LOW", "LOW (0V)"],
              ]}
              onChange={(v) => setDriverA(v as DriverState)}
            />
          ) : (
            <Toggle
              value={driverA}
              options={[
                ["Hi-Z", "Idle (Hi-Z)"],
                ["LOW", "Active LOW (0V)"],
              ]}
              onChange={(v) => setDriverA(v as DriverState)}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Driver B:</span>
          {mode === "push-pull" ? (
            <Toggle
              value={driverB}
              options={[
                ["HIGH", "HIGH (5V)"],
                ["LOW", "LOW (0V)"],
              ]}
              onChange={(v) => setDriverB(v as DriverState)}
            />
          ) : (
            <Toggle
              value={driverB}
              options={[
                ["Hi-Z", "Idle (Hi-Z)"],
                ["LOW", "Active LOW (0V)"],
              ]}
              onChange={(v) => setDriverB(v as DriverState)}
            />
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-sm border border-border bg-background/60" aria-label="Circuit schematic of bus drivers">
        {/* V_CC Rail */}
        <line x1={40} y1={20} x2={440} y2={20} stroke="currentColor" strokeWidth={2.5} className="text-mint" />
        <text x={445} y={24} className="fill-mint font-mono text-[11px] font-bold">V_CC (5V)</text>

        {/* GND Rail */}
        <line x1={40} y1={140} x2={440} y2={140} stroke="currentColor" strokeWidth={2.5} className="text-sky" />
        <text x={445} y={144} className="fill-sky font-mono text-[11px] font-bold">GND (0V)</text>

        {/* Bus Wire (Middle) */}
        <line
          x1={60}
          y1={80}
          x2={420}
          y2={80}
          strokeWidth={sim.hasContention ? 3.5 : 2.5}
          className={sim.hasContention ? "stroke-orange animate-pulse" : sim.busLogic === "HIGH" ? "stroke-mint" : "stroke-sky"}
        />
        <text x={425} y={84} className={`font-mono text-[11px] font-bold ${sim.hasContention ? "fill-orange" : sim.busLogic === "HIGH" ? "fill-mint" : "fill-sky"}`}>
          Bus: {sim.busVoltage.toFixed(1)}V ({sim.busLogic})
        </text>

        {/* Driver A Box */}
        <rect x={70} y={35} width={90} height={90} rx={4} className="fill-background/80 stroke-border" strokeWidth={1.5} />
        <text x={115} y={50} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-bold">Driver A</text>
        <text x={115} y={64} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">{driverA}</text>

        {/* Driver A connections */}
        {mode === "push-pull" ? (
          <>
            <line x1={115} y1={20} x2={115} y2={35} stroke="currentColor" className={driverA === "HIGH" ? "text-mint" : "text-border"} strokeWidth={2} />
            <line x1={115} y1={125} x2={115} y2={140} stroke="currentColor" className={driverA === "LOW" ? "text-sky" : "text-border"} strokeWidth={2} />
            <line x1={160} y1={80} x2={175} y2={80} stroke="currentColor" className="text-foreground" strokeWidth={2} />
          </>
        ) : (
          <>
            <line x1={115} y1={125} x2={115} y2={140} stroke="currentColor" className={driverA === "LOW" ? "text-sky" : "text-border"} strokeWidth={2} />
            <line x1={160} y1={80} x2={175} y2={80} stroke="currentColor" className="text-foreground" strokeWidth={2} />
          </>
        )}

        {/* Driver B Box */}
        <rect x={310} y={35} width={90} height={90} rx={4} className="fill-background/80 stroke-border" strokeWidth={1.5} />
        <text x={355} y={50} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-bold">Driver B</text>
        <text x={355} y={64} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">{driverB}</text>

        {/* Driver B connections */}
        {mode === "push-pull" ? (
          <>
            <line x1={355} y1={20} x2={355} y2={35} stroke="currentColor" className={driverB === "HIGH" ? "text-mint" : "text-border"} strokeWidth={2} />
            <line x1={355} y1={125} x2={355} y2={140} stroke="currentColor" className={driverB === "LOW" ? "text-sky" : "text-border"} strokeWidth={2} />
            <line x1={295} y1={80} x2={310} y2={80} stroke="currentColor" className="text-foreground" strokeWidth={2} />
          </>
        ) : (
          <>
            <line x1={355} y1={125} x2={355} y2={140} stroke="currentColor" className={driverB === "LOW" ? "text-sky" : "text-border"} strokeWidth={2} />
            <line x1={295} y1={80} x2={310} y2={80} stroke="currentColor" className="text-foreground" strokeWidth={2} />
          </>
        )}

        {/* Pull-Up Resistor in Open-Drain Mode */}
        {mode === "open-drain" && (
          <g>
            <line x1={235} y1={20} x2={235} y2={45} stroke="currentColor" className="text-mint" strokeWidth={1.5} />
            <rect x={223} y={45} width={24} height={22} rx={2} className="fill-mint/20 stroke-mint" strokeWidth={1.5} />
            <text x={235} y={60} textAnchor="middle" className="fill-mint font-mono text-[9px] font-bold">10kΩ</text>
            <line x1={235} y1={67} x2={235} y2={80} stroke="currentColor" className="text-mint" strokeWidth={1.5} />
            <circle cx={235} cy={80} r={3} className="fill-mint" />
          </g>
        )}

        {/* Contention short-circuit current arrow */}
        {sim.hasContention && (
          <g className="animate-pulse">
            <path
              d={driverA === "HIGH" ? "M115,20 L115,80 L355,80 L355,140" : "M355,20 L355,80 L115,80 L115,140"}
              fill="none"
              stroke="#f97316"
              strokeWidth={3}
              strokeDasharray="6,4"
            />
            <text x={235} y={105} textAnchor="middle" className="fill-orange font-mono text-[11px] font-bold">
              ⚡ SHORT CIRCUIT: 125 mA
            </text>
          </g>
        )}
      </svg>

      <div className={`p-2.5 rounded border font-mono text-[12px] ${sim.hasContention ? "border-orange/50 bg-orange/10 text-orange" : "border-border bg-background/50 text-foreground"}`}>
        <div className="font-bold">{sim.summary}</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {mode === "push-pull"
            ? "Push-pull drivers must never share a wire without tri-state enable logic. Conflicting outputs short V_CC directly to GND."
            : "In open-drain, drivers only pull down or release (Hi-Z). Multiple chips can safely share a single wire with a pull-up resistor (wired-AND reset bus, I2C)."}
        </p>
      </div>
    </Panel>
  );
}

/** A clock's period, frequency, duty cycle, and real-world rise/fall times. */
export function ClockExplorer() {
  const [tab, setTab] = useState<"ideal" | "real">("ideal");
  const [period, setPeriod] = useState(10);
  const [width, setWidth] = useState(50);
  const [riseTime, setRiseTime] = useState(1.5);

  const W = 480;
  const H = 100;
  const px = W / 48;
  const high = (period * width) / 100;

  // Ideal square wave points
  const idealPts: string[] = [];
  for (let t = 0; t < 48; t += period) {
    idealPts.push(`${t * px},${H - 18} ${t * px},18 ${(t + high) * px},18 ${(t + high) * px},${H - 18} ${(t + period) * px},${H - 18}`);
  }

  // Real waveform points
  const realPts = useMemo(() => {
    return generateRealWaveform(period, width, riseTime, riseTime, 0.12, 3.3, 3, 60);
  }, [period, width, riseTime]);

  const sy = (v: number) => H - 18 - (v / 3.3) * (H - 36);
  const sx = (t: number) => (t / (3 * period)) * W;

  return (
    <Panel title="Period, frequency, duty cycle, and real edges">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">waveform</span>
          <Toggle
            value={tab}
            options={[
              ["ideal", "Ideal Square Wave"],
              ["real", "Real-World Waveform"],
            ]}
            onChange={(v) => setTab(v as "ideal" | "real")}
          />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-sm border border-border bg-background/60" aria-label="Clock signal waveform diagram">
        {tab === "ideal" ? (
          <>
            <polyline fill="none" strokeWidth={2.4} className="stroke-mint" points={idealPts.join(" ")} />
            <path d={`M0,8H${period * px}`} strokeWidth={1.5} className="stroke-sky" />
            <text x={4} y={7} className="fill-sky font-mono text-[9px]">T = {period} ns</text>
          </>
        ) : (
          <>
            {/* 10% and 90% reference lines */}
            <line x1={0} y1={sy(3.3 * 0.9)} x2={W} y2={sy(3.3 * 0.9)} stroke="currentColor" strokeDasharray="2,3" className="text-border" strokeWidth={1} />
            <line x1={0} y1={sy(3.3 * 0.1)} x2={W} y2={sy(3.3 * 0.1)} stroke="currentColor" strokeDasharray="2,3" className="text-border" strokeWidth={1} />
            <text x={6} y={sy(3.3 * 0.9) - 3} className="fill-muted-foreground font-mono text-[8px]">90%</text>
            <text x={6} y={sy(3.3 * 0.1) - 3} className="fill-muted-foreground font-mono text-[8px]">10%</text>

            <polyline
              fill="none"
              strokeWidth={2.4}
              className="stroke-mint"
              points={realPts.map((p) => `${sx(p.t).toFixed(1)},${sy(p.v).toFixed(1)}`).join(" ")}
            />

            <text x={W - 6} y={14} textAnchor="end" className="fill-orange font-mono text-[9px]">
              overshoot & ringing
            </text>
          </>
        )}
      </svg>

      <div className="space-y-2">
        <label className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
          <span>period (T)</span>
          <input
            type="range"
            min={4}
            max={24}
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            aria-label="Period in nanoseconds"
            className="flex-1 accent-[hsl(var(--sky))]"
          />
          <span className="w-16 text-right text-foreground">{period} ns</span>
        </label>

        <label className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
          <span>HIGH time (t_w)</span>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            aria-label="Duty cycle percent"
            className="flex-1 accent-[hsl(var(--mint))]"
          />
          <span className="w-16 text-right text-foreground">{width}%</span>
        </label>

        {tab === "real" && (
          <label className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
            <span>rise time (t_r, 10% to 90%)</span>
            <input
              type="range"
              min={0.5}
              max={Math.min(4.0, (period * width) / 100)}
              step={0.1}
              value={riseTime}
              onChange={(e) => setRiseTime(Number(e.target.value))}
              aria-label="Rise time in nanoseconds"
              className="flex-1 accent-[hsl(var(--orange))]"
            />
            <span className="w-16 text-right text-foreground">{riseTime.toFixed(1)} ns</span>
          </label>
        )}

        <div className="font-mono text-[12px] flex flex-wrap gap-x-6 gap-y-1">
          <span>T = <strong>{period} ns</strong></span>
          <span>f = 1/T = <strong>{(1000 / period).toFixed(0)} MHz</strong></span>
          <span>t_w = <strong>{((period * width) / 100).toFixed(1)} ns</strong></span>
          <span>duty cycle = <strong>{width}%</strong></span>
          {tab === "real" && (
            <span>t_r / T = <strong>{((riseTime / period) * 100).toFixed(0)}%</strong></span>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** Serial transmission vs parallel transmission, and the clock skew frequency wall. */
export function SerialParallel() {
  const [tab, setTab] = useState<"live" | "skew">("live");
  const byte = "01000111";
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Skew simulator state
  const [freqMhz, setFreqMhz] = useState(33);
  const [deltaMm, setDeltaMm] = useState(30);

  useEffect(() => {
    if (!playing || tab !== "live") return;
    const id = setInterval(() => setT((x) => (x + 1) % 10), 800);
    return () => clearInterval(id);
  }, [playing, tab]);

  const skew = useMemo(
    () => evaluateParallelSkew(freqMhz, deltaMm),
    [freqMhz, deltaMm],
  );

  return (
    <Panel title="Serial vs parallel transmission, and the clock skew bottleneck">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px]">
        <Toggle
          value={tab}
          options={[
            ["live", "Transmission Comparison"],
            ["skew", "Parallel Skew & Frequency Limit"],
          ]}
          onChange={(v) => setTab(v as "live" | "skew")}
        />
        {tab === "live" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className={`${btn} py-0.5 px-2 text-[11px]`}
            >
              {playing ? "pause" : "play"}
            </button>
            <button
              type="button"
              onClick={() => setT((x) => (x + 1) % 10)}
              className={`${btn} py-0.5 px-2 text-[11px]`}
            >
              step
            </button>
            <button
              type="button"
              onClick={() => setT(0)}
              className={`${btn} py-0.5 px-2 text-[11px]`}
            >
              reset
            </button>
          </div>
        )}
      </div>

      {tab === "live" ? (
        <div className="grid md:grid-cols-2 gap-6 font-mono text-[12px]">
          <div className="p-3 rounded border border-border bg-background/50">
            <div className="text-muted-foreground mb-2 font-bold">Serial: 1 wire, 8 clock ticks</div>
            <div className="flex gap-1">
              {[...byte].map((b, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 flex items-center justify-center border rounded-[2px] ${
                    i < t ? "border-mint bg-mint/20 font-bold" : i === t ? "border-neon bg-neon/20 font-bold animate-pulse" : "border-border text-muted-foreground"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
            <div className="mt-2 text-muted-foreground text-[11px]">
              Tick {Math.min(t + 1, 8)} of 8 {t >= 8 && "· byte complete"}
            </div>
            <p className="mt-2 text-muted-foreground text-[11px] leading-relaxed">
              Bits stream sequentially across one wire. Low pin count, compact connectors, zero inter-wire skew.
            </p>
          </div>

          <div className="p-3 rounded border border-border bg-background/50">
            <div className="text-muted-foreground mb-2 font-bold">Parallel: 8 wires, 1 clock tick</div>
            <div className="flex flex-col gap-1">
              {[...byte].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-muted-foreground text-[10px]">d{i}</span>
                  <span className={`w-5 h-5 flex items-center justify-center rounded-[2px] border ${b === "1" ? "border-mint bg-mint/20 text-mint font-bold" : "border-border text-muted-foreground"}`}>
                    {b}
                  </span>
                  <span className={`h-1 flex-1 ${b === "1" ? "bg-mint" : "bg-border"}`} />
                  <span className="text-[10px] text-muted-foreground">wire {i}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-muted-foreground text-[11px]">All 8 bits transfer in a single clock tick.</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">clock frequency:</span>
            <Toggle
              value={String(freqMhz)}
              options={[
                ["33", "33 MHz (PCI)"],
                ["100", "100 MHz (IDE)"],
                ["500", "500 MHz"],
                ["2500", "2.5 GHz (PCIe Gen 1)"],
              ]}
              onChange={(v) => setFreqMhz(Number(v))}
            />
          </div>

          <label className="flex items-center gap-3 text-muted-foreground">
            <span>trace length difference (ΔL):</span>
            <input
              type="range"
              min={0}
              max={50}
              value={deltaMm}
              onChange={(e) => setDeltaMm(Number(e.target.value))}
              aria-label="Trace length difference in millimeters"
              className="flex-1 accent-[hsl(var(--orange))]"
            />
            <span className="w-16 text-right text-foreground">{deltaMm} mm</span>
          </label>

          <div className="p-3 rounded border bg-background/60 space-y-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>Clock Period: <strong>{skew.periodPs >= 1000 ? `${(skew.periodPs / 1000).toFixed(1)} ns` : `${skew.periodPs} ps`}</strong></span>
              <span>Propagation Skew (Δt): <strong>{skew.skewPs.toFixed(0)} ps</strong></span>
              <span>Skew / Period: <strong className={skew.isReliable ? "text-mint" : "text-destructive"}>{(skew.skewFraction * 100).toFixed(1)}%</strong></span>
            </div>

            <div className={`p-2 rounded text-[11px] font-bold ${skew.isReliable ? "bg-mint/10 text-mint border border-mint/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
              {skew.isReliable
                ? `✓ RELIABLE: Skew consumes only ${(skew.skewFraction * 100).toFixed(1)}% of clock cycle. Bits settle well within register setup time.`
                : `⚡ BUS FAILURE: Skew consumes ${(skew.skewFraction * 100).toFixed(1)}% of clock cycle! Bits launched in cycle N collide with cycle N+1 at receiving flip-flops.`}
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Signals in circuit board copper travel at 15 cm/ns (6.67 ps/mm). A small 30 mm routing difference produces a 200 ps arrival gap. At 33 MHz (30.3 ns cycle) this is harmless (&lt;1%), but at 2.5 GHz (400 ps cycle) it eats 50% of the entire cycle, making wide parallel buses physically impossible at modern speeds.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ---------------------------- number systems --------------------------- */

const BASES: [string, string][] = [["2", "binary"], ["8", "octal"], ["16", "hex"]];

/** Repeated division: remainders drop out and read bottom-up. */
export function BaseConverter({ start = 58 }: { start?: number }) {
  const [n, setN] = useState(start);
  const [base, setBase] = useState("2");
  const b = Number(base);
  const steps = useMemo(() => divisionSteps(n, b), [n, b]);
  const frames = useMemo<Frame<{ upTo: number }>[]>(
    () => [
      ...steps.map((s, i) => ({
        state: { upTo: i },
        message: `${s.value} ÷ ${b} = ${s.quotient} remainder ${s.remainder}${s.remainder > 9 ? ` (written ${s.digit})` : ""}. That remainder is the next digit, working from the right.`,
        line: 1,
        stats: {},
      })),
      { state: { upTo: steps.length }, message: `The quotient reached 0. Read the remainders from the last to the first: ${n} in decimal is ${toBase(n, b)} in base ${b}.`, line: 3, stats: {} },
    ],
    [steps, n, b],
  );
  return (
    <Stepper
      title="Decimal to another base"
      frames={frames}
      codeLabel="The method"
      code={["while the number is above 0:", "    divide by the base and keep the remainder", "    carry on with the quotient", "read the remainders bottom to top"]}
      inputs={
        <div className="flex flex-wrap gap-3 items-center">
          <input type="number" min={0} max={65535} value={n} aria-label="Decimal number" onChange={(e) => setN(Math.min(65535, Math.max(0, Number(e.target.value) || 0)))} className={`${inputCls} w-28`} />
          <Toggle value={base} options={BASES} onChange={setBase} />
        </div>
      }
      render={({ upTo }) => (
        <div className="font-mono text-[14px] flex flex-col gap-1">
          {steps.slice(0, upTo + 1).map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 text-right">{s.value}</span>
              <span className="text-muted-foreground">÷ {b} =</span>
              <span className="w-12">{s.quotient}</span>
              <span className="text-muted-foreground">rem</span>
              <span className={`w-7 h-7 flex items-center justify-center rounded-[2px] border ${i === upTo ? "border-neon bg-neon/20" : "border-mint bg-mint/15"}`}>{s.digit}</span>
            </div>
          ))}
          {upTo === steps.length && <div className="mt-2 text-lg">{[...steps].reverse().map((s, i) => <span key={i} className="text-mint font-bold">{s.digit}</span>)}<sub className="text-muted-foreground ml-1">{b}</sub></div>}
        </div>
      )}
    />
  );
}

/** Toggle each bit and see its weight join the total. */
export function PlaceValueBits({ width = 8 }: { width?: number }) {
  const [v, setV] = useState(109);
  const bits = bitsOf(v, width);
  const hex = toBase(v, 16).padStart(Math.ceil(width / 4), "0");
  const oct = toBase(v, 8);
  return (
    <Panel title="Each switch is worth a power of two">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {bits.map((b, i) => {
          const w = 2 ** (width - 1 - i);
          return (
            <button key={i} type="button" aria-pressed={!!b} aria-label={`Bit worth ${w}`} onClick={() => setV(v ^ w)} className={`w-11 flex flex-col items-center rounded-sm border py-1.5 font-mono transition-colors ${b ? "border-mint bg-mint/20" : "border-border"}`}>
              <span className="text-[10px] text-muted-foreground">{w}</span>
              <span className="text-lg font-bold">{b}</span>
            </button>
          );
        })}
      </div>
      <div className="font-mono text-[13px] text-center break-words">
        {placeValues(bits.join(""), 2).filter((p) => p.digit).map((p) => p.weight).join(" + ") || "0"} = <span className="text-mint font-bold">{v}</span>
      </div>
      <div className="font-mono text-[12px] text-muted-foreground flex flex-wrap justify-center gap-x-6">
        <span>hex <span className="text-foreground">{hex}</span> (group 4 bits)</span>
        <span>octal <span className="text-foreground">{oct}</span> (group 3 bits)</span>
      </div>
    </Panel>
  );
}

/** Fractions: keep doubling, and the whole-number part that pops out is the next bit. */
export function FractionConverter() {
  const [f, setF] = useState(0.3125);
  const rows = fractionBits(f);
  return (
    <Panel title="A decimal fraction to binary">
      <label className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">fraction
        <input type="number" step={0.0625} min={0} max={0.9999} value={f} onChange={(e) => setF(Math.min(0.9999, Math.max(0, Number(e.target.value) || 0)))} aria-label="Fraction" className={`${inputCls} w-28`} />
      </label>
      <div className="font-mono text-[13px] flex flex-col gap-1">
        {rows.map((r, i) => <div key={i}>{r.value} × 2 = {r.product} <span className="text-muted-foreground">→ bit</span> <span className="text-mint font-bold">{r.bit}</span></div>)}
      </div>
      <div className="font-mono text-[14px]">0.<span className="text-mint font-bold">{rows.map((r) => r.bit).join("")}</span><sub>2</sub>{rows.length === 8 && <span className="text-orange text-[12px] ml-2">cut at 8 bits: this one never ends</span>}</div>
    </Panel>
  );
}

/** Visualizes grouping binary digits outward from the radix point into 4-bit nibbles (hex) or 3-bit octal digits, with explicit zero-padding. */
export function BitGroupingVisualizer() {
  const [binaryStr, setBinaryStr] = useState("10110110101.101011");
  const [groupSize, setGroupSize] = useState<3 | 4>(4);

  const presets = [
    { label: "Exam sample (10110110101.101011)", val: "10110110101.101011" },
    { label: "Padded fraction (1111101.1)", val: "1111101.1" },
    { label: "12-bit integer (110110110101)", val: "110110110101" },
    { label: "0.1 in binary (0.1)", val: "0.1" },
  ];

  const grouped = useMemo(() => groupBinaryBits(binaryStr, groupSize), [binaryStr, groupSize]);

  return (
    <Panel title="Bit Grouping Around the Radix Point">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Group into:</span>
            <Toggle
              value={String(groupSize)}
              options={[
                ["4", "Hexadecimal (4 bits)"],
                ["3", "Octal (3 bits)"],
              ]}
              onChange={(v) => setGroupSize(Number(v) as 3 | 4)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Binary:</span>
            <input
              type="text"
              value={binaryStr}
              onChange={(e) => setBinaryStr(e.target.value.replace(/[^01.]/g, ""))}
              className={`${inputCls} w-52 text-xs`}
              placeholder="e.g. 101101.101"
              aria-label="Binary number input"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => setBinaryStr(p.val)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                binaryStr === p.val ? "border-mint bg-mint/20 text-mint font-bold" : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Direction guidance */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs py-1 px-2 rounded bg-muted/40 border border-border">
          <div className="flex items-center justify-center gap-1.5 text-sky font-semibold">
            <span>←</span>
            <span>Integer: Group LEFT from point (pad leading 0s)</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-orange font-semibold">
            <span>Fraction: Group RIGHT from point (pad trailing 0s)</span>
            <span>→</span>
          </div>
        </div>

        {/* Group visualization cards */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-card rounded-md border border-border overflow-x-auto">
          {/* Integer groups (left of radix point) */}
          <div className="flex items-center gap-1.5">
            {grouped.integerGroups.map((grp, idx) => (
              <div key={idx} className="flex flex-col items-center p-2 rounded border border-sky/40 bg-sky/5">
                <span className="text-[10px] text-muted-foreground uppercase">
                  {idx === 0 && grp.paddingCount > 0 ? `Pad +${grp.paddingCount}` : `Nibble ${grouped.integerGroups.length - 1 - idx}`}
                </span>
                <div className="flex gap-0.5 my-1">
                  {[...grp.paddedBits].map((b, bIdx) => {
                    const isPadded = idx === 0 && bIdx < grp.paddingCount;
                    return (
                      <span
                        key={bIdx}
                        className={`w-5 h-6 flex items-center justify-center text-xs rounded-[2px] border ${
                          isPadded
                            ? "border-orange/60 bg-orange/20 text-orange font-bold"
                            : b === "1"
                            ? "border-sky bg-sky/20 font-bold"
                            : "border-border text-muted-foreground"
                        }`}
                        title={isPadded ? "Padded leading zero" : `Bit ${b}`}
                      >
                        {b}
                      </span>
                    );
                  })}
                </div>
                <span className="text-base font-bold text-mint">{grp.digit}</span>
              </div>
            ))}
          </div>

          {/* Radix Point */}
          <div className="flex flex-col items-center px-1">
            <span className="text-[10px] text-muted-foreground">point</span>
            <span className="text-2xl font-bold text-neon leading-none my-1">·</span>
            <span className="text-xs text-muted-foreground font-bold">.</span>
          </div>

          {/* Fractional groups (right of radix point) */}
          <div className="flex items-center gap-1.5">
            {grouped.fractionalGroups.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No fractional bits</span>
            ) : (
              grouped.fractionalGroups.map((grp, idx) => (
                <div key={idx} className="flex flex-col items-center p-2 rounded border border-orange/40 bg-orange/5">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {idx === grouped.fractionalGroups.length - 1 && grp.paddingCount > 0
                      ? `Pad +${grp.paddingCount}`
                      : `Frac ${idx + 1}`}
                  </span>
                  <div className="flex gap-0.5 my-1">
                    {[...grp.paddedBits].map((b, bIdx) => {
                      const isPadded = idx === grouped.fractionalGroups.length - 1 && bIdx >= grp.paddedBits.length - grp.paddingCount;
                      return (
                        <span
                          key={bIdx}
                          className={`w-5 h-6 flex items-center justify-center text-xs rounded-[2px] border ${
                            isPadded
                              ? "border-orange/60 bg-orange/20 text-orange font-bold"
                              : b === "1"
                              ? "border-orange/80 bg-orange/20 font-bold"
                              : "border-border text-muted-foreground"
                          }`}
                          title={isPadded ? "Padded trailing zero" : `Bit ${b}`}
                        >
                          {b}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-base font-bold text-mint">{grp.digit}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Converted representation */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-muted/20 border border-border">
          <div>
            <span className="text-muted-foreground">Converted Result: </span>
            <span className="text-lg font-bold text-mint font-mono">({grouped.resultString})</span>
            <sub className="text-muted-foreground font-mono font-bold text-xs ml-1">{grouped.radix}</sub>
          </div>
          <div className="text-xs text-muted-foreground">
            {grouped.intPadCount > 0 && <span className="text-orange mr-3">+{grouped.intPadCount} leading zero{grouped.intPadCount > 1 ? "s" : ""}</span>}
            {grouped.fracPadCount > 0 && <span className="text-orange">+{grouped.fracPadCount} trailing zero{grouped.fracPadCount > 1 ? "s" : ""}</span>}
          </div>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Why padding side matters: </strong>
          In fraction <code className="text-foreground">0.1₂</code>, adding trailing zeros yields{" "}
          <code className="text-foreground">0.1000₂ = 0.8₁₆ = 0.5₁₀</code> (preserves exact value).
          Padding on the left would give <code className="text-foreground">0.0001₂ = 0.0625₁₀</code> (corrupting the value by an 8× division error).
        </div>
      </div>
    </Panel>
  );
}

/** Column addition with carries lifted above the numbers. */
export function BinaryAddition() {
  const [a, setA] = useState(6);
  const [b, setB] = useState(7);
  const w = 5;
  const cols = rippleAdd(a, b, w);
  const order = [...cols].reverse();
  return (
    <Panel title="Binary addition, column by column">
      <div className="flex gap-6 flex-wrap font-mono text-[12px] text-muted-foreground">
        <label className="flex items-center gap-2">A <input type="range" min={0} max={15} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="A" className="accent-[hsl(var(--mint))]" /> <span className="text-foreground w-5">{a}</span></label>
        <label className="flex items-center gap-2">B <input type="range" min={0} max={15} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="B" className="accent-[hsl(var(--mint))]" /> <span className="text-foreground w-5">{b}</span></label>
      </div>
      <div className="font-mono text-[18px] inline-grid gap-y-1 w-fit" style={{ gridTemplateColumns: `4rem repeat(${w}, 2rem)` }}>
        <span className="text-[11px] text-orange self-center">carry</span>{order.map((c) => <span key={c.index} className="text-center text-orange text-[13px]">{c.carryIn || ""}</span>)}
        <span className="text-[11px] text-muted-foreground self-center">A = {a}</span>{order.map((c) => <span key={c.index} className="text-center">{c.a}</span>)}
        <span className="text-[11px] text-muted-foreground self-center">B = {b}</span>{order.map((c) => <span key={c.index} className="text-center border-b border-foreground">{c.b}</span>)}
        <span className="text-[11px] text-mint self-center">sum = {a + b}</span>{order.map((c) => <span key={c.index} className="text-center text-mint font-bold">{c.sum}</span>)}
      </div>
    </Panel>
  );
}

/** The 4-bit two's complement clock: adding wraps, and overflow is visible as crossing the seam. */
export function TwosComplementWheel() {
  const [v, setV] = useState(5);
  const [add, setAdd] = useState(4);
  const W = 300, C = 150, R = 112;
  const pos = (n: number) => {
    const a = ((n * 360) / 16 - 90) * (Math.PI / 180);
    return [C + R * Math.cos(a), C + R * Math.sin(a)];
  };
  const sum = (v + add) & 15;
  const sa = signedValue(v, 4), sb = signedValue(add, 4), ss = signedValue(sum, 4);
  const overflow = sa + sb !== ss;
  const neg = twosComplement(v, 4);

  // Position between 7 and 8 (the seam)
  const seamAngle = ((7.5 * 360) / 16 - 90) * (Math.PI / 180);
  const xSeamInner = C + (R - 26) * Math.cos(seamAngle);
  const ySeamInner = C + (R - 26) * Math.sin(seamAngle);
  const xSeamOuter = C + (R + 26) * Math.cos(seamAngle);
  const ySeamOuter = C + (R + 26) * Math.sin(seamAngle);

  return (
    <Panel title="Four bits bent into a circle (The Two's Complement Wheel)">
      <div className="grid md:grid-cols-[300px_1fr] gap-5 items-center">
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-[300px] mx-auto">
          <circle cx={C} cy={C} r={R} fill="none" className="stroke-border" strokeWidth={2} />
          {/* The Seam between +7 and -8 */}
          <line
            x1={xSeamInner}
            y1={ySeamInner}
            x2={xSeamOuter}
            y2={ySeamOuter}
            stroke="hsl(var(--orange))"
            strokeWidth={3}
            strokeDasharray="3 3"
          />
          <text
            x={xSeamOuter - 4}
            y={ySeamOuter + 14}
            textAnchor="middle"
            className="fill-orange font-mono text-[9px] font-bold"
          >
            THE SEAM
          </text>
          {Array.from({ length: 16 }, (_, n) => {
            const [x, y] = pos(n);
            const tone = n === v ? "fill-neon/40 stroke-neon" : n === sum ? "fill-mint/40 stroke-mint" : "fill-card stroke-border";
            return (
              <g key={n} onClick={() => setV(n)} className="cursor-pointer" role="button" aria-label={`Pick ${bitString(n, 4)}`}>
                <circle cx={x} cy={y} r={19} strokeWidth={2} className={tone} />
                <text x={x} y={y - 2} textAnchor="middle" className="fill-foreground font-mono text-[10px]">{bitString(n, 4)}</text>
                <text x={x} y={y + 10} textAnchor="middle" className={`font-mono text-[11px] font-bold ${n >= 8 ? "fill-orange" : "fill-sky"}`}>{signedValue(n, 4)}</text>
              </g>
            );
          })}
          <text x={C} y={C - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">click a state</text>
          <text x={C} y={C + 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">bottom half = negative</text>
        </svg>
        <div className="flex flex-col gap-2.5 font-mono text-[13px]">
          <div>Starting value <Bits value={bitString(v, 4)} tone="neon" /> = <span className="font-bold">{sa}</span></div>
          <div className="text-muted-foreground text-xs">flip every bit (1&apos;s complement): <span className="text-foreground">{bitString(onesComplement(v, 4), 4)}</span></div>
          <div className="text-muted-foreground text-xs">add 1 (2&apos;s complement negation): <span className="text-foreground">{bitString(neg, 4)}</span> = {signedValue(neg, 4)}</div>
          <label className="flex items-center gap-2 text-muted-foreground text-xs pt-1">
            add offset:
            <input type="range" min={-7} max={7} value={add} onChange={(e) => setAdd(Number(e.target.value))} aria-label="Amount to add" className="flex-1 accent-[hsl(var(--mint))]" />
            <span className="text-foreground w-6 font-bold">{add >= 0 ? `+${add}` : add}</span>
          </label>
          <div className="pt-1">
            Operation: {sa} + ({sb}) → <Bits value={bitString(sum, 4)} /> = <span className="font-bold">{ss}</span>
          </div>
          <div className={`p-2 rounded text-xs border ${overflow ? "border-orange bg-orange/15 text-orange font-semibold" : "border-mint/50 bg-mint/10 text-mint"}`}>
            {overflow
              ? `OVERFLOW DETECTED: The true mathematical sum ${sa + sb} falls outside the 4-bit signed range [-8, +7]. The needle crossed the orange seam, wrapping past +7 into negative values.`
              : `NO OVERFLOW: Result fits within [-8, +7]. Arithmetic wrapping preserves valid two's complement modular sum.`}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/** Interactive two's complement adder/subtractor with column-by-column carries, V = C_{n-1} ^ C_n overflow logic, and sign extension. */
export function SignedArithmeticLab() {
  const [width, setWidth] = useState<4 | 8>(4);
  const [op, setOp] = useState<"add" | "sub">("add");
  const [a, setA] = useState<number>(5);
  const [b, setB] = useState<number>(4);
  const [showSignExt, setShowSignExt] = useState(false);

  const minVal = -(2 ** (width - 1));
  const maxVal = 2 ** (width - 1) - 1;

  const result = useMemo(() => simulateSignedArithmetic(a, b, width, op), [a, b, width, op]);
  const ext = useMemo(() => signExtend(a, 4, 8), [a]);

  const presets = [
    { label: "4-bit Pos Overflow (+5 + +4)", w: 4 as const, op: "add" as const, a: 5, b: 4 },
    { label: "4-bit Neg Overflow (-6 + -5)", w: 4 as const, op: "add" as const, a: -6, b: -5 },
    { label: "4-bit Opposite Signs (+5 + -3)", w: 4 as const, op: "add" as const, a: 5, b: -3 },
    { label: "8-bit Valid Sum (+42 + +19)", w: 8 as const, op: "add" as const, a: 42, b: 19 },
    { label: "8-bit Pos Overflow (+80 + +70)", w: 8 as const, op: "add" as const, a: 80, b: 70 },
    { label: "8-bit Sub M≥N (+42 - +19)", w: 8 as const, op: "sub" as const, a: 42, b: 19 },
    { label: "8-bit Sub M<N (+19 - +42)", w: 8 as const, op: "sub" as const, a: 19, b: 42 },
  ];

  const colsReversed = useMemo(() => [...result.columns].reverse(), [result.columns]);

  return (
    <Panel title="Signed Two's Complement Arithmetic & Overflow Lab">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              value={String(width)}
              options={[
                ["4", "4-Bit ([-8, +7])"],
                ["8", "8-Bit ([-128, +127])"],
              ]}
              onChange={(v) => {
                const nw = Number(v) as 4 | 8;
                setWidth(nw);
                const nMin = -(2 ** (nw - 1));
                const nMax = 2 ** (nw - 1) - 1;
                setA(Math.max(nMin, Math.min(nMax, a)));
                setB(Math.max(nMin, Math.min(nMax, b)));
              }}
            />
            <Toggle
              value={op}
              options={[
                ["add", "Addition (A + B)"],
                ["sub", "Subtraction (A - B)"],
              ]}
              onChange={(v) => setOp(v as "add" | "sub")}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSignExt(!showSignExt)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              showSignExt ? "border-mint bg-mint/20 text-mint font-bold" : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            {showSignExt ? "Hide Sign Extension" : "Show Sign Extension"}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setWidth(p.w);
                setOp(p.op);
                setA(p.a);
                setB(p.b);
              }}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-4 p-3 bg-muted/20 rounded border border-border">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Operand A</span>
              <span className="text-foreground font-bold">{result.a}</span>
            </div>
            <input
              type="range"
              min={minVal}
              max={maxVal}
              value={result.a}
              onChange={(e) => setA(Number(e.target.value))}
              className="accent-[hsl(var(--mint))] w-full"
              aria-label="Operand A"
            />
            <span className="text-[11px] text-muted-foreground">
              Binary: <code className="text-foreground">{bitString(result.a < 0 ? result.a + 2 ** width : result.a, width)}</code>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Operand B</span>
              <span className="text-foreground font-bold">{result.b}</span>
            </div>
            <input
              type="range"
              min={minVal}
              max={maxVal}
              value={result.b}
              onChange={(e) => setB(Number(e.target.value))}
              className="accent-[hsl(var(--mint))] w-full"
              aria-label="Operand B"
            />
            <span className="text-[11px] text-muted-foreground">
              Binary: <code className="text-foreground">{bitString(result.b < 0 ? result.b + 2 ** width : result.b, width)}</code>
              {op === "sub" && (
                <span className="text-orange ml-1">
                  → Negated -B: <code className="text-orange">{result.bEffBits.join("")}</code>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Subtraction reduction note */}
        {op === "sub" && (
          <div className="text-xs p-2.5 rounded bg-muted/40 border border-border text-muted-foreground">
            <strong className="text-foreground">Subtraction via Two&apos;s Complement: </strong>
            <span className="text-foreground">A - B = A + (-B)</span>. Hardware inverts B (<code className="text-foreground">{onesComplement(result.b < 0 ? result.b + 2 ** width : result.b, width).toString(2).padStart(width, "0")}</code>) and adds 1 to obtain 2&apos;s complement <code className="text-foreground">{result.bEffBits.join("")}</code>, feeding both into an ordinary adder.
          </div>
        )}

        {/* Column-by-column adder table */}
        <div className="p-3 bg-card rounded-md border border-border overflow-x-auto">
          <div className="min-w-fit mx-auto flex flex-col items-center">
            <div className="grid gap-y-1.5 items-center font-mono" style={{ gridTemplateColumns: `5.5rem repeat(${width}, 2.2rem)` }}>
              {/* Carry Row */}
              <span className="text-xs text-orange font-bold text-right pr-2">Carry</span>
              {colsReversed.map((c) => {
                const isMsbIn = c.index === width - 1;
                return (
                  <span
                    key={`c-${c.index}`}
                    className={`h-6 flex items-center justify-center text-xs rounded-[2px] font-bold ${
                      isMsbIn ? "border border-orange bg-orange/20 text-orange" : c.carryIn ? "text-orange" : "text-muted-foreground/40"
                    }`}
                    title={isMsbIn ? `Carry entering MSB (C_${width - 1} = ${c.carryIn})` : `Carry in`}
                  >
                    {c.carryIn}
                  </span>
                );
              })}

              {/* Operand A Row */}
              <span className="text-xs text-muted-foreground text-right pr-2">A ({result.a})</span>
              {colsReversed.map((c) => (
                <span key={`a-${c.index}`} className="h-7 flex items-center justify-center text-sm font-bold border border-border rounded-[2px] bg-muted/10">
                  {c.a}
                </span>
              ))}

              {/* Operand B / -B Row */}
              <span className="text-xs text-muted-foreground text-right pr-2">
                {op === "sub" ? `-B (${-result.b})` : `B (${result.b})`}
              </span>
              {colsReversed.map((c) => (
                <span key={`b-${c.index}`} className="h-7 flex items-center justify-center text-sm font-bold border-b-2 border-foreground rounded-[2px] bg-muted/10">
                  {c.b}
                </span>
              ))}

              {/* Sum Row */}
              <span className="text-xs text-mint font-bold text-right pr-2">Sum</span>
              {colsReversed.map((c) => (
                <span key={`s-${c.index}`} className="h-8 flex items-center justify-center text-sm font-bold border border-mint bg-mint/20 text-mint rounded-[2px]">
                  {c.sum}
                </span>
              ))}

              {/* Bit Weight Labels */}
              <span className="text-[10px] text-muted-foreground text-right pr-2">Weight</span>
              {colsReversed.map((c) => (
                <span key={`w-${c.index}`} className="text-center text-[10px] text-muted-foreground">
                  {c.index === width - 1 ? `-${2 ** c.index}` : `+${2 ** c.index}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* XOR Overflow Detector & Carry-Out Analysis */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* XOR Overflow Gate */}
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground">Signed Overflow Detector (XOR Gate)</span>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border">
              <div className="flex flex-col text-xs">
                <span>Carry into MSB (C_{width - 1}): <strong className="text-orange">{result.carryInMsb}</strong></span>
                <span>Carry out of MSB (C_{width}): <strong className="text-sky">{result.carryOutMsb}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-sm">V = C_{width - 1} ⊕ C_{width} =</span>
                <span className={`px-2 py-0.5 rounded text-sm font-bold ${result.overflow ? "bg-orange text-black" : "bg-mint/20 text-mint border border-mint"}`}>
                  {result.overflow ? "1 (OVERFLOW)" : "0 (OK)"}
                </span>
              </div>
            </div>
            <div className={`text-xs p-2 rounded border ${result.overflow ? "border-orange bg-orange/10 text-orange" : "border-mint/40 bg-mint/10 text-mint"}`}>
              {result.overflowReason}
            </div>
          </div>

          {/* Unsigned vs Signed Summary */}
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground">Hardware Flag Interpretation</span>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-muted-foreground">Unsigned Carry-out (C_{width}):</span>
                <span className="font-bold text-sky">{result.carryOut} {result.carryOut ? "(Result ≥ 2ⁿ)" : "(No carry-out)"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-muted-foreground">Signed Two&apos;s Complement Result:</span>
                <span className={`font-bold ${result.overflow ? "text-orange line-through" : "text-mint"}`}>
                  {result.signedResult} {result.overflow ? `(True answer ${result.expectedTrueResult} truncated!)` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Carry-out in Subtraction:</span>
                <span className="text-muted-foreground text-[11px]">
                  {op === "sub" && (result.carryOut ? "M ≥ N: Carry 2ⁿ discarded normally" : "M < N: No carry, result is negative")}
                  {op === "add" && (result.carryOut ? "Unsigned addition overflowed" : "Unsigned addition fits")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Extension Explorer */}
        {showSignExt && (
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground">Sign Extension: Widening 4 Bits to 8 Bits</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${ext.preserved ? "bg-mint/20 text-mint" : "bg-orange/20 text-orange"}`}>
                {ext.preserved ? "Value Preserved" : "Value Corrupted"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2 rounded bg-muted/20 border border-border flex flex-col gap-1">
                <span className="text-muted-foreground font-semibold">Sign Extended (Replicate MSB {ext.signBit}):</span>
                <div className="flex items-center gap-1 font-mono my-1">
                  <span className="text-mint font-bold">{ext.signExtendedBits.slice(0, 4).join("")}</span>
                  <span className="text-foreground">{ext.signExtendedBits.slice(4).join("")}</span>
                  <span className="ml-2 font-bold text-mint">= {ext.signedValExtended}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Upper bits carry negative weight, exactly preserving {ext.originalValue}.</span>
              </div>

              <div className="p-2 rounded bg-muted/20 border border-border flex flex-col gap-1">
                <span className="text-muted-foreground font-semibold">Zero Extended (Pad 0000):</span>
                <div className="flex items-center gap-1 font-mono my-1">
                  <span className="text-orange font-bold">{ext.zeroExtendedBits.slice(0, 4).join("")}</span>
                  <span className="text-foreground">{ext.zeroExtendedBits.slice(4).join("")}</span>
                  <span className="ml-2 font-bold text-orange">= {ext.zeroExtendedVal}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {ext.originalValue < 0 ? `Corrupts negative value ${ext.originalValue} into positive +${ext.zeroExtendedVal}!` : "Valid for unsigned only."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/** Why Gray code exists: on a position sensor, several bits never change at exactly the same instant. */
export function GrayEncoder() {
  const [pos, setPos] = useState(3);
  const [gray, setGray] = useState(false);
  const code = (n: number) => (gray ? toGray(n) : n);
  const cur = bitString(code(pos), 3);
  const next = bitString(code((pos + 1) % 8), 3);
  const flips = [...cur].filter((b, i) => b !== next[i]).length;
  const C = 120;
  return (
    <Panel title="A rotating shaft reading its own position">
      <div className="grid md:grid-cols-[240px_1fr] gap-5 items-center">
        <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
          {Array.from({ length: 8 }, (_, n) => {
            const a0 = ((n * 45 - 90) * Math.PI) / 180, a1 = (((n + 1) * 45 - 90) * Math.PI) / 180;
            const bits = bitString(code(n), 3);
            return [...bits].map((b, ring) => {
              const r1 = 110 - ring * 28, r0 = r1 - 26;
              const p = (r: number, a: number) => `${C + r * Math.cos(a)},${C + r * Math.sin(a)}`;
              return <path key={`${n}${ring}`} d={`M${p(r0, a0)} L${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)}Z`} onClick={() => setPos(n)} className={`cursor-pointer stroke-card ${b === "1" ? (n === pos ? "fill-mint" : "fill-foreground/60") : n === pos ? "fill-mint/25" : "fill-background"}`} strokeWidth={1.5} />;
            });
          })}
        </svg>
        <div className="flex flex-col gap-3 font-mono text-[13px]">
          <Toggle value={gray ? "gray" : "bin"} options={[["bin", "binary"], ["gray", "gray"]]} onChange={(x) => setGray(x === "gray")} />
          <div>position {pos} <Bits value={cur} /></div>
          <div className="text-muted-foreground">next {(pos + 1) % 8} <Bits value={next} tone="sky" /></div>
          <div className={flips > 1 ? "text-orange" : "text-mint"}>{flips} bit{flips > 1 ? "s" : ""} must change. {flips > 1 ? "If they change a moment apart, the sensor reads a wrong position in between." : "With one bit changing, there is no in-between reading."}</div>
          <button type="button" className={`${btn} w-fit`} onClick={() => setPos((pos + 1) % 8)}>Rotate →</button>
        </div>
      </div>
    </Panel>
  );
}

/** One decimal number in every code from the lesson. */
export function CodeTable() {
  const [d, setD] = useState(7);
  return (
    <Panel title="One digit, many codes">
      <input type="range" min={0} max={9} value={d} onChange={(e) => setD(Number(e.target.value))} aria-label="Decimal digit" className="accent-[hsl(var(--mint))] max-w-xs" />
      <table className="font-mono text-[13px] w-fit">
        <tbody>
          {[["Decimal", String(d)], ["Binary / BCD 8421", toBcd(d)[0]], ["Excess-3 (digit + 3)", toExcess3(d)], ["Gray", bitString(toGray(d), 4)], ["ASCII for the character", bitString(48 + d, 8)]].map(([k, v]) => (
            <tr key={k}><td className="pr-6 py-1 text-muted-foreground">{k}</td><td className="font-bold">{v}</td></tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/** Visualizes the two-stage BCD adder architecture with Boolean correction logic C = K + Z3*Z2 + Z3*Z1 injecting +6 (0110_2). */
export function BcdAdderVisualizer() {
  const [digitA, setDigitA] = useState<number>(7);
  const [digitB, setDigitB] = useState<number>(8);
  const [carryIn, setCarryIn] = useState<Bit>(0);

  const res = useMemo(() => simulateBcdAdder(digitA, digitB, carryIn), [digitA, digitB, carryIn]);

  const presets = [
    { label: "Valid Sum (4 + 3 = 7)", a: 4, b: 3, cin: 0 as Bit },
    { label: "Sum > 9 (7 + 8 = 15)", a: 7, b: 8, cin: 0 as Bit },
    { label: "Binary Carry K=1 (8 + 8 = 16)", a: 8, b: 8, cin: 0 as Bit },
    { label: "Max Decade (9 + 9 + 1 = 19)", a: 9, b: 9, cin: 1 as Bit },
  ];

  return (
    <Panel title="Two-Stage BCD Adder with +6 Correction Logic">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setDigitA(p.a);
                setDigitB(p.b);
                setCarryIn(p.cin);
              }}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid sm:grid-cols-3 gap-3 p-3 bg-muted/20 rounded border border-border">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Digit A (0..9)</span>
              <span className="font-bold text-foreground">{digitA} (<code className="text-sky">{res.aBits.join("")}</code>)</span>
            </div>
            <input
              type="range"
              min={0}
              max={9}
              value={digitA}
              onChange={(e) => setDigitA(Number(e.target.value))}
              className="accent-[hsl(var(--mint))] w-full"
              aria-label="Digit A"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Digit B (0..9)</span>
              <span className="font-bold text-foreground">{digitB} (<code className="text-sky">{res.bBits.join("")}</code>)</span>
            </div>
            <input
              type="range"
              min={0}
              max={9}
              value={digitB}
              onChange={(e) => setDigitB(Number(e.target.value))}
              className="accent-[hsl(var(--mint))] w-full"
              aria-label="Digit B"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Carry-in (Cin)</span>
              <span className="font-bold text-foreground">{carryIn}</span>
            </div>
            <div className="flex gap-2">
              {[0, 1].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCarryIn(c as Bit)}
                  className={`flex-1 py-1 rounded text-xs border transition-colors ${
                    carryIn === c ? "border-mint bg-mint/20 text-mint font-bold" : "border-border text-muted-foreground"
                  }`}
                >
                  Cin = {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture flow */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Stage 1 */}
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground">Stage 1: 4-Bit Binary Adder</span>
              <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">Modulo 16</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binary sum:</span>
                <span className="font-bold text-foreground">{digitA} + {digitB} + {carryIn} = {res.stage1Sum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intermediate sum (Z):</span>
                <span className="font-bold text-mint font-mono">{res.stage1Bits.join("")} ({res.stage1Sum % 16}₁₀)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binary carry (K):</span>
                <span className={`font-bold font-mono ${res.binaryCarryK ? "text-orange" : "text-foreground"}`}>{res.binaryCarryK}</span>
              </div>
            </div>
          </div>

          {/* Correction Logic */}
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground">Correction Logic</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${res.needsCorrection ? "bg-orange/20 text-orange border border-orange/40" : "bg-mint/20 text-mint"}`}>
                {res.needsCorrection ? "Correction Active" : "No Correction"}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Formula: <code className="text-foreground font-semibold">C = K + Z₃·Z₂ + Z₃·Z₁</code>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Term K (sum ≥ 16):</span>
                <span className={`font-mono font-bold ${res.termK ? "text-orange" : "text-muted-foreground"}`}>{res.termK}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Term Z₃·Z₂ (sum 12..15):</span>
                <span className={`font-mono font-bold ${res.termZ3Z2 ? "text-orange" : "text-muted-foreground"}`}>{res.termZ3Z2}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Term Z₃·Z₁ (sum 10,11,14,15):</span>
                <span className={`font-mono font-bold ${res.termZ3Z1 ? "text-orange" : "text-muted-foreground"}`}>{res.termZ3Z1}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border font-bold">
                <span className="text-foreground">Decade Carry Out (C):</span>
                <span className={`font-mono ${res.bcdCarryOut ? "text-orange" : "text-mint"}`}>{res.bcdCarryOut}</span>
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground">Stage 2: +6 Correction Adder</span>
              <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">Modulo 10</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Injected offset:</span>
                <span className="font-bold font-mono text-orange">+{res.correctionCode.join("")} ({res.needsCorrection ? "6" : "0"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Corrected BCD digit (S):</span>
                <span className="font-bold font-mono text-mint">{res.correctedBits.join("")} ({res.finalBcdDigit}₁₀)</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-muted-foreground">Total Output:</span>
                <span className="text-base font-bold text-mint font-mono">
                  {res.bcdCarryOut ? `${res.bcdCarryOut} ` : ""}{res.finalBcdDigit} ({res.totalDecimal}₁₀)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason banner */}
        <div className={`text-xs p-2.5 rounded border ${res.needsCorrection ? "border-orange/50 bg-orange/10 text-orange" : "border-mint/40 bg-mint/10 text-mint"}`}>
          {res.reason}
        </div>
      </div>
    </Panel>
  );
}

/** Visualizes 7-bit ASCII parity generation, physical channel noise, and single-bit vs undetected double-bit errors. */
export function ParityLab() {
  const [dataBits, setDataBits] = useState<Bit[]>([1, 0, 0, 0, 0, 1, 1]); // ASCII 'C'
  const [mode, setMode] = useState<"even" | "odd">("even");
  const [flipped, setFlipped] = useState<number[]>([]);

  const presets = [
    { label: "ASCII 'C' (1000011)", bits: [1, 0, 0, 0, 0, 1, 1] as Bit[] },
    { label: "ASCII 'A' (1000001)", bits: [1, 0, 0, 0, 0, 0, 1] as Bit[] },
    { label: "ASCII 'G' (1000111)", bits: [1, 0, 0, 0, 1, 1, 1] as Bit[] },
    { label: "ASCII '0' (0110000)", bits: [0, 1, 1, 0, 0, 0, 0] as Bit[] },
  ];

  const result = useMemo(() => simulateParity(dataBits, mode, flipped), [dataBits, mode, flipped]);

  const toggleBit = (idx: number) => {
    const next = [...dataBits];
    next[idx] = (next[idx] ? 0 : 1) as Bit;
    setDataBits(next);
  };

  const toggleChannelFlip = (idx: number) => {
    if (flipped.includes(idx)) {
      setFlipped(flipped.filter((i) => i !== idx));
    } else {
      setFlipped([...flipped, idx]);
    }
  };

  return (
    <Panel title="Parity Bit Generator & Error Detection Lab">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Parity Scheme:</span>
            <Toggle
              value={mode}
              options={[
                ["even", "Even Parity"],
                ["odd", "Odd Parity"],
              ]}
              onChange={(v) => setMode(v as "even" | "odd")}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFlipped([0])}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              Inject 1-Bit Error
            </button>
            <button
              type="button"
              onClick={() => setFlipped([0, 1])}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              Inject 2-Bit Error
            </button>
            <button
              type="button"
              onClick={() => setFlipped([])}
              className="text-xs px-2 py-0.5 rounded border border-mint bg-mint/10 text-mint transition-colors"
            >
              Clear Channel
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDataBits(p.bits);
                setFlipped([]);
              }}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Transmitter Block */}
        <div className="p-3 bg-card rounded border border-border flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-foreground">Transmitter: 7 Data Bits + 1 Parity Bit (P)</span>
            <span className="text-muted-foreground">
              Total 1s in Data: <strong className="text-foreground">{result.onesInData}</strong> → Parity Bit P = <strong className="text-mint">{result.parityBit}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
            {dataBits.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleBit(i)}
                aria-label={`Toggle data bit b${6 - i}`}
                className={`w-10 flex flex-col items-center rounded border py-1 transition-colors ${
                  b ? "border-sky bg-sky/20" : "border-border text-muted-foreground"
                }`}
              >
                <span className="text-[9px] text-muted-foreground">b{6 - i}</span>
                <span className="text-base font-bold">{b}</span>
              </button>
            ))}
            <div className="w-10 flex flex-col items-center rounded border border-mint bg-mint/20 py-1" title="Generated Parity Bit">
              <span className="text-[9px] text-mint font-bold">P</span>
              <span className="text-base font-bold text-mint">{result.parityBit}</span>
            </div>
          </div>
        </div>

        {/* Channel Noise Simulator */}
        <div className="p-3 bg-muted/20 rounded border border-border flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-foreground">Transmission Channel (Click bits to flip / inject electrical noise)</span>
            <span className="text-muted-foreground">
              Errors: <strong className={flipped.length ? "text-orange" : "text-mint"}>{flipped.length} bit(s)</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
            {result.receivedWord.map((b, i) => {
              const isFlipped = flipped.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleChannelFlip(i)}
                  className={`w-10 flex flex-col items-center rounded border py-1 transition-colors ${
                    isFlipped
                      ? "border-orange bg-orange/30 text-orange font-bold animate-pulse"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                  title={isFlipped ? "Corrupted by noise! Click to restore" : "Click to flip bit simulating noise"}
                >
                  <span className="text-[9px] text-muted-foreground">{i < 7 ? `d${6 - i}` : "P"}</span>
                  <span className="text-base font-bold">{b}</span>
                  <span className="text-[9px] text-muted-foreground">{isFlipped ? "FLIPPED" : "clean"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Receiver Block */}
        <div className={`p-3 rounded border flex flex-col gap-2 ${
          result.silentCorruption
            ? "border-orange bg-orange/15 text-orange"
            : result.errorDetected
            ? "border-destructive bg-destructive/15 text-foreground"
            : "border-mint/50 bg-mint/10 text-mint"
        }`}>
          <div className="flex justify-between items-center text-xs font-bold">
            <span>Receiver Parity Evaluation</span>
            <span>
              {result.silentCorruption
                ? "⚠ SILENT CORRUPTION DETECTED"
                : result.errorDetected
                ? "❌ PARITY ERROR DETECTED"
                : "✓ PARITY CHECK PASSED"}
            </span>
          </div>
          <div className="text-xs leading-relaxed">
            {result.diagnostic}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/** Live IEEE 754 single precision breakdown with presets, bit-level toggles, and hexadecimal equivalent. */
export function FloatExplorer() {
  const [text, setText] = useState("-43.625");
  const value = Number(text) || 0;
  const p = floatParts(value);
  const exp = p.exponent - 127;

  const presets = [
    { label: "-43.625 (Exam example)", val: "-43.625" },
    { label: "0.15625 (Exact fraction)", val: "0.15625" },
    { label: "1.0 (Unit)", val: "1.0" },
    { label: "0.1 (Repeating)", val: "0.1" },
    { label: "+0.0", val: "0" },
    { label: "-0.0", val: "-0" },
    { label: "Infinity", val: "Infinity" },
    { label: "1e-40 (Subnormal)", val: "1e-40" },
    { label: "NaN", val: "NaN" },
  ];

  const hexNibbles = useMemo(() => {
    const out: { nibble: string; hex: string }[] = [];
    for (let i = 0; i < 32; i += 4) {
      const chunk = p.bits.slice(i, i + 4);
      out.push({ nibble: chunk, hex: parseInt(chunk, 2).toString(16).toUpperCase() });
    }
    return out;
  }, [p.bits]);

  const seg = (s: string, cls: string, label: string) => (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-px">
        {[...s].map((b, i) => (
          <span
            key={i}
            className={`w-[14px] h-6 flex items-center justify-center font-mono text-[10px] rounded-[1px] ${
              b === "1" ? `${cls} font-bold` : "bg-background border border-border text-muted-foreground"
            }`}
          >
            {b}
          </span>
        ))}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <Panel
      title="IEEE 754 Single Precision (32-Bit) Floating Point"
      legend={[
        ["bg-orange", "sign (1 bit)"],
        ["bg-sky", "exponent (8 bits, bias 127)"],
        ["bg-mint", "fraction (23 bits, implicit 1.)"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Decimal input:</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="A decimal number"
              className={`${inputCls} w-44`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground">Presets:</span>
            {presets.slice(0, 5).map((pr) => (
              <button
                key={pr.val}
                type="button"
                onClick={() => setText(pr.val)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  text === pr.val ? "border-mint bg-mint/20 text-mint font-bold" : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>

        {/* More Presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Special cases:</span>
          {presets.slice(5).map((pr) => (
            <button
              key={pr.val}
              type="button"
              onClick={() => setText(pr.val)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                text === pr.val ? "border-orange bg-orange/20 text-orange font-bold" : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* 32-bit segment visualization */}
        <div className="p-3 bg-card rounded border border-border overflow-x-auto flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            {seg(p.bits[0], "bg-orange/50 text-orange-foreground", "Sign (1)")}
            {seg(p.bits.slice(1, 9), "bg-sky/50 text-sky-foreground", "Exponent (8)")}
            {seg(p.bits.slice(9), "bg-mint/50 text-mint-foreground", "Fraction / Mantissa (23)")}
          </div>
        </div>

        {/* Hex grouping representation */}
        <div className="p-2.5 rounded bg-muted/20 border border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Hexadecimal (0x):</span>
            <div className="flex gap-1.5 font-bold text-mint text-base">
              {hexNibbles.map((h, i) => (
                <span key={i} title={`Bits ${h.nibble}`} className="px-1 py-0.5 rounded bg-muted/40 border border-border">
                  {h.hex}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(= 0x{hexNibbles.map((h) => h.hex).join("")})</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Class: <strong className="text-foreground uppercase">{p.kind}</strong>
          </span>
        </div>

        {/* Decoded interpretation breakdown */}
        <div className="flex flex-col gap-1.5 text-xs p-3 rounded bg-card border border-border">
          <div>
            • <strong>Sign:</strong> bit is <code className="text-orange">{p.sign}</code> → number is{" "}
            <strong className="text-foreground">{p.sign ? "negative (-)" : "positive (+)"}</strong>.
          </div>
          {p.kind === "normal" && (
            <div>
              • <strong>Biased Exponent:</strong> stored <code className="text-sky">{p.exponent}</code> (binary{" "}
              <code className="text-sky">{p.bits.slice(1, 9)}</code>), minus bias of 127 ={" "}
              <strong className="text-foreground">{exp}</strong>. Binary point scales by{" "}
              <code className="text-foreground">2^{exp}</code>.
            </div>
          )}
          {p.kind === "normal" && (
            <div>
              • <strong>Significand (with implicit 1.):</strong>{" "}
              <code className="text-mint">1.{p.bits.slice(9).replace(/0+$/, "") || "0"}₂</code>
            </div>
          )}
          {p.kind === "subnormal" && (
            <div className="text-orange">
              • <strong>Subnormal:</strong> Exponent is 0 with non-zero fraction. Evaluates as{" "}
              <code>(-1)^S × 0.F × 2^(-126)</code> (gradual underflow, no implicit 1).
            </div>
          )}
          {p.kind === "infinity" && (
            <div className="text-orange font-bold">
              • <strong>Infinity:</strong> Exponent = 255 with all-zero fraction. Result of overflow or division by zero.
            </div>
          )}
          {p.kind === "nan" && (
            <div className="text-destructive font-bold">
              • <strong>NaN (Not a Number):</strong> Exponent = 255 with non-zero fraction. Result of invalid operations (0/0, √-1).
            </div>
          )}
          <div className="pt-1 border-t border-border flex justify-between items-center text-muted-foreground">
            <span>Exact float32 value recovered: <strong className="text-foreground">{p.value}</strong></span>
            {p.value !== value && (
              <span className="text-orange">
                (Rounded: {value} cannot be stored with finite binary precision)
              </span>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- CMOS Switch Simulation -------------------------- */

/** Simulates and visualizes CMOS complementary transistor switch behavior (PDN vs PUN). */
export function CmosSwitchVisualizer() {
  const [gate, setGate] = useState<CmosGateType>("NOT");
  const [va, setVa] = useState<number>(0);
  const [vb, setVb] = useState<number>(0);

  const isDual = gate !== "NOT";
  const inputs = useMemo(() => ({ A: va, B: vb }), [va, vb]);
  const sim = useMemo(() => simulateCmosGate(gate, inputs), [gate, inputs]);

  const rows = useMemo(() => {
    if (gate === "NOT") return [{ a: 0, b: 0, out: 1 }, { a: 1, b: 0, out: 0 }];
    const target = gate === "NAND" ? "NAND" : "NOR";
    return [
      { a: 0, b: 0, out: evalGate(target, [0, 0]) },
      { a: 0, b: 1, out: evalGate(target, [0, 1]) },
      { a: 1, b: 0, out: evalGate(target, [1, 0]) },
      { a: 1, b: 1, out: evalGate(target, [1, 1]) },
    ];
  }, [gate]);

  const curA = va >= 3.5 ? 1 : va <= 1.5 ? 0 : "X";
  const curB = vb >= 3.5 ? 1 : vb <= 1.5 ? 0 : "X";

  return (
    <Panel
      title="CMOS Transistor Switch Model"
      legend={[
        ["bg-mint/40", "conducting channel (ON)"],
        ["bg-border", "open circuit (OFF)"],
        ["bg-orange/40", "shoot-through alert"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Gate selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-muted-foreground mr-1">Gate:</span>
          {(["NOT", "NAND", "NOR"] as CmosGateType[]).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={g === gate}
              onClick={() => { setGate(g); setVa(0); setVb(0); }}
              className={`${btn} !px-2.5 ${g === gate ? "bg-foreground text-background font-bold" : ""}`}
            >
              {g}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setVa(2.5); setVb(2.5); }}
              className={`${btn} !px-2 text-[11px] text-orange border-orange/40 hover:bg-orange/10`}
            >
              Test Shoot-Through (2.5V)
            </button>
          </div>
        </div>

        {/* Input level toggles */}
        <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-2.5 rounded border border-border/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Input A:</span>
            <button
              type="button"
              onClick={() => setVa(0)}
              className={`${btn} !px-2 ${va === 0 ? "bg-mint text-background font-bold" : ""}`}
            >
              0 (0.0V)
            </button>
            <button
              type="button"
              onClick={() => setVa(5.0)}
              className={`${btn} !px-2 ${va === 5.0 ? "bg-mint text-background font-bold" : ""}`}
            >
              1 (5.0V)
            </button>
          </div>
          {isDual && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Input B:</span>
              <button
                type="button"
                onClick={() => setVb(0)}
                className={`${btn} !px-2 ${vb === 0 ? "bg-mint text-background font-bold" : ""}`}
              >
                0 (0.0V)
              </button>
              <button
                type="button"
                onClick={() => setVb(5.0)}
                className={`${btn} !px-2 ${vb === 5.0 ? "bg-mint text-background font-bold" : ""}`}
              >
                1 (5.0V)
              </button>
            </div>
          )}
        </div>

        {/* Schematic & Table Grid */}
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
          {/* Circuit SVG schematic */}
          <div className="border border-border rounded bg-card p-3">
            <svg viewBox="0 0 320 230" className="w-full max-w-[340px] mx-auto block select-none" role="img" aria-label="CMOS transistor schematic">
              {/* VDD rail */}
              <line x1="40" y1="20" x2="280" y2="20" stroke="currentColor" strokeWidth="2.5" className="text-neon" />
              <text x="160" y="14" textAnchor="middle" className="fill-neon text-[10px] font-bold">VDD (+5.0V Power Rail)</text>

              {/* GND rail */}
              <line x1="40" y1="210" x2="280" y2="210" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" />
              <line x1="145" y1="215" x2="175" y2="215" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
              <line x1="152" y1="220" x2="168" y2="220" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
              <text x="160" y="228" textAnchor="middle" className="fill-muted-foreground text-[9px]">GND (0.0V)</text>

              {/* Output node Y */}
              <line x1="160" y1="115" x2="265" y2="115" stroke="currentColor" strokeWidth={sim.pullUpConnected || sim.pullDownConnected ? 2.5 : 1.5} className={sim.outputState === "HIGH" ? "text-mint" : sim.outputState === "LOW" ? "text-sky" : sim.outputState === "SHOOT_THROUGH" ? "text-orange" : "text-muted-foreground"} />
              <circle cx="160" cy="115" r="3.5" className="fill-foreground" />
              <circle cx="270" cy="115" r="9" className={sim.outputState === "HIGH" ? "fill-mint/20 stroke-mint stroke-2" : sim.outputState === "LOW" ? "fill-sky/20 stroke-sky stroke-2" : "fill-background stroke-border stroke-2"} />
              <text x="270" y="119" textAnchor="middle" className="fill-foreground text-[11px] font-bold">{sim.outputBit}</text>
              <text x="295" y="119" className="fill-foreground text-[12px] font-bold">Y</text>

              {gate === "NOT" && (
                <>
                  {/* Pull-up pMOS */}
                  <line x1="160" y1="20" x2="160" y2="50" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn ? "text-mint" : "text-border"} />
                  <rect x="145" y="50" width="30" height="24" rx="2" className={sim.transistors[0]?.isOn ? "fill-mint/20 stroke-mint stroke-2" : "fill-card stroke-border stroke-1.5"} />
                  <circle cx="138" cy="62" r="3.5" className="fill-background stroke-foreground stroke-1.5" />
                  <line x1="90" y1="62" x2="134" y2="62" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                  <text x="160" y="65" textAnchor="middle" className="fill-foreground text-[10px] font-bold">pMOS</text>
                  <line x1="160" y1="74" x2="160" y2="115" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn ? "text-mint" : "text-border"} />
                  <text x="75" y="65" textAnchor="end" className="fill-foreground text-[11px] font-bold">A ({va.toFixed(1)}V)</text>

                  {/* Pull-down nMOS */}
                  <line x1="160" y1="115" x2="160" y2="145" stroke="currentColor" strokeWidth="2" className={sim.transistors[1]?.isOn ? "text-sky" : "text-border"} />
                  <rect x="145" y="145" width="30" height="24" rx="2" className={sim.transistors[1]?.isOn ? "fill-sky/20 stroke-sky stroke-2" : "fill-card stroke-border stroke-1.5"} />
                  <line x1="90" y1="157" x2="145" y2="157" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                  <line x1="90" y1="62" x2="90" y2="157" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                  <text x="160" y="160" textAnchor="middle" className="fill-foreground text-[10px] font-bold">nMOS</text>
                  <line x1="160" y1="169" x2="160" y2="210" stroke="currentColor" strokeWidth="2" className={sim.transistors[1]?.isOn ? "text-sky" : "text-border"} />
                </>
              )}

              {gate === "NAND" && (
                <>
                  {/* PUN: Parallel pMOS A and B */}
                  <path d="M160,20 V35 H120 V50" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn ? "text-mint" : "text-border"} />
                  <path d="M160,20 V35 H200 V50" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[1]?.isOn ? "text-mint" : "text-border"} />
                  <rect x="105" y="50" width="30" height="22" rx="2" className={sim.transistors[0]?.isOn ? "fill-mint/20 stroke-mint stroke-2" : "fill-card stroke-border"} />
                  <rect x="185" y="50" width="30" height="22" rx="2" className={sim.transistors[1]?.isOn ? "fill-mint/20 stroke-mint stroke-2" : "fill-card stroke-border"} />
                  <circle cx="98" cy="61" r="3.5" className="fill-background stroke-foreground" />
                  <circle cx="178" cy="61" r="3.5" className="fill-background stroke-foreground" />
                  <text x="120" y="64" textAnchor="middle" className="fill-foreground text-[9px]">pA</text>
                  <text x="200" y="64" textAnchor="middle" className="fill-foreground text-[9px]">pB</text>
                  <path d="M120,72 V88 H160 V115" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn ? "text-mint" : "text-border"} />
                  <path d="M200,72 V88 H160 V115" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[1]?.isOn ? "text-mint" : "text-border"} />

                  {/* PDN: Series nMOS A and B */}
                  <line x1="160" y1="115" x2="160" y2="135" stroke="currentColor" strokeWidth="2" className={sim.transistors[2]?.isOn ? "text-sky" : "text-border"} />
                  <rect x="145" y="135" width="30" height="22" rx="2" className={sim.transistors[2]?.isOn ? "fill-sky/20 stroke-sky stroke-2" : "fill-card stroke-border"} />
                  <text x="160" y="149" textAnchor="middle" className="fill-foreground text-[9px]">nA</text>
                  <line x1="160" y1="157" x2="160" y2="175" stroke="currentColor" strokeWidth="2" className={sim.transistors[2]?.isOn && sim.transistors[3]?.isOn ? "text-sky" : "text-border"} />
                  <rect x="145" y="175" width="30" height="22" rx="2" className={sim.transistors[3]?.isOn ? "fill-sky/20 stroke-sky stroke-2" : "fill-card stroke-border"} />
                  <text x="160" y="189" textAnchor="middle" className="fill-foreground text-[9px]">nB</text>
                  <line x1="160" y1="197" x2="160" y2="210" stroke="currentColor" strokeWidth="2" className={sim.transistors[3]?.isOn ? "text-sky" : "text-border"} />
                </>
              )}

              {gate === "NOR" && (
                <>
                  {/* PUN: Series pMOS A and B */}
                  <line x1="160" y1="20" x2="160" y2="38" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn ? "text-mint" : "text-border"} />
                  <rect x="145" y="38" width="30" height="22" rx="2" className={sim.transistors[0]?.isOn ? "fill-mint/20 stroke-mint stroke-2" : "fill-card stroke-border"} />
                  <circle cx="138" cy="49" r="3.5" className="fill-background stroke-foreground" />
                  <text x="160" y="52" textAnchor="middle" className="fill-foreground text-[9px]">pA</text>
                  <line x1="160" y1="60" x2="160" y2="78" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn && sim.transistors[1]?.isOn ? "text-mint" : "text-border"} />
                  <rect x="145" y="78" width="30" height="22" rx="2" className={sim.transistors[1]?.isOn ? "fill-mint/20 stroke-mint stroke-2" : "fill-card stroke-border"} />
                  <circle cx="138" cy="89" r="3.5" className="fill-background stroke-foreground" />
                  <text x="160" y="92" textAnchor="middle" className="fill-foreground text-[9px]">pB</text>
                  <line x1="160" y1="100" x2="160" y2="115" stroke="currentColor" strokeWidth="2" className={sim.transistors[0]?.isOn && sim.transistors[1]?.isOn ? "text-mint" : "text-border"} />

                  {/* PDN: Parallel nMOS A and B */}
                  <path d="M160,115 V130 H120 V145" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[2]?.isOn ? "text-sky" : "text-border"} />
                  <path d="M160,115 V130 H200 V145" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[3]?.isOn ? "text-sky" : "text-border"} />
                  <rect x="105" y="145" width="30" height="22" rx="2" className={sim.transistors[2]?.isOn ? "fill-sky/20 stroke-sky stroke-2" : "fill-card stroke-border"} />
                  <rect x="185" y="145" width="30" height="22" rx="2" className={sim.transistors[3]?.isOn ? "fill-sky/20 stroke-sky stroke-2" : "fill-card stroke-border"} />
                  <text x="120" y="159" textAnchor="middle" className="fill-foreground text-[9px]">nA</text>
                  <text x="200" y="159" textAnchor="middle" className="fill-foreground text-[9px]">nB</text>
                  <path d="M120,167 V190 H160 V210" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[2]?.isOn ? "text-sky" : "text-border"} />
                  <path d="M200,167 V190 H160 V210" fill="none" stroke="currentColor" strokeWidth="2" className={sim.transistors[3]?.isOn ? "text-sky" : "text-border"} />
                </>
              )}
            </svg>
          </div>

          {/* Truth table & state status */}
          <div className="flex flex-col gap-3">
            <div className={`p-2.5 rounded border text-[12px] leading-relaxed ${sim.outputState === "SHOOT_THROUGH" ? "bg-orange/15 border-orange text-orange" : sim.outputState === "HIGH" ? "bg-mint/15 border-mint text-mint" : "bg-sky/15 border-sky text-sky"}`}>
              {sim.statusText}
            </div>

            <div className="text-[12px] text-muted-foreground">
              <div>Pull-Up Network (pMOS): <span className={sim.pullUpConnected ? "text-mint font-bold" : "text-muted-foreground"}>{sim.pullUpConnected ? "CONDUCTING" : "OFF"}</span></div>
              <div>Pull-Down Network (nMOS): <span className={sim.pullDownConnected ? "text-sky font-bold" : "text-muted-foreground"}>{sim.pullDownConnected ? "CONDUCTING" : "OFF"}</span></div>
              <div>Output Voltage: <span className="font-bold text-foreground">{sim.outputVoltage.toFixed(1)} V</span></div>
            </div>

            <table className="font-mono text-[12px] border-collapse w-full border border-border">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-2 py-1 border-b border-border text-center">A</th>
                  {isDual && <th className="px-2 py-1 border-b border-border text-center">B</th>}
                  <th className="px-2 py-1 border-b border-border text-center text-mint font-bold">Y</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const match = curA === r.a && (!isDual || curB === r.b);
                  return (
                    <tr key={idx} className={match ? "bg-mint/20 font-bold" : ""}>
                      <td className="px-2 py-1 border-b border-border/50 text-center">{r.a}</td>
                      {isDual && <td className="px-2 py-1 border-b border-border/50 text-center">{r.b}</td>}
                      <td className="px-2 py-1 border-b border-border/50 text-center">{r.out}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- Propagation Delay Cascade -------------------------- */

/** Interactive cascaded path propagation delay analyzer demonstrating alternating edge polarities. */
export function PropagationDelayLab() {
  const [transition, setTransition] = useState<"0to1" | "1to0">("0to1");
  const [tpInv, setTpInv] = useState<{ tpHL: number; tpLH: number }>({ tpHL: 3, tpLH: 4 });
  const [tpAnd, setTpAnd] = useState<{ tpHL: number; tpLH: number }>({ tpHL: 6, tpLH: 8 });
  const [tpNor, setTpNor] = useState<{ tpHL: number; tpLH: number }>({ tpHL: 5, tpLH: 7 });

  const stages: CascadeStageConfig[] = useMemo(() => [
    { label: "Stage 1: Inverter", gate: "NOT", tpHL: tpInv.tpHL, tpLH: tpInv.tpLH },
    { label: "Stage 2: AND Gate (B=1)", gate: "AND", tpHL: tpAnd.tpHL, tpLH: tpAnd.tpLH, staticInputs: [1] },
    { label: "Stage 3: NOR Gate (B=0)", gate: "NOR", tpHL: tpNor.tpHL, tpLH: tpNor.tpLH, staticInputs: [0] },
  ], [tpInv, tpAnd, tpNor]);

  const result = useMemo(() => simulateCascadeDelay(stages, transition), [stages, transition]);

  return (
    <Panel
      title="Cascaded Path Propagation Delay Analyzer"
      legend={[
        ["bg-mint/30", "rising transition (0 \u2192 1)"],
        ["bg-sky/30", "falling transition (1 \u2192 0)"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Input Transition Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2.5 rounded border border-border/60">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground">Primary Input Edge:</span>
            <button
              type="button"
              aria-pressed={transition === "0to1"}
              onClick={() => setTransition("0to1")}
              className={`${btn} !px-2.5 ${transition === "0to1" ? "bg-mint text-background font-bold" : ""}`}
            >
              Rising (0 \u2192 1)
            </button>
            <button
              type="button"
              aria-pressed={transition === "1to0"}
              onClick={() => setTransition("1to0")}
              className={`${btn} !px-2.5 ${transition === "1to0" ? "bg-sky text-background font-bold" : ""}`}
            >
              Falling (1 \u2192 0)
            </button>
          </div>
          <div className="text-[14px]">
            Total Path Delay: <span className="font-bold text-mint text-base">{result.totalDelayNs} ns</span>
          </div>
        </div>

        {/* Stage Delay Table */}
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[12px] border-collapse border border-border">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-3 py-1.5 border-b border-border">Stage</th>
                <th className="px-3 py-1.5 border-b border-border text-center">Input Transition</th>
                <th className="px-3 py-1.5 border-b border-border text-center">Output Transition</th>
                <th className="px-3 py-1.5 border-b border-border text-center">Parameter</th>
                <th className="px-3 py-1.5 border-b border-border text-right">Stage Delay</th>
                <th className="px-3 py-1.5 border-b border-border text-right">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {result.stages.map((stg) => (
                <tr key={stg.index} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-3 py-2 font-bold text-foreground">{stg.label}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${stg.inEdge === "rising" ? "bg-mint/20 text-mint" : "bg-sky/20 text-sky"}`}>
                      {stg.inBefore} \u2192 {stg.inAfter} ({stg.inEdge})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stg.outEdge === "rising" ? "bg-mint/20 text-mint" : "bg-sky/20 text-sky"}`}>
                      {stg.outBefore} \u2192 {stg.outAfter} ({stg.outEdge})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-neon">{stg.delayParameter}</td>
                  <td className="px-3 py-2 text-right">{stg.delayNs} ns</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{stg.cumulativeNs} ns</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timeline Visualization */}
        <div className="bg-card p-3 rounded border border-border">
          <div className="eyebrow text-muted-foreground mb-2">Stage-by-Stage Timeline Waveforms</div>
          <svg viewBox="0 0 460 140" className="w-full max-w-[500px] mx-auto block select-none" role="img" aria-label="Propagation delay timeline">
            {/* Axis time markers */}
            <line x1="80" y1="125" x2="440" y2="125" stroke="currentColor" strokeWidth="1" className="text-border" />
            {[0, 5, 10, 15, 20].map((t) => {
              const x = 80 + t * 16;
              return (
                <g key={t}>
                  <line x1={x} y1="122" x2={x} y2="128" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <text x={x} y="137" textAnchor="middle" className="fill-muted-foreground text-[9px]">{t}ns</text>
                </g>
              );
            })}

            {/* Input Signal */}
            <text x="70" y="24" textAnchor="end" className="fill-muted-foreground text-[10px]">Input</text>
            <path
              d={transition === "0to1" ? "M80,26 H100 V12 H440" : "M80,12 H100 V26 H440"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-foreground"
            />

            {/* Stage traces */}
            {result.stages.map((stg, i) => {
              const yBase = 45 + i * 26;
              const tX = 80 + stg.cumulativeNs * 16;
              const prevX = i === 0 ? 100 : 80 + result.stages[i - 1].cumulativeNs * 16;
              const highY = yBase - 8;
              const lowY = yBase + 6;
              const startY = stg.outBefore === 1 ? highY : lowY;
              const endY = stg.outAfter === 1 ? highY : lowY;

              return (
                <g key={i}>
                  <text x="70" y={yBase + 2} textAnchor="end" className="fill-muted-foreground text-[10px]">Stg {i + 1}</text>
                  <path
                    d={`M80,${startY} H${tX} V${endY} H440`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={stg.outEdge === "rising" ? "text-mint" : "text-sky"}
                  />
                  {/* Transition marker */}
                  <line x1={tX} y1={highY - 2} x2={tX} y2={lowY + 2} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-neon" />
                  <text x={tX + 3} y={highY + 3} className="fill-neon text-[8px] font-bold">{stg.delayParameter}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- Boolean algebra -------------------------- */

const THEOREMS: [string, string, string, string[]][] = [
  ["Huntington Distributive", "A + BC", "(A + B)(A + C)", ["A", "B", "C"]],
  ["Absorption Law", "A + AB", "A", ["A", "B"]],
  ["Elimination Law", "A + A'B", "A + B", ["A", "B"]],
  ["Consensus Theorem", "AB + A'C + BC", "AB + A'C", ["A", "B", "C"]],
  ["De Morgan 1", "(AB)'", "A' + B'", ["A", "B"]],
  ["De Morgan 2", "(A + B)'", "A'B'", ["A", "B"]],
  ["Idempotent Law", "A + A", "A", ["A"]],
  ["Boundedness Law", "A + 1", "1", ["A"]],
  ["Involution Law", "(A')'", "A", ["A"]],
];

/** Interactive Boolean Algebra theorem lab and Principle of Duality explorer. */
export function BooleanAlgebraLab() {
  const [i, setI] = useState(0);
  const [title, left, right, vars] = THEOREMS[i];
  const rows = truthRows(vars);

  const leftDual = useMemo(() => computeBooleanDual(left), [left]);
  const rightDual = useMemo(() => computeBooleanDual(right), [right]);

  return (
    <Panel title="Boolean Algebra: Theorems and Duality Explorer">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Theorem selection tabs */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select Boolean theorem">
          {THEOREMS.map((x, k) => (
            <button
              key={x[0]}
              type="button"
              onClick={() => setI(k)}
              aria-pressed={k === i}
              className={`${btn} !px-2.5 ${k === i ? "bg-foreground text-background font-bold" : ""}`}
            >
              {x[0]}
            </button>
          ))}
        </div>

        {/* Primary and Dual identities */}
        <div className="grid sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded border border-border/60">
          <div>
            <div className="eyebrow text-mint mb-1">Primary Form</div>
            <div className="text-base font-bold text-foreground break-words">{left} = {right}</div>
            <div className="text-[11px] text-muted-foreground font-body mt-1">Verified row-by-row via perfect induction below.</div>
          </div>
          <div>
            <div className="eyebrow text-sky mb-1">Dual Form (Principle of Duality)</div>
            <div className="text-base font-bold text-sky break-words">{leftDual} = {rightDual}</div>
            <div className="text-[11px] text-muted-foreground font-body mt-1">Interchanging (+ \u2194 \u00B7) and (0 \u2194 1) while preserving literals.</div>
          </div>
        </div>

        {/* Perfect Induction Truth Table */}
        <div className="overflow-x-auto">
          <table className="font-mono text-[12px] w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/30">
                {vars.map((v) => (
                  <th key={v} className="px-3 py-1 border-b border-border text-center">{v}</th>
                ))}
                <th className="px-3 py-1 border-b border-border text-center text-mint font-bold">{left}</th>
                <th className="px-3 py-1 border-b border-border text-center text-mint font-bold">{right}</th>
                <th className="px-3 py-1 border-b border-border text-center text-muted-foreground">Match?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, env }) => {
                const a = evalExpr(left.replace(/·/g, "."), env);
                const b = evalExpr(right.replace(/·/g, "."), env);
                const match = a === b;
                return (
                  <tr key={m} className="border-b border-border/40 hover:bg-muted/10">
                    {vars.map((v) => (
                      <td key={v} className="px-3 py-0.5 text-center text-muted-foreground">{env[v]}</td>
                    ))}
                    <td className="px-3 py-0.5 text-center font-bold text-foreground">{a}</td>
                    <td className="px-3 py-0.5 text-center font-bold text-foreground">{b}</td>
                    <td className="px-3 py-0.5 text-center text-mint font-bold">{match ? "\u2713" : "\u2717"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-[12px] text-mint">
          {rows.length} of {rows.length} truth table rows agree, rigorously proving {title} by perfect induction.
        </div>
      </div>
    </Panel>
  );
}

/** Legacy alias preserving backward compatibility. */
export function LawChecker() {
  return <BooleanAlgebraLab />;
}

/* ---------------------------- SOP and POS -------------------------- */

const SOP_PRESETS: { label: string; vars: string[]; on: number[] }[] = [
  { label: "Majority Vote (3-var)", vars: ["A", "B", "C"], on: [3, 5, 6, 7] },
  { label: "XOR / Odd Parity (3-var)", vars: ["A", "B", "C"], on: [1, 2, 4, 7] },
  { label: "2-to-1 MUX (A'B + AC)", vars: ["A", "B", "C"], on: [2, 3, 5, 7] },
  { label: "Full Adder Carry (3-var)", vars: ["A", "B", "C"], on: [3, 5, 6, 7] },
  { label: "4-Var Corner Quad", vars: ["A", "B", "C", "D"], on: [0, 2, 8, 10] },
];

/** Click output cells; inspect canonical SOP (sum of minterms) and POS (product of maxterms). */
export function TruthTableBuilder({ start = [3, 4] }: { start?: number[] }) {
  const [varCount, setVarCount] = useState<2 | 3 | 4>(3);
  const vars = useMemo(() => ["A", "B", "C", "D"].slice(0, varCount), [varCount]);
  const [on, setOn] = useState<number[]>(start);

  const rows = useMemo(() => truthRows(vars), [vars]);
  const zeros = useMemo(() => Array.from({ length: 2 ** varCount }, (_, m) => m).filter((m) => !on.includes(m)), [varCount, on]);

  const sopStr = useMemo(() => sopFromMinterms(on, vars), [on, vars]);
  const posStr = useMemo(() => posFromMinterms(on, vars), [on, vars]);

  return (
    <Panel title="Truth Tables to Circuits: Canonical SOP and POS Explorer">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Variable count and presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground">Variables:</span>
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={varCount === n}
                onClick={() => { setVarCount(n); setOn([1, 2]); }}
                className={`${btn} !px-2.5 ${varCount === n ? "bg-foreground text-background font-bold" : ""}`}
              >
                {n} vars
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SOP_PRESETS.filter((p) => p.vars.length === varCount).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setOn(p.on)}
                className={`${btn} !px-2 text-[11px]`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Truth Table & Formulas Grid */}
        <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-border rounded">
            <table className="font-mono text-[12px] border-collapse w-full">
              <thead className="sticky top-0 bg-card z-10 shadow-sm">
                <tr>
                  <th className="px-2 py-1 border-b border-border text-center text-muted-foreground">Row</th>
                  {vars.map((v) => (
                    <th key={v} className="px-2 py-1 border-b border-border text-center">{v}</th>
                  ))}
                  <th className="px-2 py-1 border-b border-border text-center text-mint font-bold">F</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, env }) => {
                  const isOn = on.includes(m);
                  return (
                    <tr key={m} className={`border-b border-border/40 ${isOn ? "bg-mint/15" : ""}`}>
                      <td className="px-2 py-0.5 text-center text-muted-foreground text-[10px]">m{m} / M{m}</td>
                      {vars.map((v) => (
                        <td key={v} className="px-2 py-0.5 text-center">{env[v]}</td>
                      ))}
                      <td className="px-2 py-0.5 text-center">
                        <button
                          type="button"
                          aria-label={`Toggle row ${m}`}
                          onClick={() => setOn(isOn ? on.filter((x) => x !== m) : [...on, m])}
                          className={`w-7 h-6 border rounded-[2px] font-bold transition-colors ${isOn ? "border-mint bg-mint/30 text-mint" : "border-border text-muted-foreground"}`}
                        >
                          {isOn ? 1 : 0}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4">
            {/* Canonical SOP */}
            <div className="bg-muted/20 p-3 rounded border border-border/60">
              <div className="flex items-center justify-between mb-1">
                <span className="eyebrow text-mint">Canonical Sum of Minterms (SOP)</span>
                <span className="text-[11px] text-muted-foreground">{on.length} minterms</span>
              </div>
              <div className="font-bold text-mint break-words mb-1">
                F({vars.join(", ")}) = \u2211 m({[...on].sort((a, b) => a - b).join(", ") || "\u2205"})
              </div>
              <div className="text-[12px] text-foreground break-words font-mono">
                F = {sopStr}
              </div>
              <div className="text-[11px] text-muted-foreground font-body mt-1">
                Two-level AND-OR structure: {on.length} AND gates feeding a single {on.length}-input OR gate.
              </div>
            </div>

            {/* Canonical POS */}
            <div className="bg-muted/20 p-3 rounded border border-border/60">
              <div className="flex items-center justify-between mb-1">
                <span className="eyebrow text-sky">Canonical Product of Maxterms (POS)</span>
                <span className="text-[11px] text-muted-foreground">{zeros.length} maxterms</span>
              </div>
              <div className="font-bold text-sky break-words mb-1">
                F({vars.join(", ")}) = \u220F M({[...zeros].sort((a, b) => a - b).join(", ") || "\u2205"})
              </div>
              <div className="text-[12px] text-foreground break-words font-mono">
                F = {posStr}
              </div>
              <div className="text-[11px] text-muted-foreground font-body mt-1">
                Two-level OR-AND structure: {zeros.length} OR gates feeding a single {zeros.length}-input AND gate.
              </div>
            </div>

            {/* Inverted function */}
            <div className="text-[12px] text-muted-foreground">
              Complement function: <span className="font-bold text-foreground">F' = \u2211 m({zeros.join(", ")}) = \u220F M({[...on].sort((a, b) => a - b).join(", ")})</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------- K-map -------------------------------- */

const KMAP_GROUP_TONES = [
  "border-mint bg-mint/25 text-mint",
  "border-sky bg-sky/25 text-sky",
  "border-orange bg-orange/25 text-orange",
  "border-violet bg-violet/25 text-violet",
  "border-neon bg-neon/25 text-neon",
];

const KMAP_PRESETS = [
  { label: "Problem 1: EPIs & Quad", vars: ["A", "B", "C", "D"], on: [0, 2, 5, 7, 8, 10, 14, 15], dc: [] },
  { label: "Problem 2: Don't Cares", vars: ["w", "x", "y", "z"], on: [1, 3, 7, 11, 15], dc: [0, 2, 5] },
  { label: "Corner Quad (B'D')", vars: ["A", "B", "C", "D"], on: [0, 2, 8, 10], dc: [] },
  { label: "Static-1 Hazard Pair", vars: ["A", "B", "C"], on: [2, 3, 6, 7], dc: [] },
  { label: "Checkerboard (XOR)", vars: ["A", "B", "C"], on: [1, 2, 4, 7], dc: [] },
];

/** Upgraded Karnaugh Map Explorer supporting 2/3/4 vars, Don't-Cares, SOP vs POS, and EPI identification. */
export function KMapExplorer({
  vars: initialVars = ["A", "B", "C"],
  start = [5, 3, 1, 0, 4],
}: {
  vars?: string[];
  start?: number[];
}) {
  const [currentVars, setCurrentVars] = useState<string[]>(initialVars);
  const n = currentVars.length as 2 | 3 | 4;

  const [on, setOn] = useState<number[]>(start);
  const [dc, setDc] = useState<number[]>([]);
  const [mode, setMode] = useState<"SOP" | "POS">("SOP");

  const layout = useMemo(() => kmapLayout(n), [n]);

  const minResult = useMemo(
    () => minimizeKMap(currentVars, on, dc, mode),
    [currentVars, on, dc, mode],
  );

  const label = (bits: number, count: number) => bitString(bits, count);

  const handleCellClick = (m: number) => {
    // 3-way toggle: 0 -> 1 -> X (don't care) -> 0
    if (on.includes(m)) {
      setOn(on.filter((x) => x !== m));
      setDc([...dc, m]);
    } else if (dc.includes(m)) {
      setDc(dc.filter((x) => x !== m));
    } else {
      setOn([...on, m]);
    }
  };

  return (
    <Panel
      title="Karnaugh Map Interactive Minimization Lab"
      legend={[
        ["bg-mint/40", "prime implicant group"],
        ["border-orange", "don't-care (X)"],
        ["border-neon", "essential prime implicant (EPI)"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Controls: variables, mode, presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground">Dimension:</span>
            {([2, 3, 4] as const).map((dim) => (
              <button
                key={dim}
                type="button"
                aria-pressed={n === dim}
                onClick={() => {
                  const newVars = ["A", "B", "C", "D"].slice(0, dim);
                  setCurrentVars(newVars);
                  setOn([0, 1]);
                  setDc([]);
                }}
                className={`${btn} !px-2.5 ${n === dim ? "bg-foreground text-background font-bold" : ""}`}
              >
                {dim} vars
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground">Mode:</span>
            <button
              type="button"
              aria-pressed={mode === "SOP"}
              onClick={() => setMode("SOP")}
              className={`${btn} !px-2.5 ${mode === "SOP" ? "bg-mint text-background font-bold" : ""}`}
            >
              SOP (Group 1s)
            </button>
            <button
              type="button"
              aria-pressed={mode === "POS"}
              onClick={() => setMode("POS")}
              className={`${btn} !px-2.5 ${mode === "POS" ? "bg-sky text-background font-bold" : ""}`}
            >
              POS (Group 0s)
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/20 p-2 rounded border border-border/60">
          <span className="eyebrow text-muted-foreground text-[10px] mr-1">Presets:</span>
          {KMAP_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setCurrentVars(p.vars);
                setOn(p.on);
                setDc(p.dc);
              }}
              className={`${btn} !px-2 text-[11px]`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOn([]); setDc([]); }}
            className={`${btn} !px-2 text-[11px] text-muted-foreground ml-auto`}
          >
            Clear All
          </button>
        </div>

        {/* K-Map Grid & Solutions */}
        <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
          {/* Grid */}
          <div className="font-mono text-[12px] bg-card p-3 rounded border border-border overflow-x-auto">
            <div className="flex">
              <div className="w-14 h-7 flex items-end justify-end pr-1 text-[10px] text-muted-foreground">
                {currentVars.slice(0, layout.rowBits).join("")}\{currentVars.slice(layout.rowBits).join("")}
              </div>
              {layout.cols.map((c) => (
                <div key={c} className="w-14 h-7 flex items-center justify-center text-muted-foreground font-bold">
                  {label(c, layout.colBits)}
                </div>
              ))}
            </div>

            {layout.rows.map((rv, r) => (
              <div key={rv} className="flex">
                <div className="w-14 h-14 flex items-center justify-end pr-2 text-muted-foreground font-bold">
                  {label(rv, layout.rowBits)}
                </div>
                {layout.cols.map((_, c) => {
                  const m = layout.cell(r, c);
                  const is1 = on.includes(m);
                  const isX = dc.includes(m);
                  const owners = minResult.primes
                    .map((g, idx) => (g.cells.includes(m) ? idx : -1))
                    .filter((idx) => idx >= 0);

                  const isDistinguished = minResult.essentials.some((e) => e.distinguishedMinterms.includes(m));

                  return (
                    <button
                      key={m}
                      type="button"
                      aria-label={`Cell m${m} (${bitString(m, n)})`}
                      onClick={() => handleCellClick(m)}
                      className={`relative w-14 h-14 border text-base font-bold transition-colors select-none ${
                        is1 && owners.length
                          ? KMAP_GROUP_TONES[owners[0] % 5]
                          : isX
                          ? "border-orange/60 bg-orange/15 text-orange"
                          : "border-border hover:bg-muted/10 text-muted-foreground/40"
                      }`}
                    >
                      <span className="absolute top-1 left-1.5 text-[9px] text-muted-foreground/60 font-normal">m{m}</span>
                      {isDistinguished && (
                        <span className="absolute top-1 right-1.5 text-[10px] text-neon font-bold" title="Distinguished minterm (covered by only 1 prime implicant)">★</span>
                      )}
                      <span className={is1 ? "text-foreground font-bold text-lg" : isX ? "text-orange font-bold text-lg" : ""}>
                        {is1 ? 1 : isX ? "X" : 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground mt-2">
              Tip: Click cell to cycle <span className="text-foreground font-bold">0 \u2192 1 \u2192 X (don't care) \u2192 0</span>.
            </div>
          </div>

          {/* Solutions & Implicant Analysis */}
          <div className="flex flex-col gap-3">
            <div className="bg-muted/20 p-3 rounded border border-border/60">
              <div className="eyebrow text-mint mb-1">Minimal {mode} Expression</div>
              <div className="font-mono text-lg font-bold text-mint break-words">
                F = {minResult.minimalExpr}
              </div>
            </div>

            {/* Implicants breakdown */}
            <div>
              <div className="eyebrow text-muted-foreground mb-1">Prime Implicants Analysis</div>
              {minResult.primes.length === 0 ? (
                <div className="text-muted-foreground text-[12px]">No implicants active.</div>
              ) : (
                <ul className="space-y-1.5 text-[12px]">
                  {minResult.primes.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between p-1.5 rounded bg-muted/10 border border-border/40">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${KMAP_GROUP_TONES[idx % 5].split(" ")[1]}`} />
                        <span className="font-bold text-foreground">{p.term}</span>
                        <span className="text-muted-foreground text-[11px]">({p.cells.length} cells: {p.cells.join(",")})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.isEssential && (
                          <span className="px-1.5 py-0.5 rounded bg-neon/20 text-neon font-bold text-[10px]">
                            EPI (covers {p.distinguishedMinterms.map((m) => `m${m}`).join(",")})
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.isChosen ? "bg-mint/20 text-mint font-bold" : "bg-muted text-muted-foreground line-through"}`}>
                          {p.isChosen ? "Selected" : "Redundant"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- Timing Hazards -------------------------- */

/** Interactive Static-1 Hazard simulator for F = A'C + AB demonstrating glitch elimination with consensus. */
export function HazardLab() {
  const [hasConsensus, setHasConsensus] = useState<boolean>(false);
  const [timeStep, setTimeStep] = useState<number>(3); // default at glitch position

  const trace = useMemo(() => simulateStatic1Hazard(), []);
  const cur = trace[timeStep] ?? trace[0];

  return (
    <Panel
      title="Combinational Timing Hazard Simulator"
      legend={[
        ["bg-orange/40", "static-1 glitch (unwanted 0 spike)"],
        ["bg-mint/40", "hazard-free consensus term (BC)"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2.5 rounded border border-border/60">
          <div className="flex items-center gap-3">
            <span className="eyebrow text-muted-foreground">Transition:</span>
            <span className="font-bold text-foreground">A: 0 \u2192 1 (with B=1, C=1)</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConsensus}
              onChange={(e) => setHasConsensus(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-mint"
            />
            <span className={`font-bold ${hasConsensus ? "text-mint" : "text-muted-foreground"}`}>
              Add Redundant Consensus Term (BC)
            </span>
          </label>
        </div>

        {/* Time slider */}
        <div className="flex items-center gap-4 bg-card p-3 rounded border border-border">
          <span className="eyebrow text-muted-foreground whitespace-nowrap">Time t: {cur.t} ns</span>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={timeStep}
            onChange={(e) => setTimeStep(Number(e.target.value))}
            className="w-full accent-mint"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTimeStep(Math.max(0, timeStep - 1))}
              className={`${btn} !px-2 text-[11px]`}
            >
              \u25C0 Step
            </button>
            <button
              type="button"
              onClick={() => setTimeStep(Math.min(6, timeStep + 1))}
              className={`${btn} !px-2 text-[11px]`}
            >
              Step \u25B6
            </button>
          </div>
        </div>

        {/* Live signals and Glitch Alert */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded border bg-card text-[12px] space-y-1">
            <div className="font-bold text-foreground mb-1">Circuit State at t = {cur.t} ns:</div>
            <div>Primary Input A: <span className="font-bold text-foreground">{cur.a}</span></div>
            <div>Inverter Output A': <span className="font-bold text-foreground">{cur.aNot}</span> (delayed transition)</div>
            <div>First Product T1 = A'C: <span className={cur.termA ? "text-mint font-bold" : "text-muted-foreground"}>{cur.termA}</span></div>
            <div>Second Product T2 = AB: <span className={cur.termB ? "text-mint font-bold" : "text-muted-foreground"}>{cur.termB}</span></div>
            {hasConsensus && (
              <div>Consensus Term T3 = BC: <span className="text-mint font-bold">1 (Holds output high)</span></div>
            )}
          </div>

          <div className={`p-3 rounded border flex flex-col justify-center items-center text-center ${!hasConsensus && cur.isGlitch ? "bg-orange/15 border-orange text-orange" : "bg-mint/15 border-mint text-mint"}`}>
            <div className="text-2xl font-bold font-mono">
              Output F = {!hasConsensus ? cur.fWithoutConsensus : cur.fWithConsensus}
            </div>
            <div className="text-[12px] font-body mt-1">
              {!hasConsensus && cur.isGlitch ? (
                <span className="font-bold">DANGER: STATIC-1 HAZARD GLITCH! Output dipped to 0 for 2 ns during inverter delay overlap.</span>
              ) : hasConsensus ? (
                <span className="font-bold">HAZARD-FREE: Consensus term BC bridges the gap. Output remains solidly at logic 1 throughout transition!</span>
              ) : (
                <span>Steady state logic 1. Drag slider to t=3 ns to observe glitch.</span>
              )}
            </div>
          </div>
        </div>

        {/* Timing Waveform Display */}
        <div className="bg-card p-3 rounded border border-border">
          <div className="eyebrow text-muted-foreground mb-2">Dynamic Timing Diagram Across Transition</div>
          <svg viewBox="0 0 460 160" className="w-full max-w-[500px] mx-auto block select-none" role="img" aria-label="Hazard timing diagram">
            {/* Time markers */}
            <line x1="80" y1="145" x2="440" y2="145" stroke="currentColor" strokeWidth="1" className="text-border" />
            {[0, 1, 2, 3, 4, 5, 6].map((t) => {
              const x = 90 + t * 50;
              return (
                <g key={t}>
                  <line x1={x} y1="142" x2={x} y2="148" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <text x={x} y="156" textAnchor="middle" className="fill-muted-foreground text-[9px]">{t}ns</text>
                </g>
              );
            })}

            {/* Current time cursor */}
            <line x1={90 + timeStep * 50} y1="10" x2={90 + timeStep * 50} y2="145" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-neon" />

            {/* Signal A */}
            <text x="75" y="24" textAnchor="end" className="fill-muted-foreground text-[10px]">A</text>
            <path d="M80,26 H190 V14 H440" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />

            {/* Signal A' */}
            <text x="75" y="48" textAnchor="end" className="fill-muted-foreground text-[10px]">A'</text>
            <path d="M80,38 H240 V50 H440" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky" />

            {/* Signal T1 (A'C) */}
            <text x="75" y="72" textAnchor="end" className="fill-muted-foreground text-[10px]">A'C</text>
            <path d="M80,62 H240 V74 H440" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky" />

            {/* Signal T2 (AB) */}
            <text x="75" y="96" textAnchor="end" className="fill-muted-foreground text-[10px]">AB</text>
            <path d="M80,98 H340 V86 H440" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint" />

            {/* Output F */}
            <text x="75" y="122" textAnchor="end" className="fill-foreground text-[10px] font-bold">F</text>
            {!hasConsensus ? (
              <>
                <path d="M80,112 H240 V124 H340 V112 H440" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground" />
                {/* Glitch zone highlight */}
                <rect x="240" y="110" width="100" height="18" className="fill-orange/25 stroke-orange stroke-1 stroke-dasharray-2" />
                <text x="290" y="123" textAnchor="middle" className="fill-orange text-[9px] font-bold">GLITCH</text>
              </>
            ) : (
              <path d="M80,112 H440" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mint" />
            )}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- Universal Gates -------------------------- */

/** Interactive Universal Gates Lab simulating complete logic synthesis using only NAND or only NOR. */
export function UniversalGateLab() {
  const [family, setFamily] = useState<UniversalGateFamily>("NAND");
  const [target, setTarget] = useState<TargetOperation>("XOR");
  const [a, setA] = useState<Bit>(0);
  const [b, setB] = useState<Bit>(1);

  const circuit = UNIVERSAL_CIRCUITS[family][target] ?? UNIVERSAL_CIRCUITS.NAND.XOR;
  const sim = useMemo(() => circuit.simulate({ A: a, B: b }), [circuit, a, b]);

  const rows = useMemo(() => {
    const isSingle = target === "NOT";
    if (isSingle) {
      return [
        { a: 0 as Bit, b: 0 as Bit, out: evalGate("NOT", [0]) },
        { a: 1 as Bit, b: 0 as Bit, out: evalGate("NOT", [1]) },
      ];
    }
    return [
      { a: 0 as Bit, b: 0 as Bit, out: evalGate(target, [0, 0]) },
      { a: 0 as Bit, b: 1 as Bit, out: evalGate(target, [0, 1]) },
      { a: 1 as Bit, b: 0 as Bit, out: evalGate(target, [1, 0]) },
      { a: 1 as Bit, b: 1 as Bit, out: evalGate(target, [1, 1]) },
    ];
  }, [target]);

  return (
    <Panel
      title="Universal Gates: Everything from NAND or NOR"
      legend={[
        ["bg-mint/30", "logic 1 wire"],
        ["bg-muted-foreground/30", "logic 0 wire"],
        ["border-neon", "minimal multi-gate realization"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Family and target buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground">Universal Gate:</span>
            {(["NAND", "NOR"] as UniversalGateFamily[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === family}
                onClick={() => setFamily(f)}
                className={`${btn} !px-2.5 ${f === family ? "bg-foreground text-background font-bold" : ""}`}
              >
                {f}-Only
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow text-muted-foreground mr-1">Synthesize:</span>
            {(["NOT", "AND", "OR", "NAND", "NOR", "XOR", "XNOR"] as TargetOperation[])
              .filter((t) => t !== family)
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={t === target}
                  onClick={() => setTarget(t)}
                  className={`${btn} !px-2 ${t === target ? "bg-mint text-background font-bold" : ""}`}
                >
                  {t}
                </button>
              ))}
          </div>
        </div>

        {/* Input toggles and gate count badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2.5 rounded border border-border/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">A:</span>
              <button
                type="button"
                onClick={() => setA(a ? 0 : 1)}
                className={`w-7 h-6 border rounded-[2px] font-bold ${a ? "border-mint bg-mint/20 text-mint" : "border-border text-muted-foreground"}`}
              >
                {a}
              </button>
            </div>
            {target !== "NOT" && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">B:</span>
                <button
                  type="button"
                  onClick={() => setB(b ? 0 : 1)}
                  className={`w-7 h-6 border rounded-[2px] font-bold ${b ? "border-mint bg-mint/20 text-mint" : "border-border text-muted-foreground"}`}
                >
                  {b}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-neon/15 border border-neon/40 text-neon font-bold text-[11px]">
              {circuit.gateCount} {family} gate{circuit.gateCount > 1 ? "s" : ""}
            </span>
            <span className="text-[14px]">
              Output Y = <span className="font-bold text-mint text-base">{sim.output}</span>
            </span>
          </div>
        </div>

        {/* Formula and explanation card */}
        <div className="bg-card p-3 rounded border border-border">
          <div className="font-bold text-foreground text-sm mb-1">{circuit.title}</div>
          <div className="font-mono text-xs text-mint break-words mb-1.5">{circuit.formula}</div>
          <p className="text-[12px] text-muted-foreground font-body leading-relaxed">{circuit.notes}</p>
        </div>

        {/* Truth Table */}
        <div className="overflow-x-auto">
          <table className="font-mono text-[12px] border-collapse w-full border border-border">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-3 py-1 border-b border-border text-center">A</th>
                {target !== "NOT" && <th className="px-3 py-1 border-b border-border text-center">B</th>}
                <th className="px-3 py-1 border-b border-border text-center text-mint font-bold">Output Y</th>
                <th className="px-3 py-1 border-b border-border text-left">Internal Node States</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const match = a === r.a && (target === "NOT" || b === r.b);
                const evalRow = circuit.simulate({ A: r.a, B: r.b });
                return (
                  <tr key={idx} className={match ? "bg-mint/15 font-bold" : "hover:bg-muted/10"}>
                    <td className="px-3 py-1 border-b border-border/40 text-center">{r.a}</td>
                    {target !== "NOT" && <td className="px-3 py-1 border-b border-border/40 text-center">{r.b}</td>}
                    <td className="px-3 py-1 border-b border-border/40 text-center font-bold text-mint">{evalRow.output}</td>
                    <td className="px-3 py-1 border-b border-border/40 text-[11px] text-muted-foreground">
                      {Object.entries(evalRow.internalSignals).map(([k, v]) => `${k}=${v}`).join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------- Bubble Pushing -------------------------- */

const BUBBLE_STEPS = [
  {
    step: 0,
    title: "Step 0: Original Two-Level AND-OR Circuit",
    desc: "A classical Sum of Products circuit consists of first-level AND gates computing product terms, feeding a second-level OR gate computing the sum.",
  },
  {
    step: 1,
    title: "Step 1: Inversion Insertion (Double Bubble Cancellation)",
    desc: "By Boolean involution (A'' = A), adding two inversion bubbles to a wire preserves the signal logic completely. Place an output bubble on each AND gate and a compensating input bubble on the OR gate.",
  },
  {
    step: 2,
    title: "Step 2: De Morgan Graphic Equivalence",
    desc: "By De Morgan's theorem, (A' \u00B7 B')' = A + B. An OR gate with bubbles on all its inputs is physically and logically identical to a standard NAND gate with an output bubble!",
  },
  {
    step: 3,
    title: "Step 3: Complete All-NAND Synthesis",
    desc: "Substitute the second-level Invert-OR gate with a standard NAND gate. Both levels are now identical NAND gates, requiring zero change in wiring or gate count!",
  },
];

/** Interactive walkthrough of the Bubble-Pushing conversion technique. */
export function BubblePushingLab() {
  const [step, setStep] = useState<number>(0);
  const cur = BUBBLE_STEPS[step];

  return (
    <Panel
      title="Bubble-Pushing and De Morgan Graphic Equivalences"
      legend={[
        ["bg-mint/30", "standard NAND gate"],
        ["bg-sky/30", "De Morgan Invert-OR (OR with bubbly inputs)"],
      ]}
    >
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        {/* Step navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2.5 rounded border border-border/60">
          <div className="flex items-center gap-1.5">
            {BUBBLE_STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                aria-pressed={s.step === step}
                onClick={() => setStep(s.step)}
                className={`${btn} !px-2.5 ${s.step === step ? "bg-foreground text-background font-bold" : ""}`}
              >
                Step {s.step}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep(Math.max(0, step - 1))}
              className={`${btn} !px-2 text-[11px] disabled:opacity-40`}
            >
              \u25C0 Previous
            </button>
            <button
              type="button"
              disabled={step === BUBBLE_STEPS.length - 1}
              onClick={() => setStep(Math.min(BUBBLE_STEPS.length - 1, step + 1))}
              className={`${btn} !px-2 text-[11px] disabled:opacity-40`}
            >
              Next \u25B6
            </button>
          </div>
        </div>

        {/* Step description */}
        <div className="bg-card p-3 rounded border border-border">
          <div className="font-bold text-foreground text-sm mb-1">{cur.title}</div>
          <p className="text-[12px] text-muted-foreground font-body leading-relaxed">{cur.desc}</p>
        </div>

        {/* Graphic Equivalence Reference */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-muted/10 p-3 rounded border border-border/60 text-center">
            <div className="eyebrow text-mint mb-2">NAND Graphic Equivalence</div>
            <div className="font-mono text-sm text-foreground">
              [AND with bubble] \u2261 [OR with input bubbles]
            </div>
            <div className="text-[11px] text-muted-foreground font-body mt-1">
              (AB)' = A' + B' (De Morgan Law 1)
            </div>
          </div>
          <div className="bg-muted/10 p-3 rounded border border-border/60 text-center">
            <div className="eyebrow text-sky mb-2">NOR Graphic Equivalence</div>
            <div className="font-mono text-sm text-foreground">
              [OR with bubble] \u2261 [AND with input bubbles]
            </div>
            <div className="text-[11px] text-muted-foreground font-body mt-1">
              (A + B)' = A'B' (De Morgan Law 2)
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------------- adders ------------------------------ */

/** Ripple carry: each stage waits for the one before it. Look-ahead: all at once. */
export function CarryRace() {
  const [a, setA] = useState(15);
  const [b, setB] = useState(1);
  const [t, setT] = useState(0);
  const [run, setRun] = useState(false);
  const w = 8;
  const cols = rippleAdd(a, b, w);
  const look = lookaheadCarries(a, b, w);
  // each ripple stage is ready two gate delays after the carry reaches it
  const readyAt = (i: number) => {
    let reach = 0;
    for (let k = 0; k < i; k++) if (cols[k].carryOut) reach = (k + 1) * 2;
    return reach + 2;
  };
  const rippleDone = Math.max(...cols.map((_, i) => readyAt(i)));
  const lookDone = 4;
  const end = Math.max(rippleDone, lookDone) + 1;
  useEffect(() => {
    if (!run) return;
    if (t >= end) { setRun(false); return; }
    const id = setTimeout(() => setT((x) => x + 1), 450);
    return () => clearTimeout(id);
  }, [run, t, end]);
  const lane = (label: string, ready: (i: number) => boolean, carry: (i: number) => Bit) => (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="flex gap-1 flex-row-reverse justify-end">
        {cols.map((c, i) => (
          <div key={i} className={`w-11 h-14 rounded-[2px] border flex flex-col items-center justify-center font-mono transition-colors ${ready(i) ? "border-mint bg-mint/20" : "border-border"}`}>
            <span className="text-[9px] text-orange">{ready(i) && carry(i) ? "c→" : " "}</span>
            <span className="font-bold">{ready(i) ? c.sum : "?"}</span>
            <span className="text-[9px] text-muted-foreground">bit {i}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Panel title="Ripple carry vs look-ahead">
      <div className="flex gap-5 flex-wrap font-mono text-[12px] text-muted-foreground items-center">
        <label className="flex items-center gap-2">A<input type="number" min={0} max={255} value={a} onChange={(e) => { setA(Math.min(255, Math.max(0, Number(e.target.value) || 0))); setT(0); }} aria-label="A" className={`${inputCls} w-20`} /></label>
        <label className="flex items-center gap-2">B<input type="number" min={0} max={255} value={b} onChange={(e) => { setB(Math.min(255, Math.max(0, Number(e.target.value) || 0))); setT(0); }} aria-label="B" className={`${inputCls} w-20`} /></label>
        <button type="button" className={btn} onClick={() => { setT(0); setRun(true); }}>▶ Race</button>
        <span>time <span className="text-foreground">{t}</span> gate delays</span>
      </div>
      {lane(`Ripple: valid after ${rippleDone} delays`, (i) => t >= readyAt(i), (i) => cols[i].carryOut)}
      {lane(`Look-ahead: valid after ${lookDone} delays, whatever the numbers`, () => t >= lookDone, (i) => look.c[i + 1])}
      <div className="font-mono text-[13px]">{a} + {b} = {a + b}. Try 255 + 1 for the worst case, and 1 + 2 for no carries at all.</div>
    </Panel>
  );
}

/** Press a key. A priority encoder reports the highest key held. */
export function PriorityEncoder() {
  const [held, setHeld] = useState<number[]>([3]);
  const top = held.length ? Math.max(...held) : -1;
  return (
    <Panel title="Keypad to BCD: a priority encoder">
      <div className="grid grid-cols-5 gap-1.5 w-fit">
        {Array.from({ length: 10 }, (_, d) => (
          <button key={d} type="button" aria-pressed={held.includes(d)} onClick={() => setHeld(held.includes(d) ? held.filter((x) => x !== d) : [...held, d])} className={`w-11 h-11 border rounded-sm font-mono font-bold ${d === top ? "border-mint bg-mint/25" : held.includes(d) ? "border-orange bg-orange/15" : "border-border"}`}>{d}</button>
        ))}
      </div>
      <div className="font-mono text-[14px]">{top >= 0 ? <>Output <Bits value={bitString(top, 4)} /> = {top}</> : <span className="text-muted-foreground">No key pressed.</span>}</div>
      {held.length > 1 && <div className="text-sm text-orange">Several keys are down. The highest wins and the others are ignored.</div>}
    </Panel>
  );
}

/* ------------------------------- timing -------------------------------- */

export function TimingDiagram({ signals, marks = [], cellW = 34 }: { signals: { name: string; bits: Bit[]; tone?: string }[]; marks?: number[]; cellW?: number }) {
  const n = signals[0]?.bits.length ?? 0;
  const rowH = 38;
  const left = 44;
  return (
    <svg viewBox={`0 0 ${left + n * cellW + 4} ${signals.length * rowH + 4}`} className="w-full max-w-[640px] block" role="img" aria-label="Timing diagram">
      {marks.map((m) => <path key={m} d={`M${left + m * cellW},0V${signals.length * rowH}`} strokeDasharray="3 3" className="stroke-neon" />)}
      {signals.map((s, r) => {
        const y = (b: Bit) => r * rowH + (b ? 6 : rowH - 8);
        const d = s.bits.map((b, i) => `${i ? "V" : "M" + left + "," }${i ? y(b) : y(b)}H${left + (i + 1) * cellW}`).join("");
        return (
          <g key={s.name}>
            <text x={left - 8} y={r * rowH + rowH / 2 + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[12px]">{s.name}</text>
            <path d={d} fill="none" strokeWidth={2.2} className={s.tone ?? "stroke-foreground"} />
          </g>
        );
      })}
    </svg>
  );
}

const DEFAULT_CLK: Bit[] = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0];

/** Same clock, same data: draw on D and compare what a latch and a flip-flop do. */
export function EdgeLab() {
  const [d, setD] = useState<Bit[]>([0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1]);
  const { latch, flop } = latchVersusFlipFlop(DEFAULT_CLK, d);
  const edges = DEFAULT_CLK.map((c, i) => (c && !DEFAULT_CLK[i - 1] ? i : -1)).filter((i) => i >= 0);
  return (
    <Panel title="Level-triggered vs edge-triggered" legend={[["bg-neon", "rising edge"], ["bg-sky", "latch Q"], ["bg-mint", "flip-flop Q"]]}>
      <TimingDiagram marks={edges} signals={[
        { name: "CLK", bits: DEFAULT_CLK },
        { name: "D", bits: d, tone: "stroke-orange" },
        { name: "latch", bits: latch, tone: "stroke-sky" },
        { name: "flop", bits: flop, tone: "stroke-mint" },
      ]} />
      <div>
        <div className="font-mono text-[11px] text-muted-foreground mb-1">Click to change D at each moment:</div>
        <div className="flex gap-px flex-wrap">{d.map((b, i) => <button key={i} type="button" aria-label={`D at time ${i}`} aria-pressed={!!b} onClick={() => setD(d.map((x, k) => (k === i ? ((x ? 0 : 1) as Bit) : x)))} className={`w-7 h-7 font-mono text-[12px] border rounded-[2px] ${b ? "border-orange bg-orange/25" : "border-border"}`}>{b}</button>)}</div>
      </div>
      <p className="text-sm leading-relaxed">The latch follows every wiggle in D while the clock is high. The flip-flop takes a single photo of D at each rising edge and ignores everything in between.</p>
    </Panel>
  );
}

/** JK flip-flop: choose J and K, then press the clock. */
export function JkLab() {
  const [j, setJ] = useState<Bit>(1);
  const [k, setK] = useState<Bit>(1);
  const [hist, setHist] = useState<Bit[]>([0]);
  const q = hist[hist.length - 1];
  const name = j && k ? "toggle" : j ? "set" : k ? "reset" : "hold";
  const row = (jj: Bit, kk: Bit, label: string) => <tr key={label} className={jj === j && kk === k ? "bg-mint/20" : ""}><td className="px-3 text-center">{jj}</td><td className="px-3 text-center">{kk}</td><td className="px-3">{label}</td></tr>;
  return (
    <Panel title="JK flip-flop">
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button type="button" className={`${btn} ${j ? "border-mint bg-mint/20" : ""}`} aria-pressed={!!j} onClick={() => setJ(j ? 0 : 1)}>J = {j}</button>
            <button type="button" className={`${btn} ${k ? "border-mint bg-mint/20" : ""}`} aria-pressed={!!k} onClick={() => setK(k ? 0 : 1)}>K = {k}</button>
          </div>
          <button type="button" className={`${btn} border-neon`} onClick={() => setHist([...hist.slice(-23), jkNext(q, { j, k })])}>⇧ Clock edge</button>
          <button type="button" className={btn} onClick={() => setHist([0])}>⟲ Reset</button>
          <table className="font-mono text-[13px]"><thead><tr><th className="px-3">J</th><th className="px-3">K</th><th className="px-3 text-left">at the edge</th></tr></thead><tbody>{row(0, 0, "hold")}{row(0, 1, "reset to 0")}{row(1, 0, "set to 1")}{row(1, 1, "toggle")}</tbody></table>
        </div>
        <div className="flex flex-col gap-3">
          <div className="font-mono">Q = <span className={`text-2xl font-bold ${q ? "text-mint" : ""}`}>{q}</span> <span className="text-muted-foreground text-[12px]">next edge will {name}</span></div>
          <div className="flex gap-px flex-wrap items-end h-10">{hist.map((b, i) => <span key={i} className={`w-3 ${b ? "h-9 bg-mint" : "h-1.5 bg-border"}`} />)}</div>
          <div className="text-sm text-muted-foreground">Q's history, one bar per clock edge. J=K=1 is the one input an SR latch forbids; here it means "flip".</div>
        </div>
      </div>
    </Panel>
  );
}

/** Master-slave: two latches take turns, so there's never a clear path from D to Q. */
export function MasterSlave() {
  const [d, setD] = useState<Bit>(1);
  const [clk, setClk] = useState<Bit>(0);
  const [m, setM] = useState<Bit>(0);
  const [q, setQ] = useState<Bit>(0);
  const master = clk === 0 ? d : m;
  const box = (name: string, open: boolean, val: Bit) => (
    <div className={`w-28 h-24 rounded-sm border-2 flex flex-col items-center justify-center gap-1 transition-colors ${open ? "border-mint bg-mint/10" : "border-border"}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{name}</span>
      <span className="text-2xl font-mono font-bold">{val}</span>
      <span className={`font-mono text-[10px] ${open ? "text-mint" : "text-muted-foreground"}`}>{open ? "door open" : "door shut"}</span>
    </div>
  );
  const flip = () => {
    if (clk === 0) { setM(d); setQ(d); setClk(1); } // rising edge: master freezes, slave copies
    else { setClk(0); }
  };
  return (
    <Panel title="Two latches, one airlock">
      <div className="flex items-center gap-2 flex-wrap font-mono">
        <button type="button" onClick={() => setD(d ? 0 : 1)} aria-pressed={!!d} className={`${btn} ${d ? "border-orange bg-orange/20" : ""}`}>D = {d}</button>
        <span className="text-muted-foreground">→</span>
        {box("master", clk === 0, master)}
        <span className="text-muted-foreground">→</span>
        {box("slave", clk === 1, q)}
        <span className="text-muted-foreground">→ Q = <span className="text-mint font-bold">{q}</span></span>
      </div>
      <div className="flex gap-3 items-center flex-wrap">
        <button type="button" className={`${btn} border-neon`} onClick={flip}>{clk === 0 ? "⇧ Clock rises" : "⇩ Clock falls"}</button>
        <span className="font-mono text-[12px] text-muted-foreground">CLK = {clk}</span>
      </div>
      <p className="text-sm leading-relaxed">{clk === 0 ? "Clock low: the master listens to D while the slave holds Q steady. Change D now and only the master moves." : "Clock high: the master froze the value it had at the instant of the edge and the slave copied it to Q. Change D now and nothing moves."}</p>
    </Panel>
  );
}

/* -------------------------- registers & counters ----------------------- */

/** Parallel-load register: write-enable decides whether the clock edge copies D in. */
export function RegisterLab() {
  const [input, setInput] = useState(0b1011);
  const [stored, setStored] = useState(0b0101);
  const [load, setLoad] = useState(true);
  const [flash, setFlash] = useState(false);
  const clock = () => {
    if (load) setStored(input);
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };
  const ibits = bitsOf(input, 4), sbits = bitsOf(stored, 4);
  return (
    <Panel title="A 4-bit register: four flip-flops sharing one clock">
      <div className="flex flex-col gap-2 font-mono items-start">
        <div className="flex gap-2 items-center"><span className="w-12 text-[11px] text-muted-foreground">D</span>{ibits.map((b, i) => <button key={i} type="button" aria-label={`Data bit ${3 - i}`} aria-pressed={!!b} onClick={() => setInput(input ^ (1 << (3 - i)))} className={`w-12 h-9 border rounded-[2px] font-bold ${b ? "border-orange bg-orange/20" : "border-border"}`}>{b}</button>)}</div>
        <div className="flex gap-2 items-center"><span className="w-12" />{ibits.map((_, i) => <span key={i} className={`w-12 text-center transition-colors ${flash && load ? "text-neon" : "text-border"}`}>↓</span>)}</div>
        <div className="flex gap-2 items-center"><span className="w-12 text-[11px] text-muted-foreground">Q</span>{sbits.map((b, i) => <span key={i} className={`w-12 h-12 border-2 rounded-[2px] flex items-center justify-center text-lg font-bold transition-colors ${flash && load ? "border-neon bg-neon/20" : b ? "border-mint bg-mint/20" : "border-border"}`}>{b}</span>)}<span className="text-[12px] text-muted-foreground ml-2">= {stored}</span></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" className={`${btn} ${load ? "border-mint bg-mint/20" : ""}`} aria-pressed={load} onClick={() => setLoad(!load)}>Load = {load ? 1 : 0}</button>
        <button type="button" className={`${btn} border-neon`} onClick={clock}>⇧ Clock edge</button>
      </div>
      <p className="text-sm">{load ? "With Load on, the next edge copies D into all four flip-flops at once." : "With Load off, each flip-flop feeds its own Q back to its D, so the clock edge changes nothing."}</p>
    </Panel>
  );
}

/** Bits march through a chain of flip-flops on each clock edge. */
export function ShiftRegisterLab() {
  const [incoming, setIncoming] = useState<Bit>(1);
  const [state, setState] = useState<Bit[]>([0, 0, 0, 0]);
  const [count, setCount] = useState(0);
  const value = bitsToNumber([...state].reverse());
  return (
    <Panel title="Shift register">
      <div className="flex items-center gap-2 font-mono flex-wrap">
        <button type="button" className={`${btn} ${incoming ? "border-orange bg-orange/20" : ""}`} aria-pressed={!!incoming} onClick={() => setIncoming(incoming ? 0 : 1)}>in = {incoming}</button>
        <span className="text-muted-foreground">→</span>
        {state.map((b, i) => <span key={`${i}-${count}`} className={`w-12 h-12 border-2 rounded-[2px] flex items-center justify-center text-lg font-bold animate-in fade-in slide-in-from-left-3 duration-300 motion-reduce:animate-none ${b ? "border-mint bg-mint/20" : "border-border"}`}>{b}</span>)}
        <span className="text-muted-foreground">→ out</span>
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-neon`} onClick={() => { setState(shiftFrames(4, [incoming], state)[1]); setCount(count + 1); }}>⇧ Clock edge</button>
        <button type="button" className={btn} onClick={() => { setState([0, 0, 0, 0]); setCount(0); }}>⟲ Clear</button>
      </div>
      <p className="text-sm">{count} edge{count === 1 ? "" : "s"} so far. It takes 4 edges to pull a 4-bit word in from a single wire: serial in, parallel out, which is how a serial port turns a stream of bits back into a byte. Read as a number with the first cell lowest, the register holds {value}.</p>
    </Panel>
  );
}

/** A 4-bit counter, with the waveform each stage produces. */
export function CounterLab() {
  const width = 4;
  const [bits, setBits] = useState<Bit[]>([0, 0, 0, 0]);
  const [hist, setHist] = useState<Bit[][]>([[0, 0, 0, 0]]);
  const [toggled, setToggled] = useState<number[]>([]);
  const [auto, setAuto] = useState(false);
  const tick = () => {
    setBits((b) => {
      const { next, toggled: t } = counterStep(b);
      setToggled(t);
      setHist((h) => [...h.slice(-16), next]);
      return next;
    });
  };
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [auto]);
  return (
    <Panel title="Binary counter">
      <div className="flex items-center gap-2 font-mono flex-wrap">
        {bits.map((b, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground">{2 ** (width - 1 - i)}</span>
            <span className={`w-12 h-12 border-2 rounded-[2px] flex items-center justify-center text-lg font-bold transition-colors ${toggled.includes(i) ? "border-neon" : "border-border"} ${b ? "bg-mint/25" : ""}`}>{b}</span>
          </div>
        ))}
        <span className="text-2xl font-bold ml-3">= {bitsToNumber(bits)}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" className={`${btn} border-neon`} onClick={tick}>⇧ Clock edge</button>
        <button type="button" className={btn} onClick={() => setAuto(!auto)}>{auto ? "❚❚ Pause" : "▶ Run"}</button>
        <button type="button" className={btn} onClick={() => { setAuto(false); setBits([0, 0, 0, 0]); setHist([[0, 0, 0, 0]]); setToggled([]); }}>⟲ Reset</button>
      </div>
      {hist.length > 1 && (
        <TimingDiagram cellW={26} signals={[3, 2, 1, 0].map((i) => ({ name: `2^${3 - i}`, bits: hist.map((h) => h[i]), tone: "stroke-mint" }))} />
      )}
      <p className="text-sm">Neon cells toggled on the last edge. The lowest bit flips every edge; each higher bit flips at half the rate of the one below it. Used this way, each stage divides the clock frequency by 2.</p>
    </Panel>
  );
}

/** A tiny RAM: the address decoder picks a row, and read or write acts on that row only. */
export function MemoryUnit() {
  const [words, setWords] = useState<number[]>([0b1010, 0b0111, 0b0000, 0b1100, 0b0011, 0b1001, 0b0101, 0b1110]);
  const [addr, setAddr] = useState(3);
  const [input, setInput] = useState(0b0110);
  const [flash, setFlash] = useState<string | null>(null);
  const bits = bitsOf(addr, 3);
  const pulse = (s: string) => { setFlash(s); setTimeout(() => setFlash(null), 500); };
  return (
    <Panel title="An 8 × 4 memory built from what you already know" legend={[["bg-neon", "decoder's chosen row"], ["bg-mint", "stored 1"]]}>
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[11px] text-muted-foreground">address lines</div>
          <div className="flex gap-1">{bits.map((b, i) => <button key={i} type="button" aria-label={`Address bit ${2 - i}`} aria-pressed={!!b} onClick={() => setAddr(addr ^ (1 << (2 - i)))} className={`w-9 h-9 border rounded-[2px] font-mono font-bold ${b ? "border-sky bg-sky/25" : "border-border"}`}>{b}</button>)}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-2">data in</div>
          <div className="flex gap-1">{bitsOf(input, 4).map((b, i) => <button key={i} type="button" aria-label={`Data bit ${3 - i}`} aria-pressed={!!b} onClick={() => setInput(input ^ (1 << (3 - i)))} className={`w-9 h-9 border rounded-[2px] font-mono font-bold ${b ? "border-orange bg-orange/25" : "border-border"}`}>{b}</button>)}</div>
          <div className="flex gap-1.5 mt-2">
            <button type="button" className={btn} onClick={() => { setWords(words.map((w, i) => (i === addr ? input : w))); pulse("write"); }}>Write</button>
            <button type="button" className={btn} onClick={() => pulse("read")}>Read</button>
          </div>
          <div className="font-mono text-[12px] h-5">{flash === "read" && <>data out <span className="text-mint font-bold">{bitString(words[addr], 4)}</span></>}{flash === "write" && <span className="text-orange">stored in word {addr}</span>}</div>
        </div>
        <div className="flex flex-col gap-1 font-mono text-[12px]">
          {words.map((w, i) => (
            <div key={i} className={`flex items-center gap-2 px-1.5 py-0.5 rounded-[2px] transition-colors ${i === addr ? "bg-neon/20 ring-1 ring-neon" : ""}`}>
              <span className="w-10 text-muted-foreground">{bitString(i, 3)}</span>
              <span className={`w-2 h-2 rounded-full ${i === addr ? "bg-neon" : "bg-border"}`} />
              {bitsOf(w, 4).map((b, j) => <span key={j} className={`w-6 h-6 flex items-center justify-center border rounded-[2px] ${b ? "border-mint bg-mint/20" : "border-border text-muted-foreground"}`}>{b}</span>)}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
