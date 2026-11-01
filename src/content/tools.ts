/* Real tools mapped to the lessons that explain them. Each `mentions` is checked against the lesson's text
   by src/test/paths-and-tools.test.ts, so a link can't claim something the lesson doesn't cover. */

export type ToolLesson = { course: string; lesson: string; mentions: string };
export type Tool = { name: string; what: string; lessons: ToolLesson[] };

export const tools: Tool[] = [
  {
    name: "Regex engines",
    what: "grep, your editor's find box and form validators all run the machines from this theory.",
    lessons: [
      { course: "theory-of-computation", lesson: "nfa", mentions: "regex" },
      { course: "theory-of-computation", lesson: "regular-expressions", mentions: "grep" },
      { course: "theory-of-computation", lesson: "regex-playground", mentions: "regex" },
    ],
  },
  {
    name: "Compilers and parsers",
    what: "How a program turns source code or JSON into a structure it can work with.",
    lessons: [
      { course: "theory-of-computation", lesson: "context-free-grammars", mentions: "parser" },
      { course: "theory-of-computation", lesson: "pushdown-automata", mentions: "JSON" },
      { course: "microprocessors", lesson: "stack-and-procedures", mentions: "compiler" },
    ],
  },
  {
    name: "Hash maps",
    what: "Python dicts, JavaScript objects and Java HashMaps, and why they're usually so fast.",
    lessons: [
      { course: "advanced-algorithms", lesson: "hashing", mentions: "hash" },
      { course: "advanced-algorithms", lesson: "collision-resolution", mentions: "hash" },
      { course: "advanced-algorithms", lesson: "lab-hashing", mentions: "hash" },
      { course: "discrete-mathematics", lesson: "pigeonhole-principle", mentions: "hash table" },
      { course: "discrete-mathematics", lesson: "birthday-problem", mentions: "hash table" },
      { course: "data-structures", lesson: "hash-maps", mentions: "load factor" },
    ],
  },
  {
    name: "Database indexes",
    what: "Why looking up one row among millions doesn't mean reading them all.",
    lessons: [
      { course: "algorithm-design-and-analysis", lesson: "linear-and-binary-search", mentions: "index" },
      { course: "advanced-algorithms", lesson: "balanced-search-trees", mentions: "B-tree" },
      { course: "data-structures", lesson: "binary-search-trees", mentions: "B-tree" },
    ],
  },
  {
    name: "Redis",
    what: "The data structure behind its sorted sets.",
    lessons: [{ course: "advanced-algorithms", lesson: "skip-lists", mentions: "Redis" }],
  },
  {
    name: "File compression",
    what: "How zip-style formats make common data take fewer bits.",
    lessons: [
      { course: "advanced-algorithms", lesson: "huffman-and-activity-selection", mentions: "Huffman" },
      { course: "discrete-mathematics", lesson: "pigeonhole-principle", mentions: "gzip" },
    ],
  },
  {
    name: "Python lists, ArrayList and vector",
    what: "Why appending is fast, inserting at the front is slow, and what happens when the list fills up.",
    lessons: [
      { course: "data-structures", lesson: "arrays-and-memory", mentions: "cache" },
      { course: "data-structures", lesson: "dynamic-arrays", mentions: "ArrayList" },
    ],
  },
  {
    name: "Autocomplete and search boxes",
    what: "How suggestions appear as you type, one step per letter.",
    lessons: [{ course: "data-structures", lesson: "tries", mentions: "autocomplete" }],
  },
  {
    name: "Package managers and build tools",
    what: "How npm, make and Airflow decide what runs first, and why they reject circular dependencies.",
    lessons: [
      { course: "discrete-mathematics", lesson: "relations", mentions: "partial order" },
      { course: "discrete-mathematics", lesson: "paths-and-dags", mentions: "npm" },
    ],
  },
  {
    name: "Passwords and hashes",
    what: "Why length beats complexity, and how many bits a hash or random ID really needs.",
    lessons: [
      { course: "discrete-mathematics", lesson: "sum-and-product-rules", mentions: "password" },
      { course: "discrete-mathematics", lesson: "birthday-problem", mentions: "SHA-256" },
    ],
  },
  {
    name: "Encryption",
    what: "The number theory that secures HTTPS and RSA.",
    lessons: [
      { course: "computational-mathematics", lesson: "primality-and-the-totient", mentions: "RSA" },
      { course: "computational-mathematics", lesson: "order-and-primitive-roots", mentions: "Diffie" },
      { course: "computational-mathematics", lesson: "modular-inverses", mentions: "RSA" },
    ],
  },
  {
    name: "Machine learning and GPUs",
    what: "The matrix maths and parallel hardware that training a model comes down to.",
    lessons: [
      { course: "computational-mathematics", lesson: "multiplying-matrices", mentions: "GPU" },
      { course: "computational-mathematics", lesson: "derivatives-and-curve-fitting", mentions: "neural" },
      { course: "computer-architecture", lesson: "parallel-processing", mentions: "GPU" },
    ],
  },
  {
    name: "CPU caches",
    what: "Why the same code can run far faster depending on how it touches memory.",
    lessons: [
      { course: "computer-organization", lesson: "memory-hierarchy", mentions: "cache" },
      { course: "computer-architecture", lesson: "cache-mapping", mentions: "cache" },
      { course: "computer-architecture", lesson: "cache-policies", mentions: "cache" },
    ],
  },
  {
    name: "Assembly and debuggers",
    what: "What's left of your program by the time the processor runs it.",
    lessons: [
      { course: "microprocessors", lesson: "first-program", mentions: "assembl" },
      { course: "microprocessors", lesson: "registers", mentions: "register" },
      { course: "microprocessors", lesson: "stack-and-procedures", mentions: "stack" },
    ],
  },
];
