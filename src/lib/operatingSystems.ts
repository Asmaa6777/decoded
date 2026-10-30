import type { Frame } from "@/lib/algorithms";

/* ============================================================
   Logic behind the Operating Systems course visualizers.
   Every function here is pure, so the tests can check it and
   OsVisualizers.tsx only has to draw what it returns.
   ============================================================ */

/* ----------------------------- interrupts ----------------------------- */

export type Lane = { from: number; to: number; kind: string }[];

/** The textbook's interrupt timeline: a user process runs while an I/O device transfers, then an interrupt hands the CPU to the handler. */
export const INTERRUPT_TIMELINE = {
  length: 14,
  cpu: [
    { from: 0, to: 4, kind: "user" },
    { from: 4, to: 5, kind: "isr" },
    { from: 5, to: 10, kind: "user" },
    { from: 10, to: 11, kind: "isr" },
    { from: 11, to: 14, kind: "user" },
  ] as Lane,
  io: [
    { from: 0, to: 1, kind: "idle" },
    { from: 1, to: 4, kind: "transfer" },
    { from: 4, to: 6, kind: "idle" },
    { from: 6, to: 10, kind: "transfer" },
    { from: 10, to: 14, kind: "idle" },
  ] as Lane,
};

export const INTERRUPT_CODE = [
  "user program runs on the CPU",
  "program asks for I/O  →  device starts transferring",
  "CPU keeps running other work in parallel",
  "device finishes  →  raises an INTERRUPT",
  "CPU saves registers + program counter",
  "interrupt vector  →  jump to the service routine",
  "service routine handles the device",
  "restore registers, resume the interrupted program",
];

export type InterruptState = { t: number; flash?: "request" | "interrupt" | "resume" };

export function interruptFrames(): Frame<InterruptState>[] {
  const f = (t: number, line: number, message: string, flash?: InterruptState["flash"], handled = 0): Frame<InterruptState> => ({
    state: { t, flash },
    line,
    message,
    stats: { time: t, "interrupts handled": handled },
  });
  return [
    f(0, 0, "The CPU is running a user program. The I/O device has nothing to do yet (idle)."),
    f(1, 1, "The program asks for I/O, say reading a key press or a disk block. The device controller starts moving data into its local buffer.", "request"),
    f(3, 2, "The CPU does not sit and wait. It keeps running the user program while the device works. They run at the same time."),
    f(4, 3, "The transfer is done. The device controller raises an interrupt: a signal that says 'hey CPU, I'm finished!'", "interrupt"),
    f(4, 4, "Before doing anything else, the CPU saves where it was: the registers and the address of the interrupted instruction (the program counter)."),
    f(4, 5, "The interrupt vector is a table of addresses. The CPU looks up this interrupt's number and jumps straight to the right service routine."),
    f(5, 6, "The interrupt service routine handles the device, for example copying the data from the controller's buffer into memory.", undefined, 1),
    f(5, 7, "Registers are restored and the user program continues exactly where it stopped. It never notices the pause.", "resume", 1),
    f(6, 1, "Another I/O request. The device starts a new transfer while the CPU keeps working.", "request", 1),
    f(10, 3, "Done again: a second interrupt.", "interrupt", 1),
    f(11, 6, "The CPU handles it with the service routine.", undefined, 2),
    f(14, 7, "Back to the user program. This is why we say an operating system is interrupt driven: it sits quietly until an interrupt or a trap wakes it up.", "resume", 2),
  ];
}

/* --------------------------- storage hierarchy --------------------------- */

export type StorageLevel = { name: string; size: string; access: string; volatile: boolean; managedBy: string; example: string };

/** From fastest and smallest at the top to slowest and biggest at the bottom. */
export const STORAGE_LEVELS: StorageLevel[] = [
  { name: "Registers", size: "< 1 KB", access: "≈ 0.3 ns", volatile: true, managedBy: "compiler", example: "the value the CPU is adding right now" },
  { name: "Cache", size: "a few MB", access: "≈ 1–25 ns", volatile: true, managedBy: "hardware", example: "the variables your loop keeps touching" },
  { name: "Main memory (RAM)", size: "GBs", access: "≈ 80–250 ns", volatile: true, managedBy: "operating system", example: "your open browser tabs" },
  { name: "Solid-state disk", size: "hundreds of GB", access: "≈ 25–100 µs", volatile: false, managedBy: "operating system", example: "your installed apps" },
  { name: "Magnetic disk", size: "TBs", access: "≈ 5–10 ms", volatile: false, managedBy: "operating system", example: "a backup drive full of photos" },
  { name: "Optical disk", size: "GBs per disc", access: "≈ 100 ms", volatile: false, managedBy: "operating system", example: "a DVD or Blu-ray" },
  { name: "Magnetic tape", size: "TBs per tape", access: "seconds or more", volatile: false, managedBy: "operating system", example: "long-term archive in a data center" },
];

