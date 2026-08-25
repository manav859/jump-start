// Razorpay Tier 1 routes — package purchase.
//
// Ordinary JSON routes, mounted AFTER express.json() in server.js. The
// webhook (next) is different: it needs the raw body for HMAC verification
// and must mount ahead of the global parser, following the /api/vitals
// precedent at server.js:69-75.
import express from "express";
import { protect } from "../middleware/auth.js";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

export default router;
