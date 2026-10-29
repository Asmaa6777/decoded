import { useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";

export default function Team() {
  useEffect(() => {
    document.title = "Team — Decoded";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* grid texture */}
      <div className="grid-noise pointer-events-none fixed inset-0 z-0" aria-hidden />

      <SiteHeader />

      <main className="flex-1 relative z-10">
        <div className="container py-20 md:py-28 max-w-5xl">
          <div className="text-center mb-16">
            <div className="eyebrow text-muted-foreground mb-3">The People</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">The Minds Behind Decoded</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <CreatorCard
              name="Ahmed Alghali"
              role="Architect & Lead"
              bio="I love when I finally understand what a theoratical CS course talks about"
              image="https://github.com/a7med7x7.png"
            />
            <CreatorCard
              name="Asmaa Farouq"
              role="Course Author"
              image="https://github.com/Asmaa6777.png"
              href="https://github.com/Asmaa6777"
            />
            <div className="flex flex-col items-center justify-center border border-dashed border-border p-8 text-center bg-muted/5">
              <div className="h-16 w-16 rounded-full bg-border/20 mb-4 animate-pulse" />
              <div className="font-display font-bold text-muted-foreground">Join the Team</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Open Source</div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function CreatorCard({ name, role, bio, image, href }: { name: string; role: string; bio?: string; image: string; href?: string }) {
  const Wrapper: React.ElementType = href ? "a" : "div";
  const linkProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Wrapper {...linkProps} className="group block border border-border bg-muted/5 p-6 hover:border-neon/40 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={image}
          alt={name}
          className="h-14 w-14 rounded-full border border-border object-cover grayscale group-hover:grayscale-0 transition-all"
        />
        <div>
          <div className="font-display font-bold text-lg">{name}</div>
          <div className="font-mono text-[10px] text-neon uppercase tracking-widest">{role}</div>
        </div>
      </div>
      {bio && (
        <p className="text-sm text-muted-foreground leading-relaxed font-body italic">
          "{bio}"
        </p>
      )}
    </Wrapper>
  );
}
