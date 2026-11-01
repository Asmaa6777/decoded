/* Logic for the Data Structures course. Pure functions that return snapshots
   (or Stepper frames); src/components/mdx/DataStructureVisualizers.tsx draws them. */

import type { Frame } from "@/lib/algorithms";

const f = <S>(state: S, line: number, message: string, stats: Record<string, number> = {}): Frame<S> => ({ state, line, message, stats });

/* ================================ dynamic array ================================ */

export type DynArrayState = { items: number[]; capacity: number; copying: boolean; copies: number; appends: number };

export const PY_APPEND = [
  "def append(self, x):",
  "    if self.size == self.capacity:",
  "        bigger = [None] * (self.capacity * growth)",
  "        for i in range(self.size):",
  "            bigger[i] = self.data[i]      # copy",
  "        self.data, self.capacity = bigger, self.capacity * growth",
  "    self.data[self.size] = x",
  "    self.size += 1",
];

/** Append 1..n to an array that starts with capacity 1 and multiplies it by `growth` when full. */
export function appendFrames(n: number, growth = 2): Frame<DynArrayState>[] {
  let items: number[] = [];
  let capacity = 1;
  let copies = 0;
  const frames: Frame<DynArrayState>[] = [f({ items: [], capacity, copying: false, copies, appends: 0 }, 0, "An empty array with room for 1 item.", { copies: 0 })];
  for (let x = 1; x <= n; x++) {
    if (items.length === capacity) {
      const next = Math.max(capacity + 1, Math.floor(capacity * growth));
      copies += items.length;
      frames.push(f({ items: [...items], capacity: next, copying: true, copies, appends: x - 1 }, 4, `Full at ${capacity}. Allocate ${next} slots and copy all ${items.length} item${items.length === 1 ? "" : "s"} across.`, { copies, "copies per append": round2(copies / x) }));
      capacity = next;
    }
    items = [...items, x];
    frames.push(f({ items: [...items], capacity, copying: false, copies, appends: x }, 6, `Write ${x} into slot ${x - 1}. ${capacity - items.length} free slot${capacity - items.length === 1 ? "" : "s"} left.`, { copies, "copies per append": round2(copies / x) }));
  }
  return frames;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Total element copies made by n appends with a given growth factor (starting capacity 1). */
export function totalCopies(n: number, growth: number) {
  let capacity = 1;
  let copies = 0;
  for (let size = 0; size < n; size++) {
    if (size === capacity) {
      copies += size;
      capacity = Math.max(capacity + 1, Math.floor(capacity * growth));
    }
  }
  return copies;
}

/* ================================ linked list ================================ */

export type LNode = { id: number; value: string; next: number | null };
export type LinkedList = { nodes: Record<number, LNode>; head: number | null; nextId: number };
export type ListOp = { list: LinkedList; walked: number[]; changed: number[]; note: string };

export function listFrom(values: string[]): LinkedList {
  const nodes: Record<number, LNode> = {};
  values.forEach((v, i) => (nodes[i] = { id: i, value: v, next: i + 1 < values.length ? i + 1 : null }));
  return { nodes, head: values.length ? 0 : null, nextId: values.length };
}

export function listValues(l: LinkedList): string[] {
  const out: string[] = [];
  for (let at = l.head; at !== null; at = l.nodes[at].next) out.push(l.nodes[at].value);
  return out;
}

const clone = (l: LinkedList): LinkedList => ({ ...l, nodes: Object.fromEntries(Object.entries(l.nodes).map(([k, n]) => [k, { ...n }])) });

export function pushFront(l: LinkedList, value: string): ListOp {
  const c = clone(l);
  const id = c.nextId++;
  c.nodes[id] = { id, value, next: c.head };
  c.head = id;
  return { list: c, walked: [], changed: [id], note: `New node "${value}" points at the old head, then head points at it. Two pointer writes, no matter how long the list is: O(1).` };
}

export function append(l: LinkedList, value: string): ListOp {
  const c = clone(l);
  const id = c.nextId++;
  c.nodes[id] = { id, value, next: null };
  const walked: number[] = [];
  if (c.head === null) {
    c.head = id;
    return { list: c, walked, changed: [id], note: `The list was empty, so "${value}" becomes the head.` };
  }
  let at = c.head;
  walked.push(at);
  while (c.nodes[at].next !== null) {
    at = c.nodes[at].next!;
    walked.push(at);
  }
  c.nodes[at].next = id;
  return { list: c, walked, changed: [id], note: `No tail pointer, so we walk all ${walked.length} nodes to find the last one: O(n). Keeping a tail pointer makes this O(1).` };
}

export function removeValue(l: LinkedList, value: string): ListOp {
  const c = clone(l);
  const walked: number[] = [];
  let prev: number | null = null;
  for (let at = c.head; at !== null; prev = at, at = c.nodes[at].next) {
    walked.push(at);
    if (c.nodes[at].value === value) {
      if (prev === null) c.head = c.nodes[at].next;
      else c.nodes[prev].next = c.nodes[at].next;
      delete c.nodes[at];
      return { list: c, walked, changed: prev === null ? [] : [prev], note: `Found "${value}" after looking at ${walked.length} node${walked.length === 1 ? "" : "s"}. ${prev === null ? "It was the head, so head moves to the next node." : `The node before it now points past it.`} Nothing else moves: unlike an array, no items shift.` };
    }
  }
  return { list: c, walked, changed: [], note: `Walked all ${walked.length} nodes: "${value}" isn't in the list.` };
}

/* ================================ stack: brackets ================================ */

export type BracketState = { text: string; i: number; stack: { ch: string; at: number }[]; verdict: "running" | "ok" | "mismatch" | "unclosed" | "extra"; bad: number | null };

export const PY_BRACKETS = [
  "def balanced(text):",
  "    stack = []",
  "    for ch in text:",
  "        if ch in '([{':",
  "            stack.append(ch)             # push",
  "        elif ch in ')]}':",
  "            if not stack or stack.pop() != PAIR[ch]:",
  "                return False             # wrong closer",
  "    return not stack                     # leftovers = unclosed",
];

const OPEN: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

export function bracketFrames(text: string): Frame<BracketState>[] {
  const stack: { ch: string; at: number }[] = [];
  const frames: Frame<BracketState>[] = [f({ text, i: -1, stack: [], verdict: "running", bad: null }, 1, "Start with an empty stack. Openers go on; each closer must match the opener on top.")];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ("([{".includes(ch)) {
      stack.push({ ch, at: i });
      frames.push(f({ text, i, stack: [...stack], verdict: "running", bad: null }, 4, `"${ch}" opens: push it. Depth ${stack.length}.`, { depth: stack.length }));
    } else if (ch in OPEN) {
      const top = stack[stack.length - 1];
      if (!top) {
        frames.push(f({ text, i, stack: [], verdict: "extra", bad: i }, 7, `"${ch}" closes, but the stack is empty: nothing is open. Unbalanced.`, { depth: 0 }));
        return frames;
      }
      if (top.ch !== OPEN[ch]) {
        frames.push(f({ text, i, stack: [...stack], verdict: "mismatch", bad: i }, 7, `"${ch}" closes, but the top of the stack is "${top.ch}". The most recent opener must close first. Unbalanced.`, { depth: stack.length }));
        return frames;
      }
      stack.pop();
      frames.push(f({ text, i, stack: [...stack], verdict: "running", bad: null }, 6, `"${ch}" matches the "${top.ch}" on top: pop it. Depth ${stack.length}.`, { depth: stack.length }));
    }
  }
  const ok = stack.length === 0;
  frames.push(f({ text, i: text.length, stack: [...stack], verdict: ok ? "ok" : "unclosed", bad: ok ? null : stack[stack.length - 1].at }, 8, ok ? "End of input with an empty stack: balanced." : `End of input, but ${stack.length} opener${stack.length === 1 ? " is" : "s are"} still on the stack: never closed.`, { depth: stack.length }));
  return frames;
}

