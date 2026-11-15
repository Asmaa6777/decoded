import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { SignInDialog } from "@/components/AccountButton";
import { CourseGlyph } from "@/components/brand/Glyphs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCourse } from "@/content/registry";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { acceptInvite, fetchInvite, type AcceptError, type Invite } from "@/lib/companions";

const ACCEPT_ERRORS: Record<AcceptError, string> = {
  needs_profile: "Turn on a public profile first, so they see who you are. Then open this link again.",
  own_invite: "This is your own link. Send it to someone you'd like to study with.",
  not_found: "This link was already used or has expired. Ask for a new one.",
  signed_out: "You've been signed out. Sign in again to accept.",
  unavailable: "Couldn't reach Decoded's server. Check your connection and try again.",
};

export default function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const status = useAccountStatus();
  const [invite, setInvite] = useState<Invite | null | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<AcceptError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Study together — Decoded";
    fetchInvite(token).then((i) => {
      setInvite(i);
      setLoaded(true);
    });
  }, [token]);

  const course = invite ? getCourse(invite.course) : null;

  const accept = async () => {
    setBusy(true);
    setError(null);
    const result = await acceptInvite(token);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    toast.success(`You're studying ${course?.title ?? "this course"} with @${result.companion}`);
    navigate(`/courses/${result.course}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-14 md:py-20 max-w-xl">
          {loaded && (invite === null || (invite && !course)) && (
            <div className="border border-dashed border-border p-10 text-center">
              <p className="font-display text-2xl font-bold mb-2">This link doesn't work anymore.</p>
              <p className="font-body italic text-muted-foreground">It was already used or has expired. Ask for a new one.</p>
            </div>
          )}
          {loaded && invite === undefined && <p className="font-mono text-sm text-muted-foreground">{ACCEPT_ERRORS.unavailable}</p>}

          {invite && course && (
            <div className="border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12 border border-border">
                  {invite.inviter.avatarUrl && <AvatarImage src={invite.inviter.avatarUrl} alt="" referrerPolicy="no-referrer" />}
                  <AvatarFallback className="font-mono">{invite.inviter.handle.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link to={`/u/${invite.inviter.handle}`} className="font-mono hover:text-neon">
                  @{invite.inviter.handle}
                </Link>
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight mb-3">
                Study <span className="whitespace-nowrap">{course.title}</span> together?
              </h1>
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground mb-6">
                <CourseGlyph slug={course.slug} className="h-4 w-4" />
                {course.tagline}
              </p>
              <p className="font-body text-sm leading-relaxed text-foreground/80 mb-6">
                You'll each see the other's progress in this course: lessons completed and the latest one. Nothing else,
                not quiz scores or other courses. Either of you can stop at any time. Accepting also registers you for
                the course.
              </p>

              {status === "signed-out" ? (
                <SignInDialog
                  title="Sign in to accept"
                  trigger={
                    <button type="button" className="bg-neon px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-background hover:opacity-90">
                      Sign in to accept
                    </button>
                  }
                />
              ) : (
                <button
                  type="button"
                  onClick={accept}
                  disabled={busy || status !== "signed-in"}
                  className="bg-neon px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? "Accepting…" : "Accept"}
                </button>
              )}
              {error && (
                <p role="alert" className="mt-4 font-mono text-xs text-orange">
                  {ACCEPT_ERRORS[error]}{" "}
                  {error === "needs_profile" && (
                    <Link to="/profile" className="underline underline-offset-4">
                      Set up your profile
                    </Link>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
