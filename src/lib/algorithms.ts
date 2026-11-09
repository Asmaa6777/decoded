/* ============================================================
   Algorithm frame generators.

   Each generator runs a real algorithm and records a "frame" at
   every meaningful moment: a snapshot of the state, the line of
   Java source being executed, a plain-English message, and running
   counters (comparisons, swaps, ...). The visualizers in
   src/components/mdx/AlgoVisualizers.tsx only replay these frames,
   so all the logic lives here and is unit-tested directly.
   ============================================================ */

export type Frame<S> = {
  state: S;
  line: number; // 0-based index into the matching JAVA_* source
  message: string;
  stats: Record<string, number>;
};

/* ---------------------------- arrays ---------------------------- */

export type ArrayState = {
  array: number[];
  compare?: number[]; // indices being compared right now
  write?: number[]; // indices being swapped / shifted / written
  sorted?: number[]; // indices in their final position
  pivot?: number;
  range?: [number, number]; // active window; everything else is dimmed
  pointers?: Record<string, number>; // labels drawn under indices
  held?: { label: string; value: number; id?: number }; // a value held outside the array (insertion key)
  ids?: number[]; // stable identity per slot, so a view can animate elements moving between slots
  gap?: number; // a slot whose value has been lifted out (insertion sort's hole)
  split?: number; // indices < split form the sorted prefix (insertion sort's "hand")
  aux?: (number | null)[]; // merge sort's temporary buffer
  auxIds?: (number | null)[]; // identity of each element sitting in aux
  auxWrite?: number[]; // aux slots written this step
  holes?: number[]; // array slots whose element has moved down into aux
  cuts?: number[]; // split points b (between b - 1 and b) that have not been merged back yet
  stack?: [number, number][]; // active recursive calls as [lo, hi], outermost first
  marks?: { from: number; to: number; label: string }[]; // labelled spans under the array
  found?: number;
};

export type SortAlgorithm = "selection" | "bubble" | "insertion" | "merge" | "quick";
export type SearchAlgorithm = "linear" | "binary";

export const JAVA_SORT: Record<SortAlgorithm, string[]> = {
  selection: [
    "static void selectionSort(int[] a) {",
    "    for (int i = 0; i < a.length - 1; i++) {",
    "        int min = i;                      // assume a[i] is the smallest",
    "        for (int j = i + 1; j < a.length; j++) {",
    "            if (a[j] < a[min]) {",
    "                min = j;                  // found a smaller one",
    "            }",
    "        }",
    "        swap(a, i, min);                  // put it in position i",
    "    }",
    "}",
  ],
  bubble: [
    "static void bubbleSort(int[] a) {",
    "    for (int i = 0; i < a.length - 1; i++) {",
    "        boolean swapped = false;",
    "        for (int j = 0; j < a.length - 1 - i; j++) {",
    "            if (a[j + 1] < a[j]) {",
    "                swap(a, j, j + 1);        // neighbours out of order",
    "                swapped = true;",
    "            }",
    "        }",
    "        if (!swapped) break;              // no swaps = already sorted",
    "    }",
    "}",
  ],
  insertion: [
    "static void insertionSort(int[] a) {",
    "    for (int i = 1; i < a.length; i++) {",
    "        int key = a[i];                   // pick up the next card",
    "        int j = i - 1;",
    "        while (j >= 0 && a[j] > key) {",
    "            a[j + 1] = a[j];              // shift bigger one right",
    "            j--;",
    "        }",
    "        a[j + 1] = key;                   // drop the card in the gap",
    "    }",
    "}",
  ],
  merge: [
    "static void mergeSort(int[] a, int lo, int hi) {",
    "    if (hi - lo < 1) return;              // 0 or 1 element: sorted",
    "    int mid = (lo + hi) / 2;",
    "    mergeSort(a, lo, mid);                // divide: left half",
    "    mergeSort(a, mid + 1, hi);            // divide: right half",
    "    merge(a, lo, mid, hi);                // combine",
    "}",
    "",
    "static void merge(int[] a, int lo, int mid, int hi) {",
    "    int[] tmp = new int[hi - lo + 1];",
    "    int i = lo, j = mid + 1, k = 0;",
    "    while (i <= mid && j <= hi) {",
    "        if (a[i] <= a[j]) tmp[k++] = a[i++];",
    "        else              tmp[k++] = a[j++];",
    "    }",
    "    while (i <= mid) tmp[k++] = a[i++];   // leftovers",
    "    while (j <= hi)  tmp[k++] = a[j++];",
    "    for (k = 0; k < tmp.length; k++) a[lo + k] = tmp[k];",
    "}",
  ],
  quick: [
    "static void quickSort(int[] a, int lo, int hi) {",
    "    if (lo >= hi) return;                 // 0 or 1 element: sorted",
    "    int p = partition(a, lo, hi);",
    "    quickSort(a, lo, p - 1);",
    "    quickSort(a, p + 1, hi);",
    "}",
    "",
    "static int partition(int[] a, int lo, int hi) {",
    "    int pivot = a[lo];                    // first element is the pivot",
    "    int left = lo, right = hi;",
    "    while (left < right) {",
    "        while (a[right] >= pivot && left < right) right--;",
    "        while (a[left] <= pivot && left < right) left++;",
    "        swap(a, left, right);",
    "    }",
    "    swap(a, lo, right);                   // pivot lands in its final spot",
    "    return right;",
    "}",
  ],
};

export const JAVA_SEARCH: Record<SearchAlgorithm, string[]> = {
  linear: [
    "static int linearSearch(int[] a, int x) {",
    "    for (int i = 0; i < a.length; i++) {",
    "        if (a[i] == x) return i;          // found it",
    "    }",
    "    return -1;                            // checked everything",
    "}",
  ],
  binary: [
    "static int binarySearch(int[] a, int x) {",
    "    int low = 0, high = a.length - 1;",
    "    while (low <= high) {",
    "        int mid = low + (high - low) / 2;",
    "        if (a[mid] == x) return mid;",
    "        else if (a[mid] < x) low = mid + 1;   // go right",
    "        else high = mid - 1;                  // go left",
    "    }",
    "    return -1;",
    "}",
  ],
};

const range = (a: number, b: number) => {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
};

