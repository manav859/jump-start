// Counselling booking routes — Tier 2.
//
// Ordinary JSON routes, mounted AFTER express.json() in server.js. There is
// deliberately no webhook route here: Razorpay delivers counselling payments
// to the SAME /api/v1/user/payment/webhook mount, which needs the raw body
// and already branches on notes.type.
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getAvailability,
  reserveSlot,
  verifyBookingPayment,
} from "../controllers/counsellingController.js";

const router = express.Router();

router.get("/availability", protect, getAvailability);
router.post("/reserve", protect, reserveSlot);
router.post("/verify", protect, verifyBookingPayment);

export default router;
