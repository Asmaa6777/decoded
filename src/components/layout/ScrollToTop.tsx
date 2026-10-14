import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * BrowserRouter keeps the window's scroll position across route changes, so
 * clicking a course card low on the home page used to open the course page
 * scrolled down to its last lessons. New navigations now start at the top.
 * Back/forward (POP) is left to the browser so it can restore the previous
 * position, and #section links are left to the page that owns the heading.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    if (navType === "POP" || hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navType]);

  return null;
}