/* ================================ ring-buffer queue ================================ */

export type Ring = { slots: (string | null)[]; head: number; size: number; next: number };

export const ringQueue = (cap = 8): Ring => ({ slots: Array(cap).fill(null), head: 0, size: 0, next: 1 });
export const ringTail = (r: Ring) => (r.head + r.size) % r.slots.length;

export function enqueue(r: Ring): { ring: Ring; ok: boolean; note: string } {
  const cap = r.slots.length;
  if (r.size === cap) return { ring: r, ok: false, note: `Full: all ${cap} slots are used. A growable queue would allocate a bigger array here and copy the items over, in order from head.` };
  const tail = ringTail(r);
  const slots = [...r.slots];
  const item = `#${r.next}`;
  slots[tail] = item;
  return { ring: { ...r, slots, size: r.size + 1, next: r.next + 1 }, ok: true, note: `enqueue ${item} at the tail, slot ${tail}. tail = (head + size) mod ${cap}${tail === cap - 1 ? ", so the next one wraps round to slot 0" : ""}.` };
}

export function dequeue(r: Ring): { ring: Ring; ok: boolean; item: string | null; note: string } {
  if (r.size === 0) return { ring: r, ok: false, item: null, note: "Empty: nothing to dequeue." };
  const slots = [...r.slots];
  const item = slots[r.head];
  slots[r.head] = null;
  const head = (r.head + 1) % slots.length;
  return { ring: { ...r, slots, head, size: r.size - 1 }, ok: true, item, note: `dequeue ${item} from the head, slot ${r.head}. head moves to slot ${head}. Nothing shifts: that's why this is O(1), while list.pop(0) in Python shifts every item, O(n).` };
}

