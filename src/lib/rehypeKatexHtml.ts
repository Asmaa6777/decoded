import { toHtml } from "hast-util-to-html";

/**
 * Turns each formula rehype-katex rendered into one <span> whose contents are a
 * prebuilt HTML string, instead of the hundreds of nested JSX calls MDX would
 * otherwise compile it to. A formula-heavy lesson shrinks from megabytes of
 * JavaScript to a fraction of that, and React mounts one element per formula.
 * The DOM that reaches the page is the same markup KaTeX produced.
 *
 * Runs after rehype-slug, so heading ids are still built from the formula's text.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  [key: string]: unknown;
};

const classes = (node: HastNode): string[] => {
  const c = node.properties?.className;
  return Array.isArray(c) ? c.map(String) : typeof c === "string" ? c.split(/\s+/) : [];
};

const isFormula = (node: HastNode) =>
  node.type === "element" && node.tagName === "span" && (classes(node).includes("katex") || classes(node).includes("katex-display"));

/** `<span className={cls} dangerouslySetInnerHTML={{ __html: html }} />` as an MDX JSX node. */
function htmlSpan(cls: string[], html: string): HastNode {
  const literal = { type: "Literal", value: html, raw: JSON.stringify(html) };
  const object = {
    type: "ObjectExpression",
    properties: [
      {
        type: "Property",
        key: { type: "Identifier", name: "__html" },
        value: literal,
        kind: "init",
        computed: false,
        method: false,
        shorthand: false,
      },
    ],
  };
  return {
    type: "mdxJsxTextElement",
    name: "span",
    attributes: [
      { type: "mdxJsxAttribute", name: "className", value: cls.join(" ") },
      {
        type: "mdxJsxAttribute",
        name: "dangerouslySetInnerHTML",
        value: {
          type: "mdxJsxAttributeValueExpression",
          value: `{__html: ${literal.raw}}`,
          data: {
            estree: {
              type: "Program",
              sourceType: "module",
              body: [{ type: "ExpressionStatement", expression: object }],
            },
          },
        },
      },
    ],
    children: [],
  };
}

function walk(node: HastNode) {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isFormula(child)) {
      children[i] = htmlSpan(classes(child), toHtml(child.children as never));
    } else {
      walk(child);
    }
  }
}

export default function rehypeKatexHtml() {
  return (tree: HastNode) => {
    walk(tree);
  };
}
