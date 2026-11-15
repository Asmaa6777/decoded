import { TooltipPortal } from "@radix-ui/react-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MATURITY_LEVELS, maturity } from "@/lib/maturity";

/** Signal bars plus a word for how far along a course is; hover or focus for what it means. */
export function CourseMaturity({
  rounds,
  className = "",
}: {
  rounds?: number;
  className?: string;
}) {
  const m = maturity(rounds);
  // Its own provider, so the badge also works where the app's isn't mounted (tests, previews).
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label={`Course maturity: ${m.label}, ${m.level} of ${MATURITY_LEVELS}. ${m.meaning}`}
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground cursor-help ${className}`}
          >
            <svg viewBox="0 0 19 12" className="h-3 w-[19px]" aria-hidden>
              {Array.from({ length: MATURITY_LEVELS }, (_, i) => {
                const h = 4 + i * 2;
                return (
                  <rect
                    key={i}
                    x={i * 4}
                    y={12 - h}
                    width={3}
                    height={h}
                    className={
                      i < m.level ? "fill-foreground/70" : "fill-foreground/15"
                    }
                  />
                );
              })}
            </svg>
            {m.label}
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="max-w-[260px]">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
              {m.label} · {m.level} of {MATURITY_LEVELS}
            </p>
            <p className="text-sm leading-snug">{m.meaning}</p>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}
