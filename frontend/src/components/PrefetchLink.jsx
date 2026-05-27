// Drop-in replacement for react-router-dom's <Link> that warms the
// target page's lazy chunk on hover / focus, so by the time the user
// clicks the next page is already in cache and renders without a
// chunk-loading flash.
//
// Why not just <Link prefetch="intent">?
// --------------------------------------
// `prefetch` is a framework-mode prop in react-router-dom v7. This app
// uses the data router (createBrowserRouter + RouterProvider), where
// <Link> has no `prefetch` prop. So we do it manually: any time the
// pointer or focus crosses the link, we invoke the provided dynamic
// `import()` thunk, which fires the chunk request via the bundler.
// The browser caches the response; the second time React Router asks
// for the same chunk (on click), it's already there.
//
// Usage:
//   <PrefetchLink to="/test" prefetch={() => import("../pages/Test")}>
//     Browse tests
//   </PrefetchLink>
//
// Each prefetch fires at most once per mount — the thunk is wrapped so
// repeated hovers don't queue extra requests.

import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";

export default function PrefetchLink({ prefetch, onMouseEnter, onFocus, ...rest }) {
  const fired = useRef(false);

  const trigger = useCallback(() => {
    if (fired.current || typeof prefetch !== "function") return;
    fired.current = true;
    try {
      const promise = prefetch();
      if (promise && typeof promise.catch === "function") {
        // Silently swallow network errors — a failed prefetch shouldn't
        // surface to the user; they'll see the normal Suspense fallback
        // on click if the chunk is still genuinely unavailable.
        promise.catch(() => {
          fired.current = false;
        });
      }
    } catch (_err) {
      fired.current = false;
    }
  }, [prefetch]);

  const handleMouseEnter = (event) => {
    trigger();
    onMouseEnter?.(event);
  };

  const handleFocus = (event) => {
    trigger();
    onFocus?.(event);
  };

  return <Link {...rest} onMouseEnter={handleMouseEnter} onFocus={handleFocus} />;
}
