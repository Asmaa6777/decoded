import { useState } from "react";
import { btn } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";

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
              : "border-border bg-muted/10 text-muted-foreground"
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