export function sortFrames(algorithm: SortAlgorithm, input: number[]): Frame<ArrayState>[] {
  const a = [...input];
  const n = a.length;
  const frames: Frame<ArrayState>[] = [];
  const stats = { comparisons: 0, writes: 0 };
  const writeLabel = algorithm === "insertion" || algorithm === "merge" ? "writes" : "swaps";
  const sorted = new Set<number>();

  // track which element sits in each slot, so views can slide elements around and tell equal values apart
  const ids = range(0, n - 1);

  const push = (line: number, message: string, s: Omit<ArrayState, "array" | "sorted"> = {}) => {
    frames.push({
      state: { ...s, array: [...a], sorted: [...sorted], ids: [...ids] },
      line,
      message,
      stats: { comparisons: stats.comparisons, [writeLabel]: stats.writes },
    });
  };
  const swap = (i: number, j: number) => {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    stats.writes++;
  };

  push(0, `Start with ${n} unsorted numbers.`, algorithm === "insertion" ? { split: Math.min(1, n) } : {});

  if (algorithm === "selection") {
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      push(2, `Pass ${i + 1}: assume ${a[i]} (index ${i}) is the smallest of what's left.`, { pointers: { i, min }, range: [i, n - 1] });
      for (let j = i + 1; j < n; j++) {
        stats.comparisons++;
        const smaller = a[j] < a[min];
        push(4, `Is ${a[j]} smaller than the current minimum ${a[min]}? ${smaller ? "Yes." : "No."}`, { compare: [j, min], pointers: { i, j, min }, range: [i, n - 1] });
        if (smaller) {
          min = j;
          push(5, `New minimum: ${a[min]} at index ${min}.`, { pointers: { i, j, min }, range: [i, n - 1] });
        }
      }
      if (min !== i) {
        swap(i, min);
        push(8, `Swap the minimum into position ${i}.`, { write: [i, min], pointers: { i, min }, range: [i, n - 1] });
      } else {
        push(8, `${a[i]} is already the minimum — it stays put.`, { pointers: { i }, range: [i, n - 1] });
      }
      sorted.add(i);
    }
    sorted.add(n - 1);
  }

  if (algorithm === "bubble") {
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      push(2, `Pass ${i + 1}: walk left to right, swapping any neighbours that are out of order.`, { range: [0, n - 1 - i] });
      for (let j = 0; j < n - 1 - i; j++) {
        stats.comparisons++;
        const out = a[j + 1] < a[j];
        push(4, `Compare ${a[j]} and ${a[j + 1]}: ${out ? "out of order." : "fine."}`, { compare: [j, j + 1], pointers: { j }, range: [0, n - 1 - i] });
        if (out) {
          swap(j, j + 1);
          swapped = true;
          push(5, `Swap them — the bigger one bubbles right.`, { write: [j, j + 1], pointers: { j }, range: [0, n - 1 - i] });
        }
      }
      sorted.add(n - 1 - i);
      if (!swapped) {
        range(0, n - 1).forEach((k) => sorted.add(k));
        push(9, `No swaps in this pass, so the array is already sorted. Stop early.`);
        break;
      }
      push(1, `${a[n - 1 - i]} has bubbled to its final position.`, { range: [0, n - 1 - i] });
    }
    range(0, n - 1).forEach((k) => sorted.add(k));
  }

  if (algorithm === "insertion") {
    for (let i = 1; i < n; i++) {
      const key = a[i];
      const held = { label: "key", value: key, id: ids[i] };
      const split = i + 1;
      let j = i - 1;
      push(2, `Pick up ${key}. Everything to its left is already in order.`, { held, gap: i, split, pointers: { i } });
      while (j >= 0) {
        stats.comparisons++;
        const bigger = a[j] > key;
        push(4, `Is ${a[j]} bigger than ${key}? ${bigger ? "Yes — it has to move." : "No — the gap is here."}`, { compare: [j], held, gap: j + 1, split, pointers: { i, j } });
        if (!bigger) break;
        a[j + 1] = a[j];
        ids[j + 1] = ids[j];
        stats.writes++;
        push(5, `Shift ${a[j]} one step right.`, { write: [j + 1], held, gap: j, split, pointers: { i, j } });
        j--;
      }
      a[j + 1] = key;
      ids[j + 1] = held.id;
      stats.writes++;
      push(8, `Drop ${key} into index ${j + 1}.`, { write: [j + 1], split, pointers: { i } });
    }
    range(0, n - 1).forEach((k) => sorted.add(k));
  }

  if (algorithm === "merge") {
    const cuts = new Set<number>();
    const stack: [number, number][] = [];
    const rec = (lo: number, hi: number) => {
      stack.push([lo, hi]);
      const at = () => ({ range: [lo, hi] as [number, number], cuts: [...cuts].sort((x, y) => x - y), stack: stack.map(([l, h]) => [l, h] as [number, number]) });
      if (hi - lo < 1) {
        push(1, `[${a.slice(lo, hi + 1).join(", ")}] has one element — already sorted.`, at());
        stack.pop();
        return;
      }
      const mid = Math.floor((lo + hi) / 2);
      cuts.add(mid + 1);
      push(2, `Split [${a.slice(lo, hi + 1).join(", ")}] into [${a.slice(lo, mid + 1).join(", ")}] and [${a.slice(mid + 1, hi + 1).join(", ")}].`, { ...at(), pointers: { lo, mid, hi } });
      rec(lo, mid);
      rec(mid + 1, hi);
      const tmp: (number | null)[] = new Array(hi - lo + 1).fill(null);
      const tmpIds: (number | null)[] = new Array(hi - lo + 1).fill(null);
      const holes: number[] = [];
      let i = lo;
      let j = mid + 1;
      let k = 0;
      // i or j that has run off the end of its half points at nothing worth drawing
      const fronts = () => ({ ...(i <= mid && { i }), ...(j <= hi && { j }) });
      const merging = () => ({ ...at(), aux: [...tmp], auxIds: [...tmpIds], holes: [...holes] });
      const take = (from: number) => {
        tmp[k] = a[from];
        tmpIds[k] = ids[from];
        holes.push(from);
        k++;
        stats.writes++;
      };
      push(9, `Merge the two sorted halves [${a.slice(lo, mid + 1).join(", ")}] and [${a.slice(mid + 1, hi + 1).join(", ")}].`, { ...merging(), pointers: fronts() });
      while (i <= mid && j <= hi) {
        stats.comparisons++;
        const takeLeft = a[i] <= a[j];
        const v = takeLeft ? a[i] : a[j];
        push(takeLeft ? 12 : 13, `Compare the fronts: ${a[i]} vs ${a[j]}. Take ${v}.`, { ...merging(), compare: [i, j], pointers: fronts() });
        take(takeLeft ? i++ : j++);
        push(takeLeft ? 12 : 13, `${v} moves down into tmp[${k - 1}].`, { ...merging(), auxWrite: [k - 1], pointers: fronts() });
      }
      const left = k;
      while (i <= mid) take(i++);
      while (j <= hi) take(j++);
      push(15, `One side ran out — copy the leftovers straight across.`, { ...merging(), auxWrite: range(left, hi - lo) });
      for (let t = 0; t < tmp.length; t++) {
        a[lo + t] = tmp[t] as number;
        ids[lo + t] = tmpIds[t] as number;
      }
      cuts.delete(mid + 1);
      push(17, `Copy the merged run back: [${a.slice(lo, hi + 1).join(", ")}].`, { ...at(), write: range(lo, hi) });
      stack.pop();
    };
    rec(0, n - 1);
    range(0, n - 1).forEach((k) => sorted.add(k));
  }

  if (algorithm === "quick") {
    // a placed pivot is cut off from its neighbours: there is nothing to combine afterwards
    const cuts = new Set<number>();
    const stack: [number, number][] = [];
    const at = (lo: number, hi: number) => ({
      range: [lo, hi] as [number, number],
      cuts: [...cuts].sort((x, y) => x - y),
      stack: stack.map(([l, h]) => [l, h] as [number, number]),
    });
    const partition = (lo: number, hi: number) => {
      // the lab's version: the first element is the pivot, and the right pointer moves first,
      // so wherever the pointers meet holds a value no bigger than the pivot
      const pivot = a[lo];
      let left = lo;
      let right = hi;
      // what each pointer has already walked past and confirmed
      const sides = () => ({
        marks: [
          ...(left > lo + 1 ? [{ from: lo + 1, to: left - 1, label: `≤ ${pivot}` }] : []),
          ...(right < hi ? [{ from: right + 1, to: hi, label: `≥ ${pivot}` }] : []),
        ],
      });
      const st = () => ({ ...at(lo, hi), ...sides(), pivot: lo, pointers: { left, right } });
      push(8, `Partition [${a.slice(lo, hi + 1).join(", ")}] around the first element, pivot ${pivot}.`, st());
      while (left < right) {
        while (left < right) {
          stats.comparisons++;
          const ok = a[right] >= pivot;
          push(11, `${a[right]} ≥ ${pivot}? ${ok ? "Yes, it belongs on the right — move on." : "No, it's too small for the right side. Stop."}`, { ...st(), compare: [right] });
          if (!ok) break;
          right--;
        }
        while (left < right) {
          stats.comparisons++;
          const ok = a[left] <= pivot;
          const self = left === lo ? " (that's the pivot itself)" : "";
          push(12, `${a[left]} ≤ ${pivot}?${self} ${ok ? "Yes, it belongs on the left — move on." : "No, it's too big for the left side. Stop."}`, { ...st(), compare: [left] });
          if (!ok) break;
          left++;
        }
        if (left !== right) {
          swap(left, right);
          push(13, `Swap ${a[right]} and ${a[left]} — each goes to the side it belongs on.`, { ...st(), write: [left, right] });
        }
      }
      if (right !== lo) swap(lo, right);
      sorted.add(right);
      if (right > 0) cuts.add(right);
      if (right < n - 1) cuts.add(right + 1);
      push(15, `Pointers met at index ${right}. Pivot ${pivot} swaps into it: smaller on its left, bigger on its right. It never moves again.`, { ...at(lo, hi), write: [lo, right], pointers: { p: right } });
      return right;
    };
    const rec = (lo: number, hi: number) => {
      if (lo >= hi) {
        if (lo === hi) {
          sorted.add(lo);
          stack.push([lo, hi]);
          push(1, `[${a[lo]}] is a single element — done.`, at(lo, hi));
          stack.pop();
        }
        return;
      }
      stack.push([lo, hi]);
      const p = partition(lo, hi);
      rec(lo, p - 1);
      rec(p + 1, hi);
      stack.pop();
    };
    rec(0, n - 1);
    range(0, n - 1).forEach((k) => sorted.add(k));
  }

  push(JAVA_SORT[algorithm].length - 1, `Sorted. ${stats.comparisons} comparisons, ${stats.writes} ${writeLabel}.`);
  return frames;
}

/**
 * A letter for each slot whose value appears more than once (5ᵃ, 5ᵇ), lettered by where the
 * element started, so a view can show whether equal values kept their order. Empty strings
 * for values that appear once.
 */
export function equalTags(s: ArrayState): string[] {
  const ids = s.ids ?? s.array.map((_, i) => i);
  return s.array.map((v, i) => {
    const same = ids.filter((_, k) => s.array[k] === v).sort((x, y) => x - y);
    return same.length > 1 ? String.fromCharCode(97 + same.indexOf(ids[i])) : "";
  });
}

/** Did every group of equal values end in the order it started? null if there are no equal values. */
export function keptEqualOrder(s: ArrayState): boolean | null {
  const ids = s.ids ?? s.array.map((_, i) => i);
  let any = false;
  for (let i = 0; i < s.array.length; i++) {
    for (let j = i + 1; j < s.array.length; j++) {
      if (s.array[i] !== s.array[j]) continue;
      any = true;
      if (ids[i] > ids[j]) return false;
    }
  }
  return any ? true : null;
}

export function searchFrames(algorithm: SearchAlgorithm, input: number[], target: number): Frame<ArrayState>[] {
  const a = algorithm === "binary" ? [...input].sort((x, y) => x - y) : [...input];
  const frames: Frame<ArrayState>[] = [];
  let comparisons = 0;
  const push = (line: number, message: string, s: Omit<ArrayState, "array"> = {}) =>
    frames.push({ state: { ...s, array: a }, line, message, stats: { comparisons } });

  push(0, `Looking for ${target} in ${a.length} numbers${algorithm === "binary" ? " (sorted — binary search needs that)" : ""}.`);

  if (algorithm === "linear") {
    for (let i = 0; i < a.length; i++) {
      comparisons++;
      if (a[i] === target) {
        push(2, `a[${i}] = ${a[i]}. Found it at index ${i}.`, { compare: [i], found: i, pointers: { i } });
        return frames;
      }
      push(2, `a[${i}] = ${a[i]}. Not it, keep walking.`, { compare: [i], pointers: { i } });
    }
    push(4, `Reached the end. ${target} isn't here — return -1.`);
    return frames;
  }

  let low = 0;
  let high = a.length - 1;
  push(1, `The whole array is still possible: low = 0, high = ${high}.`, { range: [low, high], pointers: { low, high } });
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    comparisons++;
    if (a[mid] === target) {
      push(4, `Middle is a[${mid}] = ${a[mid]}. Found it.`, { range: [low, high], compare: [mid], found: mid, pointers: { low, mid, high } });
      return frames;
    }
    if (a[mid] < target) {
      push(5, `Middle is a[${mid}] = ${a[mid]}, smaller than ${target}. Throw away the left half.`, { range: [low, high], compare: [mid], pointers: { low, mid, high } });
      low = mid + 1;
    } else {
      push(6, `Middle is a[${mid}] = ${a[mid]}, bigger than ${target}. Throw away the right half.`, { range: [low, high], compare: [mid], pointers: { low, mid, high } });
      high = mid - 1;
    }
  }
  push(8, `low passed high — nothing left to search. ${target} isn't here.`);
  return frames;
}

/* ------------------------------ GCD ------------------------------ */

export type GcdState = {
  rows: { m: number; n: number; r: number | null }[];
  m: number;
  n: number;
  result?: number;
  buggy?: boolean;
};

export const JAVA_GCD = [
  "static int gcd(int m, int n) {",
  "    while (n != 0) {",
  "        int r = m % n;                    // remainder",
  "        m = n;",
  "        n = r;",
  "    }",
  "    return m;",
  "}",
];

export const JAVA_GCD_BUGGY = [
  "static int gcd(int m, int n) {",
  "    while (n != 0) {",
  "        int r = m % n;                    // remainder",
  "        n = r;                            // BUG: overwrites n before m receives it",
  "        m = n;                            // m receives r instead of previous n",
  "    }",
  "    return m;",
  "}",
];

