// Razorpay's checkout widget cannot be bundled — the modal only talks to
// the gateway when it is served from checkout.razorpay.com.
//
// It is fetched on demand rather than from a tag in index.html: nothing on
// the critical path should resolve off-origin (see the font comments in
// index.html), and the overwhelming majority of sessions never reach the
// buy button. The cost is paid by the students who actually pay.
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// The in-flight (or already settled) load. Cached at module scope so a
// double-click, a retry after a dismissed modal, and two callers racing all
// share a single <script> tag instead of stacking duplicates.
let loadPromise = null;

/**
 * Inject Razorpay's checkout script.
 *
 * @returns {Promise<boolean>} true once window.Razorpay is usable, false if
 *   the script could not be fetched. Never rejects — the caller decides how
 *   loudly to fail.
 */
export const loadRazorpayCheckout = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(false);
  }

  // Already there: a previous purchase attempt in this tab, or a warm HMR
  // reload that kept the global.
  if (window.Razorpay) return Promise.resolve(true);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // A tag may already exist and still be in flight (module re-evaluated by
    // HMR while the fetch was open). Attach to it rather than adding a second.
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    const script = existing || document.createElement("script");

    script.addEventListener(
      "load",
      () => resolve(Boolean(window.Razorpay)),
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        // Drop the cached promise so a later attempt can retry — this is
        // almost always a flaky network, not a permanent failure.
        loadPromise = null;
        script.remove();
        resolve(false);
      },
      { once: true }
    );

    if (!existing) {
      script.src = CHECKOUT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
};

export default loadRazorpayCheckout;
