import type { ComponentType } from "react";

// Lesson MDX modules (eagerly loaded so we can render synchronously)
import TocIntro from "@/content/theory-of-computation/m0-01-intro.mdx";
import TocLanguageOfLanguages from "@/content/theory-of-computation/m0-02-language-of-languages.mdx";
import TocHowToReadAMachine from "@/content/theory-of-computation/m0-03-how-to-read-a-machine.mdx";
import TocGrammars from "@/content/theory-of-computation/m0-04-grammars.mdx";
import TocStatesSymbols from "@/content/theory-of-computation/m1-01-states-symbols.mdx";
import TocNfa from "@/content/theory-of-computation/m1-02-nfa.mdx";
import TocRegexPlayground from "@/content/theory-of-computation/m1-03-regex-playground.mdx";
import TocFiniteAutomataQuiz from "@/content/theory-of-computation/m1-04-finite-automata-quiz.mdx";
import TocLimitsOfFiniteMemory from "@/content/theory-of-computation/m2-01-limits-of-finite-memory.mdx";
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
import ExamMindLesson01 from "@/content/the-exam-mind/01-the-problem-with-how-you-study.mdx";
import ExamMindLesson02 from "@/content/the-exam-mind/02-the-one-week-plan.mdx";
import ExamMindLesson03 from "@/content/the-exam-mind/03-stress-and-anxiety.mdx";
import ExamMindLesson04 from "@/content/the-exam-mind/04-exam-day.mdx";


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
          { slug: "regex-playground", title: "Practical: Building Regex from Automata", duration: "10 min", kind: "practical", Component: TocRegexPlayground },
          { slug: "finite-automata-quiz", title: "Quiz: Finite Automata & Regex", duration: "6 min", kind: "quiz", Component: TocFiniteAutomataQuiz },
        ],
      },
      {
        title: "Pushdown Automata",
        blurb: "Where finite memory runs out — and the one stack that fixes nesting.",
        lessons: [
          { slug: "limits-of-finite-memory", title: "The Limits of Finite Memory", duration: "12 min", Component: TocLimitsOfFiniteMemory },
        ],
      },
    ],
  },
  {
    slug: "computer-literacy",
    title: "Computer Literacy",
    tagline: "The fluency needed to be one with the machine",
    description:
      "Everything about computing is interaction. The more precise your way of speaking to the machine, the more effective you become. There are three layers to that: physical, language, systems. Built from years of observation about what separates fluent users from frustrated ones.",
    accent: "orange",
    status: "available",
    number: "02",
    modules: [
      {
        title: "The Three Layers of Fluency",
        blurb: "Each layer helps removing friction between intention and execution.",
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
        blurb: "Four ways to put things in order, and why the fastest on paper isn't always the one you want.",
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
    slug: "operating-systems",
    title: "Operating Systems",
    tagline: "The invisible layer that makes everything work.",
    description:
      "Processes, memory, file systems, schedulers — and where each shows up the moment something goes wrong. Coming soon.",
    accent: "violet",
    status: "coming-soon",
    number: "04",
    modules: [],
  },
  {
    slug: "distributed-systems",
    title: "Distributed Systems",
    tagline: "Building reliable software out of unreliable parts.",
    description:
      "Consistency, availability, and the CAP theorem. This course decodes how massive systems stay synchronized across the globe, from Paxos to Raft and the tradeoffs of microservices.",
    accent: "mint",
    status: "coming-soon",
    number: "05",
    modules: [],
  },
  {
    slug: "the-exam-mind",
    title: "The Exam Mind",
    tagline: "Mental mastery for high-pressure moments..",
    description:
      "Exams are as much about mental endurance and strategy as they are about knowledge. This course decodes the psychology of performance, memory optimization, and the tactical frameworks used by top performers to excel under pressure.",
    accent: "sky",
    status: "available",
    number: "06",
    modules: [
      {
        title: "The Strategy",
        blurb: "Breaking old habits and building a framework that actually works for memory and recall.",
        lessons: [
          { slug: "the-problem-with-how-you-study", title: "The Problem with How You Study", duration: "10 min", Component: ExamMindLesson01 },
          { slug: "the-one-week-plan", title: "The One-Week Plan", duration: "12 min", Component: ExamMindLesson02 },
        ],
      },
      {
        title: "The Execution",
        blurb: "Mastering the mental game and navigating the high-pressure reality of exam day.",
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
