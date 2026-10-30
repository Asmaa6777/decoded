import { useEffect } from "react";
import { toast } from "sonner";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { signInWithGithub, signOut } from "@/lib/progressSync";

const style = "font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground";

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
      <button type="button" className={style} onClick={signInWithGithub} aria-label="Sign in with GitHub" title="Sign in with GitHub to save your progress">
        Sign in
      </button>
    );
  }

  if (status === "signed-in") {
    const handleSignOut = () =>
      signOut().catch(() =>
        toast.error("Couldn't sign you out", { description: "Your latest progress hasn't been saved yet. Check your connection and try again." }),
      );
    return (
      <button type="button" className={style} onClick={handleSignOut}>
        Sign out
      </button>
    );
  }

  return null;
}
