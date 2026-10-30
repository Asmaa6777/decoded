import type { ComponentType } from "react";

// Lesson MDX modules (eagerly loaded so we can render synchronously)
import TocIntro from "@/content/theory-of-computation/m0-01-intro.mdx";
import TocLanguageOfLanguages from "@/content/theory-of-computation/m0-02-language-of-languages.mdx";
import TocHowToReadAMachine from "@/content/theory-of-computation/m0-03-how-to-read-a-machine.mdx";
import TocGrammars from "@/content/theory-of-computation/m0-04-grammars.mdx";
import TocStatesSymbols from "@/content/theory-of-computation/m1-01-states-symbols.mdx";
import TocNfa from "@/content/theory-of-computation/m1-02-nfa.mdx";
import TocRegularExpressions from "@/content/theory-of-computation/m1-03-regular-expressions.mdx";
import TocTransitionGraphs from "@/content/theory-of-computation/m1-04-transition-graphs.mdx";
import TocKleenesTheorem from "@/content/theory-of-computation/m1-05-kleenes-theorem.mdx";
import TocRegexPlayground from "@/content/theory-of-computation/m1-06-regex-playground.mdx";
import TocFiniteAutomataQuiz from "@/content/theory-of-computation/m1-07-finite-automata-quiz.mdx";
import TocLimitsOfFiniteMemory from "@/content/theory-of-computation/m2-01-limits-of-finite-memory.mdx";
import TocContextFreeGrammars from "@/content/theory-of-computation/m2-02-context-free-grammars.mdx";
import TocNormalForms from "@/content/theory-of-computation/m2-03-normal-forms.mdx";
import TocPushdownAutomata from "@/content/theory-of-computation/m2-04-pushdown-automata.mdx";
import TocCfgEqualsPda from "@/content/theory-of-computation/m2-05-cfg-equals-pda.mdx";
import TocContextFreeQuiz from "@/content/theory-of-computation/m2-06-context-free-quiz.mdx";
import LitTyping from "@/content/computer-literacy/01-physical-layer.mdx";
import LitLanguage from "@/content/computer-literacy/02-language-layer.mdx";
import LitSystems from "@/content/computer-literacy/03-systems-layer.mdx";
import AdaWhatIsAnAlgorithm from "@/content/algorithm-design-and-analysis/m0-01-what-is-an-algorithm.mdx";
import AdaCountingSteps from "@/content/algorithm-design-and-analysis/m0-02-counting-steps.mdx";
import AdaJavaLabToolkit from "@/content/algorithm-design-and-analysis/m0-03-java-lab-toolkit.mdx";
import AdaSelectionBubble from "@/content/algorithm-design-and-analysis/m1-01-selection-and-bubble-sort.mdx";
import AdaInsertionSort from "@/content/algorithm-design-and-analysis/m1-02-insertion-sort.mdx";
import AdaMergeSort from "@/content/algorithm-design-and-analysis/m1-03-merge-sort.mdx";
import AdaQuickSort from "@/content/algorithm-design-and-analysis/m1-04-quick-sort.mdx";
import AdaSortingQuiz from "@/content/algorithm-design-and-analysis/m1-05-sorting-quiz.mdx";
import AdaSearch from "@/content/algorithm-design-and-analysis/m2-01-linear-and-binary-search.mdx";
import AdaEuclid from "@/content/algorithm-design-and-analysis/m2-02-euclid-gcd.mdx";
import AdaBfsDfs from "@/content/algorithm-design-and-analysis/m3-01-bfs-and-dfs.mdx";
import AdaGreedy from "@/content/algorithm-design-and-analysis/m4-01-greedy-and-mst.mdx";
import AdaDynamic from "@/content/algorithm-design-and-analysis/m4-02-dynamic-programming.mdx";
import AdaFinalQuiz from "@/content/algorithm-design-and-analysis/m4-03-final-quiz.mdx";
import AaAnalysis from "@/content/advanced-algorithms/m0-01-analysis-of-algorithms.mdx";
import AaCountingOperations from "@/content/advanced-algorithms/m0-02-every-worst-average-best.mdx";
import AaAsymptotic from "@/content/advanced-algorithms/m0-03-asymptotic-notation.mdx";
import AaRecurrences from "@/content/advanced-algorithms/m0-04-solving-recurrences.mdx";
import AaLabBits from "@/content/advanced-algorithms/m0-05-lab-bit-manipulation.mdx";
import AaLabAnalysis from "@/content/advanced-algorithms/m0-06-lab-algorithm-analysis.mdx";
import AaDivideConquer from "@/content/advanced-algorithms/m1-01-divide-and-conquer.mdx";
import AaLabDivideConquer from "@/content/advanced-algorithms/m1-02-lab-divide-and-conquer.mdx";
import AaQuicksort from "@/content/advanced-algorithms/m1-03-quicksort.mdx";
import AaLowerBounds from "@/content/advanced-algorithms/m1-04-sorting-lower-bounds.mdx";
import AaOrderStatistics from "@/content/advanced-algorithms/m1-05-order-statistics.mdx";
import AaHashing from "@/content/advanced-algorithms/m2-01-hashing.mdx";
import AaCollisions from "@/content/advanced-algorithms/m2-02-collision-resolution.mdx";
import AaLabHashing from "@/content/advanced-algorithms/m2-03-lab-hashing.mdx";
import AaBalancedTrees from "@/content/advanced-algorithms/m2-04-balanced-search-trees.mdx";
import AaRedBlackOps from "@/content/advanced-algorithms/m2-05-red-black-insert-delete.mdx";
import AaAugmenting from "@/content/advanced-algorithms/m2-06-augmenting-data-structures.mdx";
import AaSkipLists from "@/content/advanced-algorithms/m2-07-skip-lists.mdx";
import AaDynamic from "@/content/advanced-algorithms/m3-01-dynamic-programming.mdx";
import AaGreedy from "@/content/advanced-algorithms/m3-02-greedy-algorithms.mdx";
import AaMst from "@/content/advanced-algorithms/m3-03-minimum-spanning-trees.mdx";
import AaHuffman from "@/content/advanced-algorithms/m3-04-huffman-and-activity-selection.mdx";
import AaShortestPaths from "@/content/advanced-algorithms/m3-05-shortest-paths.mdx";
import AaPNP from "@/content/advanced-algorithms/m4-01-p-and-np.mdx";
import OsWhatAnOsDoes from "@/content/operating-systems/m1-01-what-an-os-does.mdx";
import OsArchitecture from "@/content/operating-systems/m1-02-os-architecture-and-operations.mdx";
import OsServicesSyscalls from "@/content/operating-systems/m1-03-services-and-system-calls.mdx";
import OsDesignStructure from "@/content/operating-systems/m1-04-os-design-and-structure.mdx";
import OsLabLinux from "@/content/operating-systems/m1-05-lab-linux-commands.mdx";
import OsProcesses from "@/content/operating-systems/m2-01-processes.mdx";
import OsIpc from "@/content/operating-systems/m2-02-interprocess-communication.mdx";
import OsLabThreads from "@/content/operating-systems/m2-03-lab-java-threads.mdx";
import OsCriticalSection from "@/content/operating-systems/m3-01-critical-section-problem.mdx";
import OsSemaphores from "@/content/operating-systems/m3-02-semaphores-and-classic-problems.mdx";
import OsLabSync from "@/content/operating-systems/m3-03-lab-java-synchronization.mdx";
import OsSchedulingBasics from "@/content/operating-systems/m4-01-cpu-scheduling-basics.mdx";
import OsRoundRobin from "@/content/operating-systems/m4-02-round-robin-and-beyond.mdx";
import OsMemoryAllocation from "@/content/operating-systems/m5-01-memory-allocation.mdx";
import OsPaging from "@/content/operating-systems/m5-02-paging.mdx";
import OsVirtualMemory from "@/content/operating-systems/m5-03-virtual-memory.mdx";
import OsPageReplacement from "@/content/operating-systems/m5-04-page-replacement-and-thrashing.mdx";
import CmMatrices from "@/content/computational-mathematics/m0-01-matrices-and-matlab.mdx";
import CmTranspose from "@/content/computational-mathematics/m0-02-transpose-and-products.mdx";
import CmMultiply from "@/content/computational-mathematics/m0-03-multiplying-matrices.mdx";
import CmKronecker from "@/content/computational-mathematics/m0-04-kronecker-product.mdx";
import CmNorms from "@/content/computational-mathematics/m0-05-norms-and-trace.mdx";
import CmSpecial from "@/content/computational-mathematics/m0-06-special-matrices.mdx";
import CmDeterminants from "@/content/computational-mathematics/m0-07-determinants-and-inverses.mdx";
import CmMatricesQuiz from "@/content/computational-mathematics/m0-08-matrices-quiz.mdx";
import CmPolyRoots from "@/content/computational-mathematics/m1-01-polynomials-and-roots.mdx";
import CmPolyConv from "@/content/computational-mathematics/m1-02-multiplying-and-dividing.mdx";
import CmPolyFit from "@/content/computational-mathematics/m1-03-derivatives-and-curve-fitting.mdx";
import CmPolyResidue from "@/content/computational-mathematics/m1-04-partial-fractions.mdx";
import CmPolyQuiz from "@/content/computational-mathematics/m1-05-polynomials-quiz.mdx";
import CmEuclid from "@/content/computational-mathematics/m2-01-divisibility-and-euclid.mdx";
import CmModular from "@/content/computational-mathematics/m2-02-modular-arithmetic.mdx";
import CmPrimes from "@/content/computational-mathematics/m2-03-primes-and-the-sieve.mdx";
import CmTotient from "@/content/computational-mathematics/m2-04-primality-and-the-totient.mdx";
import CmOrder from "@/content/computational-mathematics/m2-05-order-and-primitive-roots.mdx";
import CmInverses from "@/content/computational-mathematics/m2-06-modular-inverses.mdx";
import LdSignals from "@/content/logic-design/m0-01-signals.mdx";
import LdNumbers from "@/content/logic-design/m1-01-number-systems.mdx";
import LdArithmetic from "@/content/logic-design/m1-02-binary-arithmetic.mdx";
import LdCodes from "@/content/logic-design/m1-03-codes-and-floating-point.mdx";
import LdNumbersQuiz from "@/content/logic-design/m1-04-numbers-quiz.mdx";
import LdGates from "@/content/logic-design/m2-01-logic-gates.mdx";
import LdBoolean from "@/content/logic-design/m2-02-boolean-algebra.mdx";
import LdSop from "@/content/logic-design/m2-03-sop-and-pos.mdx";
import LdKmap from "@/content/logic-design/m2-04-karnaugh-maps.mdx";
import LdUniversal from "@/content/logic-design/m2-05-universal-gates.mdx";
import LdGatesQuiz from "@/content/logic-design/m2-06-gates-quiz.mdx";
import LdAdders from "@/content/logic-design/m3-01-adders.mdx";
import LdCarries from "@/content/logic-design/m3-02-fast-carries.mdx";
import LdDecoders from "@/content/logic-design/m3-03-comparators-decoders-encoders.mdx";
import LdMux from "@/content/logic-design/m3-04-multiplexers.mdx";
import LdBlocksQuiz from "@/content/logic-design/m3-05-building-blocks-quiz.mdx";
import LdSr from "@/content/logic-design/m4-01-sr-latch.mdx";
import LdDLatch from "@/content/logic-design/m4-02-d-latch-and-clock.mdx";
import LdFlipFlops from "@/content/logic-design/m4-03-flip-flops.mdx";
import LdRegisters from "@/content/logic-design/m4-04-registers.mdx";
import LdCounters from "@/content/logic-design/m4-05-counters.mdx";
import LdMemory from "@/content/logic-design/m4-06-memory-unit.mdx";
import LdSeqQuiz from "@/content/logic-design/m4-07-sequential-quiz.mdx";
import OrgInside from "@/content/computer-organization/m0-01-whats-inside.mdx";
import OrgBits from "@/content/computer-organization/m0-02-bits-and-bytes.mdx";
import OrgCpu from "@/content/computer-organization/m1-01-inside-the-cpu.mdx";
import OrgCycle from "@/content/computer-organization/m1-02-machine-cycle.mdx";
import OrgBuses from "@/content/computer-organization/m1-03-buses.mdx";
import OrgRam from "@/content/computer-organization/m2-01-ram-and-rom.mdx";
import OrgHierarchy from "@/content/computer-organization/m2-02-memory-hierarchy.mdx";
import OrgHdd from "@/content/computer-organization/m3-01-hard-disks.mdx";
import OrgSsd from "@/content/computer-organization/m3-02-ssds-and-optical.mdx";
import OrgQuiz from "@/content/computer-organization/m3-03-final-quiz.mdx";
import MpInside from "@/content/microprocessors/m0-01-inside-the-8086.mdx";
import MpRegisters from "@/content/microprocessors/m0-02-registers.mdx";
import MpFlags from "@/content/microprocessors/m0-03-flags.mdx";
import MpSegments from "@/content/microprocessors/m1-01-segments-and-addresses.mdx";
import MpModes from "@/content/microprocessors/m1-02-addressing-modes.mdx";
import MpFirst from "@/content/microprocessors/m2-01-first-program.mdx";
import MpArith from "@/content/microprocessors/m2-02-arithmetic-and-logic.mdx";
import MpJumps from "@/content/microprocessors/m2-03-jumps-and-loops.mdx";
import MpStack from "@/content/microprocessors/m2-04-stack-and-procedures.mdx";
import MpInterrupts from "@/content/microprocessors/m3-01-interrupts.mdx";
import MpBusCycles from "@/content/microprocessors/m3-02-bus-cycles.mdx";
import MpQuiz from "@/content/microprocessors/m3-03-final-quiz.mdx";
import ArchIntro from "@/content/computer-architecture/m0-01-architecture-and-organization.mdx";
import ArchFormats from "@/content/computer-architecture/m1-01-instruction-formats.mdx";
import ArchRisc from "@/content/computer-architecture/m1-02-risc-and-cisc.mdx";
import ArchPerf from "@/content/computer-architecture/m1-03-measuring-performance.mdx";
import ArchControl from "@/content/computer-architecture/m1-04-control-unit.mdx";
import ArchMemory from "@/content/computer-architecture/m2-01-main-memory.mdx";
import ArchMapping from "@/content/computer-architecture/m2-02-cache-mapping.mdx";
import ArchPolicies from "@/content/computer-architecture/m2-03-cache-policies.mdx";
import ArchVm from "@/content/computer-architecture/m2-04-virtual-memory.mdx";
import ArchIo from "@/content/computer-architecture/m3-01-io-methods.mdx";
import ArchArbiter from "@/content/computer-architecture/m3-02-buses-and-arbitration.mdx";
import ArchPipe from "@/content/computer-architecture/m4-01-pipelining.mdx";
import ArchHazards from "@/content/computer-architecture/m4-02-pipeline-hazards.mdx";
import ArchParallel from "@/content/computer-architecture/m4-03-parallel-processing.mdx";
import ArchQuiz from "@/content/computer-architecture/m4-04-final-quiz.mdx";
import ExamMindLesson01 from "@/content/the-exam-mind/01-the-problem-with-how-you-study.mdx";
import ExamMindLesson02 from "@/content/the-exam-mind/02-the-one-week-plan.mdx";
import ExamMindLesson03 from "@/content/the-exam-mind/03-stress-and-anxiety.mdx";
import ExamMindLesson04 from "@/content/the-exam-mind/04-exam-day.mdx";
import { ahmedAlghali, asmaaFarouq, type Author } from "./authors";