export function gcdFrames(m0: number, n0: number, swapOrder: "correct" | "buggy" = "correct"): Frame<GcdState>[] {
  let m = m0;
  let n = n0;
  const rows: GcdState["rows"] = [];
  const frames: Frame<GcdState>[] = [];
  let steps = 0;
  const push = (line: number, message: string, result?: number, buggy = false) =>
    frames.push({ state: { rows: rows.map((r) => ({ ...r })), m, n, result, buggy }, line, message, stats: { divisions: steps } });

  if (swapOrder === "buggy") {
    push(0, `gcd(${m}, ${n}) with the assignment order bug (n = r before m = n).`, undefined, true);
    let iterations = 0;
    while (n !== 0 && iterations < 20) {
      iterations++;
      push(1, `n = ${n} is not 0, so loop continues.`, undefined, true);
      const r = m % n;
      steps++;
      rows.push({ m, n, r });
      push(2, `r = ${m} % ${n} = ${r} (${m} = ${Math.floor(m / n)} × ${n} + ${r}).`, undefined, true);
      const oldN = n;
      n = r;
      push(3, `BUG: Executed n = r first. n is now ${n}, but original n (${oldN}) is lost!`, undefined, true);
      m = n;
      push(4, `Executed m = n. m receives ${m} (which is r, not original n). State is now gcd(${m}, ${n}).`, undefined, true);
    }
    rows.push({ m, n, r: null });
    push(6, `n is 0, so loop halts. Returned ${m}! Bug produced an incorrect answer of ${m} instead of correct GCD.`, m, true);
    return frames;
  }

  push(0, `gcd(${m}, ${n}): find the largest number that divides both.`);
  while (n !== 0) {
    push(1, `n = ${n} is not 0, so keep going.`);
    const r = m % n;
    steps++;
    rows.push({ m, n, r });
    push(2, `${m} mod ${n} = ${r}  (${m} = ${Math.floor(m / n)} × ${n} + ${r}).`);
    m = n;
    n = r;
    push(4, `Slide left: the problem is now gcd(${m}, ${n}) — same answer, smaller numbers.`);
  }
  rows.push({ m, n, r: null });
  push(6, `n = 0, so gcd(${m0}, ${n0}) = ${m}. Took ${steps} division${steps === 1 ? "" : "s"}.`, m);
  return frames;
}

/* ----------------------------- graphs ----------------------------- */

export type GraphNode = { id: number; x: number; y: number; label?: string }; // label replaces the id when drawn, e.g. the notes' letters
export type GraphEdge = { from: number; to: number; weight?: number };

export type TraversalState = {
  visited: number[];
  current?: number;
  checking?: [number, number];
  frontier: number[]; // queue (BFS) or call stack (DFS)
  order: number[];
  treeEdges: [number, number][];
};

export const JAVA_TRAVERSAL = {
  bfs: [
    "static void bfs(List<List<Integer>> adj, int start) {",
    "    boolean[] visited = new boolean[adj.size()];",
    "    Queue<Integer> queue = new ArrayDeque<>();",
    "    visited[start] = true;",
    "    queue.add(start);",
    "    while (!queue.isEmpty()) {",
    "        int v = queue.poll();             // oldest in line goes first",
    "        System.out.print(v + \" \");",
    "        for (int w : adj.get(v)) {",
    "            if (!visited[w]) {",
    "                visited[w] = true;",
    "                queue.add(w);             // join the back of the line",
    "            }",
    "        }",
    "    }",
    "}",
  ],
  dfs: [
    "static void dfs(List<List<Integer>> adj, int v, boolean[] visited) {",
    "    visited[v] = true;",
    "    System.out.print(v + \" \");",
    "    for (int w : adj.get(v)) {",
    "        if (!visited[w]) {",
    "            dfs(adj, w, visited);         // go deeper first",
    "        }",
    "    }",
    "    // every neighbour handled: return = backtrack",
    "}",
  ],
};

export function adjacency(nodeCount: number, edges: GraphEdge[], directed = false): number[][] {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const e of edges) {
    adj[e.from].push(e.to);
    if (!directed) adj[e.to].push(e.from);
  }
  adj.forEach((l) => l.sort((x, y) => x - y));
  return adj;
}

export function traversalFrames(kind: "bfs" | "dfs", nodeCount: number, edges: GraphEdge[], start = 0, directed = false, names?: string[]): Frame<TraversalState>[] {
  const nm = (v: number) => names?.[v] ?? String(v);
  const adj = adjacency(nodeCount, edges, directed);
  const frames: Frame<TraversalState>[] = [];
  const visited = new Set<number>();
  const order: number[] = [];
  const treeEdges: [number, number][] = [];
  let edgeChecks = 0;
  const push = (line: number, message: string, frontier: number[], current?: number, checking?: [number, number]) =>
    frames.push({
      state: { visited: [...visited], current, checking, frontier: [...frontier], order: [...order], treeEdges: treeEdges.map((e) => [...e] as [number, number]) },
      line,
      message,
      stats: { visited: order.length, "edge checks": edgeChecks },
    });

  if (kind === "bfs") {
    const queue: number[] = [];
    visited.add(start);
    queue.push(start);
    push(4, `Mark ${nm(start)} as seen and put it in the queue.`, queue);
    while (queue.length) {
      const v = queue.shift()!;
      order.push(v);
      push(7, `Take ${nm(v)} from the front of the queue and visit it.`, queue, v);
      for (const w of adj[v]) {
        edgeChecks++;
        if (!visited.has(w)) {
          visited.add(w);
          queue.push(w);
          treeEdges.push([v, w]);
          push(11, `${nm(w)} is new — mark it and add it to the back of the queue.`, queue, v, [v, w]);
        } else {
          push(9, `${nm(w)} was already seen — skip it.`, queue, v, [v, w]);
        }
      }
    }
    push(15, `Queue is empty. Visit order: ${order.map(nm).join(" → ")}. Notice it went level by level.`, queue);
  } else {
    const stack: number[] = [];
    const rec = (v: number) => {
      visited.add(v);
      stack.push(v);
      order.push(v);
      push(2, `Visit ${nm(v)} and push it on the call stack.`, stack, v);
      for (const w of adj[v]) {
        edgeChecks++;
        if (!visited.has(w)) {
          treeEdges.push([v, w]);
          push(5, `${nm(w)} is unvisited — go deeper into ${nm(w)} before looking at anything else.`, stack, v, [v, w]);
          rec(w);
          push(3, `Back at ${nm(v)}. Check its next neighbour.`, stack, v);
        } else {
          push(4, `${nm(w)} is already visited — skip it.`, stack, v, [v, w]);
        }
      }
      stack.pop();
      push(8, `${nm(v)} has nothing new left. Pop it — backtrack${stack.length ? ` to ${nm(stack[stack.length - 1])}` : ""}.`, stack, stack[stack.length - 1]);
    };
    rec(start);
    push(9, `Call stack is empty. Visit order: ${order.map(nm).join(" → ")}. Notice it ran deep down one path first.`, stack);
  }
  return frames;
}

/* ------------------------------ MST ------------------------------ */

export type MstState = {
  accepted: number[]; // edge indices in the tree
  rejected: number[];
  candidates: number[];
  considering?: number;
  inTree: number[]; // nodes reached (Prim) / touched (Kruskal)
  total: number;
};

export const JAVA_MST = {
  prim: [
    "static int prim(int[][] w) {             // w[u][v] = weight, 0 = no edge",
    "    int n = w.length;",
    "    boolean[] inTree = new boolean[n];",
    "    inTree[0] = true;                     // start anywhere",
    "    int total = 0;",
    "    for (int added = 1; added < n; added++) {",
    "        int bu = -1, bv = -1;             // best crossing edge so far",
    "        for (int u = 0; u < n; u++)",
    "            for (int v = 0; v < n; v++)",
    "                if (inTree[u] && !inTree[v] && w[u][v] > 0",
    "                        && (bu == -1 || w[u][v] < w[bu][bv])) { bu = u; bv = v; }",
    "        inTree[bv] = true;                // greedy: take the cheapest one",
    "        total += w[bu][bv];",
    "    }",
    "    return total;",
    "}",
  ],
  kruskal: [
    "static int kruskal(int n, int[][] edges) {   // each edge = {u, v, w}",
    "    Arrays.sort(edges, (x, y) -> x[2] - y[2]); // cheapest first",
    "    int[] parent = new int[n];",
    "    for (int i = 0; i < n; i++) parent[i] = i; // everyone alone",
    "    int total = 0;",
    "    for (int[] e : edges) {",
    "        int ru = find(parent, e[0]), rv = find(parent, e[1]);",
    "        if (ru == rv) continue;              // same tree: cycle, reject",
    "        parent[ru] = rv;                     // join the two trees",
    "        total += e[2];",
    "    }",
    "    return total;",
    "}",
    "",
    "static int find(int[] parent, int x) {",
    "    while (parent[x] != x) x = parent[x];",
    "    return x;",
    "}",
  ],
};

export function mstFrames(kind: "prim" | "kruskal", nodeCount: number, edges: GraphEdge[], names: string[] = []): Frame<MstState>[] {
  const nm = (v: number) => names[v] ?? String(v);
  const frames: Frame<MstState>[] = [];
  const accepted: number[] = [];
  const rejected: number[] = [];
  const inTree = new Set<number>();
  let total = 0;
  let looked = 0;
  const w = (i: number) => edges[i].weight ?? 1;
  const push = (line: number, message: string, candidates: number[] = [], considering?: number) =>
    frames.push({
      state: { accepted: [...accepted], rejected: [...rejected], candidates, considering, inTree: [...inTree], total },
      line,
      message,
      stats: { "edges in tree": accepted.length, "total weight": total, "edges looked at": looked },
    });

  if (kind === "prim") {
    inTree.add(0);
    push(3, `Start the tree at node ${nm(0)}.`);
    while (inTree.size < nodeCount) {
      const crossing = edges.map((_, i) => i).filter((i) => inTree.has(edges[i].from) !== inTree.has(edges[i].to));
      if (!crossing.length) break;
      looked += crossing.length;
      push(9, `Edges leaving the tree: ${crossing.map((i) => `${nm(edges[i].from)}–${nm(edges[i].to)} (${w(i)})`).join(", ")}.`, crossing);
      const best = crossing.reduce((b, i) => (w(i) < w(b) ? i : b), crossing[0]);
      const e = edges[best];
      const newNode = inTree.has(e.from) ? e.to : e.from;
      accepted.push(best);
      inTree.add(newNode);
      total += w(best);
      push(11, `Cheapest is ${nm(e.from)}–${nm(e.to)} with weight ${w(best)}. Take it; node ${nm(newNode)} joins the tree.`, [], best);
    }
    push(14, `Every node is connected. Minimum spanning tree weight = ${total}.`);
  } else {
    const order = edges.map((_, i) => i).sort((x, y) => w(x) - w(y) || x - y);
    const parent = Array.from({ length: nodeCount }, (_, i) => i);
    const find = (x: number) => {
      while (parent[x] !== x) x = parent[x];
      return x;
    };
    push(1, `Sort all edges by weight: ${order.map((i) => w(i)).join(", ")}.`, order);
    for (const i of order) {
      if (accepted.length === nodeCount - 1) break;
      const e = edges[i];
      looked++;
      push(6, `Next cheapest: ${nm(e.from)}–${nm(e.to)} (${w(i)}). Are ${nm(e.from)} and ${nm(e.to)} already connected?`, [], i);
      const ru = find(e.from);
      const rv = find(e.to);
      if (ru === rv) {
        rejected.push(i);
        push(7, `Yes — adding it would close a loop. Reject.`, [], i);
      } else {
        parent[ru] = rv;
        accepted.push(i);
        inTree.add(e.from);
        inTree.add(e.to);
        total += w(i);
        push(8, `No — it joins two separate pieces. Accept.`, [], i);
      }
    }
    push(11, `${nodeCount - 1} edges accepted, so the tree is complete. Total weight = ${total}.`);
  }
  return frames;
}

