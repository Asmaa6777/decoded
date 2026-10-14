import { useEffect, useState, type RefObject } from "react";
import type { Course } from "@/content/registry";

type TocItem = { id: string; html: string; level: 2 | 3 };

const accentBorder: Record<Course["accent"], string> = {
  neon: "border-neon", orange: "border-orange", sky: "border-sky", violet: "border-violet", mint: "border-mint",
};

// A heading counts as "current" once its top passes this line.
const ACTIVE_OFFSET = 120;

/**
 * The heading's own markup, minus KaTeX's hidden MathML copy, so formulas
 * like $n \log n$ render the same as in the lesson. Source is our MDX.
 */
function headingHtml(h: HTMLElement) {
  const clone = h.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".katex-mathml").forEach((n) => n.remove());
  return clone.innerHTML.trim();
}

/**
 * Right sidebar on lesson pages: the lesson's h2/h3 headings (ids come
 * from rehype-slug). The rail fills in up to the section being read.
 */
export function LessonToc({
  contentRef,
  contentKey,
  accent,
}: {
  contentRef: RefObject<HTMLElement>;
  contentKey: string;
  accent: Course["accent"];
}) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [active, setActive] = useState(-1);

  // Only direct children of the lesson body, so headings inside widgets are skipped.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const hs = Array.from(root.querySelectorAll<HTMLElement>(":scope > h2[id], :scope > h3[id]"));
    setItems(hs.map((h) => ({ id: h.id, html: headingHtml(h), level: h.tagName === "H3" ? 3 : 2 })));
    setActive(-1);
  }, [contentRef, contentKey]);

  useEffect(() => {
    if (items.length === 0) return;
    const onScroll = () => {
      const doc = document.documentElement;
      if (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 4) {
        setActive(items.length - 1);
        return;
      }
      let idx = -1;
      items.forEach((it, i) => {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) idx = i;
      });
      setActive(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  const jump = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label="Lesson contents" className="flex flex-col gap-4">
      <div className="eyebrow text-muted-foreground">Lesson contents</div>
      <ol className="flex flex-col">
        {items.map((it, i) => {
          const isActive = i === active;
          const passed = i < active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={(e) => jump(e, it.id)}
                aria-current={isActive ? "location" : undefined}
                className={`block border-l-2 py-1.5 text-[13px] leading-snug transition-colors ${it.level === 3 ? "pl-7" : "pl-4"} ${
                  isActive
                    ? `${accentBorder[accent]} text-foreground font-semibold`
                    : passed
                      ? `${accentBorder[accent]} text-foreground/70 hover:text-foreground`
                      : "border-border text-muted-foreground hover:text-foreground"
                }`}
                dangerouslySetInnerHTML={{ __html: it.html }}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
