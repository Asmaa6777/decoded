/* Editorial guidance on where to start and what to read first. Slugs are checked by src/test/paths-and-tools.test.ts. */

export type LearningPath = { slug: string; title: string; description: string; courses: string[] };

export const learningPaths: LearningPath[] = [
  {
    slug: "start-here",
    title: "New to computer science",
    description: "Get comfortable with the machine, learn the maths every course leans on, learn to think in algorithms, and learn how to study for all of it.",
    courses: ["computer-literacy", "the-exam-mind", "discrete-mathematics", "algorithm-design-and-analysis"],
  },
  {
    slug: "the-machine",
    title: "How a computer really works",
    description: "From a single logic gate up to pipelines and caches.",
    courses: ["logic-design", "computer-organization", "microprocessors", "computer-architecture"],
  },
  {
    slug: "algorithms",
    title: "Algorithms in depth",
    description: "From proofs and counting to your first sort and the core data structures, then hashing, balanced trees, dynamic programming and P vs NP.",
    courses: ["discrete-mathematics", "algorithm-design-and-analysis", "data-structures", "computational-mathematics", "advanced-algorithms"],
  },
  {
    slug: "languages",
    title: "How languages are read",
    description: "The theory behind regex engines, parsers and compilers.",
    courses: ["discrete-mathematics", "theory-of-computation", "microprocessors"],
  },
  {
    slug: "systems",
    title: "From one machine to the internet",
    description: "How a computer runs programs, how the OS shares it between them, and how machines talk across the world.",
    courses: ["computer-organization", "operating-systems", "computer-networks"],
  },
];

/** Courses that make a course easier. Nothing is locked; these are only suggestions. */
export const prerequisites: Record<string, string[]> = {
  "algorithm-design-and-analysis": ["discrete-mathematics"],
  "advanced-algorithms": ["algorithm-design-and-analysis", "discrete-mathematics", "data-structures"],
  "computational-mathematics": ["discrete-mathematics"],
  "theory-of-computation": ["discrete-mathematics"],
  "distributed-systems": ["operating-systems", "computer-networks"],
  "computer-organization": ["computer-literacy"],
  "operating-systems": ["computer-organization", "data-structures"],
  "computer-graphics": ["computer-organization"],
  microprocessors: ["logic-design", "computer-organization"],
  "computer-architecture": ["computer-organization", "microprocessors"],
};