/* ---------------------------- knapsack ---------------------------- */

export type KnapsackItem = { name: string; weight: number; value: number };

export type KnapsackState = {
  table: (number | null)[][]; // (n+1) x (W+1)
  cell?: [number, number];
  deps?: [number, number][];
  chosen: number[]; // item indices (0-based) picked during backtracking
  trace?: [number, number];
};

export const JAVA_KNAPSACK = [
  "static int knapsack(int[] wt, int[] val, int W) {",
  "    int n = wt.length;",
  "    int[][] V = new int[n + 1][W + 1];        // row 0 and column 0 stay 0",
  "    for (int i = 1; i <= n; i++) {",
  "        for (int w = 1; w <= W; w++) {",
  "            if (wt[i - 1] > w)",
  "                V[i][w] = V[i - 1][w];                    // doesn't fit",
  "            else",
  "                V[i][w] = Math.max(V[i - 1][w],           // skip it",
  "                        val[i - 1] + V[i - 1][w - wt[i - 1]]); // take it",
  "        }",
  "    }",
  "    return V[n][W];",
  "}",
];

export function knapsackFrames(items: KnapsackItem[], W: number): Frame<KnapsackState>[] {
  const n = items.length;
  const V: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: W + 1 }, (_, w) => (i === 0 || w === 0 ? 0 : null)));
  const frames: Frame<KnapsackState>[] = [];
  const chosen: number[] = [];
  let cells = 0;
  const push = (line: number, message: string, extra: Partial<KnapsackState> = {}) =>
    frames.push({ state: { table: V.map((r) => [...r]), chosen: [...chosen], ...extra }, line, message, stats: { "cells filled": cells } });

  push(2, `Row 0 (no items) and column 0 (no capacity) are all 0 — nothing fits, nothing earned.`);
  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let w = 1; w <= W; w++) {
      cells++;
      const skip = V[i - 1][w] as number;
      if (it.weight > w) {
        V[i][w] = skip;
        push(6, `${it.name} weighs ${it.weight} > capacity ${w}. It can't fit, so copy the value above: ${skip}.`, { cell: [i, w], deps: [[i - 1, w]] });
      } else {
        const take = it.value + (V[i - 1][w - it.weight] as number);
        V[i][w] = Math.max(skip, take);
        push(8, `Capacity ${w}: skip ${it.name} → ${skip}, or take it → ${it.value} + V[${i - 1}][${w - it.weight}] = ${take}. Best: ${V[i][w]}.`, { cell: [i, w], deps: [[i - 1, w], [i - 1, w - it.weight]] });
      }
    }
  }
  push(12, `The answer is in the bottom-right corner: ${V[n][W]}. Now walk back up to see which items made it.`, { cell: [n, W] });
  let w = W;
  for (let i = n; i >= 1; i--) {
    if (V[i][w] !== V[i - 1][w]) {
      chosen.push(i - 1);
      push(12, `V[${i}][${w}] ≠ V[${i - 1}][${w}], so ${items[i - 1].name} was taken. Move left by its weight (${items[i - 1].weight}).`, { trace: [i, w] });
      w -= items[i - 1].weight;
    } else {
      push(12, `V[${i}][${w}] = V[${i - 1}][${w}], so ${items[i - 1].name} was skipped. Go straight up.`, { trace: [i, w] });
    }
  }
  push(12, `Knapsack holds: ${chosen.map((c) => items[c].name).reverse().join(", ") || "nothing"}. Total value ${V[n][W]}.`);
  return frames;
}

/* ----------------------------- growth ----------------------------- */

export const GROWTH = [
  { label: "O(1)", name: "constant", f: () => 1 },
  { label: "O(log n)", name: "logarithmic", f: (n: number) => Math.max(1, Math.log2(n)) },
  { label: "O(n)", name: "linear", f: (n: number) => n },
  { label: "O(n log n)", name: "linearithmic", f: (n: number) => n * Math.max(1, Math.log2(n)) },
  { label: "O(n²)", name: "quadratic", f: (n: number) => n * n },
  { label: "O(2ⁿ)", name: "exponential", f: (n: number) => Math.pow(2, n) },
] as const;

/** Human-readable duration for `ops` simple operations at ~10^8 ops/second. */
export function humanTime(ops: number): string {
  const s = ops / 1e8;
  if (!isFinite(s) || s > 3.15e7 * 1e10) return "longer than the age of the universe";
  if (s < 1e-6) return "under a microsecond";
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)} µs`;
  if (s < 1) return `${(s * 1e3).toFixed(0)} ms`;
  if (s < 60) return `${s.toFixed(1)} s`;
  if (s < 3600) return `${(s / 60).toFixed(0)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
  if (s < 3.15e7) return `${(s / 86400).toFixed(0)} days`;
  return `${(s / 3.15e7).toExponential(1).replace("e+", " × 10^")} years`;
}

export function formatOps(ops: number): string {
  if (!isFinite(ops) || ops > 1e300) return "∞ (effectively)";
  if (ops < 1e6) return Math.round(ops).toLocaleString("en-US");
  return ops.toExponential(1).replace("e+", " × 10^");
}

/* ----------------------------- findMax ----------------------------- */

export const JAVA_FIND_MAX = [
  "static int findMax(int[] a) {",
  "    int max = a[0];",
  "    for (int i = 1; i < a.length; i++) {",
  "        if (a[i] > max) {",
  "            max = a[i];",
  "        }",
  "    }",
  "    return max;",
  "}",
];

export function findMaxFrames(input: number[]): Frame<ArrayState>[] {
  const a = [...input];
  const frames: Frame<ArrayState>[] = [];
  let comparisons = 0;
  let updates = 0;
  const push = (line: number, message: string, s: Omit<ArrayState, "array"> = {}) =>
    frames.push({ state: { ...s, array: a }, line, message, stats: { comparisons, updates } });

  if (a.length === 0) {
    push(1, "Empty array: a[0] throws ArrayIndexOutOfBoundsException. findMax requires at least one element.");
    return frames;
  }

  push(0, `Looking for the largest number among ${a.length} elements.`);
  let max = a[0];
  let maxIdx = 0;
  push(1, `Initialize max = a[0] = ${max} at index 0.`, {
    pointers: { max: 0 },
    sorted: [0],
  });

  for (let i = 1; i < a.length; i++) {
    push(2, `i = ${i}: examine a[${i}] = ${a[i]}.`, {
      pointers: { max: maxIdx, i },
      sorted: [maxIdx],
      compare: [i],
    });

    comparisons++;
    if (a[i] > max) {
      push(3, `Compare a[${i}] (${a[i]}) > max (${max}): yes! Found a new larger value.`, {
        pointers: { max: maxIdx, i },
        compare: [i, maxIdx],
      });
      max = a[i];
      maxIdx = i;
      updates++;
      push(4, `Update max = a[${i}] = ${max}.`, {
        pointers: { max: maxIdx, i },
        write: [maxIdx],
        sorted: [maxIdx],
      });
    } else {
      push(3, `Compare a[${i}] (${a[i]}) > max (${max}): no. Keep current max = ${max}.`, {
        pointers: { max: maxIdx, i },
        sorted: [maxIdx],
        compare: [i, maxIdx],
      });
    }
  }

  push(7, `Finished scanning all ${a.length} elements with ${comparisons} comparison${comparisons === 1 ? "" : "s"}. Return max = ${max}.`, {
    pointers: { max: maxIdx },
    sorted: [maxIdx],
    found: maxIdx,
  });

  return frames;
}

/* -------------------------- nested loops -------------------------- */

export type LoopGridMode = "dependent" | "independent" | "fixed";

export type LoopGridInfo = {
  n: number;
  mode: LoopGridMode;
  totalOps: number;
  maxOps: number;
  formula: string;
  bigO: string;
  activeCells: [number, number][];
  rowCounts: number[];
};

export function loopGridInfo(n: number, mode: LoopGridMode): LoopGridInfo {
  const activeCells: [number, number][] = [];
  const rowCounts: number[] = [];

  for (let i = 1; i <= n; i++) {
    const limit = mode === "dependent" ? i : mode === "independent" ? n : Math.min(3, n);
    rowCounts.push(limit);
    for (let j = 1; j <= limit; j++) {
      activeCells.push([i, j]);
    }
  }

  const totalOps = activeCells.length;
  const maxOps = n * n;
  let formula = "";
  let bigO = "";

  if (mode === "dependent") {
    formula = `n(n + 1) / 2 = (${n} × ${n + 1}) / 2 = ${totalOps}`;
    bigO = "O(n²)";
  } else if (mode === "independent") {
    formula = `n × n = ${n}² = ${totalOps}`;
    bigO = "O(n²)";
  } else {
    formula = `3 × n = 3 × ${n} = ${totalOps}`;
    bigO = "O(n)";
  }

  return { n, mode, totalOps, maxOps, formula, bigO, activeCells, rowCounts };
}

/* ----------------------------- swap ----------------------------- */

export const JAVA_SWAP = {
  correct: [
    "public static void swap(int[] array, int x, int y) {",
    "    int temp = array[x];",
    "    array[x] = array[y];",
    "    array[y] = temp;",
    "}",
  ],
  buggy: [
    "public static void swapBuggy(int[] array, int x, int y) {",
    "    array[x] = array[y];  // BUG: overwrites array[x]!",
    "    array[y] = array[x];  // reads back array[x] (already lost)",
    "}",
  ],
};

export type SwapState = {
  array: number[];
  x: number;
  y: number;
  temp: number | null;
  write?: number[];
  compare?: number[];
  buggy?: boolean;
};

