import { describe, expect, it } from "vitest";
import {
  append,
  appendFrames,
  bracketFrames,
  bstDelete,
  bstFrom,
  bstInsert,
  bstSearch,
  dequeue,
  emptyTrie,
  enqueue,
  hashMapFrames,
  heapPopFrames,
  heapPushFrames,
  height,
  inorder,
  isMinHeap,
  listFrom,
  listValues,
  pushFront,
  removeValue,
  ringQueue,
  stringHash,
  totalCopies,
  traversalFrames,
  trieComplete,
  trieFrom,
  trieInsert,
  trieSize,
  ufFind,
  ufSets,
  ufStart,
  ufUnion,
} from "@/lib/dataStructures";
import { seeded } from "@/lib/operatingSystems";

describe("dynamic array", () => {
  it("doubling keeps total copies under 2n", () => {
    for (const n of [1, 2, 3, 5, 17, 100, 1000, 4097]) expect(totalCopies(n, 2)).toBeLessThan(2 * n);
    expect(totalCopies(9, 2)).toBe(1 + 2 + 4 + 8);
  });
  it("growing by one each time copies about n²/2", () => {
    expect(totalCopies(100, 1)).toBe((99 * 100) / 2);
  });
  it("frames end with every item in order", () => {
    const fr = appendFrames(9).at(-1)!.state;
    expect(fr.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(fr.capacity).toBe(16);
    expect(fr.copies).toBe(15);
  });
});

describe("linked list", () => {
  it("pushes, appends and removes", () => {
    let l = listFrom(["b", "c"]);
    l = pushFront(l, "a").list;
    l = append(l, "d").list;
    expect(listValues(l)).toEqual(["a", "b", "c", "d"]);
    const r = removeValue(l, "c");
    expect(listValues(r.list)).toEqual(["a", "b", "d"]);
    expect(r.walked.length).toBe(3);
    expect(listValues(removeValue(r.list, "a").list)).toEqual(["b", "d"]);
    expect(removeValue(r.list, "z").walked.length).toBe(3);
  });
});

describe("bracket matching", () => {
  const verdict = (t: string) => bracketFrames(t).at(-1)!.state.verdict;
  it("judges strings", () => {
    expect(verdict("{[()()]}")).toBe("ok");
    expect(verdict("([)]")).toBe("mismatch");
    expect(verdict("(()")).toBe("unclosed");
    expect(verdict("())")).toBe("extra");
    expect(verdict("f(a[0], {b: 1})")).toBe("ok");
  });
});

describe("ring-buffer queue", () => {
  it("is first in, first out across the wrap", () => {
    let r = ringQueue(4);
    const out: string[] = [];
    for (let i = 0; i < 3; i++) r = enqueue(r).ring;
    for (let i = 0; i < 2; i++) {
      const d = dequeue(r);
      r = d.ring;
      out.push(d.item!);
    }
    for (let i = 0; i < 3; i++) r = enqueue(r).ring;
    expect(enqueue(r).ok).toBe(false);
    while (r.size) {
      const d = dequeue(r);
      r = d.ring;
      out.push(d.item!);
    }
    expect(out).toEqual(["#1", "#2", "#3", "#4", "#5", "#6"]);
    expect(dequeue(r).ok).toBe(false);
  });
});

describe("hash map", () => {
  it("matches Java's String.hashCode", () => {
    // "hello".hashCode() == 99162322 in Java
    expect(stringHash("hello")).toBe(99162322);
    expect(stringHash("")).toBe(0);
  });
  it("keeps every key and stays under the load factor", () => {
    const keys = ["apple", "banana", "cherry", "date", "elder", "fig", "grape", "kiwi", "lemon", "apple"];
    const last = hashMapFrames(keys).at(-1)!.state;
    expect(last.size).toBe(9);
    expect(last.buckets.flat().sort()).toEqual([...new Set(keys)].sort());
    expect(last.size / last.buckets.length).toBeLessThanOrEqual(0.75);
    last.buckets.forEach((b, i) => b.forEach((k) => expect(stringHash(k) % last.buckets.length).toBe(i)));
  });
});

describe("binary search tree", () => {
  const keys = [50, 30, 70, 20, 40, 60, 80, 35, 45, 65];
  it("keeps keys sorted in order and finds them", () => {
    const t = bstFrom(keys)!;
    expect(inorder(t)).toEqual([...keys].sort((a, b) => a - b));
    expect(bstSearch(t, 45)).toEqual({ path: [50, 30, 40, 45], found: true });
    expect(bstSearch(t, 66).found).toBe(false);
    expect(bstInsert(t, 40).existed).toBe(true);
  });
  it("deletes all three cases", () => {
    const t = bstFrom(keys);
    expect(bstDelete(t, 20).kind).toBe("leaf");
    expect(bstDelete(t, 60).kind).toBe("one child");
    const two = bstDelete(t, 30);
    expect(two.kind).toBe("two children");
    expect(two.successor).toBe(35);
    expect(inorder(two.root)).toEqual(keys.filter((k) => k !== 30).sort((a, b) => a - b));
    expect(bstDelete(t, 99).kind).toBe("missing");
  });
  it("random inserts and deletes stay sorted", () => {
    const rand = seeded(5);
    for (let trial = 0; trial < 200; trial++) {
      const ks = [...new Set(Array.from({ length: 15 }, () => Math.floor(rand() * 40)))];
      let t = bstFrom(ks);
      const gone = ks.filter(() => rand() < 0.4);
      for (const k of gone) t = bstDelete(t, k).root;
      expect(inorder(t)).toEqual(ks.filter((k) => !gone.includes(k)).sort((a, b) => a - b));
    }
  });
  it("degenerates on sorted input", () => {
    expect(height(bstFrom([1, 2, 3, 4, 5, 6, 7]))).toBe(6);
    expect(height(bstFrom([4, 2, 6, 1, 3, 5, 7]))).toBe(2);
  });
  it("traverses in the four orders", () => {
    const t = bstFrom([4, 2, 6, 1, 3, 5, 7])!;
    const order = (k: "pre" | "in" | "post" | "level") => traversalFrames(t, k).at(-1)!.state.visited;
    expect(order("pre")).toEqual([4, 2, 1, 3, 6, 5, 7]);
    expect(order("in")).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(order("post")).toEqual([1, 3, 2, 5, 7, 6, 4]);
    expect(order("level")).toEqual([4, 2, 6, 1, 3, 5, 7]);
  });
});

describe("binary heap", () => {
  it("push and pop keep the heap property and sort", () => {
    const rand = seeded(9);
    for (let trial = 0; trial < 100; trial++) {
      let h: number[] = [];
      const xs = Array.from({ length: 20 }, () => Math.floor(rand() * 100));
      for (const x of xs) {
        h = heapPushFrames(h, x).at(-1)!.state.a;
        expect(isMinHeap(h)).toBe(true);
      }
      const out: number[] = [];
      while (h.length) {
        out.push(Math.min(...h));
        h = heapPopFrames(h).at(-1)!.state.a;
        expect(isMinHeap(h)).toBe(true);
      }
      expect(out).toEqual([...xs].sort((a, b) => a - b));
    }
  });
});

describe("trie", () => {
  it("completes prefixes", () => {
    const t = trieFrom(["car", "card", "care", "cart", "cat", "dog"]);
    expect(trieComplete(t, "car")).toEqual({ words: ["car", "card", "care", "cart"], steps: 3, found: true });
    expect(trieComplete(t, "do").words).toEqual(["dog"]);
    expect(trieComplete(t, "x").found).toBe(false);
    expect(trieSize(t)).toBe(11); // root, c-a, r, t, d-e-t under r, d-o-g
    expect(trieComplete(trieInsert(emptyTrie(), "a"), "").words).toEqual(["a"]);
  });
});

describe("union-find", () => {
  it("joins sets and compresses paths", () => {
    let s = ufStart(6);
    s = ufUnion(s, 0, 1);
    s = ufUnion(s, 2, 3);
    s = ufUnion(s, 0, 2);
    s = ufUnion(s, 4, 5);
    expect(ufSets(s).map((g) => g.sort()).sort()).toEqual([[0, 1, 2, 3], [4, 5]]);
    const f = ufFind(s, 3);
    expect(f.root).toBe(0);
    expect(f.state.parent[3]).toBe(0);
    expect(ufUnion(s, 1, 3).note).toContain("already");
  });
});
