import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Github, LogOut, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountProfile, useAccountStatus } from "@/hooks/useAccountStatus";
import { signInWithGithub, signOut } from "@/lib/progressSync";

/** `returnTo` is where GitHub sends people back to; defaults to the current page. */
export function SignInDialog({ trigger, title = "Keep your progress", returnTo }: { trigger: ReactNode; title?: string; returnTo?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <BrandMark className="mb-2 h-10 w-10 text-foreground" />
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription className="font-body text-base">
            Sign in to pick up where you left off on any device. Lessons you've already finished here come with you.
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          onClick={() => signInWithGithub(returnTo)}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-sm bg-foreground px-4 py-3 font-mono text-sm text-background transition-opacity hover:opacity-85"
        >
          <Github className="h-4 w-4" aria-hidden />
          Continue with GitHub
        </button>
        <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
          Decoded only keeps your GitHub ID, username and picture.{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function AccountMenu() {
  const profile = useAccountProfile();
  const name = profile?.name ?? "Your account";

  const handleSignOut = () =>
    signOut().catch(() =>
      toast.error("Couldn't sign you out", { description: "Your latest progress hasn't been saved yet. Check your connection and try again." }),
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="h-8 w-8 border border-border transition-colors hover:border-foreground">
          {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback className="font-mono text-xs text-foreground">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate font-mono text-sm normal-case tracking-normal">{name}</div>
          <div className="font-mono text-[11px] normal-case tracking-normal text-muted-foreground">Progress saved to your account</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer font-mono text-xs normal-case tracking-normal">
          <Link to="/privacy">
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
            Privacy &amp; account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer font-mono text-xs normal-case tracking-normal">
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Hidden until the API has answered, and if it can't be reached. */
export function AccountButton() {
  const status = useAccountStatus();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("signin") !== "failed") return;
    url.searchParams.delete("signin");
    window.history.replaceState(null, "", url);
    toast.error("Couldn't sign you in", { description: "Your progress is still saved on this device. Please try again." });
  }, []);

  if (status === "signed-out") {
    return (
      <SignInDialog
        trigger={
          <button
            type="button"
            className="rounded-sm border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-foreground transition-colors hover:border-foreground"
          >
            Sign in
          </button>
        }
      />
    );
  }
  if (status === "signed-in") return <AccountMenu />;
  return null;
}
