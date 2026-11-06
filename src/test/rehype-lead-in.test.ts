import { describe, expect, it } from "vitest";
import rehypeLeadIn from "@/lib/rehypeLeadIn";

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };
const text = (value: string): Node => ({ type: "text", value });
const el = (tagName: string, children: Node[] = []): Node => ({ type: "element", tagName, properties: {}, children });
const classes = (n: Node) => (n.properties?.className as string[] | undefined) ?? [];

describe("rehypeLeadIn", () => {
  it("marks bold that starts a paragraph or a list item, and nothing else", () => {
    const label = el("strong", [text("Worst case:")]);
    const middle = el("strong", [text("one")]);
    const item = el("strong", [text("Case 1:")]);
    const loose = el("strong", [text("Proof.")]);
    const tree = el("root", [
      el("p", [label, text(" all n elements land in "), middle, text(" chain.")]),
      el("ul", [text("\n"), el("li", [text("\n"), item, text(" the keys arrive sorted")]), el("li", [el("p", [loose, text(" …")])])]),
      el("p", [text("One proposal is that "), el("strong", [text("each slot holds a BST")])]),
    ]);
    rehypeLeadIn()(tree);
    expect(classes(label)).toEqual(["lead-in"]);
    expect(classes(item)).toEqual(["lead-in"]);
    expect(classes(loose)).toEqual(["lead-in"]);
    expect(classes(middle)).toEqual([]);
    expect(classes((tree.children![2].children![1]) as Node)).toEqual([]);
  });
});