/** Where integer A lives as it climbs from disk to the CPU. Index into ["disk", "memory", "cache", "register"]. */
export const MIGRATION_STEPS = [
  { at: 0, message: "A starts on the magnetic disk, inside a file. The CPU can't use it from there: the CPU can only work directly with main memory." },
  { at: 1, message: "The OS copies the disk block that holds A into main memory." },
  { at: 2, message: "When the program touches A, the hardware copies it into the cache, which is smaller but much faster." },
  { at: 3, message: "Finally A is loaded into a CPU register, where an instruction can add to it. Now A has copies in four places!" },
  { at: 3, message: "If the CPU changes A in the register, the other copies are out of date. The system must always use the most recent value. With many CPUs, each with its own cache, the hardware keeps the caches in agreement: cache coherency." },
];

/* ------------------------------ DMA ------------------------------ */

/** Interrupts the CPU must handle to move `bytes` of data: one per byte without DMA, one per block with it. */
export function interruptCount(bytes: number, mode: "per-byte" | "dma", blockSize = 512) {
  if (bytes <= 0) return 0;
  return mode === "per-byte" ? bytes : Math.ceil(bytes / blockSize);
}

/* --------------------------- multiprogramming --------------------------- */

/** A job alternates CPU bursts and I/O waits: [cpu, io, cpu, io, cpu, ...]. */
export type Job = { name: string; bursts: number[] };

export type GanttSlice = { from: number; to: number; job: string | null };

export const DEMO_JOBS: Job[] = [
  { name: "A", bursts: [3, 4, 2] },
  { name: "B", bursts: [2, 5, 3] },
  { name: "C", bursts: [4, 2, 1] },
];

/**
 * Run the jobs on one CPU, one time unit at a time.
 * - "single": the CPU sticks with one job until it finishes, idling while that job waits for I/O.
 * - "multi": when the running job starts waiting for I/O, the CPU switches to another ready job.
 * I/O waits overlap freely (each job has its own device).
 */
export function runJobs(jobs: Job[], mode: "single" | "multi") {
  const left = jobs.map((j) => [...j.bursts]);
  const phase = jobs.map(() => 0); // index into bursts; even = CPU, odd = I/O
  const done = jobs.map((j) => j.bursts.length === 0);
  const cpu: GanttSlice[] = [];
  const io: GanttSlice[][] = jobs.map(() => []);
  let running = -1;
  let t = 0;
  let busy = 0;
  const finish: number[] = jobs.map(() => 0);
  const push = (lane: GanttSlice[], job: string | null) => {
    const lastSlice = lane[lane.length - 1];
    if (lastSlice && lastSlice.job === job && lastSlice.to === t) lastSlice.to = t + 1;
    else lane.push({ from: t, to: t + 1, job });
  };
  const advance = (i: number) => {
    left[i][phase[i]]--;
    if (left[i][phase[i]] === 0) {
      phase[i]++;
      if (phase[i] >= left[i].length) {
        done[i] = true;
        finish[i] = t + 1;
      }
    }
  };
  while (!done.every(Boolean) && t < 500) {
    const ready = (i: number) => !done[i] && phase[i] % 2 === 0;
    if (mode === "single") {
      // stick with the first unfinished job, even while it waits
      if (running < 0 || done[running]) running = done.findIndex((d) => !d);
    } else if (running < 0 || !ready(running)) {
      // pick the next ready job after the one that just left the CPU
      const from = running < 0 ? jobs.length - 1 : running;
      running = -1;
      for (let k = 1; k <= jobs.length; k++) {
        const i = (from + k) % jobs.length;
        if (ready(i)) {
          running = i;
          break;
        }
      }
    }
    const onCpu = running >= 0 && ready(running) ? running : -1;
    // everyone waiting on I/O makes progress at the same time
    const waiting = jobs.map((_, i) => !done[i] && phase[i] % 2 === 1);
    push(cpu, onCpu >= 0 ? jobs[onCpu].name : null);
    jobs.forEach((j, i) => push(io[i], waiting[i] ? j.name : null));
    if (onCpu >= 0) {
      busy++;
      advance(onCpu);
    }
    waiting.forEach((w, i) => w && advance(i));
    t++;
  }
  return { cpu, io, total: t, busy, utilization: t ? busy / t : 0, finish };
}

/* ------------------------------ dual mode ------------------------------ */

export const DUAL_MODE_CODE = [
  "user process executing        (mode bit = 1)",
  "calls a system call, e.g. read()",
  "trap!  mode bit ← 0           (kernel mode)",
  "kernel runs the system call",
  "return from system call: mode bit ← 1",
  "user process continues",
];

export type ModeState = { mode: 0 | 1; where: "user" | "kernel"; arrow?: "down" | "up" };

