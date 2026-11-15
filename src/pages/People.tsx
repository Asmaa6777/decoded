import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchProfiles, type ProfileSummary } from "@/lib/profiles";

const MIN_QUERY = 2;

export default function People() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSummary[] | null>(null);
  const q = query.trim().toLowerCase().replace(/^@/, "");

  useEffect(() => {
    document.title = "Find people — Decoded";
  }, []);

  useEffect(() => {
    if (q.length < MIN_QUERY) return setResults(null);
    let live = true;
    // wait for a pause in typing before asking the API
    const timer = setTimeout(() => searchProfiles(q).then((r) => live && setResults(r)), 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-14 md:py-20 max-w-2xl">
          <div className="eyebrow text-muted-foreground mb-3">People</div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">Find other learners</h1>
          <p className="font-body text-lg italic text-muted-foreground mb-8">
            Search by handle. Only people who turned on a public profile show up.{" "}
            <Link to="/profile" className="not-italic font-mono text-sm underline underline-offset-4 hover:text-neon">
              Set up yours
            </Link>
          </p>

          <label htmlFor="people-search" className="sr-only">
            Search handles
          </label>
          <div className="flex items-center gap-2 border border-border bg-card px-3 focus-within:border-foreground">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing a handle"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent py-3 font-mono outline-none"
            />
          </div>

          <div aria-live="polite" className="mt-6">
            {results?.length === 0 && <p className="font-body italic text-muted-foreground">Nobody with a public profile starts with @{q}.</p>}
            {results && results.length > 0 && (
              <ul className="divide-y divide-border border-y border-border">
                {results.map((p) => (
                  <li key={p.handle}>
                    <Link to={`/u/${p.handle}`} className="flex items-center gap-3 py-3 hover:bg-card/60 transition-colors">
                      <Avatar className="h-9 w-9 border border-border">
                        {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" referrerPolicy="no-referrer" />}
                        <AvatarFallback className="font-mono text-xs">{p.handle.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-mono">@{p.handle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
