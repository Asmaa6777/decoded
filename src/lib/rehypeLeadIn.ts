/**
 * Marks a paragraph's or list item's leading bold phrase ("**Worst case:** …", "**Case 1:** …")
 * with the class `lead-in`, so the lesson CSS can colour these topic labels without touching
 * bold words in the middle of a sentence. CSS alone can't tell whether text comes before a <strong>.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const isBlank = (n: HastNode) => n.type === "text" && !(n.value ?? "").trim();

function markLeading(container: HastNode) {
  const first = (container.children ?? []).find((c) => !isBlank(c));
  if (!first || first.type !== "element") return;
  if (first.tagName === "strong") {
    const props = (first.properties ??= {});
    const existing = props.className;
    const list = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : [];
    if (!list.includes("lead-in")) props.className = [...list, "lead-in"];
  } else if (container.tagName === "li" && first.tagName === "p") {
    // loose lists wrap each item's text in a <p>
    markLeading(first);
  }
}

function walk(node: HastNode) {
  if (node.type === "element" && (node.tagName === "p" || node.tagName === "li")) markLeading(node);
  for (const child of node.children ?? []) walk(child);
}

export default function rehypeLeadIn() {
  return (tree: HastNode) => {
    walk(tree);
  };
}