export function dualModeFrames(): Frame<ModeState>[] {
  const f = (s: ModeState, line: number, message: string, calls: number): Frame<ModeState> => ({ state: s, line, message, stats: { "mode bit": s.mode, "system calls": calls } });
  return [
    f({ mode: 1, where: "user" }, 0, "Your program runs in user mode. The mode bit is 1. In this mode the CPU refuses to run privileged instructions, like talking to the disk directly.", 0),
    f({ mode: 1, where: "user", arrow: "down" }, 1, "The program needs something only the OS may do, like reading a file. It makes a system call.", 0),
    f({ mode: 0, where: "kernel", arrow: "down" }, 2, "The system call causes a trap. The hardware flips the mode bit to 0 and jumps into the kernel. Only the hardware can make this switch, so a program can't sneak into kernel mode on its own.", 1),
    f({ mode: 0, where: "kernel" }, 3, "In kernel mode every instruction is allowed. The kernel checks the request is legal and does the work.", 1),
    f({ mode: 1, where: "user", arrow: "up" }, 4, "Return from the system call: the mode bit goes back to 1 before control returns to the program.", 1),
    f({ mode: 1, where: "user" }, 5, "The program carries on with the result. Dual mode is how the OS protects itself and every other program from a buggy or malicious one.", 1),
  ];
}

/* ------------------------------ system calls ------------------------------ */

/** A small slice of a system-call table: the number is the index the interface looks up. */
export const SYSCALL_TABLE = ["read", "write", "open", "close", "fork", "exit", "wait"];

export type SyscallState = { stage: "user" | "api" | "interface" | "kernel" | "return"; index: number | null; mode: 0 | 1 };

export const SYSCALL_CODE = [
  "user application calls the API function",
  "library prepares the system-call number + parameters",
  "trap into the kernel (mode bit ← 0)",
  "system-call interface looks up the number in its table",
  "kernel runs the real system call",
  "return status + values, mode bit ← 1",
];

/** One call travelling from a program, through the API and the system-call interface, into the kernel and back. */
export function syscallFrames(call: "open" | "printf"): Frame<SyscallState>[] {
  const name = call === "open" ? "open" : "write";
  const index = SYSCALL_TABLE.indexOf(name);
  const f = (stage: SyscallState["stage"], line: number, message: string, mode: 0 | 1 = 1, idx: number | null = null): Frame<SyscallState> => ({
    state: { stage, index: idx, mode },
    line,
    message,
    stats: { "mode bit": mode },
  });
  const first =
    call === "open"
      ? "Your program calls open(\"notes.txt\"). It's using the POSIX API, a library function, not the system call itself."
      : "Your C program calls printf(\"Hello\"). printf is part of the standard C library, not a system call.";
  const lib =
    call === "open"
      ? `The library puts the system-call number for open (${index}) and the parameters (file name, flags) where the kernel can find them.`
      : `printf formats the text, then the library calls the write() system call, number ${index}, with the screen as the destination.`;
  return [
    f("user", 0, first),
    f("api", 1, lib),
    f("interface", 2, "The library executes a trap instruction. The CPU switches to kernel mode and jumps into the system-call interface.", 0),
    f("interface", 3, `The system-call interface keeps a table indexed by system-call numbers. Entry ${index} points to the kernel's ${name}() code.`, 0, index),
    f("kernel", 4, `The kernel runs ${name}(). Your program never needs to know how this part works. It only follows the API.`, 0, index),
    f("return", 5, `The kernel returns a status (and any values) and switches back to user mode. ${call === "open" ? "open() hands back a file descriptor, a small number naming the open file." : "\"Hello\" appears on the screen and printf returns."}`, 1),
  ];
}

/** The textbook's system-call sequence for copying one file to another. */
export const COPY_FILE_CALLS: { step: string; group: "input" | "open" | "loop" | "close" }[] = [
  { step: "Write a prompt to the screen", group: "input" },
  { step: "Accept the input file name", group: "input" },
  { step: "Write a prompt to the screen", group: "input" },
  { step: "Accept the output file name", group: "input" },
  { step: "Open the input file (abort if it doesn't exist)", group: "open" },
  { step: "Create the output file (abort if it already exists)", group: "open" },
  { step: "Loop: read from the input file", group: "loop" },
  { step: "Loop: write to the output file (until read fails)", group: "loop" },
  { step: "Close the output file", group: "close" },
  { step: "Write a completion message to the screen", group: "close" },
  { step: "Terminate normally", group: "close" },
];

export type ParamMethod = "registers" | "table" | "stack";

/** Where the parameters end up for each passing method. Registers run out after `regs`. */
export function paramPassing(method: ParamMethod, params: string[], regs = 4) {
  if (method === "registers") return { registers: params.slice(0, regs), memory: [] as string[], stack: [] as string[], overflow: params.length > regs };
  if (method === "table") return { registers: ["X = address of the table"], memory: params, stack: [] as string[], overflow: false };
  return { registers: [] as string[], memory: [] as string[], stack: [...params].reverse(), overflow: false };
}

