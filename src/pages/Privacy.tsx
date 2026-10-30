import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { deleteAccount } from "@/lib/progressSync";

export default function Privacy() {
  const status = useAccountStatus();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = "Privacy — Decoded";
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted", { description: "Your account and saved progress are gone." });
    } catch {
      toast.error("Couldn't delete your account", { description: "Check your connection and try again." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <div className="grid-noise pointer-events-none fixed inset-0 z-0" aria-hidden />

      <SiteHeader />

      <main className="flex-1 relative z-10">
        <article className="container py-20 max-w-2xl prose dark:prose-invert font-body">
          <h1 className="font-display">Privacy</h1>
          <p>You can use all of Decoded without an account. Your progress is then saved only in your browser.</p>

          <h2 className="font-display">If you sign in</h2>
          <p>Signing in saves your progress so it follows you between devices. Decoded stores:</p>
          <ul>
            <li>your numeric GitHub user ID, which is how your account is recognised</li>
            <li>your GitHub username and the address of your profile picture, shown in your account menu</li>
            <li>the lessons you've completed and when</li>
            <li>a sign-in session, kept in a cookie that lasts up to 90 days</li>
          </ul>
          <p>
            Decoded doesn't store your email address or GitHub password. The data is held on Cloudflare, and the
            cookie is used only to keep you signed in.
          </p>

          <h2 className="font-display">Deleting your data</h2>
          <p>Deleting your account removes your account, sessions and saved progress straight away.</p>
          {status === "signed-in" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={deleting}
                  className="font-mono text-xs uppercase tracking-widest underline text-destructive"
                >
                  Delete my account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes your saved progress, on this browser too. It can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my account</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete account</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <p>Sign in first to delete your account.</p>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
