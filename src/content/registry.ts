import type { ComponentType } from "react";

// Lesson MDX modules (eagerly loaded so we can render synchronously)
import TocIntro from "@/content/theory-of-computation/m0-01-intro.mdx";
import TocLanguageOfLanguages from "@/content/theory-of-computation/m0-02-language-of-languages.mdx";
import TocHowToReadAMachine from "@/content/theory-of-computation/m0-03-how-to-read-a-machine.mdx";
import TocAutomata from "@/content/theory-of-computation/m1-02-automata.mdx";
import TocStatesSymbols from "@/content/theory-of-computation/m1-01-states-symbols.mdx"
import LitTyping from "@/content/computer-literacy/01-physical-layer.mdx";
import LitLanguage from "@/content/computer-literacy/02-language-layer.mdx";
import LitSystems from "@/content/computer-literacy/03-systems-layer.mdx";
import ExamMindLesson01 from "@/content/the-exam-mind/01-the-problem-with-how-you-study.mdx";
import ExamMindLesson02 from "@/content/the-exam-mind/02-the-one-week-plan.mdx";
import ExamMindLesson03 from "@/content/the-exam-mind/03-stress-and-anxiety.mdx";
import ExamMindLesson04 from "@/content/the-exam-mind/04-exam-day.mdx";


export type Lesson = {
  slug: string;
  title: string;
  duration: string; // e.g. "8 min"
  Component: ComponentType<Record<string, unknown>>;
};

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
          { slug: "how-to-read-a-machine", title: "How to Read a Machine", duration: "9 min", Component: TocHowToReadAMachine },
        ],
      },
      {
        title: "Finite Automata",
        blurb: "The first formal computing model — and the engine behind every regex.",
        lessons: [
          { slug: "states-symbols-and-transitions", title: "States, Symbols, and Transitions", duration: "10 min", Component: TocStatesSymbols },
          { slug: "automata", title: "Finite Automata → Regex Engines", duration: "9 min", Component: TocAutomata },
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
    slug: "algorithms-complexity",
    title: "Algorithms & Complexity",
    tagline: "The math behind efficiency — and the hard limits of what can be solved.",
    description:
      "Sorting and searching are just the surface. This course dives into Big O, P vs NP, and the algorithms that power everything from routing to genome sequencing. Decoded into the logic that helps you write code that scales.",
    accent: "sky",
    status: "coming-soon",
    number: "03",
    modules: [],
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