/* ------------------------------ OS structures ------------------------------ */

export type StructureKind = "simple" | "unix" | "layered" | "microkernel" | "modules" | "hybrid";

export const STRUCTURES: Record<StructureKind, { title: string; example: string; layers: string[]; pros: string[]; cons: string[] }> = {
  simple: {
    title: "Simple structure",
    example: "MS-DOS",
    layers: ["application program", "resident system program", "MS-DOS device drivers", "ROM BIOS device drivers"],
    pros: ["most functionality in the least space"],
    cons: ["not divided into modules", "levels aren't well separated: an app can reach the hardware directly, so one buggy app can crash everything"],
  },
  unix: {
    title: "Traditional UNIX (monolithic)",
    example: "original UNIX",
    layers: ["users", "shells, commands, compilers, interpreters, system libraries", "system-call interface to the kernel", "kernel: file system, CPU scheduling, memory management, signals, swapping, device drivers", "kernel interface to the hardware", "hardware: terminals, disks, memory"],
    pros: ["fast: kernel parts call each other directly, with little overhead"],
    cons: ["a huge number of functions packed into one level", "hard to implement, extend and maintain"],
  },
  layered: {
    title: "Layered approach",
    example: "layer 0 is the hardware, layer N is the user interface",
    layers: ["layer N: user interface", "…", "layer 2", "layer 1", "layer 0: hardware"],
    pros: ["each layer only uses the layers below it, so you can build and debug one layer at a time"],
    cons: ["hard to decide which layer goes where", "a request has to pass through many layers, which is slower"],
  },
  microkernel: {
    title: "Microkernel",
    example: "Mach (macOS's Darwin kernel is partly based on it)",
    layers: ["user mode: application program, file system, device driver", "kernel mode (microkernel): interprocess communication, memory management, CPU scheduling", "hardware"],
    pros: ["easier to extend", "easier to port to new hardware", "more reliable: less code runs in kernel mode", "more secure"],
    cons: ["performance overhead from all the messages between user space and kernel space"],
  },
  modules: {
    title: "Loadable kernel modules",
    example: "Linux, Solaris",
    layers: ["core kernel", "scheduling classes, file systems, loadable system calls, executable formats, STREAMS modules, device and bus drivers, miscellaneous"],
    pros: ["object-oriented: each core part is separate and talks to the others over known interfaces", "modules are loaded into the kernel only when needed", "like layers, but more flexible: any module can call any other"],
    cons: ["a buggy module still runs in kernel mode"],
  },
  hybrid: {
    title: "Hybrid systems",
    example: "Linux, Windows, macOS, iOS, Android",
    layers: ["Linux and Solaris: monolithic kernel plus loadable modules", "Windows: mostly monolithic, plus microkernel ideas for its subsystem personalities", "macOS: Aqua UI and Cocoa on top of a kernel made of the Mach microkernel, BSD UNIX parts, the I/O kit and kernel extensions"],
    pros: ["combines approaches to balance performance, security and usability"],
    cons: ["no single clean model: you have to learn each system's mix"],
  },
};

/** The message hops for one request in a microkernel: the app never talks to the file system directly. */
export const MICROKERNEL_HOPS = ["application", "microkernel", "file system", "microkernel", "application"];

/* ------------------------------ system boot ------------------------------ */

export const BOOT_CODE = [
  "power on: execution starts at a fixed memory address",
  "firmware in ROM runs the initial boot code",
  "ROM code loads the boot block from a fixed place on disk",
  "boot block loads the bootstrap loader (e.g. GRUB)",
  "loader lets you pick a kernel, then loads it into memory",
  "kernel starts: the system is running",
];

export const BOOT_STAGES = ["Power on", "ROM firmware", "Boot block", "Bootstrap loader", "Kernel in memory", "System running"];

export type BootState = { stage: number };

export function bootFrames(): Frame<BootState>[] {
  const msgs = [
    "You press the power button. The CPU starts executing at a fixed memory location, wired in by the hardware.",
    "That location holds firmware in ROM (or EEPROM). It can't be erased by accident, so the computer can always start.",
    "Booting is often a two-step process: the ROM code is tiny, so it only loads a boot block from a fixed location on the disk.",
    "The boot block loads the bootstrap loader. A common one on Linux is GRUB.",
    "GRUB lets you choose a kernel from several disks, versions or options. Then it finds the kernel, loads it into memory and starts it.",
    "The kernel takes over. The system is now running.",
  ];
  return msgs.map((message, stage) => ({ state: { stage }, line: stage, message, stats: { stage: stage + 1 } }));
}