export function swapFrames(
  initial: number[],
  x: number,
  y: number,
  mode: "correct" | "buggy" = "correct"
): Frame<SwapState>[] {
  const a = [...initial];
  const frames: Frame<SwapState>[] = [];
  const push = (line: number, message: string, s: Omit<SwapState, "array" | "x" | "y">) =>
    frames.push({
      state: { ...s, array: [...a], x, y },
      line,
      message,
      stats: {},
    });

  if (mode === "correct") {
    push(0, `Ready to swap elements at indices ${x} (value ${a[x]}) and ${y} (value ${a[y]}).`, {
      temp: null,
      compare: [x, y],
    });
    const temp = a[x];
    push(1, `int temp = array[${x}]; Save ${temp} in temporary variable temp so it won't be lost.`, {
      temp,
      compare: [x],
    });
    a[x] = a[y];
    push(2, `array[${x}] = array[${y}]; Copy ${a[y]} into slot ${x}. Slot ${x} is now ${a[x]}.`, {
      temp,
      write: [x],
      compare: [y],
    });
    a[y] = temp;
    push(3, `array[${y}] = temp; Retrieve ${temp} from temp into slot ${y}. Swap complete!`, {
      temp,
      write: [y],
    });
    return frames;
  }

  // Buggy mode without temp
  push(0, `Attempting to swap indices ${x} (value ${a[x]}) and ${y} (value ${a[y]}) without a temporary variable.`, {
    temp: null,
    compare: [x, y],
    buggy: true,
  });
  const originalX = a[x];
  a[x] = a[y];
  push(1, `array[${x}] = array[${y}]; Overwrote slot ${x} with ${a[y]}! The original value ${originalX} is gone.`, {
    temp: null,
    write: [x],
    buggy: true,
  });
  a[y] = a[x];
  push(2, `array[${y}] = array[${x}]; Copy slot ${x} into slot ${y}. Both slots now hold ${a[y]}! Swap failed.`, {
    temp: null,
    write: [y],
    buggy: true,
  });
  return frames;
}

/* ------------------------ bubble sort early exit ------------------------ */

export const JAVA_BUBBLE_EARLY_EXIT = {
  with_flag: [
    "public static void bubbleSortWithFlag(int[] array) {",
    "    for (int i = 0; i < array.length - 1; i++) {",
    "        boolean swapped = false;",
    "        for (int j = 0; j < array.length - 1 - i; j++) {",
    "            if (array[j + 1] < array[j]) {",
    "                swap(array, j, j + 1);",
    "                swapped = true;",
    "            }",
    "        }",
    "        if (!swapped) break; // early exit: array is sorted",
    "    }",
    "}",
  ],
  without_flag: [
    "public static void bubbleSortNoFlag(int[] array) {",
    "    for (int i = 0; i < array.length - 1; i++) {",
    "        // no swapped flag check",
    "        for (int j = 0; j < array.length - 1 - i; j++) {",
    "            if (array[j + 1] < array[j]) {",
    "                swap(array, j, j + 1);",
    "            }",
    "        }",
    "        // continues unconditionally for all passes",
    "    }",
    "}",
  ],
};

export type BubbleEarlyExitState = {
  array: number[];
  i: number;
  j?: number;
  swappedThisPass: boolean;
  totalSwaps: number;
  totalComparisons: number;
  passCount: number;
  stoppedEarly: boolean;
  compare?: [number, number];
  write?: [number, number];
  sorted: number[];
  mode: "with_flag" | "without_flag";
};

export function bubbleEarlyExitFrames(
  input: number[],
  mode: "with_flag" | "without_flag" = "with_flag"
): Frame<BubbleEarlyExitState>[] {
  const a = [...input];
  const n = a.length;
  const frames: Frame<BubbleEarlyExitState>[] = [];
  const sorted: number[] = [];
  let totalComparisons = 0;
  let totalSwaps = 0;

  const push = (
    line: number,
    message: string,
    s: {
      i: number;
      j?: number;
      swappedThisPass: boolean;
      stoppedEarly?: boolean;
      compare?: [number, number];
      write?: [number, number];
    }
  ) => {
    frames.push({
      state: {
        array: [...a],
        i: s.i,
        j: s.j,
        swappedThisPass: s.swappedThisPass,
        totalSwaps,
        totalComparisons,
        passCount: s.i + 1,
        stoppedEarly: Boolean(s.stoppedEarly),
        compare: s.compare,
        write: s.write,
        sorted: [...sorted],
        mode,
      },
      line,
      message,
      stats: { comparisons: totalComparisons, swaps: totalSwaps },
    });
  };

  if (n <= 1) {
    if (n === 1) sorted.push(0);
    push(0, `Array of size ${n} is already sorted.`, { i: 0, swappedThisPass: false });
    return frames;
  }

  push(
    0,
    `Starting bubble sort (${mode === "with_flag" ? "with early exit flag" : "without flag"}). Input has ${n} elements.`,
    { i: 0, swappedThisPass: false }
  );

  let stoppedEarly = false;
  let lastPass = 0;

  for (let i = 0; i < n - 1; i++) {
    lastPass = i;
    let swapped = false;
    push(
      mode === "with_flag" ? 2 : 1,
      `Pass ${i + 1} of ${n - 1}: reset swapped = false. Scanning indices 0 to ${n - 2 - i}.`,
      { i, swappedThisPass: swapped }
    );

    for (let j = 0; j < n - 1 - i; j++) {
      totalComparisons++;
      const outOfOrder = a[j + 1] < a[j];
      push(
        mode === "with_flag" ? 4 : 4,
        `Compare a[${j}] (${a[j]}) and a[${j + 1}] (${a[j + 1]}): ${outOfOrder ? "out of order!" : "in order."}`,
        { i, j, swappedThisPass: swapped, compare: [j, j + 1] }
      );

      if (outOfOrder) {
        const temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        swapped = true;
        totalSwaps++;
        push(
          mode === "with_flag" ? 5 : 5,
          `Swap a[${j}] and a[${j + 1}]. Set swapped = true.`,
          { i, j, swappedThisPass: swapped, write: [j, j + 1] }
        );
      }
    }

    sorted.push(n - 1 - i);

    if (mode === "with_flag") {
      if (!swapped) {
        for (let k = 0; k < n; k++) {
          if (!sorted.includes(k)) sorted.push(k);
        }
        stoppedEarly = true;
        push(
          9,
          `Pass ${i + 1} finished with 0 swaps! swapped is still false, proving the array is fully sorted. Early exit breaks out of the loop after ${totalComparisons} comparisons.`,
          { i, swappedThisPass: false, stoppedEarly: true }
        );
        break;
      } else {
        push(
          9,
          `Pass ${i + 1} finished with swaps. swapped is true, so early exit does not trigger. Continue to next pass.`,
          { i, swappedThisPass: true }
        );
      }
    } else {
      push(
        mode === "without_flag" ? 8 : 7,
        `Pass ${i + 1} finished. Flag check omitted: outer loop will execute all ${n - 1} passes regardless of order.`,
        { i, swappedThisPass: swapped }
      );
    }
  }

  for (let k = 0; k < n; k++) {
    if (!sorted.includes(k)) sorted.push(k);
  }

  const finalMsg = stoppedEarly
    ? `Completed early at pass ${frames[frames.length - 1].state.passCount}/${n - 1}! Total comparisons: ${totalComparisons} (saved ${(n * (n - 1)) / 2 - totalComparisons} comparisons).`
    : `Completed all ${n - 1} passes. Total comparisons: ${totalComparisons}, swaps: ${totalSwaps}.`;

  push(mode === "with_flag" ? 11 : 9, finalMsg, {
    i: lastPass,
    swappedThisPass: false,
    stoppedEarly,
  });

  return frames;
}

/* ------------------------ insertion shift vs swap ------------------------ */

export const JAVA_INSERTION_SHIFT = {
  shift: [
    "public static void insertionSortShift(int[] a) {",
    "    for (int i = 1; i < a.length; i++) {",
    "        int key = a[i];              // write to key variable (1 write)",
    "        int j = i - 1;",
    "        while (j >= 0 && a[j] > key) {",
    "            a[j + 1] = a[j];          // 1 write: shift element right",
    "            j--;",
    "        }",
    "        a[j + 1] = key;              // 1 write: drop key into gap",
    "    }",
    "}",
  ],
  swap: [
    "public static void insertionSortSwap(int[] a) {",
    "    for (int i = 1; i < a.length; i++) {",
    "        int j = i;",
    "        while (j > 0 && a[j - 1] > a[j]) {",
    "            swap(a, j, j - 1);       // 3 writes per swap!",
    "            j--;",
    "        }",
    "    }",
    "}",
  ],
};

export type InsertionShiftState = {
  array: (number | null)[];
  key: number | null;
  keyOrigin?: number;
  gap?: number;
  i: number;
  j?: number;
  compare?: [number, number];
  write?: number[];
  writes: number;
  comparisons: number;
  sorted: number[];
  mode: "shift" | "swap";
};

export function insertionShiftFrames(
  input: number[],
  mode: "shift" | "swap" = "shift"
): Frame<InsertionShiftState>[] {
  const a: (number | null)[] = [...input];
  const n = a.length;
  const frames: Frame<InsertionShiftState>[] = [];
  const sorted: number[] = [0];
  let writes = 0;
  let comparisons = 0;

  const push = (
    line: number,
    message: string,
    s: {
      key: number | null;
      keyOrigin?: number;
      gap?: number;
      i: number;
      j?: number;
      compare?: [number, number];
      write?: number[];
    }
  ) => {
    frames.push({
      state: {
        array: [...a],
        key: s.key,
        keyOrigin: s.keyOrigin,
        gap: s.gap,
        i: s.i,
        j: s.j,
        compare: s.compare,
        write: s.write,
        writes,
        comparisons,
        sorted: [...sorted],
        mode,
      },
      line,
      message,
      stats: { comparisons, writes },
    });
  };

  if (n <= 1) {
    push(0, `Array has ${n} element(s): already sorted.`, { key: null, i: 0 });
    return frames;
  }

  push(
    0,
    `Starting insertion sort using ${mode === "shift" ? "shifting (1 write per shift + key)" : "adjacent swapping (3 writes per swap)"}.`,
    { key: null, i: 1 }
  );

  if (mode === "shift") {
    for (let i = 1; i < n; i++) {
      const key = a[i] as number;
      writes++; // write to key variable
      a[i] = null; // gap created
      let gap: number | undefined = i;
      let j = i - 1;

      push(2, `i = ${i}: Lift key = ${key} into variable. Slot ${i} becomes an open gap. (Writes: ${writes})`, {
        key,
        keyOrigin: i,
        gap,
        i,
        j,
      });

      while (j >= 0) {
        comparisons++;
        const cmpVal = a[j] as number;
        const shouldShift = cmpVal > key;
        push(
          4,
          `Compare a[${j}] (${cmpVal}) > key (${key}): ${shouldShift ? "yes, shift right!" : "no, found insertion position."}`,
          { key, keyOrigin: i, gap, i, j, compare: [j, gap] }
        );

        if (!shouldShift) break;

        a[j + 1] = a[j];
        a[j] = null;
        gap = j;
        writes++; // 1 write per shift
        push(5, `Shift a[${j}] (${cmpVal}) into slot ${j + 1}. Open gap moves to slot ${j}. (Writes: ${writes})`, {
          key,
          keyOrigin: i,
          gap,
          i,
          j,
          write: [j + 1],
        });
        j--;
      }

      a[j + 1] = key;
      writes++; // write key into gap
      gap = undefined;
      for (let k = 0; k <= i; k++) {
        if (!sorted.includes(k)) sorted.push(k);
      }
      push(8, `Drop key ${key} into gap at slot ${j + 1}. Sorted prefix is now 0..${i}. (Writes: ${writes})`, {
        key: null,
        i,
        write: [j + 1],
      });
    }
  } else {
    // swap mode
    for (let i = 1; i < n; i++) {
      let j = i;
      push(2, `i = ${i}: Consider element a[${i}] = ${a[i]}.`, { key: null, i, j });

      while (j > 0) {
        comparisons++;
        const leftVal = a[j - 1] as number;
        const curVal = a[j] as number;
        const outOfOrder = leftVal > curVal;

        push(
          3,
          `Compare a[${j - 1}] (${leftVal}) > a[${j}] (${curVal}): ${outOfOrder ? "out of order, must swap!" : "in order, stop."}`,
          { key: null, i, j, compare: [j - 1, j] }
        );

        if (!outOfOrder) break;

        const temp = a[j];
        a[j] = a[j - 1];
        a[j - 1] = temp;
        writes += 3; // 3 writes per swap!

        push(
          4,
          `Swap a[${j}] and a[${j - 1}] via temp (3 writes: temp = a[j]; a[j] = a[j-1]; a[j-1] = temp). Total writes: ${writes}.`,
          { key: null, i, j: j - 1, write: [j - 1, j] }
        );
        j--;
      }

      for (let k = 0; k <= i; k++) {
        if (!sorted.includes(k)) sorted.push(k);
      }
    }
  }

  push(
    mode === "shift" ? 9 : 7,
    `Array fully sorted! Total comparisons: ${comparisons}, Total memory writes: ${writes}. (${mode === "shift" ? "Shifting minimizes writes." : "Swapping incurred 3x writes per inversion!"})`,
    { key: null, i: n - 1 }
  );

  return frames;
}