/* ================================ hash map ================================ */

export type HashMapState = { buckets: string[][]; size: number; resizing: boolean; probe: { key: string; hash: number; bucket: number } | null };

/** A small, readable string hash: h = h·31 + code, kept to 32 bits. Java's String.hashCode works the same way. */
export function stringHash(s: string): number {
  let h = 0;
  for (const ch of s) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

export const PY_PUT = [
  "def put(self, key, value):",
  "    i = hash(key) % len(self.buckets)",
  "    for pair in self.buckets[i]:",
  "        if pair[0] == key: pair[1] = value; return",
  "    self.buckets[i].append([key, value])",
  "    self.size += 1",
  "    if self.size / len(self.buckets) > 0.75:",
  "        self.resize(2 * len(self.buckets))   # rehash everything",
];

export function hashMapFrames(keys: string[], startBuckets = 4, maxLoad = 0.75): Frame<HashMapState>[] {
  let buckets: string[][] = Array.from({ length: startBuckets }, () => []);
  let size = 0;
  const frames: Frame<HashMapState>[] = [f({ buckets: buckets.map((b) => [...b]), size, resizing: false, probe: null }, 0, `${startBuckets} empty buckets. Each key goes in bucket hash(key) mod ${startBuckets}.`, { "load factor": 0 })];
  for (const key of keys) {
    const hash = stringHash(key);
    const bucket = hash % buckets.length;
    const there = buckets[bucket].includes(key);
    if (!there) {
      buckets[bucket] = [...buckets[bucket], key];
      size++;
    }
    const load = size / buckets.length;
    frames.push(
      f(
        { buckets: buckets.map((b) => [...b]), size, resizing: false, probe: { key, hash, bucket } },
        there ? 3 : 4,
        there
          ? `"${key}" is already in bucket ${bucket}: update its value, size stays ${size}.`
          : `hash("${key}") = ${hash}, and ${hash} mod ${buckets.length} = ${bucket}.${buckets[bucket].length > 1 ? ` Bucket ${bucket} already holds ${buckets[bucket].slice(0, -1).map((k) => `"${k}"`).join(", ")}: a collision, so the chain grows.` : ""} Load factor ${size}/${buckets.length} = ${round2(load)}.`,
        { "load factor": round2(load) },
      ),
    );
    if (load > maxLoad) {
      const bigger: string[][] = Array.from({ length: buckets.length * 2 }, () => []);
      for (const b of buckets) for (const k of b) bigger[stringHash(k) % bigger.length].push(k);
      buckets = bigger;
      frames.push(f({ buckets: buckets.map((b) => [...b]), size, resizing: true, probe: null }, 7, `Load factor passed ${maxLoad}. Double to ${buckets.length} buckets and rehash every key: each one's bucket is recomputed mod ${buckets.length}, so chains get short again.`, { "load factor": round2(size / buckets.length) }));
    }
  }
  return frames;
}

/* ================================ binary trees ================================ */

export type TNode = { key: number; left: TNode | null; right: TNode | null };

export function bstInsert(root: TNode | null, key: number): { root: TNode; path: number[]; existed: boolean } {
  const path: number[] = [];
  const go = (n: TNode | null): TNode => {
    if (!n) return { key, left: null, right: null };
    path.push(n.key);
    if (key < n.key) return { ...n, left: go(n.left) };
    if (key > n.key) return { ...n, right: go(n.right) };
    return n;
  };
  const before = bstSearch(root, key).found;
  return { root: go(root), path, existed: before };
}

export function bstFrom(keys: number[]): TNode | null {
  return keys.reduce<TNode | null>((r, k) => bstInsert(r, k).root, null);
}

export function bstSearch(root: TNode | null, key: number): { path: number[]; found: boolean } {
  const path: number[] = [];
  for (let n = root; n; n = key < n.key ? n.left : n.right) {
    path.push(n.key);
    if (n.key === key) return { path, found: true };
  }
  return { path, found: false };
}

/** Delete by the textbook rule: a leaf goes, a node with one child is replaced by it, and a node with two children takes its in-order successor's key. */
export function bstDelete(root: TNode | null, key: number): { root: TNode | null; kind: "leaf" | "one child" | "two children" | "missing"; successor: number | null } {
  let kind: "leaf" | "one child" | "two children" | "missing" = "missing";
  let successor: number | null = null;
  const minKey = (n: TNode): number => (n.left ? minKey(n.left) : n.key);
  const del = (n: TNode | null, k: number, top: boolean): TNode | null => {
    if (!n) return null;
    if (k < n.key) return { ...n, left: del(n.left, k, top) };
    if (k > n.key) return { ...n, right: del(n.right, k, top) };
    if (!n.left || !n.right) {
      if (top) kind = !n.left && !n.right ? "leaf" : "one child";
      return n.left ?? n.right;
    }
    const s = minKey(n.right);
    if (top) {
      kind = "two children";
      successor = s;
    }
    return { ...n, key: s, right: del(n.right, s, false) };
  };
  const out = del(root, key, true);
  return { root: out, kind, successor };
}

export function inorder(n: TNode | null): number[] {
  return n ? [...inorder(n.left), n.key, ...inorder(n.right)] : [];
}

export function height(n: TNode | null): number {
  return n ? 1 + Math.max(height(n.left), height(n.right)) : -1;
}

export type Traversal = "pre" | "in" | "post" | "level";
export type TravState = { visited: number[]; current: number | null; queue: number[] };

export const TRAVERSAL_CODE: Record<Traversal, string[]> = {
  pre: ["def preorder(n):", "    if n is None: return", "    visit(n)", "    preorder(n.left)", "    preorder(n.right)"],
  in: ["def inorder(n):", "    if n is None: return", "    inorder(n.left)", "    visit(n)", "    inorder(n.right)"],
  post: ["def postorder(n):", "    if n is None: return", "    postorder(n.left)", "    postorder(n.right)", "    visit(n)"],
  level: ["def level_order(root):", "    queue = deque([root])", "    while queue:", "        n = queue.popleft()", "        visit(n)", "        queue.extend(c for c in (n.left, n.right) if c)"],
};

export function traversalFrames(root: TNode, kind: Traversal): Frame<TravState>[] {
  const visited: number[] = [];
  const frames: Frame<TravState>[] = [f({ visited: [], current: null, queue: kind === "level" ? [root.key] : [] }, 0, kind === "level" ? "Start with the root in a queue." : "Start at the root.")];
  const visitLine = { pre: 2, in: 3, post: 4, level: 4 }[kind];
  const visit = (n: TNode, queue: number[] = []) => {
    visited.push(n.key);
    frames.push(f({ visited: [...visited], current: n.key, queue }, visitLine, `Visit ${n.key}. Order so far: ${visited.join(", ")}.`, { visited: visited.length }));
  };
  if (kind === "level") {
    const q: TNode[] = [root];
    while (q.length) {
      const n = q.shift()!;
      [n.left, n.right].forEach((c) => c && q.push(c));
      visit(n, q.map((x) => x.key));
    }
  } else {
    const walk = (n: TNode | null) => {
      if (!n) return;
      if (kind === "pre") visit(n);
      walk(n.left);
      if (kind === "in") visit(n);
      walk(n.right);
      if (kind === "post") visit(n);
    };
    walk(root);
  }
  return frames;
}

/* ================================ binary heap ================================ */

export type HeapState = { a: number[]; active: number[]; done: boolean };

export const PY_HEAP = [
  "def push(heap, x):",
  "    heap.append(x); i = len(heap) - 1",
  "    while i > 0 and heap[(i - 1) // 2] > heap[i]:      # sift up",
  "        swap(heap, i, (i - 1) // 2); i = (i - 1) // 2",
  "def pop(heap):",
  "    top = heap[0]; heap[0] = heap.pop()",
  "    i = 0   # sift down: swap with the smaller child while it's smaller",
  "    while smaller child c of i exists and heap[c] < heap[i]:",
  "        swap(heap, i, c); i = c",
  "    return top",
];

export function heapPushFrames(start: number[], x: number): Frame<HeapState>[] {
  const a = [...start, x];
  let i = a.length - 1;
  const frames: Frame<HeapState>[] = [f({ a: [...a], active: [i], done: false }, 1, `Put ${x} in the next free slot, index ${i}: the bottom level, leftmost gap. The shape stays a complete tree.`, { swaps: 0 })];
  let swaps = 0;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (a[p] <= a[i]) {
      frames.push(f({ a: [...a], active: [p, i], done: true }, 2, `Parent ${a[p]} ≤ ${a[i]}: the heap property holds. Done after ${swaps} swap${swaps === 1 ? "" : "s"}.`, { swaps }));
      return frames;
    }
    [a[p], a[i]] = [a[i], a[p]];
    swaps++;
    frames.push(f({ a: [...a], active: [p, i], done: false }, 3, `Parent at index ${p} was bigger: swap. ${a[p]} moves up to index ${p}.`, { swaps }));
    i = p;
  }
  frames.push(f({ a: [...a], active: [0], done: true }, 2, `${a[0]} reached the root: it's the new minimum. ${swaps} swap${swaps === 1 ? "" : "s"}, at most the height, log₂ n.`, { swaps }));
  return frames;
}

