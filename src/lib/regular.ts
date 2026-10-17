/* Regular expressions in the textbook notation the course and its exams use:
   + is union (not "one or more"), * is Kleene star, juxtaposition is
   concatenation, and ε (or λ / Λ) is the empty string. Symbols are single
   letters or digits. Everything here is pure so it can be tested directly. */

export type Re =
  | { t: "sym"; c: string }
  | { t: "eps" }
  | { t: "union"; a: Re; b: Re }
  | { t: "concat"; a: Re; b: Re }
  | { t: "star"; a: Re };

export class ReError extends Error {}

const EPS = new Set(["ε", "λ", "Λ"]);

/** Parses textbook notation into a syntax tree. Spaces are ignored. */
export function parseRe(src: string): Re {
  const s = src.replace(/\s+/g, "");
  if (!s) throw new ReError("Type a regular expression, for example (a+b)*abb.");
  let i = 0;

  const atomStart = (c: string | undefined) => c !== undefined && (c === "(" || EPS.has(c) || /[a-z0-9]/i.test(c));

  function union(): Re {
    let left = concat();
    while (s[i] === "+") {
      i++;
      left = { t: "union", a: left, b: concat() };
    }
    return left;
  }
  function concat(): Re {
    if (!atomStart(s[i])) throw new ReError(s[i] ? `Unexpected "${s[i]}" at position ${i + 1}.` : "The expression ends too early.");
    let left = star();
    while (atomStart(s[i])) left = { t: "concat", a: left, b: star() };
    return left;
  }
  function star(): Re {
    let node = atom();
    while (s[i] === "*") {
      i++;
      node = { t: "star", a: node };
    }
    return node;
  }
  function atom(): Re {
    const c = s[i];
    if (c === "(") {
      i++;
      const inner = union();
      if (s[i] !== ")") throw new ReError("A bracket is opened but never closed.");
      i++;
      return inner;
    }
    i++;
    return EPS.has(c) ? { t: "eps" } : { t: "sym", c };
  }

  const tree = union();
  if (i < s.length) throw new ReError(s[i] === ")" ? "A bracket is closed but never opened." : `Unexpected "${s[i]}" at position ${i + 1}.`);
  return tree;
}

/** Every word of the language with length at most maxLen. */
export function wordsUpTo(re: Re, maxLen: number): Set<string> {
  switch (re.t) {
    case "eps":
      return new Set([""]);
    case "sym":
      return maxLen >= 1 ? new Set([re.c]) : new Set();
    case "union":
      return new Set([...wordsUpTo(re.a, maxLen), ...wordsUpTo(re.b, maxLen)]);
    case "concat": {
      const out = new Set<string>();
      const right = wordsUpTo(re.b, maxLen);
      for (const x of wordsUpTo(re.a, maxLen)) for (const y of right) if (x.length + y.length <= maxLen) out.add(x + y);
      return out;
    }
    case "star": {
      const base = [...wordsUpTo(re.a, maxLen)].filter((w) => w.length > 0);
      const out = new Set([""]);
      let frontier = [""];
      while (frontier.length) {
        const next: string[] = [];
        for (const x of frontier) {
          for (const y of base) {
            const w = x + y;
            if (w.length <= maxLen && !out.has(w)) {
              out.add(w);
              next.push(w);
            }
          }
        }
        frontier = next;
      }
      return out;
    }
  }
}

/** Shortest first, then alphabetical: the order exam answers list words in. */
export const shortlex = (a: string, b: string) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);

/** The first `count` words in shortlex order, searching up to length `limit`. */
export function firstWords(re: Re, count: number, limit = 14): string[] {
  for (let len = 1; ; len++) {
    const words = [...wordsUpTo(re, len)].sort(shortlex);
    // Once a length bound yields enough words, every shorter word is already included.
    if (words.length >= count || len >= limit) return words.slice(0, count);
  }
}

/** Symbols the expression mentions, sorted. */
export function alphabetOf(re: Re): string[] {
  const out = new Set<string>();
  const walk = (r: Re) => {
    if (r.t === "sym") out.add(r.c);
    else if (r.t === "union" || r.t === "concat") {
      walk(r.a);
      walk(r.b);
    } else if (r.t === "star") walk(r.a);
  };
  walk(re);
  return [...out].sort();
}

/** Every string over `sigma` up to `maxLen`, in shortlex order. */
export function allStrings(sigma: string[], maxLen: number): string[] {
  const out = [""];
  let layer = [""];
  for (let n = 1; n <= maxLen; n++) {
    layer = layer.flatMap((w) => sigma.map((c) => w + c));
    out.push(...layer);
  }
  return out;
}

/**
 * Compares two expressions on every string over `sigma` up to `maxLen` and
 * returns the shortest string they disagree on, or null if none does. With
 * maxLen around 8 this catches the mistakes students actually make.
 */
export function firstDifference(answer: Re, reference: Re, sigma: string[], maxLen = 8): { word: string; inAnswer: boolean } | null {
  const a = wordsUpTo(answer, maxLen);
  const r = wordsUpTo(reference, maxLen);
  for (const w of allStrings(sigma, maxLen)) {
    if (a.has(w) !== r.has(w)) return { word: w, inAnswer: a.has(w) };
  }
  return null;
}

/** Prints a tree back in textbook notation with the fewest brackets. */
export function showRe(re: Re): string {
  const prec = (r: Re) => (r.t === "union" ? 0 : r.t === "concat" ? 1 : 2);
  const wrap = (r: Re, min: number) => (prec(r) < min ? `(${showRe(r)})` : showRe(r));
  switch (re.t) {
    case "eps":
      return "ε";
    case "sym":
      return re.c;
    case "union":
      return `${wrap(re.a, 0)}+${wrap(re.b, 0)}`;
    case "concat":
      return `${wrap(re.a, 1)}${wrap(re.b, 1)}`;
    case "star":
      return `${wrap(re.a, 2)}*`;
  }
}