/* ------------------------ two-way merge subroutine ------------------------ */

export const JAVA_TWO_WAY_MERGE = {
  lte: [
    "static void merge(int[] L, int[] R, int[] A) {",
    "    int i = 0, j = 0, k = 0;",
    "    while (i < L.length && j < R.length) {",
    "        if (L[i] <= R[j]) {              // <= preserves stability!",
    "            A[k++] = L[i++];",
    "        } else {",
    "            A[k++] = R[j++];",
    "        }",
    "    }",
    "    while (i < L.length) A[k++] = L[i++]; // copy leftovers from L",
    "    while (j < R.length) A[k++] = R[j++]; // copy leftovers from R",
    "}",
  ],
  lt: [
    "static void mergeUnstable(int[] L, int[] R, int[] A) {",
    "    int i = 0, j = 0, k = 0;",
    "    while (i < L.length && j < R.length) {",
    "        if (L[i] < R[j]) {               // BUG: strict < takes R first on equal keys!",
    "            A[k++] = L[i++];",
    "        } else {",
    "            A[k++] = R[j++];",
    "        }",
    "    }",
    "    while (i < L.length) A[k++] = L[i++];",
    "    while (j < R.length) A[k++] = R[j++];",
    "}",
  ],
};

export type MergeItem = {
  value: number;
  id: string;
  tag?: string; // "a" or "b" when duplicates exist between L and R
};

export type TwoWayMergeState = {
  left: (MergeItem | null)[];
  right: (MergeItem | null)[];
  output: (MergeItem | null)[];
  i: number;
  j: number;
  k: number;
  condition: "lte" | "lt";
  compare?: boolean;
  takeSource?: "L" | "R";
  stabilityBroken?: boolean;
  comparisons: number;
  writes: number;
  phase: "init" | "compare" | "take" | "drain_left" | "drain_right" | "complete";
};

export function twoWayMergeFrames(
  leftVals: number[],
  rightVals: number[],
  condition: "lte" | "lt" = "lte"
): Frame<TwoWayMergeState>[] {
  const frames: Frame<TwoWayMergeState>[] = [];
  const totalN = leftVals.length + rightVals.length;

  const left: (MergeItem | null)[] = leftVals.map((v, idx) => {
    const hasDuplicate = rightVals.includes(v);
    return { value: v, id: `L${idx}`, tag: hasDuplicate ? "a" : undefined };
  });
  const right: (MergeItem | null)[] = rightVals.map((v, idx) => {
    const hasDuplicate = leftVals.includes(v);
    return { value: v, id: `R${idx}`, tag: hasDuplicate ? "b" : undefined };
  });
  const output: (MergeItem | null)[] = new Array(totalN).fill(null);

  let i = 0;
  let j = 0;
  let k = 0;
  let comparisons = 0;
  let writes = 0;
  let stabilityBroken = false;

  const push = (
    line: number,
    message: string,
    meta: {
      compare?: boolean;
      takeSource?: "L" | "R";
      phase: TwoWayMergeState["phase"];
    }
  ) => {
    frames.push({
      state: {
        left: [...left],
        right: [...right],
        output: [...output],
        i,
        j,
        k,
        condition,
        compare: meta.compare,
        takeSource: meta.takeSource,
        stabilityBroken,
        comparisons,
        writes,
        phase: meta.phase,
      },
      line,
      message,
      stats: { comparisons, writes },
    });
  };

  push(
    1,
    `Initialize pointers i = 0 (Left), j = 0 (Right), k = 0 (Output A). Merging ${leftVals.length} + ${rightVals.length} = ${totalN} elements.`,
    { phase: "init" }
  );

  while (i < leftVals.length && j < rightVals.length) {
    comparisons++;
    const lItem = left[i]!;
    const rItem = right[j]!;
    const lVal = lItem.value;
    const rVal = rItem.value;

    const isEqual = lVal === rVal;
    let takeLeft: boolean;

    if (condition === "lte") {
      takeLeft = lVal <= rVal;
    } else {
      takeLeft = lVal < rVal;
    }

    const compMessage = isEqual
      ? `Compare fronts: L[${i}] (${lVal}${lItem.tag ? "ᵃ" : ""}) vs R[${j}] (${rVal}${rItem.tag ? "ᵇ" : ""}): EQUAL keys! Condition ${condition === "lte" ? "L[i] <= R[j] takes Left (stable)" : "L[i] < R[j] evaluates false and takes Right (breaks stability!)"}.`
      : `Compare fronts: L[${i}] (${lVal}) vs R[${j}] (${rVal}). ${takeLeft ? `L[${i}] is smaller.` : `R[${j}] is smaller.`}`;

    push(3, compMessage, { compare: true, phase: "compare" });

    if (isEqual && !takeLeft) {
      stabilityBroken = true;
    }

    writes++;
    if (takeLeft) {
      output[k] = lItem;
      left[i] = null;
      push(
        4,
        `Take L[${i}] (${lVal}${lItem.tag ? "ᵃ" : ""}) into A[${k}]. Advance i to ${i + 1}, k to ${k + 1}.`,
        { takeSource: "L", phase: "take" }
      );
      i++;
    } else {
      output[k] = rItem;
      right[j] = null;
      push(
        6,
        `Take R[${j}] (${rVal}${rItem.tag ? "ᵇ" : ""}) into A[${k}]. Advance j to ${j + 1}, k to ${k + 1}.${isEqual ? " Notice: duplicate from Right crossed duplicate from Left!" : ""}`,
        { takeSource: "R", phase: "take" }
      );
      j++;
    }
    k++;
  }

  if (i < leftVals.length) {
    push(
      9,
      `Right array is exhausted (j = ${j}). Copy remaining ${leftVals.length - i} element(s) from Left directly into A without comparisons.`,
      { phase: "drain_left" }
    );
    while (i < leftVals.length) {
      writes++;
      output[k] = left[i];
      left[i] = null;
      push(
        9,
        `Copy L[${i}] (${output[k]!.value}) straight to A[${k}].`,
        { takeSource: "L", phase: "drain_left" }
      );
      i++;
      k++;
    }
  } else if (j < rightVals.length) {
    push(
      10,
      `Left array is exhausted (i = ${i}). Copy remaining ${rightVals.length - j} element(s) from Right directly into A without comparisons.`,
      { phase: "drain_right" }
    );
    while (j < rightVals.length) {
      writes++;
      output[k] = right[j];
      right[j] = null;
      push(
        10,
        `Copy R[${j}] (${output[k]!.value}) straight to A[${k}].`,
        { takeSource: "R", phase: "drain_right" }
      );
      j++;
      k++;
    }
  }

  const finalNote = stabilityBroken
    ? "Merge finished, but equal elements were inverted (unstable due to '<')!"
    : "Merge finished successfully in linear Theta(n) time and preserved stability (due to '<=').";

  push(0, `${finalNote} Total comparisons: ${comparisons}, Total writes: ${writes}.`, {
    phase: "complete",
  });

  return frames;
}

/* ------------------------ two-pointer partition ------------------------ */

export const JAVA_PARTITION = {
  right_first: [
    "public static int partition(int[] a, int low, int high) {",
    "    int pivot = a[low];                    // first element is pivot",
    "    int left = low, right = high;",
    "    while (left < right) {",
    "        while (a[right] >= pivot && left < right) right--;",
    "        while (a[left] <= pivot && left < right) left++;",
    "        if (left < right) swap(a, left, right);",
    "    }",
    "    swap(a, low, right);                   // pivot lands in its final spot",
    "    return right;",
    "}",
  ],
  left_first: [
    "public static int partitionBuggy(int[] a, int low, int high) {",
    "    int pivot = a[low];                    // first element is pivot",
    "    int left = low, right = high;",
    "    while (left < right) {",
    "        while (a[left] <= pivot && left < right) left++; // BUG: left moves first!",
    "        while (a[right] >= pivot && left < right) right--;",
    "        if (left < right) swap(a, left, right);",
    "    }",
    "    swap(a, low, right);                   // BUG: swaps pivot with element > pivot!",
    "    return right;",
    "}",
  ],
};

export type PartitionMode = "right_first" | "left_first";

export type PartitionState = {
  array: number[];
  low: number;
  high: number;
  pivot: number;
  left: number;
  right: number;
  meetingIdx?: number;
  compare?: number[];
  write?: [number, number];
  corrupted?: boolean;
  corruptedReason?: string;
  comparisons: number;
  swaps: number;
  mode: PartitionMode;
  done: boolean;
};

