import { useState } from "react";
import { btn, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import {
  shiftRegisterStep,
  simulateRippleStep,
  simulateSynchronousStep,
} from "@/lib/datapath";

/* --------------------------- Four Eras Timeline --------------------------- */

interface EraInfo {
  name: string;
  years: string;
  paradigm: string;
  hardware: string;
  keyMachines: string;
  significance: string;
}

const ERAS: EraInfo[] = [
  {
    name: "Batch Era",
    years: "1960 – 1968",
    paradigm: "Centralized batch processing. Programmers submitted decks of punched cards; operators queued and executed runs sequentially.",
    hardware: "Magnetic tape drives, early magnetic core memory, discrete transistors and early integrated circuits.",
    keyMachines: "IBM System/360 mainframe family (established the 8-bit byte and standard computer architecture).",
    significance: "Standardized computer architecture across product families, enabling backward software compatibility.",
  },
  {
    name: "Time-Sharing Era",
    years: "1961 – 1976",
    paradigm: "Interactive multi-user access. Multiple users typed at video/teletype terminals simultaneously, sharing one computer's CPU time.",
    hardware: "Solid-state semiconductor RAM chips, medium-scale integrated circuits (MSI), magnetic disk storage.",
    keyMachines: "DEC PDP-10, MULTICS, early UNIX systems.",
    significance: "Introduced virtual memory, hardware protection rings, and interactive computing.",
  },
  {
    name: "Desktop Era",
    years: "1977 – 1989",
    paradigm: "Decentralized personal computing. An entire computer dedicated to a single person on a desk.",
    hardware: "Single-chip microprocessors (VLSI), dynamic RAM (DRAM), floppy disks, personal color displays.",
    keyMachines: "Altair 8800, Apple II, Commodore PET, IBM PC (Intel 8088), Apple Macintosh.",
    significance: "Brought computing directly to office workers and households; microprocessor volume crashed chip costs.",
  },
  {
    name: "Network Era",
    years: "1990 – Present",
    paradigm: "Distributed computing and client-server systems. Compute power lives in clusters, clouds, and connected devices.",
    hardware: "Gigabit Ethernet, optical fibers, multi-core superscalar processors, warehouse-scale datacenters, GPUs.",
    keyMachines: "Modern cloud servers, high-performance clusters, multicore laptops and smartphones.",
    significance: "Network bandwidth outstripped processor clock scaling; parallel and distributed systems became dominant.",
  },
];

export function ErasVisualizer() {
  const [activeEra, setActiveEra] = useState<number>(0);
  const era = ERAS[activeEra];

  return (
    <Panel title="Four Decades of Computing Evolution">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="flex flex-wrap gap-1.5">
          {ERAS.map((item, idx) => (
            <button
              key={item.name}
              onClick={() => setActiveEra(idx)}
              className={`${btn} ${activeEra === idx ? "bg-violet text-background font-bold border-violet" : "border-border"}`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="border border-border/80 rounded-[2px] p-4 bg-muted/20 flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between border-b border-border/40 pb-2">
            <span className="text-base font-bold text-violet">{era.name}</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded border border-border">
              {era.years}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-0.5 font-sans font-semibold">
              Operating Paradigm
            </span>
            <p className="text-foreground/90 font-sans leading-relaxed">{era.paradigm}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-0.5 font-sans font-semibold">
              Hardware Technology
            </span>
            <p className="text-foreground/90 font-sans leading-relaxed">{era.hardware}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="border border-border/50 rounded-[2px] p-2.5 bg-background">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Representative Machines
              </span>
              <p className="text-xs text-foreground/80 font-sans">{era.keyMachines}</p>
            </div>
            <div className="border border-border/50 rounded-[2px] p-2.5 bg-background">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Architectural Milestone
              </span>
              <p className="text-xs text-foreground/80 font-sans">{era.significance}</p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------ Von Neumann Machine Model ------------------------ */

export function VonNeumannVisualizer() {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      title: "Idle State: Program and Data in Storage",
      desc: "Instructions and initial data are held in Working Storage (RAM), loaded from Permanent Storage (Disk). The CPU is ready.",
      active: ["RAM"],
      busText: "System bus is quiet.",
    },
    {
      title: "1. Instruction Fetch across System Bus",
      desc: "The Control Unit sends the address from the Program Counter onto the Address Bus and asserts Read. The instruction word returns over the Data Bus into the Instruction Register.",
      active: ["RAM", "CU", "BUS"],
      busText: "Data Bus: [Opcode + Operands] traveling RAM → CPU",
    },
    {
      title: "2. Control Unit Decodes & Dispatches Operands",
      desc: "The Control Unit interprets the opcode bits and pulses control wires. If an operand is in memory, it reads it; if in registers, it gates the register outputs to the ALU.",
      active: ["CU", "REGS"],
      busText: "Internal CPU Bus: Register R1 loaded onto ALU Input A",
    },
    {
      title: "3. ALU Executes Arithmetic or Logic",
      desc: "The Arithmetic and Logic Unit performs the operation (add, subtract, AND, shift) on its input operands. Flags (zero, negative, carry) are set in the status register.",
      active: ["ALU", "REGS"],
      busText: "ALU Output: Result routed to Accumulator / Register R3",
    },
    {
      title: "4. Result Write-Back or Output Device Transfer",
      desc: "The computed result is written back to RAM over the Data Bus, or transferred to the Output Device (display, network port) via the I/O interface.",
      active: ["ALU", "RAM", "OUTPUT", "BUS"],
      busText: "Data Bus: Result traveling CPU → RAM / Output Interface",
    },
  ];

  const current = steps[step];

  return (
    <Panel title="The Von Neumann Five-Unit Architecture">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Input Unit */}
          <div
            className={`border rounded-[2px] p-3 text-center transition-colors ${
              current.active.includes("INPUT")
                ? "border-orange bg-orange/20 font-bold"
                : "border-border bg-card"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Unit 1</div>
            <div className="font-sans font-semibold">Input Device</div>
            <div className="text-[11px] text-muted-foreground font-sans mt-1">Keyboard, Sensor, Network In</div>
          </div>

          {/* Central Processing Unit (ALU + CU + Registers) */}
          <div className="border-2 border-violet rounded-[2px] p-3 bg-violet/5 flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-wider text-violet font-bold text-center">
              Unit 2: Central Processing Unit (CPU)
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div
                className={`border rounded-[2px] p-1.5 transition-colors ${
                  current.active.includes("CU")
                    ? "border-neon bg-neon/20 font-bold"
                    : "border-border bg-background"
                }`}
              >
                <div className="text-[9px] text-muted-foreground">Control</div>
                <div className="text-[11px]">CU</div>
              </div>
              <div
                className={`border rounded-[2px] p-1.5 transition-colors ${
                  current.active.includes("ALU")
                    ? "border-sky bg-sky/20 font-bold"
                    : "border-border bg-background"
                }`}
              >
                <div className="text-[9px] text-muted-foreground">Logic</div>
                <div className="text-[11px]">ALU</div>
              </div>
              <div
                className={`border rounded-[2px] p-1.5 transition-colors ${
                  current.active.includes("REGS")
                    ? "border-mint bg-mint/20 font-bold"
                    : "border-border bg-background"
                }`}
              >
                <div className="text-[9px] text-muted-foreground">Storage</div>
                <div className="text-[11px]">Regs / AC</div>
              </div>
            </div>
          </div>

          {/* Output Unit */}
          <div
            className={`border rounded-[2px] p-3 text-center transition-colors ${
              current.active.includes("OUTPUT")
                ? "border-orange bg-orange/20 font-bold"
                : "border-border bg-card"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Unit 3</div>
            <div className="font-sans font-semibold">Output Device</div>
            <div className="text-[11px] text-muted-foreground font-sans mt-1">Screen, Printer, Network Out</div>
          </div>
        </div>

        {/* System Bus Interconnection */}
        <div
          className={`border rounded-[2px] px-3 py-2 text-center text-xs transition-colors ${
            current.active.includes("BUS")
              ? "border-violet bg-violet/20 font-bold text-violet-foreground"
              : "border-dashed border-border bg-muted/10 text-muted-foreground"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest block mb-0.5">
            System Interconnection (Address, Data, and Control Buses)
          </span>
          {current.busText}
        </div>

        {/* Memory & Permanent Storage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`border rounded-[2px] p-3 text-center transition-colors ${
              current.active.includes("RAM")
                ? "border-mint bg-mint/20 font-bold"
                : "border-border bg-card"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Unit 4</div>
            <div className="font-sans font-semibold">Working Storage (RAM)</div>
            <div className="text-[11px] text-muted-foreground font-sans mt-1">Holds active program code & runtime variables</div>
          </div>

          <div
            className={`border rounded-[2px] p-3 text-center transition-colors ${
              current.active.includes("DISK")
                ? "border-sky bg-sky/20 font-bold"
                : "border-border bg-card"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Unit 5</div>
            <div className="font-sans font-semibold">Permanent Storage</div>
            <div className="text-[11px] text-muted-foreground font-sans mt-1">Hard disk, SSD, non-volatile long-term storage</div>
          </div>
        </div>

        {/* Controls and Description */}
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-sm text-foreground">{current.title}</span>
            <div className="flex gap-1.5">
              <button
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className={`${btn} disabled:opacity-40`}
              >
                Prev
              </button>
              <button
                disabled={step === steps.length - 1}
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className={`${btn} bg-violet text-background font-bold disabled:opacity-40`}
              >
                Next Step
              </button>
              <button onClick={() => setStep(0)} className={btn}>
                Reset
              </button>
            </div>
          </div>
          <p className="text-xs font-sans text-muted-foreground leading-relaxed">{current.desc}</p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------- Circuit Schematic Reading Guide ------------------- */

const SYMBOLS = [
  {
    name: "Wire Junction vs Crossing",
    symbol: "• vs ┼",
    meaning: "A solid dot (•) indicates two intersecting lines are electrically connected. Two lines crossing with no dot (┼) are passing over each other without any electrical contact.",
    rule: "No dot means no connection. Never assume crossing wires touch unless marked with a junction node.",
  },
  {
    name: "Bus Slash (/n)",
    symbol: "— /8 —",
    meaning: "A diagonal slash with a number represents a bundle of parallel wires drawn as a single line. For example, /8 represents an 8-bit data bus; /16 represents 16 address lines.",
    rule: "Simplifies schematics from drawing dozens of parallel lines. Individual lines are labelled D0..D7.",
  },
  {
    name: "Inversion Bubble (Active-Low)",
    symbol: "○ at input/output",
    meaning: "A small circle at an input or output pin denotes logical NOT. An input with a bubble is 'active-low': it triggers when the incoming voltage is 0 (Ground).",
    rule: "A Clear line with a bubble (CLR) resets the register when forced to 0, not when brought to 1.",
  },
  {
    name: "Dynamic Clock Trigger (>)",
    symbol: "▷ triangle at CLK",
    meaning: "A triangle symbol on a clock input pin denotes edge-triggering. The circuit captures data only at the exact instant the clock transitions (e.g. 0 → 1 rising edge).",
    rule: "A pin without the triangle is a level-sensitive latch: it stays transparent as long as clock is held at 1.",
  },
  {
    name: "Common Control Bus",
    symbol: "Shared wire to all FFs",
    meaning: "When a clock, load, or clear wire branches out to all flip-flops in a register simultaneously, it guarantees all bits update at the exact same clock tick.",
    rule: "Common clock prevents race conditions between flip-flops in parallel registers.",
  },
];

export function SchematicReaderGuide() {
  const [selected, setSelected] = useState<number>(0);
  const sym = SYMBOLS[selected];

  return (
    <Panel title="How to Read Hardware Circuit Schematics">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="flex flex-wrap gap-1.5">
          {SYMBOLS.map((s, idx) => (
            <button
              key={s.name}
              onClick={() => setSelected(idx)}
              className={`${btn} ${selected === idx ? "bg-sky text-background font-bold border-sky" : "border-border"}`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="border border-border/80 rounded-[2px] p-4 bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="font-sans font-bold text-sm text-sky">{sym.name}</span>
            <span className="font-mono text-sm px-2.5 py-1 rounded bg-background border border-border font-bold">
              {sym.symbol}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
              Circuit Meaning
            </span>
            <p className="font-sans text-xs text-foreground/90 leading-relaxed">{sym.meaning}</p>
          </div>
          <div className="border-l-2 border-sky pl-3 py-1 bg-sky/5">
            <span className="text-[10px] uppercase tracking-wider text-sky block mb-0.5 font-bold">
              Engineering Rule
            </span>
            <p className="font-sans text-xs text-foreground/80 leading-relaxed">{sym.rule}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------- Shift Register Trace Lab ---------------------- */

export function ShiftRegisterTraceLab() {
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0]);
  const [serialInBit, setSerialInBit] = useState<number>(1);
  const [mode, setMode] = useState<"SISO" | "SIPO">("SISO");
  const [history, setHistory] = useState<{ clk: number; sin: number; state: number[]; sout: number }[]>([]);
  const [clkCount, setClkCount] = useState<number>(0);

  const handleClock = () => {
    const res = shiftRegisterStep(bits, serialInBit, "right");
    const newClk = clkCount + 1;
    setBits(res.bits);
    setClkCount(newClk);
    setHistory((prev) => [
      ...prev.slice(-7),
      { clk: newClk, sin: serialInBit, state: [...res.bits], sout: res.serialOut },
    ]);
  };

  const handleReset = () => {
    setBits([0, 0, 0, 0]);
    setClkCount(0);
    setHistory([]);
  };

  return (
    <Panel title="4-Bit Shift Register (SISO / SIPO) Interactive Lab">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">Topology:</span>
            <Toggle
              value={mode}
              options={[
                ["SISO", "SISO (Serial-Out)"],
                ["SIPO", "SIPO (Parallel-Out)"],
              ]}
              onChange={(v) => setMode(v as "SISO" | "SIPO")}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">Serial Input Bit:</span>
            <button
              onClick={() => setSerialInBit((b) => (b === 1 ? 0 : 1))}
              className={`${btn} ${serialInBit === 1 ? "bg-neon text-background font-bold" : "bg-muted"}`}
            >
              IN = {serialInBit}
            </button>
            <button onClick={handleClock} className={`${btn} bg-violet text-background font-bold`}>
              Pulse Clock ▷
            </button>
            <button onClick={handleReset} className={btn}>
              Clear
            </button>
          </div>
        </div>

        {/* Register Stage Diagram */}
        <div className="border border-border rounded-[2px] p-4 bg-muted/10 flex flex-col gap-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest text-center">
            Flip-Flop Stages (Shifting Right: MSB → LSB)
          </div>
          <div className="flex items-center justify-center gap-2">
            {/* Serial In wire */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neon font-bold">Serial In</span>
              <span className="border border-neon bg-neon/15 px-2 py-1 rounded text-center font-bold">
                {serialInBit}
              </span>
              <span className="text-xs text-muted-foreground mt-1">→</span>
            </div>

            {/* 4 Flip-Flop Boxes */}
            {bits.map((bitVal, idx) => {
              const stageName = `FF${3 - idx} (Q${3 - idx})`;
              return (
                <div key={idx} className="flex items-center">
                  <div className="border-2 border-violet rounded-[2px] p-2.5 bg-background min-w-[4.2rem] text-center shadow-sm">
                    <div className="text-[9px] text-muted-foreground mb-1">{stageName}</div>
                    <div className="text-xl font-bold text-violet">{bitVal}</div>
                    {mode === "SIPO" && (
                      <div className="mt-1 pt-1 border-t border-dashed border-border text-[9px] text-mint font-sans">
                        Out {3 - idx}: {bitVal}
                      </div>
                    )}
                  </div>
                  {idx < bits.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                </div>
              );
            })}

            {/* Serial Out wire */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-orange font-bold">Serial Out</span>
              <span className="border border-orange bg-orange/15 px-2 py-1 rounded text-center font-bold">
                {bits[bits.length - 1]}
              </span>
              <span className="text-xs text-muted-foreground mt-1">← Q0</span>
            </div>
          </div>
        </div>

        {/* Clock Trace Table */}
        {history.length > 0 && (
          <div className="border border-border rounded-[2px] p-3 bg-background">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
              Clock Transition History (Clock #{clkCount})
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-1 px-2">Clock</th>
                    <th className="py-1 px-2">In (D)</th>
                    <th className="py-1 px-2">Q3</th>
                    <th className="py-1 px-2">Q2</th>
                    <th className="py-1 px-2">Q1</th>
                    <th className="py-1 px-2">Q0</th>
                    <th className="py-1 px-2">Serial Out</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.clk} className="border-b border-border/40 font-mono">
                      <td className="py-1 text-muted-foreground">#{row.clk}</td>
                      <td className="py-1 font-bold text-neon">{row.sin}</td>
                      <td className="py-1">{row.state[0]}</td>
                      <td className="py-1">{row.state[1]}</td>
                      <td className="py-1">{row.state[2]}</td>
                      <td className="py-1">{row.state[3]}</td>
                      <td className="py-1 font-bold text-orange">{row.sout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ---------------------- Counter Comparison Lab ---------------------- */

export function CounterCompareLab() {
  const [val, setVal] = useState<number>(7);
  const [stepData, setStepData] = useState<{
    ripple: ReturnType<typeof simulateRippleStep>;
    sync: ReturnType<typeof simulateSynchronousStep>;
  } | null>(null);

  const handleNext = () => {
    const r = simulateRippleStep(val, 4, 10);
    const s = simulateSynchronousStep(val & 7, 3);
    setStepData({ ripple: r, sync: s });
    setVal((val + 1) & 15);
  };

  const handleReset = () => {
    setVal(7);
    setStepData(null);
  };

  const toBin = (v: number, len = 4) => v.toString(2).padStart(len, "0");

  return (
    <Panel title="Ripple Counter vs Synchronous Counter: Glitches and Delay">
      <div className="flex flex-col gap-4 font-mono text-[13px]">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs text-muted-foreground">
            Current Counter Value: <strong className="text-foreground text-sm">{val}</strong> ({toBin(val, 4)} binary)
          </span>
          <div className="flex gap-2">
            <button onClick={handleNext} className={`${btn} bg-violet text-background font-bold`}>
              Advance Clock Pulse ▷
            </button>
            <button onClick={handleReset} className={btn}>
              Reset to 7 (0111)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asynchronous Ripple Counter */}
          <div className="border border-border rounded-[2px] p-3.5 bg-muted/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="font-sans font-bold text-sm text-orange">Asynchronous (Ripple) Counter</span>
              <span className="text-[10px] text-muted-foreground">Q clocks next stage</span>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Each flip-flop is triggered by the previous one. When rolling from 7 (0111) to 8 (1000), the transition ripples through 4 stages, briefly producing illegal output states.
            </p>
            {stepData && (
              <div className="border border-orange/40 rounded-[2px] p-2.5 bg-background">
                <div className="text-[11px] font-bold text-orange mb-1">
                  Transition: {stepData.ripple.from} → {stepData.ripple.to}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Glitch sequence: </span>
                  {stepData.ripple.glitchStates.map((g, idx) => (
                    <span key={idx} className="inline-block mr-1.5">
                      <span className="font-bold text-foreground">{g}</span> ({toBin(g, 4)})
                      {idx < stepData.ripple.glitchStates.length - 1 ? " →" : ""}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Total settling time: <strong className="text-orange">{stepData.ripple.settleTimeNs} ns</strong> (
                  {stepData.ripple.glitchStates.length} stages × 10ns)
                </div>
              </div>
            )}
          </div>

          {/* Synchronous Binary Counter */}
          <div className="border border-border rounded-[2px] p-3.5 bg-muted/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <span className="font-sans font-bold text-sm text-mint">Synchronous Counter</span>
              <span className="text-[10px] text-muted-foreground">Common Clock to all FFs</span>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              All flip-flops share the same clock line. An AND carry chain computes in advance whether each flip-flop will toggle ($T_i$). All bits change at the exact same instant with zero glitch states.
            </p>
            {stepData && (
              <div className="border border-mint/40 rounded-[2px] p-2.5 bg-background">
                <div className="text-[11px] font-bold text-mint mb-1">
                  Transition: {stepData.sync.from} → {stepData.sync.to}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Excitation inputs: </span>
                  <span className="font-bold">
                    T0={stepData.sync.tInputs[0]}, T1={stepData.sync.tInputs[1]}, T2={stepData.sync.tInputs[2]}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Total settling time: <strong className="text-mint">10 ns</strong> (zero glitches, instantaneous CPU step)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