export function heapPopFrames(start: number[]): Frame<HeapState>[] {
  if (!start.length) return [f({ a: [], active: [], done: true }, 4, "The heap is empty.")];
  const a = [...start];
  const top = a[0];
  const last = a.pop()!;
  const frames: Frame<HeapState>[] = [];
  if (!a.length) return [f({ a: [], active: [], done: true }, 9, `Remove ${top}; the heap is now empty.`)];
  a[0] = last;
  frames.push(f({ a: [...a], active: [0], done: false }, 5, `Take ${top} from the root. Move the last item, ${last}, into the root so the shape stays complete.`, { swaps: 0 }));
  let i = 0;
  let swaps = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = l + 1;
    let c = l;
    if (r < a.length && a[r] < a[l]) c = r;
    if (l >= a.length || a[c] >= a[i]) {
      frames.push(f({ a: [...a], active: [i], done: true }, 9, `${a[i]} is no bigger than its children: done. Returned ${top} with ${swaps} swap${swaps === 1 ? "" : "s"}.`, { swaps }));
      return frames;
    }
    [a[c], a[i]] = [a[i], a[c]];
    swaps++;
    frames.push(f({ a: [...a], active: [i, c], done: false }, 8, `The smaller child ${a[i]} is smaller than ${a[c]}: swap them. Always the smaller child, so the new parent is ≤ both children.`, { swaps }));
    i = c;
  }
}