export function partitionFrames(
  input: number[],
  mode: PartitionMode = "right_first"
): Frame<PartitionState>[] {
  const a = [...input];
  const n = a.length;
  const frames: Frame<PartitionState>[] = [];
  const low = 0;
  const high = n - 1;
  const pivot = a[low];
  let left = low;
  let right = high;
  let comparisons = 0;
  let swaps = 0;

  const push = (
    line: number,
    message: string,
    meta: {
      compare?: number[];
      write?: [number, number];
      meetingIdx?: number;
      corrupted?: boolean;
      corruptedReason?: string;
      done?: boolean;
    } = {}
  ) => {
    frames.push({
      state: {
        array: [...a],
        low,
        high,
        pivot,
        left,
        right,
        meetingIdx: meta.meetingIdx,
        compare: meta.compare,
        write: meta.write,
        corrupted: meta.corrupted,
        corruptedReason: meta.corruptedReason,
        comparisons,
        swaps,
        mode,
        done: Boolean(meta.done),
      },
      line,
      message,
      stats: { comparisons, swaps },
    });
  };

  if (n <= 1) {
    push(0, `Subarray of size ${n}: partition trivial.`, { done: true });
    return frames;
  }

  push(
    1,
    `Select pivot = a[${low}] = ${pivot}. Left pointer at ${left}, right pointer at ${high}. Mode: ${mode === "right_first" ? "right pointer moves first (correct)" : "left pointer moves first (buggy)"}.`
  );

  if (mode === "right_first") {
    while (left < right) {
      push(3, `Outer loop: left (${left}) < right (${right}). Scan right pointer leftward.`, {
        compare: [right],
      });

      while (left < right) {
        comparisons++;
        const ok = a[right] >= pivot;
        push(
          4,
          `Compare a[${right}] (${a[right]}) >= pivot (${pivot}): ${ok ? "yes, belongs on right. Advance right leftward." : "no, smaller than pivot! Stop right pointer here."}`,
          { compare: [right] }
        );
        if (!ok) break;
        right--;
      }

      push(5, `Scan left pointer rightward while a[left] <= pivot.`, { compare: [left] });

      while (left < right) {
        comparisons++;
        const ok = a[left] <= pivot;
        const isPivotItself = left === low;
        push(
          5,
          `Compare a[${left}] (${a[left]}) <= pivot (${pivot})${isPivotItself ? " (pivot itself)" : ""}: ${ok ? "yes, belongs on left. Advance left rightward." : "no, larger than pivot! Stop left pointer here."}`,
          { compare: [left] }
        );
        if (!ok) break;
        left++;
      }

      if (left < right) {
        const temp = a[left];
        a[left] = a[right];
        a[right] = temp;
        swaps++;
        push(
          6,
          `Both pointers stopped. Swap a[${left}] (${a[left]}) and a[${right}] (${a[right]}). Now smaller value is left and larger value is right.`,
          { write: [left, right] }
        );
      }
    }

    const meetingIdx = right;
    const finalMeetingVal = a[meetingIdx];
    if (low !== meetingIdx) {
      const temp = a[low];
      a[low] = a[meetingIdx];
      a[meetingIdx] = temp;
      swaps++;
    }

    const leftValid = a.slice(0, meetingIdx).every((v) => v <= pivot);
    const rightValid = a.slice(meetingIdx + 1).every((v) => v >= pivot);
    const valid = leftValid && rightValid;

    push(
      8,
      `Pointers met at index ${meetingIdx} (value ${finalMeetingVal}). Swap pivot ${pivot} into index ${meetingIdx}. Partition complete! All elements left are <= ${pivot}, all right are >= ${pivot}.`,
      {
        write: [low, meetingIdx],
        meetingIdx,
        done: true,
        corrupted: !valid,
      }
    );
  } else {
    // left_first (buggy)
    while (left < right) {
      push(3, `Outer loop: left (${left}) < right (${right}). Scan left pointer rightward first!`, {
        compare: [left],
      });

      while (left < right) {
        comparisons++;
        const ok = a[left] <= pivot;
        const isPivotItself = left === low;
        push(
          4,
          `Compare a[${left}] (${a[left]}) <= pivot (${pivot})${isPivotItself ? " (pivot itself)" : ""}: ${ok ? "yes, belongs on left. Advance left rightward." : "no, larger than pivot! Stop left pointer here."}`,
          { compare: [left] }
        );
        if (!ok) break;
        left++;
      }

      push(5, `Scan right pointer leftward while a[right] >= pivot.`, { compare: [right] });

      while (left < right) {
        comparisons++;
        const ok = a[right] >= pivot;
        push(
          5,
          `Compare a[${right}] (${a[right]}) >= pivot (${pivot}): ${ok ? "yes, belongs on right. Advance right leftward." : "no, smaller than pivot! Stop right pointer here."}`,
          { compare: [right] }
        );
        if (!ok) break;
        right--;
      }

      if (left < right) {
        const temp = a[left];
        a[left] = a[right];
        a[right] = temp;
        swaps++;
        push(
          6,
          `Both pointers stopped. Swap a[${left}] (${a[left]}) and a[${right}] (${a[right]}).`,
          { write: [left, right] }
        );
      }
    }

    const meetingIdx = right;
    const finalMeetingVal = a[meetingIdx];
    if (low !== meetingIdx) {
      const temp = a[low];
      a[low] = a[meetingIdx];
      a[meetingIdx] = temp;
      swaps++;
    }

    const leftValid = a.slice(0, meetingIdx).every((v) => v <= pivot);
    const rightValid = a.slice(meetingIdx + 1).every((v) => v >= pivot);
    const valid = leftValid && rightValid;

    const corruptedReason = !valid
      ? `Partition corrupted! Pointers met at index ${meetingIdx} holding ${finalMeetingVal} (which is > pivot ${pivot}). Swapping placed ${finalMeetingVal} at index 0 (left of pivot)!`
      : undefined;

    push(
      8,
      !valid
        ? `${corruptedReason} Moving left first failed.`
        : `Pointers met at index ${meetingIdx}. Pivot swapped into position.`,
      {
        write: [low, meetingIdx],
        meetingIdx,
        done: true,
        corrupted: !valid,
        corruptedReason,
      }
    );
  }

  return frames;
}

/* -------------------- binary search on unsorted data -------------------- */

export type BinarySearchUnsortedState = {
  array: number[];
  low: number;
  high: number;
  mid?: number;
  target: number;
  discarded?: [number, number];
  discardedContainsTarget?: boolean;
  foundIndex?: number;
  returnedValue?: number;
  isSorted: boolean;
};

export const JAVA_BINARY_SEARCH_UNSORTED = [
  "static int binarySearch(int[] a, int x) {",
  "    int low = 0, high = a.length - 1;",
  "    while (low <= high) {",
  "        int mid = low + (high - low) / 2;",
  "        if (a[mid] == x) return mid;",
  "        else if (a[mid] < x) low = mid + 1;   // assumes left half is <= a[mid]!",
  "        else high = mid - 1;                  // assumes right half is >= a[mid]!",
  "    }",
  "    return -1;                                // silent failure if unsorted!",
  "}",
];

export function binarySearchUnsortedFrames(
  input: number[],
  target: number,
  enforceSorted = false
): Frame<BinarySearchUnsortedState>[] {
  const a = enforceSorted ? [...input].sort((x, y) => x - y) : [...input];
  const isSorted = a.every((v, i) => i === 0 || a[i - 1] <= v);
  const frames: Frame<BinarySearchUnsortedState>[] = [];
  let comparisons = 0;

  const push = (
    line: number,
    message: string,
    s: {
      low: number;
      high: number;
      mid?: number;
      discarded?: [number, number];
      discardedContainsTarget?: boolean;
      foundIndex?: number;
      returnedValue?: number;
    }
  ) =>
    frames.push({
      state: { array: a, target, isSorted, ...s },
      line,
      message,
      stats: { comparisons },
    });

  let low = 0;
  let high = a.length - 1;
  push(
    0,
    `Search for target ${target} in ${isSorted ? "sorted" : "UNSORTED"} array [${a.join(", ")}].` +
      (isSorted
        ? " Sorted order ensures binary search works."
        : " Without sorting, binary search invariants break!"),
    { low, high }
  );

  push(1, `Initial search bounds: low = 0, high = ${high}.`, { low, high });

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    comparisons++;

    push(3, `Calculate mid = low + (high - low)/2 = ${mid}. Middle element is a[${mid}] = ${a[mid]}.`, {
      low,
      high,
      mid,
    });

    if (a[mid] === target) {
      push(4, `Found target ${target} at index ${mid}! Return ${mid}.`, {
        low,
        high,
        mid,
        foundIndex: mid,
        returnedValue: mid,
      });
      return frames;
    }

    if (a[mid] < target) {
      const discardedRange: [number, number] = [low, mid];
      const targetInDiscarded = a.slice(low, mid + 1).includes(target);
      const targetIdx = a.slice(low, mid + 1).indexOf(target) + low;

      push(
        5,
        `a[${mid}] (${a[mid]}) < ${target}. Assuming ascending order, algorithm discards left half [${low}..${mid}] and sets low = ${mid + 1}.` +
          (targetInDiscarded
            ? ` SILENT BUG: The discarded half actually contained target ${target} at index ${targetIdx}! Because data is unsorted, target was wrongly thrown away.`
            : ""),
        {
          low,
          high,
          mid,
          discarded: discardedRange,
          discardedContainsTarget: targetInDiscarded,
        }
      );
      low = mid + 1;
    } else {
      const discardedRange: [number, number] = [mid, high];
      const targetInDiscarded = a.slice(mid, high + 1).includes(target);
      const targetIdx = a.slice(mid, high + 1).indexOf(target) + mid;

      push(
        6,
        `a[${mid}] (${a[mid]}) > ${target}. Assuming ascending order, algorithm discards right half [${mid}..${high}] and sets high = ${mid - 1}.` +
          (targetInDiscarded
            ? ` SILENT BUG: The discarded half actually contained target ${target} at index ${targetIdx}! Because data is unsorted, target was wrongly thrown away.`
            : ""),
        {
          low,
          high,
          mid,
          discarded: discardedRange,
          discardedContainsTarget: targetInDiscarded,
        }
      );
      high = mid - 1;
    }
  }

  const actualTargetIndex = a.indexOf(target);
  const wasSilentFailure = actualTargetIndex !== -1;

  push(
    8,
    wasSilentFailure
      ? `SILENT FAILURE: Returned -1 ('Not Found') even though target ${target} is present in the array at index ${actualTargetIndex}! Binary search silently failed because the array was not sorted.`
      : `Target ${target} is not in the array. Binary search finished with return -1.`,
    { low, high, returnedValue: -1 }
  );

  return frames;
}

/* -------------------- binary search boundary bugs -------------------- */

export type BinarySearchBoundaryMode = "correct" | "strict_less" | "low_assign_mid";

export type BinarySearchBoundaryState = {
  array: number[];
  low: number;
  high: number;
  mid?: number;
  target: number;
  mode: BinarySearchBoundaryMode;
  foundIndex?: number;
  returnedValue?: number;
  infiniteLoop?: boolean;
  bugTriggered?: string;
};

