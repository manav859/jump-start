// Razorpay webhook route — RAW BODY REQUIRED.
//
// Mounted ahead of the global express.json() in server.js. Razorpay signs
// the exact bytes it sent, so the HMAC must be computed over the raw body:
// once a JSON parser consumes the stream and hands back an object, those
// bytes are gone and re-serialising produces a different digest (key order,
// whitespace, number formatting), which fails every check.
//
// express.raw() therefore delivers req.body as a Buffer, and handleWebhook
// does the toString("utf8") itself — parsing only after the signature has
// been verified.
//
// No `protect` here: Razorpay has no session with us. The signature is the
// authentication.
import express from "express";
import { handleWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// `type: "application/json"` matches what Razorpay sends. The 1 MB cap is
// well above any real event payload and bounds an abusive request.
router.post(
  "/",
  express.raw({ type: "application/json", limit: "1mb" }),
  handleWebhook
);

export default router;
