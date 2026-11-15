import { useEffect, useState } from "react";

const GLYPHS = "01<>/{}[]#=+*";

/**
 * Text that starts scrambled and settles into its real letters, left to
 * right, in about half a second. The real word sits underneath at zero
 * opacity, so the layout never shifts and screen readers read it once.
 * Skipped when the visitor asks for reduced motion.
 */
export function DecodeText({ text, duration = 650, delay = 250 }: { text: string; duration?: number; delay?: number }) {
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start - delay) / duration);
      const settled = Math.max(0, Math.floor(p * text.length));
      if (p >= 1) {
        setShown(null);
        return;
      }
      setShown(
        text.slice(0, settled) +
          Array.from(text.slice(settled), () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay]);

  if (shown === null) return <>{text}</>;
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="opacity-0">{text}</span>
      <span aria-hidden className="absolute left-0 top-0">
        {shown}
      </span>
    </span>
  );
}