export const JAVA_BINARY_SEARCH_BOUNDARY: Record<BinarySearchBoundaryMode, string[]> = {
  correct: [
    "int low = 0, high = a.length - 1;",
    "while (low <= high) {                     // checks 1-element candidate window",
    "    int mid = low + (high - low) / 2;",
    "    if (a[mid] == x) return mid;",
    "    else if (a[mid] < x) low = mid + 1;   // advances past mid",
    "    else high = mid - 1;                  // retreats before mid",
    "}",
    "return -1;",
  ],
  strict_less: [
    "int low = 0, high = a.length - 1;",
    "while (low < high) {                      // BUG: terminates when low == high!",
    "    int mid = low + (high - low) / 2;",
    "    if (a[mid] == x) return mid;",
    "    else if (a[mid] < x) low = mid + 1;",
    "    else high = mid - 1;",
    "}",
    "return -1;                                // never checked the last candidate!",
  ],
  low_assign_mid: [
    "int low = 0, high = a.length - 1;",
    "while (low <= high) {",
    "    int mid = low + (high - low) / 2;",
    "    if (a[mid] == x) return mid;",
    "    else if (a[mid] < x) low = mid;       // BUG: doesn't advance past mid!",
    "    else high = mid - 1;",
    "}",
    "return -1;",
  ],
};

export function binarySearchBoundaryFrames(
  mode: BinarySearchBoundaryMode,
  input: number[],
  target: number
): Frame<BinarySearchBoundaryState>[] {
  const a = [...input].sort((x, y) => x - y);
  const frames: Frame<BinarySearchBoundaryState>[] = [];
  let comparisons = 0;

  const push = (
    line: number,
    message: string,
    s: {
      low: number;
      high: number;
      mid?: number;
      foundIndex?: number;
      returnedValue?: number;
      infiniteLoop?: boolean;
      bugTriggered?: string;
    }
  ) =>
    frames.push({
      state: { array: a, target, mode, ...s },
      line,
      message,
      stats: { comparisons },
    });

  let low = 0;
  let high = a.length - 1;

  push(0, `Initialize low = 0, high = ${high}. Search target = ${target}.`, { low, high });

  const seenStates = new Set<string>();

  while (true) {
    const loopConditionHolds = mode === "strict_less" ? low < high : low <= high;

    if (!loopConditionHolds) {
      push(
        1,
        mode === "strict_less"
          ? `Condition (low < high) is FALSE (${low} < ${high} is false). Loop terminates early!`
          : `Condition (low <= high) is FALSE (${low} <= ${high} is false). Window exhausted.`,
        { low, high }
      );
      break;
    }

    const stateKey = `${low},${high}`;
    if (mode === "low_assign_mid" && seenStates.has(stateKey)) {
      push(
        4,
        `INFINITE LOOP DETECTED! Window [${low}, ${high}] repeated without shrinking because low = mid (${low}) never advanced past mid. Loop will run forever.`,
        {
          low,
          high,
          infiniteLoop: true,
          bugTriggered: "Infinite loop trap: low = mid never advances past mid when two elements remain.",
        }
      );
      return frames;
    }
    seenStates.add(stateKey);

    push(
      1,
      mode === "strict_less"
        ? `Condition (low < high) is TRUE (${low} < ${high}). Window size is ${high - low + 1}.`
        : `Condition (low <= high) is TRUE (${low} <= ${high}). Window size is ${high - low + 1}.`,
      { low, high }
    );

    const mid = low + Math.floor((high - low) / 2);
    comparisons++;

    push(2, `mid = ${low} + (${high} - ${low}) / 2 = ${mid}. Middle element is a[${mid}] = ${a[mid]}.`, {
      low,
      high,
      mid,
    });

    if (a[mid] === target) {
      push(3, `a[${mid}] == ${target}. Target found at index ${mid}! Return ${mid}.`, {
        low,
        high,
        mid,
        foundIndex: mid,
        returnedValue: mid,
      });
      return frames;
    }

    if (a[mid] < target) {
      if (mode === "low_assign_mid") {
        push(
          4,
          `a[${mid}] (${a[mid]}) < ${target}. BUG: Executing low = mid sets low = ${mid} (instead of mid + 1 = ${mid + 1}).`,
          { low: mid, high, mid }
        );
        low = mid;
      } else {
        push(
          4,
          `a[${mid}] (${a[mid]}) < ${target}. Set low = mid + 1 = ${mid + 1}.`,
          { low: mid + 1, high, mid }
        );
        low = mid + 1;
      }
    } else {
      push(
        5,
        `a[${mid}] (${a[mid]}) > ${target}. Set high = mid - 1 = ${mid - 1}.`,
        { low, high: mid - 1, mid }
      );
      high = mid - 1;
    }
  }

  // After loop
  if (mode === "strict_less" && low === high && a[low] === target) {
    push(
      7,
      `PREMATURE EXIT BUG! Target ${target} is located at index ${low}, but loop condition low < high terminated before inspecting index ${low}! Method returns -1.`,
      {
        low,
        high,
        returnedValue: -1,
        bugTriggered: `Off-by-one boundary failure: target ${target} exists at index ${low}, but low < high terminated early.`,
      }
    );
  } else {
    push(7, `Search terminated. Target ${target} not found in array. Return -1.`, {
      low,
      high,
      returnedValue: -1,
    });
  }

  return frames;
}

/* -------------------- Euclid rectangle square tiling -------------------- */

export type EuclidTile = {
  x: number;
  y: number;
  size: number;
  step: number;
  orientation: "horizontal" | "vertical";
};

export type EuclidTilingState = {
  m: number;
  n: number;
  totalWidth: number;
  totalHeight: number;
  tiles: EuclidTile[];
  remaining?: { x: number; y: number; w: number; h: number };
  equation: string;
  stepNum: number;
  gcd?: number;
  done: boolean;
};

export const JAVA_EUCLID_TILING = [
  "// Euclid's algorithm as geometric rectangle tiling",
  "// An m × n rectangle is tiled with squares:",
  "while (n != 0) {",
  "    int q = m / n;          // fits q squares of size n × n",
  "    int r = m % n;          // leaves remaining strip of r × n",
  "    m = n;",
  "    n = r;",
  "}",
  "// Final square size is gcd(m, n)",
];

export function euclidTilingFrames(m0: number, n0: number): Frame<EuclidTilingState>[] {
  const totalWidth = Math.max(m0, n0);
  const totalHeight = Math.min(m0, n0);
  const frames: Frame<EuclidTilingState>[] = [];
  let steps = 0;

  const push = (
    line: number,
    message: string,
    s: {
      tiles: EuclidTile[];
      remaining?: { x: number; y: number; w: number; h: number };
      equation: string;
      stepNum: number;
      gcd?: number;
      done?: boolean;
    }
  ) =>
    frames.push({
      state: {
        m: m0,
        n: n0,
        totalWidth,
        totalHeight,
        done: s.done ?? false,
        ...s,
      },
      line,
      message,
      stats: { steps },
    });

  let rem = { x: 0, y: 0, w: totalWidth, h: totalHeight };
  const currentTiles: EuclidTile[] = [];

  push(
    0,
    `Tile a ${totalWidth} × ${totalHeight} rectangle with squares. Finding the largest possible square tile computes gcd(${m0}, ${n0}).`,
    {
      tiles: [],
      remaining: { ...rem },
      equation: `Initial floor: ${totalWidth} × ${totalHeight}`,
      stepNum: 0,
    }
  );

  let step = 0;
  while (rem.w > 0 && rem.h > 0 && step < 20) {
    step++;
    steps++;

    if (rem.w >= rem.h) {
      const size = rem.h;
      const q = Math.floor(rem.w / size);
      const r = rem.w % size;

      for (let i = 0; i < q; i++) {
        currentTiles.push({
          x: rem.x + i * size,
          y: rem.y,
          size,
          step,
          orientation: "horizontal",
        });
      }

      const nextRem = r > 0 ? { x: rem.x + q * size, y: rem.y, w: r, h: size } : undefined;
      const eq = `${rem.w} = ${q} × ${size} + ${r}`;

      push(
        3,
        `Fit ${q} square${q > 1 ? "s" : ""} of size ${size} × ${size} across width ${rem.w}. ` +
          (r > 0
            ? `Remaining strip is ${r} × ${size}. Now tile that remainder.`
            : `Remainder is 0! The floor is completely tiled.`),
        {
          tiles: [...currentTiles],
          remaining: nextRem,
          equation: eq,
          stepNum: step,
        }
      );

      rem = nextRem ?? { x: 0, y: 0, w: 0, h: 0 };
    } else {
      const size = rem.w;
      const q = Math.floor(rem.h / size);
      const r = rem.h % size;

      for (let i = 0; i < q; i++) {
        currentTiles.push({
          x: rem.x,
          y: rem.y + i * size,
          size,
          step,
          orientation: "vertical",
        });
      }

      const nextRem = r > 0 ? { x: rem.x, y: rem.y + q * size, w: size, h: r } : undefined;
      const eq = `${rem.h} = ${q} × ${size} + ${r}`;

      push(
        3,
        `Fit ${q} square${q > 1 ? "s" : ""} of size ${size} × ${size} down height ${rem.h}. ` +
          (r > 0
            ? `Remaining strip is ${size} × ${r}. Now tile that remainder.`
            : `Remainder is 0! The floor is completely tiled.`),
        {
          tiles: [...currentTiles],
          remaining: nextRem,
          equation: eq,
          stepNum: step,
        }
      );

      rem = nextRem ?? { x: 0, y: 0, w: 0, h: 0 };
    }
  }

  const finalSize = currentTiles.length > 0 ? currentTiles[currentTiles.length - 1].size : 1;

  push(
    8,
    `Tiling complete! The largest square that evenly tiles the whole ${totalWidth} × ${totalHeight} floor has side length ${finalSize}. Therefore, gcd(${m0}, ${n0}) = ${finalSize}.`,
    {
      tiles: [...currentTiles],
      remaining: undefined,
      equation: `gcd(${m0}, ${n0}) = ${finalSize}`,
      stepNum: step,
      gcd: finalSize,
      done: true,
    }
  );

  return frames;
}

/* -------------------- GCD comparison: Brute Force vs Euclid -------------------- */

export function gcdComparisonSummary(m: number, n: number) {
  const minVal = Math.min(m, n);
  const maxVal = Math.max(m, n);

  let gcd = 1;
  let bruteForceTests = 0;
  for (let d = minVal; d >= 1; d--) {
    bruteForceTests++;
    if (minVal % d === 0 && maxVal % d === 0) {
      gcd = d;
      break;
    }
  }

  let euclidDivisions = 0;
  let a = maxVal;
  let b = minVal;
  while (b !== 0) {
    const r = a % b;
    euclidDivisions++;
    a = b;
    b = r;
  }

  return {
    m,
    n,
    gcd,
    bruteForceTests,
    euclidDivisions,
    speedupRatio: +(bruteForceTests / Math.max(1, euclidDivisions)).toFixed(1),
  };
}
