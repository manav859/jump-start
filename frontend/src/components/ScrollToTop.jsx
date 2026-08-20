import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to the top of the document on every route change.
 *
 * A client-side navigate() keeps the window's current scrollY, so moving
 * from a page the user had scrolled down (e.g. the admin review page,
 * whose "View Student Report" button sits at the bottom) landed the next
 * page mid-way down. A full page load never had this problem, which is
 * why it only appeared once the report opened via navigate() instead of
 * a new tab.
 *
 * Keyed on pathname only — not search — so query-string changes on the
 * same page (filters, ?adminView=1) do not yank the user back to the top.
 *
 * behavior: "instant" is required: index.css sets a global
 * `html { scroll-behavior: smooth }`, which would otherwise animate the
 * jump on every navigation.
 *
 * Mounted per layout rather than per page so it covers every route; only
 * one layout is ever mounted at a time.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
