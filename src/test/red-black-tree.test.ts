import { describe, it, expect } from "vitest";
import { RBTree, rbFrames, rng } from "@/lib/advancedAlgorithms";

describe("red-black tree", () => {
  it("stays valid through random inserts and deletes", () => {
    const r = rng(42);
    for (let trial = 0; trial < 30; trial++) {
      const t = new RBTree();
      const keys = new Set<number>();
      for (let i = 0; i < 60; i++) {
        const k = Math.floor(r() * 200);
        if (!keys.has(k)) { t.insert(k); keys.add(k); }
        t.check();
      }
      expect(t.inorder()).toEqual([...keys].sort((a, b) => a - b));
      for (const k of [...keys].sort(() => r() - 0.5).slice(0, 40)) {
        t.delete(k); keys.delete(k);
        t.check();
        expect(t.inorder()).toEqual([...keys].sort((a, b) => a - b));
      }
      expect(t.height()).toBeLessThanOrEqual(2 * Math.log2(keys.size + 1) + 1e-9);
    }
  });

  it("deletion example hits every fix-up case", () => {
    // the example used in the deletion lesson
    const f = rbFrames([5, 25, 10, 20, 90, 80, 40, 55, 70, 95], [25, 5, 80, 10].map((key) => ({ op: "delete" as const, key })));
    const got = new Set(f.map((x) => x.state.caseLabel).filter(Boolean));
    for (const c of ["x red", "Sibling red", "Both nephews black", "Red nephew"]) expect(got).toContain(c);
  });

  it("matches the lecture's three deletion examples", () => {
    // preorder with colours, "-" for NIL, e.g. "47B(32B,71R(...))"
    const shape = (s: { nodes: { id: number; key: number; color: string; left: number | null; right: number | null }[]; root: number | null }) => {
      const byId = new Map(s.nodes.map((n) => [n.id, n]));
      const go = (id: number | null): string => {
        if (id === null) return "-";
        const n = byId.get(id)!;
        return n.left === null && n.right === null ? `${n.key}${n.color}` : `${n.key}${n.color}(${go(n.left)},${go(n.right)})`;
      };
      return go(s.root);
    };
    const end = (start: number[], key: number) => shape(rbFrames(start, [{ op: "delete", key }]).at(-1)!.state);
    const built = [47, 32, 71, 65, 82, 87, 93];
    expect(shape(rbFrames(built, []).at(-1)!.state)).toBe("47B(32B,71R(65B,87B(82R,93R)))");
    // 1: delete 87, its red predecessor 82 takes its place
    expect(end(built, 87)).toBe("47B(32B,71R(65B,82B(-,93R)))");
    // 2: with 51 added, delete 71: 65 replaces it and 51 turns black
    expect(end([...built, 51], 71)).toBe("47B(32B,65R(51B,87B(82R,93R)))");
    // 3: delete 32: red sibling, then black sibling with black nephews, then stop at red 47
    expect(end(built, 32)).toBe("71B(47B(-,65R),87B(82R,93R))");
  });

  it("uses the insertion cases on the textbook example (insert 15)", () => {
    const f = rbFrames([7, 3, 18, 10, 22, 8, 11, 26], [{ op: "insert", key: 15 }]);
    const cases = f.map((x) => x.state.caseLabel).filter(Boolean);
    // the lecture: recolor, RIGHT-ROTATE(18), then LEFT-ROTATE(7) and recolor
    expect([...new Set(cases)]).toEqual(["Case 1", "Case 2", "Case 3"]);
    const last = f.at(-1)!.state;
    const root = last.nodes.find((n) => n.id === last.root)!;
    expect(root.key).toBe(10);
  });
});
