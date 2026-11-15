import { lazy, Suspense, useEffect, useState } from "react";
import { Search } from "lucide-react";

// The dialog (cmdk, Radix dialog, the search code) loads the first time
// someone opens search, so other visitors never download it.
const loadDialog = () => import("@/components/SearchDialog");
const SearchDialog = lazy(() => loadDialog().then((m) => ({ default: m.SearchDialog })));

export function SearchButton() {
  const [open, setOpen] = useState(false);
  // stays true after the first open, so closing doesn't unmount the dialog mid-animation
  const [wanted, setWanted] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setWanted(true);
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Search lessons"
        title="Search lessons (⌘K)"
        onClick={() => {
          setWanted(true);
          setOpen(true);
        }}
        // start the download on intent, so the dialog is usually ready by the click
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
      {wanted && (
        <Suspense fallback={null}>
          <SearchDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
