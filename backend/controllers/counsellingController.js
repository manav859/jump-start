// Counselling booking — Tier 2.
//
// Reuses the Razorpay spine wholesale: same client, same order-creation
// shape, same signature check, same webhook. What differs is what a paid
// order entitles you to — a slot on the calendar rather than a package —
// so this file never touches grantPackageEntitlement or the Payment ledger.
import crypto from "crypto";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";

import { RESULT_PUBLICATION_STATUS } from "../utils/resultApproval.js";

import AssessmentConfig from "../models/AssessmentConfig.js";
import Booking from "../models/Booking.js";
import { getRazorpayClient, getRazorpayKeyId } from "../config/razorpay.js";
import {
  COUNSELLING_NOTE_TYPE,
  COUNSELLING_SLOT_LABELS,
  RESERVATION_TTL_MS,
  istDayBounds,
  slotStartFromLabel,
} from "../config/counselling.js";
import {
  confirmBookingPaid,
  isDuplicateSlotError,
  sweepExpiredReservations,
} from "../services/bookingService.js";

// Same receipt shape as paymentController.buildReceipt — Razorpay caps this
// at 40 chars and requires uniqueness.
const buildReceipt = () =>
  `jc_${Date.now().toString(36)}_${crypto.randomBytes(6).toString("hex")}`.slice(
    0,
    40
  );

const getCounsellingConfig = async () => {
  const cfg = await AssessmentConfig.getOrCreateDefault();
  const c = cfg?.counselling || {};
  return {
    fee: Number(c.fee ?? 0), // paise
    durationMinutes: Number(c.durationMinutes ?? 50),
    active: c.active !== false,
  };
};

/**
 * Has this student completed the test?
 *
 * Client-confirmed booking rule: a session may only be booked once the
 * student has actually submitted an assessment. "Submitted" means at least
 * one report has left the not_submitted state — so both a report awaiting
 * admin approval and an already-approved one qualify.
 *
 * Verified against the schema rather than assumed:
 *   path : User.assessmentReports[].publication.status
 *          (models/User.js:584 -> :460 -> resultPublicationSchema :315)
 *   enum : "not_submitted" | "pending_approval" | "approved"
 *          (utils/resultApproval.js RESULT_PUBLICATION_STATUS)
 *   default: "not_submitted"
 *
 * Written as explicit membership in the two qualifying states rather than
 * `!== NOT_SUBMITTED`. Identical today — the enum has exactly three values —
 * but if a fourth ever lands (a "rejected", say), the negative form would
 * silently grant booking rights to it and this form will not.
 *
 * This is the ONE line to change when the rule tightens.
 */
const BOOKING_QUALIFYING_STATUSES = [
  RESULT_PUBLICATION_STATUS.PENDING_APPROVAL,
  RESULT_PUBLICATION_STATUS.APPROVED,
];

export const hasCompletedTest = (user) =>
  Array.isArray(user?.assessmentReports) &&
  user.assessmentReports.some((report) =>
    BOOKING_QUALIFYING_STATUSES.includes(
      // publication defaults to {} on the subdocument, and very old rows may
      // predate it entirely — treat a missing status as not_submitted.
      report?.publication?.status || RESULT_PUBLICATION_STATUS.NOT_SUBMITTED
    )
  );

/**
 * The booking gate. Every booking entry point must call this — today that is
 * POST /reserve, and it runs before anything is swept, ordered, or inserted.
 *
 * @returns {{ allowed: boolean, msg?: string }}
 */
const checkBookingEligibility = (user) => {
  if (!hasCompletedTest(user)) {
    return {
      allowed: false,
      msg: "Complete your test before booking a counselling session.",
    };
  }
  return { allowed: true };
};

/**
 * GET /api/v1/user/counselling/availability?date=YYYY-MM-DD
 *
 * Read-only. Expired reservations are filtered out at query time rather than
 * swept, so a GET never writes.
 */
