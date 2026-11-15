import { useEffect, useRef } from "react";

/* Rising glyphs behind the landing hero. Each one starts at the bottom as
   scrambled noise (the same characters DecodeText scrambles through), drifts
   up with a gentle sway, and partway up "decodes": it settles on a symbol
   from the courses, flashes neon, then fades out near the top. Smaller glyphs
   sit farther back: dimmer, slower, and gone before they reach the top. */

const NOISE = "01<>/{}[]#=+*";
const SYMBOLS = "λεΣδ∅∀∃→≡∧∨¬⊕∞πΩθ01";

type P = {
  x: number;
  y: number;
  z: number; // depth: 0 far and small, 1 near and large
  speed: number;
  sway: number;
  phase: number;
  freq: number;
  ch: string;
  target: string;
  decodeAt: number; // fraction of the height (from the bottom) where it settles
  fadeAt: number; // fraction where it has fully faded
  decodedAt: number; // timestamp it settled, 0 while still noise
  nextScramble: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

function readColor(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v.split(" ").join(", ")}` : "hsl(0, 0%, 50%";
}

export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let parts: P[] = [];
    let colors = { neon: readColor("--neon"), ink: readColor("--muted-foreground") };

    const spawn = (anywhere: boolean): P => {
      const z = Math.pow(Math.random(), 1.6); // most are small and far
      const small = z < 0.45;
      return {
        x: rand(0, w),
        y: anywhere ? rand(0, h) : h + rand(10, 60),
        z,
        speed: 10 + z * 30,
        sway: rand(4, 14) * (0.4 + z),
        phase: rand(0, Math.PI * 2),
        freq: rand(0.25, 0.6),
        ch: pick(NOISE),
        target: pick(SYMBOLS),
        decodeAt: rand(0.3, 0.6),
        fadeAt: small ? rand(0.35, 0.75) : rand(0.85, 1),
        decodedAt: 0,
        nextScramble: 0,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(150, Math.round((w * h) / 8000));
      parts = Array.from({ length: count }, () => spawn(true));
      if (reduced) {
        // one still frame: everything above its decode line already settled
        for (const p of parts) if ((h - p.y) / h > p.decodeAt) p.ch = p.target;
        draw(0);
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const risen = (h - p.y) / h; // 0 at the bottom, 1 at the top
        const fadeIn = Math.min(1, Math.max(0, risen / 0.12));
        const fadeOut = Math.min(1, Math.max(0, (p.fadeAt - risen) / 0.2));
        const base = 0.1 + p.z * 0.45;
        const alpha = base * fadeIn * fadeOut;
        if (alpha <= 0.005) continue;
        const x = p.x + Math.sin(t * 0.001 * p.freq * Math.PI * 2 + p.phase) * p.sway;

        if (p.z < 0.3) {
          // far away: just a soft point, like distant snow
          ctx.globalAlpha = alpha;
          ctx.fillStyle = colors.ink + ")";
          ctx.beginPath();
          ctx.arc(x, p.y, 0.8 + p.z * 3, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const settled = p.ch === p.target && p.decodedAt;
        const flash = settled ? Math.max(0, 1 - (t - p.decodedAt) / 900) : 0;
        ctx.globalAlpha = Math.min(1, alpha + flash * 0.5);
        ctx.fillStyle = settled ? colors.neon + ")" : colors.ink + ")";
        ctx.font = `${Math.round(9 + p.z * 13)}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.fillText(p.ch, x, p.y);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    let running = false;
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.speed * dt;
        const risen = (h - p.y) / h;
        if (risen > p.fadeAt + 0.05) {
          parts[i] = spawn(false);
          continue;
        }
        if (p.z >= 0.3 && !p.decodedAt) {
          if (risen >= p.decodeAt) {
            p.ch = p.target;
            p.decodedAt = t;
          } else if (t > p.nextScramble) {
            p.ch = pick(NOISE);
            p.nextScramble = t + rand(70, 160);
          }
        }
      }
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // pause when the hero is off screen or the tab is hidden
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden || !visible ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    // follow the light/dark toggle
    const mo = new MutationObserver(() => {
      colors = { neon: readColor("--neon"), ink: readColor("--muted-foreground") };
      if (reduced) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // dimmer behind the text column so the copy stays easy to read
  const mask = "linear-gradient(to right, rgba(0,0,0,.6) 0%, rgba(0,0,0,.6) 50%, #000 80%)";
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}