export const isMinHeap = (a: number[]) => a.every((v, i) => i === 0 || a[Math.floor((i - 1) / 2)] <= v);

/* ================================ trie ================================ */

export type Trie = { children: Record<string, Trie>; end: boolean };

export const emptyTrie = (): Trie => ({ children: {}, end: false });

export function trieInsert(t: Trie, word: string): Trie {
  if (!word) return { ...t, end: true };
  const [c, ...rest] = word;
  return { ...t, children: { ...t.children, [c]: trieInsert(t.children[c] ?? emptyTrie(), rest.join("")) } };
}

export function trieFrom(words: string[]): Trie {
  return words.reduce(trieInsert, emptyTrie());
}

/** Every stored word that starts with prefix, in alphabetical order, plus how many nodes the walk to the prefix touched. */
export function trieComplete(t: Trie, prefix: string): { words: string[]; steps: number; found: boolean } {
  let node: Trie | undefined = t;
  let steps = 0;
  for (const c of prefix) {
    node = node.children[c];
    if (!node) return { words: [], steps, found: false };
    steps++;
  }
  const words: string[] = [];
  const walk = (n: Trie, acc: string) => {
    if (n.end) words.push(acc);
    for (const k of Object.keys(n.children).sort()) walk(n.children[k], acc + k);
  };
  walk(node, prefix);
  return { words, steps, found: true };
}

