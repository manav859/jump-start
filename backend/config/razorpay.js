// Razorpay client — lazily constructed.
//
// Deliberately NOT added to config/env.js REQUIRED_ENV_VARS: dev and
// staging must boot without Razorpay keys (they run with
// ALLOW_FREE_PURCHASE=true instead). The cost of that choice is that a
// missing key surfaces at call time rather than at boot, so
// assertRazorpayConfigured() exists to turn that into one clear error
// instead of an opaque SDK failure. server.js also warns at startup when
// keys are absent and the free-purchase bypass is off.
import Razorpay from "razorpay";

let client = null;

export const isRazorpayConfigured = () =>
  Boolean(
    String(process.env.RAZORPAY_KEY_ID || "").trim() &&
      String(process.env.RAZORPAY_KEY_SECRET || "").trim()
  );

export function assertRazorpayConfigured() {
  if (!isRazorpayConfigured()) {
    throw new Error(
      "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set"
    );
  }
}

/**
 * Returns the shared Razorpay client, constructing it on first use.
 *
 * Lazy rather than module-scope so that importing this file never throws —
 * routes can be mounted on a box with no keys, and only an actual payment
 * request fails.
 */
export function getRazorpayClient() {
  assertRazorpayConfigured();
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

// The PUBLIC key. Safe to hand to the browser — it is what the checkout
// widget is initialised with. The secret never leaves the server.
export const getRazorpayKeyId = () =>
  String(process.env.RAZORPAY_KEY_ID || "").trim();

// Exposed for tests / hot-reload; the client caches process.env at first
// construction, so a key change mid-process needs an explicit reset.
export const resetRazorpayClient = () => {
  client = null;
};