export const getAvailability = async (req, res) => {
  try {
    const date = String(req.query?.date || "").trim();
    const bounds = istDayBounds(date);
    if (!bounds) {
      return res
        .status(400)
        .json({ success: false, msg: "date must be YYYY-MM-DD" });
    }

    const { durationMinutes, active, fee } = await getCounsellingConfig();
    const now = new Date();

    // Live holds for this IST day. A "reserved" row whose expiry has passed
    // is NOT a hold — it is about to be swept and must not hide the slot.
    const holders = await Booking.find({
      slotStart: { $gte: bounds.start, $lt: bounds.end },
      activeSlotKey: { $type: "string" },
      $or: [
        { status: "booked" },
        { status: "reserved", reservationExpiresAt: { $gt: now } },
      ],
    })
      .select("slotStart")
      .lean();

    const takenInstants = new Set(
      holders.map((b) => new Date(b.slotStart).getTime())
    );

    const slots = COUNSELLING_SLOT_LABELS.map((label) => {
      const slotStart = slotStartFromLabel(date, label);
      if (!slotStart) {
        return { label, available: false, reason: "invalid" };
      }
      if (slotStart.getTime() <= now.getTime()) {
        return { label, available: false, reason: "past" };
      }
      if (takenInstants.has(slotStart.getTime())) {
        return { label, available: false, reason: "taken" };
      }
      return { label, available: true, reason: null };
    });

    return res.status(200).json({
      success: true,
      data: {
        date,
        durationMinutes,
        fee,
        currency: "INR",
        bookingOpen: active,
        slots,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to load availability",
    });
  }
};

/**
 * POST /api/v1/user/counselling/reserve
 * Body: { slotDate, slotTime, sessionType? }
 */
export const reserveSlot = async (req, res) => {
  try {
    // --- Gate: FIRST ------------------------------------------------------
    // Before anything is parsed, swept, ordered or written. An ineligible
    // user must never cause a Razorpay order to exist.
    const eligibility = checkBookingEligibility(req.user);
    if (!eligibility.allowed) {
      return res.status(403).json({
        success: false,
        msg: eligibility.msg || "You are not eligible to book a session.",
      });
    }

    const { slotDate, slotTime, sessionType } = req.body || {};

    const slotStart = slotStartFromLabel(slotDate, slotTime);
    if (!slotStart) {
      return res.status(400).json({
        success: false,
        msg: "slotDate (YYYY-MM-DD) and a valid slotTime are required",
      });
    }

    const now = new Date();
    if (slotStart.getTime() <= now.getTime()) {
      return res
        .status(400)
        .json({ success: false, msg: "That slot is in the past." });
    }

    // --- Price, server-side ----------------------------------------------
    const { fee, durationMinutes, active } = await getCounsellingConfig();
    if (!active) {
      return res.status(503).json({
        success: false,
        msg: "Counselling bookings are currently closed.",
      });
    }
    if (!Number.isFinite(fee) || fee <= 0) {
      return res.status(503).json({
        success: false,
        msg: "Counselling fee is not configured.",
      });
    }

    // --- Free any lapsed hold on this slot, then race for it -------------
    await sweepExpiredReservations(slotStart, now);

    const receipt = buildReceipt();
    const notes = {
      type: COUNSELLING_NOTE_TYPE, // the shared webhook branches on this
      userId: String(req.user.id),
      slotDate: String(slotDate),
      slotTime: String(slotTime),
    };

    // Order first, then the row: an order with no booking is a harmless
    // orphan the student simply never pays, whereas a booking holding a slot
    // with no order would be unpayable and would block the slot for 5 min.
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: fee,
      currency: "INR",
      receipt,
      notes,
    });

    let booking;
    try {
      booking = await Booking.create({
        userId: req.user.id,
        slotStart,
        slotDate: String(slotDate),
        slotLabel: String(slotTime).toUpperCase(),
        activeSlotKey: slotStart.toISOString(),
        status: "reserved",
        reservedAt: now,
        reservationExpiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
        razorpayOrderId: order.id,
        receipt,
        amount: fee,
        currency: "INR",
        notes,
        sessionType: String(sessionType || "video"),
        durationMinutes,
      });
    } catch (err) {
      // The unique partial index rejected us: somebody else holds the slot.
      // This is the collision signal, and it is a 409, never a 500.
      if (isDuplicateSlotError(err)) {
        return res.status(409).json({
          success: false,
          msg: "That slot is no longer available. Please pick another time.",
        });
      }
      throw err;
    }

    return res.status(201).json({
      success: true,
      data: {
        bookingId: String(booking._id),
        orderId: order.id,
        amount: fee,
        currency: "INR",
        keyId: getRazorpayKeyId(),
        expiresAt: booking.reservationExpiresAt.toISOString(),
        durationMinutes,
        slotDate: booking.slotDate,
        slotLabel: booking.slotLabel,
      },
    });
  } catch (err) {
    if (String(err.message || "").includes("RAZORPAY_KEY_ID")) {
      return res.status(503).json({ success: false, msg: err.message });
    }
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to reserve slot",
    });
  }
};

/**
 * POST /api/v1/user/counselling/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId? }
 *
 * bookingId is accepted for symmetry with the client payload but is NOT
 * trusted — the booking is always resolved from the order id.
 */
export const verifyBookingPayment = async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body || {};

  try {
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        msg: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    // Resolve from OUR row, never from the client — same trust anchor as the
    // package flow's Payment lookup.
    const booking = await Booking.findOne({ razorpayOrderId: orderId });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, msg: "Booking not found for this order" });
    }
    if (String(booking.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: "This booking belongs to another account",
      });
    }

    const secret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!secret) {
      return res.status(503).json({
        success: false,
        msg: "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set",
      });
    }

    const validSignature = validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      secret
    );

    if (!validSignature) {
      booking.failureReason = "signature_verification_failed";
      await booking.save();
      return res
        .status(400)
        .json({ success: false, msg: "Payment signature verification failed" });
    }

    const result = await confirmBookingPaid({
      booking,
      razorpayPaymentId: paymentId,
    });

    // Paid, but the slot went to someone else while they were in the modal.
    // Deliberately a 200 with an explicit flag rather than an error: the
    // payment DID succeed, and Phase 2 needs to say so while explaining that
    // the slot is gone and a human will follow up.
    if (!result.ok && result.reason === "conflict") {
      return res.status(200).json({
        success: true,
        data: {
          booked: false,
          conflict: true,
          bookingId: String(booking._id),
          msg: "Payment received, but that slot was taken moments before. Our team will contact you to rebook or refund.",
        },
      });
    }

    if (!result.ok) {
      return res.status(409).json({
        success: false,
        msg:
          result.reason === "cancelled"
            ? "This booking was cancelled."
            : "Booking could not be confirmed.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        booked: true,
        conflict: false,
        alreadyBooked: result.alreadyBooked,
        bookingId: String(booking._id),
        slotDate: booking.slotDate,
        slotLabel: booking.slotLabel,
        slotStart: booking.slotStart.toISOString(),
        durationMinutes: booking.durationMinutes,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to verify booking payment",
    });
  }
};