export function trieSize(t: Trie): number {
  return 1 + Object.values(t.children).reduce((s, c) => s + trieSize(c), 0);
}

/* ================================ union-find ================================ */

export type UFState = { parent: number[]; rank: number[]; touched: number[]; note: string };

export const ufStart = (n: number): UFState => ({ parent: Array.from({ length: n }, (_, i) => i), rank: Array(n).fill(0), touched: [], note: `${n} separate sets: everyone is their own root.` });

/** Find with path compression: every node on the way up is pointed straight at the root. */
export function ufFind(s: UFState, x: number): { state: UFState; root: number; path: number[] } {
  const parent = [...s.parent];
  const path = [x];
  let r = x;
  while (parent[r] !== r) {
    r = parent[r];
    path.push(r);
  }
  for (const v of path) parent[v] = r;
  return { state: { ...s, parent }, root: r, path };
}

/** Union by rank: the shorter tree hangs under the taller one's root. */
export function ufUnion(s: UFState, a: number, b: number): UFState {
  const fa = ufFind(s, a);
  const fb = ufFind(fa.state, b);
  const st = fb.state;
  const ra = fa.root;
  const rb = fb.root;
  const compressed = [...fa.path, ...fb.path].filter((v, i, all) => all.indexOf(v) === i && s.parent[v] !== st.parent[v]);
  const squash = compressed.length ? ` Path compression pointed ${compressed.join(", ")} straight at the root.` : "";
  if (ra === rb) return { ...st, touched: [a, b], note: `find(${a}) = find(${b}) = ${ra}: already in the same set, nothing to do.${squash}` };
  const parent = [...st.parent];
  const rank = [...st.rank];
  let note: string;
  if (rank[ra] < rank[rb]) {
    parent[ra] = rb;
    note = `Root ${ra} (rank ${rank[ra]}) goes under root ${rb} (rank ${rank[rb]}): shorter under taller.`;
  } else if (rank[ra] > rank[rb]) {
    parent[rb] = ra;
    note = `Root ${rb} (rank ${rank[rb]}) goes under root ${ra} (rank ${rank[ra]}): shorter under taller.`;
  } else {
    parent[rb] = ra;
    rank[ra]++;
    note = `Equal ranks: ${rb} goes under ${ra}, and ${ra}'s rank grows to ${rank[ra]}.`;
  }
  return { parent, rank, touched: [a, b], note: `union(${a}, ${b}): ${note}${squash}` };
}

export function ufSets(s: UFState): number[][] {
  const groups = new Map<number, number[]>();
  s.parent.forEach((_, v) => {
    let r = v;
    while (s.parent[r] !== r) r = s.parent[r];
    groups.set(r, [...(groups.get(r) ?? []), v]);
  });
  return [...groups.values()];
}