export type LessonKind = "theory" | "practical" | "quiz";

export type Lesson = {
  slug: string;
  title: string;
  duration: string; // e.g. "8 min"
  kind?: LessonKind; // omitted = "theory" (default)
  Component: ComponentType<Record<string, unknown>>;
};

export function lessonKind(lesson: Lesson): LessonKind {
  return lesson.kind ?? "theory";
}

export type Module = {
  title: string;
  blurb?: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  accent: "neon" | "orange" | "sky" | "violet" | "mint";
  status: "available" | "coming-soon";
  number: string; // "01"
  authors?: Author[];
  modules: Module[];
};

export const courses: Course[] = [
  {
    slug: "theory-of-computation",
    title: "Theory of Computation",
    tagline: "What machines can fundamentally compute, still matters to understand",
    description:
      "Back in the 1930s mathematicians who put the first principles of this field weren't writing and shipping apps. They were asking much simpler questions, like 'what is computable?' That question produced regex, parsers, CPUs, cryptography, and the famous world of antivirus software. This small course decodes each topic in the theory of computation into the tools you are going to use or already in use.",
    accent: "neon",
    status: "available",
    number: "01",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "Foundations",
        blurb: "Why this course exists and how to read it.",
        lessons: [
          { slug: "intro", title: "The Abstraction Gap", duration: "5 min", Component: TocIntro },
          { slug: "language-of-languages", title: "The Language of Languages", duration: "12 min", Component: TocLanguageOfLanguages },
          { slug: "grammars", title: "Grammars: Rules That Generate a Language", duration: "14 min", Component: TocGrammars },
          { slug: "how-to-read-a-machine", title: "How to Read a Machine", duration: "9 min", Component: TocHowToReadAMachine },
        ],
      },
      {
        title: "Finite Automata",
        blurb: "The first formal computing model — and the engine behind every regex.",
        lessons: [
          { slug: "states-symbols-and-transitions", title: "States, Symbols, and Transitions", duration: "10 min", Component: TocStatesSymbols },
          { slug: "nfa", title: "NFA — The Machine That Guesses Right", duration: "12 min", Component: TocNfa },
          { slug: "regular-expressions", title: "Reading and Writing Regular Expressions", duration: "15 min", kind: "practical", Component: TocRegularExpressions },
          { slug: "transition-graphs", title: "Transition Graphs", duration: "14 min", Component: TocTransitionGraphs },
          { slug: "kleenes-theorem", title: "Kleene's Theorem", duration: "15 min", Component: TocKleenesTheorem },
          { slug: "regex-playground", title: "Practical: Building Regex from Automata", duration: "10 min", kind: "practical", Component: TocRegexPlayground },
          { slug: "finite-automata-quiz", title: "Quiz: Finite Automata & Regex", duration: "10 min", kind: "quiz", Component: TocFiniteAutomataQuiz },
        ],
      },
      {
        title: "Context-Free Languages",
        blurb: "Where finite memory runs out: grammars that nest, and the stack that recognizes them.",
        lessons: [
          { slug: "limits-of-finite-memory", title: "The Limits of Finite Memory", duration: "12 min", Component: TocLimitsOfFiniteMemory },
          { slug: "context-free-grammars", title: "Context-Free Grammars", duration: "16 min", Component: TocContextFreeGrammars },
          { slug: "normal-forms", title: "Simplifying Grammars and Normal Forms", duration: "16 min", Component: TocNormalForms },
          { slug: "pushdown-automata", title: "Pushdown Automata", duration: "15 min", Component: TocPushdownAutomata },
          { slug: "cfg-equals-pda", title: "CFG = PDA", duration: "12 min", Component: TocCfgEqualsPda },
          { slug: "context-free-quiz", title: "Quiz: Context-Free Languages", duration: "10 min", kind: "quiz", Component: TocContextFreeQuiz },
        ],
      },
    ],
  },
  {
    slug: "computer-literacy",
    title: "Computer Literacy",
    tagline: "The fluency needed to be one with the machine",
    description:
      "Everything about computing is interaction. The more precisely you speak to the machine, the more effective you become. That fluency has three layers: physical, language and systems. It comes from years of watching what separates fluent users from frustrated ones.",
    accent: "orange",
    status: "available",
    number: "02",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "The Three Layers of Fluency",
        blurb: "Each layer removes friction between intention and execution.",
        lessons: [
          { slug: "physical-layer", title: "The Physical Layer", duration: "6 min", Component: LitTyping },
          { slug: "language-layer", title: "The Language Layer", duration: "7 min", Component: LitLanguage },
          { slug: "systems-layer",  title: "The Systems Layer",  duration: "7 min", Component: LitSystems },
        ],
      },
    ],
  },
  {
    slug: "algorithm-design-and-analysis",
    title: "Algorithm Design & Analysis",
    tagline: "Why two programs that give the same answer can be a million times apart.",
    description:
      "Sorting, searching, graphs, greedy choices and dynamic programming. The classic university algorithms course, decoded: every algorithm is animated step by step next to its Java code, every lesson explains why it works and what it costs, and each one ends with easy LeetCode problems to lock it in.",
    accent: "sky",
    status: "available",
    number: "03",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "Foundations",
        blurb: "What an algorithm is, how we measure one, and the Java toolkit every lab uses.",
        lessons: [
          { slug: "what-is-an-algorithm", title: "Recipes, Programs, and Proof", duration: "9 min", Component: AdaWhatIsAnAlgorithm },
          { slug: "counting-steps", title: "Counting Steps: Big-O, Omega and Theta", duration: "13 min", Component: AdaCountingSteps },
          { slug: "java-lab-toolkit", title: "Practical: Arrays, Swaps and a Stopwatch", duration: "10 min", kind: "practical", Component: AdaJavaLabToolkit },
        ],
      },
      {
        title: "Sorting",
        blurb: "Five ways to put things in order, and why the fastest on paper isn't always the one you want.",
        lessons: [
          { slug: "selection-and-bubble-sort", title: "Selection Sort and Bubble Sort", duration: "12 min", Component: AdaSelectionBubble },
          { slug: "insertion-sort", title: "Insertion Sort: Sorting Like a Card Player", duration: "9 min", Component: AdaInsertionSort },
          { slug: "merge-sort", title: "Divide and Conquer: Merge Sort", duration: "13 min", Component: AdaMergeSort },
          { slug: "quick-sort", title: "Quick Sort: Pick a Pivot", duration: "12 min", Component: AdaQuickSort },
          { slug: "sorting-quiz", title: "Quiz: Analysis & Sorting", duration: "7 min", kind: "quiz", Component: AdaSortingQuiz },
        ],
      },
      {
        title: "Searching & Numbers",
        blurb: "Finding things fast, and the oldest algorithm still running in your phone.",
        lessons: [
          { slug: "linear-and-binary-search", title: "Linear vs Binary Search", duration: "11 min", Component: AdaSearch },
          { slug: "euclid-gcd", title: "Euclid's GCD: A 2,300-Year-Old Algorithm", duration: "8 min", Component: AdaEuclid },
        ],
      },
      {
        title: "Graphs",
        blurb: "Maps, networks and friendships — and the two ways to walk through all of them.",
        lessons: [
          { slug: "bfs-and-dfs", title: "Graphs: BFS and DFS", duration: "14 min", Component: AdaBfsDfs },
        ],
      },
      {
        title: "Design Strategies",
        blurb: "Two big ideas for designing your own algorithms: grab the best thing now, or remember everything.",
        lessons: [
          { slug: "greedy-and-mst", title: "Greedy Algorithms: Prim and Kruskal", duration: "13 min", Component: AdaGreedy },
          { slug: "dynamic-programming", title: "Dynamic Programming: The 0/1 Knapsack", duration: "14 min", Component: AdaDynamic },
          { slug: "final-quiz", title: "Quiz: Searching, Graphs, Greedy & DP", duration: "8 min", kind: "quiz", Component: AdaFinalQuiz },
        ],
      },
    ],
  },
  {
    slug: "advanced-algorithms",
    title: "Advanced Algorithms & Analysis",
    tagline: "Proving how fast an algorithm is, then building ones that are faster.",
    description:
      "The second algorithms course, decoded. Asymptotic notation and recurrences, divide and conquer, randomized quicksort and linear-time sorting, hashing, balanced and red-black trees, skip lists, dynamic programming, greedy algorithms, shortest paths, and the P vs NP question. Every lesson follows the lectures and labs, in plain language, with step-through animations.",
    accent: "violet",
    status: "available",
    number: "04",
    authors: [asmaaFarouq],
    modules: [
      {
        title: "Foundations of Analysis",
        blurb: "How to measure an algorithm without a stopwatch, and how to prove what you measured.",
        lessons: [
          { slug: "analysis-of-algorithms", title: "What Is Analysis of Algorithms?", duration: "14 min", Component: AaAnalysis },
          { slug: "counting-the-basic-operation", title: "Counting the Basic Operation", duration: "14 min", Component: AaCountingOperations },
          { slug: "asymptotic-notation", title: "Complexity and Asymptotic Notation", duration: "18 min", Component: AaAsymptotic },
          { slug: "solving-recurrences", title: "Solving Recurrences", duration: "18 min", Component: AaRecurrences },
          { slug: "lab-bit-manipulation", title: "Lab: Bit Manipulation and Binary Files", duration: "16 min", kind: "practical", Component: AaLabBits },
          { slug: "lab-algorithm-analysis", title: "Lab: Analyzing Algorithms with Recurrences", duration: "18 min", kind: "practical", Component: AaLabAnalysis },
        ],
      },
      {
        title: "Divide and Conquer",
        blurb: "Split, solve, combine: from binary search to Strassen, and the sorting algorithms built on it.",
        lessons: [
          { slug: "divide-and-conquer", title: "Divide and Conquer", duration: "20 min", Component: AaDivideConquer },
          { slug: "lab-divide-and-conquer", title: "Lab: Recursion Trees and Gauss Multiplication", duration: "18 min", kind: "practical", Component: AaLabDivideConquer },
          { slug: "quicksort", title: "Quicksort and Randomized Quicksort", duration: "20 min", Component: AaQuicksort },
          { slug: "sorting-lower-bounds", title: "Sorting Lower Bounds and Linear-Time Sorting", duration: "20 min", Component: AaLowerBounds },
          { slug: "order-statistics", title: "Order Statistics: Finding the i-th Smallest", duration: "18 min", Component: AaOrderStatistics },
        ],
      },
      {
        title: "Hashing and Search Trees",
        blurb: "Constant-time lookups with hashing, then trees that stay balanced no matter what you insert.",
        lessons: [
          { slug: "hashing", title: "Hashing and Amortized Analysis", duration: "18 min", Component: AaHashing },
          { slug: "collision-resolution", title: "Collisions: Chaining and Open Addressing", duration: "22 min", Component: AaCollisions },
          { slug: "lab-hashing", title: "Lab: Hash Tables in Practice", duration: "18 min", kind: "practical", Component: AaLabHashing },
          { slug: "balanced-search-trees", title: "Balanced Search Trees and Red-Black Trees", duration: "16 min", Component: AaBalancedTrees },
          { slug: "red-black-insert-delete", title: "Red-Black Trees: Insertion and Deletion", duration: "20 min", Component: AaRedBlackOps },
          { slug: "augmenting-data-structures", title: "Augmenting Data Structures", duration: "18 min", Component: AaAugmenting },
          { slug: "skip-lists", title: "Skip Lists", duration: "16 min", Component: AaSkipLists },
        ],
      },
      {
        title: "Design Strategies",
        blurb: "Remember every answer, or grab the best option now: dynamic programming, greedy algorithms and shortest paths.",
        lessons: [
          { slug: "dynamic-programming", title: "Dynamic Programming", duration: "22 min", Component: AaDynamic },
          { slug: "greedy-algorithms", title: "Greedy Algorithms", duration: "16 min", Component: AaGreedy },
          { slug: "minimum-spanning-trees", title: "Minimum Spanning Trees: Prim and Kruskal", duration: "20 min", Component: AaMst },
          { slug: "huffman-and-activity-selection", title: "Greedy Choice: Huffman Codes and Activity Selection", duration: "22 min", Component: AaHuffman },
          { slug: "shortest-paths", title: "Shortest Paths: Dijkstra's Algorithm", duration: "22 min", Component: AaShortestPaths },
        ],
      },
      {
        title: "Hard Problems",
        blurb: "Problems that are easy to check but seem impossible to solve quickly, and the million-dollar question behind them.",
        lessons: [
          { slug: "p-and-np", title: "P, NP, NP-Hard and NP-Complete", duration: "20 min", Component: AaPNP },
        ],
      },
    ],
  },
  {
    slug: "computational-mathematics",
    title: "Computational Mathematics",
    tagline: "The maths your computer does for you, animated until it makes sense.",
    description:
      "Matrices, polynomials, number theory and the first ciphers, worked in MATLAB. Watch matrix entries slide into place, space bend under a linear map and a cipher wheel turn, then see where each idea runs in today's tools.",
    accent: "mint",
    status: "available",
    number: "05",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "Matrices",
        blurb: "Creating and combining matrices, what they do to space, and how to undo them.",
        lessons: [
          { slug: "matrices-and-matlab", title: "Matrices and MATLAB", duration: "10 min", Component: CmMatrices },
          { slug: "transpose-and-products", title: "Transpose and Vector Products", duration: "10 min", Component: CmTranspose },
          { slug: "multiplying-matrices", title: "Multiplying Matrices", duration: "14 min", Component: CmMultiply },
          { slug: "kronecker-product", title: "The Kronecker Product", duration: "8 min", Component: CmKronecker },
          { slug: "norms-and-trace", title: "Matrix Norms and the Trace", duration: "11 min", Component: CmNorms },
          { slug: "special-matrices", title: "Some Special Matrices", duration: "8 min", Component: CmSpecial },
          { slug: "determinants-and-inverses", title: "Determinants and Inverses", duration: "15 min", Component: CmDeterminants },
          { slug: "matrices-quiz", title: "Quiz: Matrices", duration: "10 min", kind: "quiz", Component: CmMatricesQuiz },
        ],
      },
      {
        title: "Polynomials",
        blurb: "Storing polynomials as vectors, finding roots, and fitting curves to data.",
        lessons: [
          { slug: "polynomials-and-roots", title: "Polynomials and Their Roots", duration: "12 min", Component: CmPolyRoots },
          { slug: "multiplying-and-dividing", title: "Multiplying and Dividing Polynomials", duration: "9 min", Component: CmPolyConv },
          { slug: "derivatives-and-curve-fitting", title: "Derivatives and Curve Fitting", duration: "12 min", Component: CmPolyFit },
          { slug: "partial-fractions", title: "Partial Fractions", duration: "9 min", Component: CmPolyResidue },
          { slug: "polynomials-quiz", title: "Quiz: Polynomials", duration: "8 min", kind: "quiz", Component: CmPolyQuiz },
        ],
      },
      {
        title: "Number Theory",
        blurb: "The whole-number arithmetic behind modern cryptography, from remainders to discrete logarithms.",
        lessons: [
          { slug: "divisibility-and-euclid", title: "Divisibility and the Euclidean Algorithm", duration: "12 min", Component: CmEuclid },
          { slug: "modular-arithmetic", title: "Modular Arithmetic", duration: "12 min", Component: CmModular },
          { slug: "primes-and-the-sieve", title: "Primes and the Sieve", duration: "10 min", Component: CmPrimes },
          { slug: "primality-and-the-totient", title: "Primality Tests and Euler's Totient", duration: "15 min", Component: CmTotient },
          { slug: "order-and-primitive-roots", title: "Order and Primitive Roots", duration: "12 min", Component: CmOrder },
          { slug: "modular-inverses", title: "Modular Inverses", duration: "11 min", Component: CmInverses },
        ],
      },
    ],
  },
  {
    slug: "computer-organization",
    title: "Computer Organization",
    tagline: "What's inside the box, and how the parts work together.",
    description:
      "A top-down tour of a computer with the history left out. Step a working CPU through a program, follow a read across the buses, cut the power on RAM, and spin a hard disk to see why it's the slowest part of the machine.",
    accent: "sky",
    status: "available",
    number: "06",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "The Big Picture",
        blurb: "What a computer is made of, and why it all comes down to bits.",
        lessons: [
          { slug: "whats-inside", title: "What's Inside a Computer", duration: "8 min", Component: OrgInside },
          { slug: "bits-and-bytes", title: "Bits and Bytes", duration: "9 min", Component: OrgBits },
        ],
      },
      {
        title: "The CPU",
        blurb: "The parts of a processor and the one loop it runs forever.",
        lessons: [
          { slug: "inside-the-cpu", title: "Inside the CPU", duration: "8 min", Component: OrgCpu },
          { slug: "machine-cycle", title: "The Machine Cycle", duration: "12 min", Component: OrgCycle },
          { slug: "buses", title: "Buses: The Computer's Roads", duration: "9 min", Component: OrgBuses },
        ],
      },
      {
        title: "Memory",
        blurb: "Words and addresses, kinds of RAM and ROM, and why cache works.",
        lessons: [
          { slug: "ram-and-rom", title: "Memory: Words, Addresses, RAM and ROM", duration: "12 min", Component: OrgRam },
          { slug: "memory-hierarchy", title: "The Memory Hierarchy and Cache", duration: "11 min", Component: OrgHierarchy },
        ],
      },
      {
        title: "Storage",
        blurb: "Where data lives when the power's off: disks, flash and light.",
        lessons: [
          { slug: "hard-disks", title: "Hard Disks", duration: "10 min", Component: OrgHdd },
          { slug: "ssds-and-optical", title: "SSDs and Optical Discs", duration: "10 min", Component: OrgSsd },
          { slug: "final-quiz", title: "Quiz: Computer Organization", duration: "10 min", kind: "quiz", Component: OrgQuiz },
        ],
      },
    ],
  },
  {
    slug: "logic-design",
    title: "Logic Design",
    tagline: "From a single switch to working memory, one live circuit at a time.",
    description:
      "Build a computer's parts from the bottom up. Flip inputs and watch signals move through real gates, simplify circuits with Karnaugh maps, add numbers with nothing but XOR and AND, and see how a loop of two gates can remember a bit.",
    accent: "neon",
    status: "available",
    number: "07",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "Signals",
        blurb: "Why digital hardware settles for two values, and what a clock does.",
        lessons: [
          { slug: "signals", title: "Signals: Why Computers Use Only Two Values", duration: "9 min", Component: LdSignals },
        ],
      },
      {
        title: "Numbers and Codes",
        blurb: "Binary, hex, negative numbers, and agreeing on what a pattern of bits means.",
        lessons: [
          { slug: "number-systems", title: "Number Systems", duration: "12 min", Component: LdNumbers },
          { slug: "binary-arithmetic", title: "Binary Arithmetic and Negative Numbers", duration: "12 min", Component: LdArithmetic },
          { slug: "codes-and-floating-point", title: "Codes and Floating Point", duration: "13 min", Component: LdCodes },
          { slug: "numbers-quiz", title: "Quiz: Numbers and Codes", duration: "8 min", kind: "quiz", Component: LdNumbersQuiz },
        ],
      },
      {
        title: "Gates and Boolean Algebra",
        blurb: "The eight gates, the algebra that describes them, and how to make circuits smaller.",
        lessons: [
          { slug: "logic-gates", title: "Logic Gates", duration: "10 min", Component: LdGates },
          { slug: "boolean-algebra", title: "Boolean Algebra", duration: "14 min", Component: LdBoolean },
          { slug: "sop-and-pos", title: "Truth Tables to Circuits: SOP and POS", duration: "11 min", Component: LdSop },
          { slug: "karnaugh-maps", title: "Karnaugh Maps", duration: "14 min", Component: LdKmap },
          { slug: "universal-gates", title: "Universal Gates: Everything from NAND", duration: "9 min", Component: LdUniversal },
          { slug: "gates-quiz", title: "Quiz: Gates and Boolean Algebra", duration: "8 min", kind: "quiz", Component: LdGatesQuiz },
        ],
      },
      {
        title: "Combinational Building Blocks",
        blurb: "Adders, comparators, decoders, encoders and multiplexers: the parts a CPU is made of.",
        lessons: [
          { slug: "adders", title: "Adders: Teaching Gates to Count", duration: "11 min", Component: LdAdders },
          { slug: "fast-carries", title: "Ripple Carry and Look-Ahead", duration: "9 min", Component: LdCarries },
          { slug: "comparators-decoders-encoders", title: "Comparators, Decoders and Encoders", duration: "13 min", Component: LdDecoders },
          { slug: "multiplexers", title: "Multiplexers and Demultiplexers", duration: "9 min", Component: LdMux },
          { slug: "building-blocks-quiz", title: "Quiz: Combinational Building Blocks", duration: "7 min", kind: "quiz", Component: LdBlocksQuiz },
        ],
      },
      {
        title: "Sequential Logic",
        blurb: "Feedback gives circuits memory: latches, flip-flops, registers, counters and RAM.",
        lessons: [
          { slug: "sr-latch", title: "The SR Latch: How a Circuit Remembers", duration: "15 min", Component: LdSr },
          { slug: "d-latch-and-clock", title: "Control Inputs and the D Latch", duration: "11 min", Component: LdDLatch },
          { slug: "flip-flops", title: "Flip-Flops: Changing Only on the Edge", duration: "13 min", Component: LdFlipFlops },
          { slug: "registers", title: "Registers and Shift Registers", duration: "10 min", Component: LdRegisters },
          { slug: "counters", title: "Binary Counters", duration: "8 min", Component: LdCounters },
          { slug: "memory-unit", title: "The Memory Unit: Putting It All Together", duration: "10 min", Component: LdMemory },
          { slug: "sequential-quiz", title: "Quiz: Sequential Logic", duration: "10 min", kind: "quiz", Component: LdSeqQuiz },
        ],
      },
    ],
  },
  {
    slug: "microprocessors",
    title: "Microprocessors",
    tagline: "Program a real 8086, one instruction at a time.",
    description:
      "Learn a real processor from the inside: its registers, flags, segments and addressing modes. Then write assembly and step through it in the browser, watching every register, flag and stack entry change.",
    accent: "orange",
    status: "available",
    number: "08",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "The 8086",
        blurb: "A real chip: its two units, its registers and its flags.",
        lessons: [
          { slug: "inside-the-8086", title: "Inside the 8086", duration: "11 min", Component: MpInside },
          { slug: "registers", title: "The 8086's Registers", duration: "11 min", Component: MpRegisters },
          { slug: "flags", title: "The Flags Register", duration: "10 min", Component: MpFlags },
        ],
      },
      {
        title: "Addressing Memory",
        blurb: "How 16-bit registers reach 1 MB, and the ways of saying where data is.",
        lessons: [
          { slug: "segments-and-addresses", title: "Segments and Physical Addresses", duration: "12 min", Component: MpSegments },
          { slug: "addressing-modes", title: "Addressing Modes", duration: "13 min", Component: MpModes },
        ],
      },
      {
        title: "Programming in Assembly",
        blurb: "Write and step through real programs in the browser.",
        lessons: [
          { slug: "first-program", title: "Your First Program", duration: "12 min", kind: "practical", Component: MpFirst },
          { slug: "arithmetic-and-logic", title: "Arithmetic and Logic Instructions", duration: "15 min", kind: "practical", Component: MpArith },
          { slug: "jumps-and-loops", title: "Jumps and Loops", duration: "14 min", kind: "practical", Component: MpJumps },
          { slug: "stack-and-procedures", title: "The Stack and Procedures", duration: "13 min", kind: "practical", Component: MpStack },
        ],
      },
      {
        title: "Talking to the Outside World",
        blurb: "Interrupts, bus timing and the modes modern chips run in.",
        lessons: [
          { slug: "interrupts", title: "Interrupts", duration: "11 min", Component: MpInterrupts },
          { slug: "bus-cycles", title: "Reading from Memory: The Bus Cycle", duration: "9 min", Component: MpBusCycles },
          { slug: "final-quiz", title: "Quiz: Microprocessors", duration: "10 min", kind: "quiz", Component: MpQuiz },
        ],
      },
    ],
  },
  {
    slug: "computer-architecture",
    title: "Computer Architecture",
    tagline: "What actually makes a computer fast.",
    description:
      "Instruction sets, RISC and CISC, control units, cache, virtual memory, I/O, pipelines and parallelism. Run a cache simulator, cause a pipeline hazard and fix it, and take a page fault, with every abstract term shown working.",
    accent: "violet",
    status: "available",
    number: "09",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "Foundations",
        blurb: "What architecture means, and what you should already know.",
        lessons: [
          { slug: "architecture-and-organization", title: "Architecture and Organization", duration: "7 min", Component: ArchIntro },
        ],
      },
      {
        title: "Instructions and Control",
        blurb: "What the hardware promises software, and how to measure it.",
        lessons: [
          { slug: "instruction-formats", title: "Instruction Formats", duration: "10 min", Component: ArchFormats },
          { slug: "risc-and-cisc", title: "RISC and CISC", duration: "10 min", Component: ArchRisc },
          { slug: "measuring-performance", title: "Measuring Performance", duration: "12 min", Component: ArchPerf },
          { slug: "control-unit", title: "The Control Unit", duration: "9 min", Component: ArchControl },
        ],
      },
      {
        title: "The Storage System",
        blurb: "Bandwidth, interleaving, cache design and virtual memory.",
        lessons: [
          { slug: "main-memory", title: "Main Memory Performance", duration: "9 min", Component: ArchMemory },
          { slug: "cache-mapping", title: "Cache Mapping", duration: "15 min", Component: ArchMapping },
          { slug: "cache-policies", title: "Cache Policies: Replacement, Writes and Block Size", duration: "13 min", Component: ArchPolicies },
          { slug: "virtual-memory", title: "Virtual Memory", duration: "14 min", Component: ArchVm },
        ],
      },
      {
        title: "Input and Output",
        blurb: "Moving data to and from devices without wasting the CPU.",
        lessons: [
          { slug: "io-methods", title: "Input and Output", duration: "10 min", Component: ArchIo },
          { slug: "buses-and-arbitration", title: "Buses and Arbitration", duration: "9 min", Component: ArchArbiter },
        ],
      },
      {
        title: "Parallelism",
        blurb: "Overlapping instructions, the hazards that follow, and many processors at once.",
        lessons: [
          { slug: "pipelining", title: "Pipelining", duration: "12 min", Component: ArchPipe },
          { slug: "pipeline-hazards", title: "Pipeline Hazards", duration: "14 min", Component: ArchHazards },
          { slug: "parallel-processing", title: "Parallel Processing", duration: "13 min", Component: ArchParallel },
          { slug: "final-quiz", title: "Quiz: Computer Architecture", duration: "12 min", kind: "quiz", Component: ArchQuiz },
        ],
      },
    ],
  },
  {
    slug: "operating-systems",
    title: "Operating Systems",
    tagline: "The invisible layer that makes everything work.",
    description:
      "What really happens between your click and the hardware. Interrupts and system calls, processes and threads, synchronization, CPU scheduling, main memory and virtual memory, plus hands-on Linux and threads labs. Every lesson follows the lectures and labs, in plain language, with animations you can step through.",
    accent: "mint",
    status: "available",
    number: "10",
    authors: [asmaaFarouq],
    modules: [
      {
        title: "Meet the Operating System",
        blurb: "What an OS is, how the hardware underneath it works, and how the OS is built.",
        lessons: [
          { slug: "what-an-os-does", title: "What an Operating System Does", duration: "18 min", Component: OsWhatAnOsDoes },
          { slug: "os-architecture-and-operations", title: "Inside the OS: Architecture, Operations and Environments", duration: "22 min", Component: OsArchitecture },
          { slug: "services-and-system-calls", title: "OS Services, Interfaces and System Calls", duration: "18 min", Component: OsServicesSyscalls },
          { slug: "os-design-and-structure", title: "System Programs, OS Design and Structure", duration: "20 min", Component: OsDesignStructure },
          { slug: "lab-linux-commands", title: "Lab: Linux and the Command Line", duration: "25 min", kind: "practical", Component: OsLabLinux },
        ],
      },
      {
        title: "Processes and Threads",
        blurb: "A program in motion: its states, how the OS switches between processes, how they talk, and threads.",
        lessons: [
          { slug: "processes", title: "Processes: The Program in Motion", duration: "22 min", Component: OsProcesses },
          { slug: "interprocess-communication", title: "Interprocess Communication", duration: "22 min", Component: OsIpc },
          { slug: "lab-java-threads", title: "Lab: Threads in Java", duration: "25 min", kind: "practical", Component: OsLabThreads },
        ],
      },
      {
        title: "Process Synchronization",
        blurb: "When processes share data: race conditions, critical sections, locks, semaphores and the classic problems.",
        lessons: [
          { slug: "critical-section-problem", title: "Race Conditions and the Critical-Section Problem", duration: "24 min", Component: OsCriticalSection },
          { slug: "semaphores-and-classic-problems", title: "Semaphores and the Classic Synchronization Problems", duration: "26 min", Component: OsSemaphores },
          { slug: "lab-java-synchronization", title: "Lab: Synchronization in Java", duration: "25 min", kind: "practical", Component: OsLabSync },
        ],
      },
      {
        title: "CPU Scheduling",
        blurb: "Who runs next? FCFS, SJF, priority, round robin and multilevel queues, and how to judge them.",
        lessons: [
          { slug: "cpu-scheduling-basics", title: "CPU Scheduling: FCFS, SJF and Priority", duration: "26 min", Component: OsSchedulingBasics },
          { slug: "round-robin-and-beyond", title: "Round Robin, Multilevel Queues and Choosing a Scheduler", duration: "24 min", Component: OsRoundRobin },
        ],
      },
      {
        title: "Memory Management",
        blurb: "Sharing RAM safely: addresses and the MMU, swapping, allocation, segmentation, paging and virtual memory.",
        lessons: [
          { slug: "memory-allocation", title: "Main Memory: Addresses, Swapping and Allocation", duration: "26 min", Component: OsMemoryAllocation },
          { slug: "paging", title: "Paging", duration: "26 min", Component: OsPaging },
          { slug: "virtual-memory", title: "Virtual Memory and Demand Paging", duration: "24 min", Component: OsVirtualMemory },
          { slug: "page-replacement-and-thrashing", title: "Page Replacement and Thrashing", duration: "28 min", Component: OsPageReplacement },
        ],
      },
    ],
  },
  {
    slug: "distributed-systems",
    title: "Distributed Systems",
    tagline: "Building reliable software out of unreliable parts.",
    description:
      "Consistency, availability, and the CAP theorem. This course decodes how massive systems stay synchronized across the globe, from Paxos to Raft and the tradeoffs of microservices.",
    accent: "mint",
    status: "coming-soon",
    number: "11",
    modules: [],
  },
  {
    slug: "the-exam-mind",
    title: "The Exam Mind",
    tagline: "How to think clearly when the pressure is on.",
    description:
      "Exams test mental endurance and strategy as much as knowledge. This course covers how memory works, how to plan the week before, and how to handle stress in the exam room and on the day itself.",
    accent: "sky",
    status: "available",
    number: "12",
    authors: [ahmedAlghali],
    modules: [
      {
        title: "The Strategy",
        blurb: "Why the usual way of studying fails, and a week-long plan built on how memory works.",
        lessons: [
          { slug: "the-problem-with-how-you-study", title: "The Problem with How You Study", duration: "10 min", Component: ExamMindLesson01 },
          { slug: "the-one-week-plan", title: "The One-Week Plan", duration: "12 min", Component: ExamMindLesson02 },
        ],
      },
      {
        title: "The Execution",
        blurb: "What stress does to recall, and how to get through exam day.",
        lessons: [
          { slug: "stress-and-anxiety", title: "Stress & Anxiety", duration: "8 min", Component: ExamMindLesson03 },
          { slug: "exam-day", title: "Exam Day", duration: "7 min", Component: ExamMindLesson04 },
        ],
      },
    ],
  },
];

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug);
}

export function getLesson(courseSlug: string, lessonSlug: string) {
  const course = getCourse(courseSlug);
  if (!course) return null;
  for (const m of course.modules) {
    const lesson = m.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) return { course, module: m, lesson };
  }
  return null;
}

export function flattenLessons(course: Course): Lesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

export function lessonNeighbors(courseSlug: string, lessonSlug: string) {
  const course = getCourse(courseSlug);
  if (!course) return { prev: null, next: null };
  const flat = flattenLessons(course);
  const idx = flat.findIndex((l) => l.slug === lessonSlug);
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}
