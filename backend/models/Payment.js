// Payment model — the gateway ledger.
//
// One document per Razorpay ORDER, written at order-creation time and
// updated as the payment resolves. This records every order including ones
// that are never paid, which `User.purchaseHistory` deliberately does not:
// that array is the student's receipt list and only ever receives paid
// purchases.
//
// Why both places
// ---------------
// purchaseHistory answers "what did this student buy" and is read by the
// student UI and the admin Payments table. This collection answers "what
// happened at the gateway" — including abandoned checkouts and signature
// failures — and is the record we reconcile against Razorpay.
//
// It is also the trust anchor for verification: verifyPayment resolves the
// package, amount and coupon from THIS document (matched on
// razorpayOrderId) rather than from the client, so a tampered client
// payload cannot change what was purchased or for how much.
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    packageId: { type: String, required: true },
    packageTitle: { type: String, default: "" },

    // Razorpay identifiers. orderId is assigned at creation; paymentId only
    // exists once a payment attempt succeeds.
    //
    // Deliberately NO `default: null`. A sparse index skips documents where
    // the field is ABSENT, but an explicit null is a value and does get
    // indexed — so a default would make every unpaid order insert null and
    // collide with E11000 on the second one. Leaving it unset keeps those
    // rows out of the index entirely; the field is only ever assigned once a
    // real payment id exists (verifyPayment / the webhook).
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Stored in PAISE, matching what was sent to Razorpay — not rupees.
    // `amount` is the post-discount figure actually charged.
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    // created -> paid on successful verification (or webhook, later).
    // failed is set when signature verification rejects the payload.
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },

    // Coupon snapshot. Held as a plain string, like purchaseHistory, so the
    // trail survives the coupon being edited or deleted.
    couponCode: { type: String, default: null },
    originalAmount: { type: Number, default: null },
    discountAmount: { type: Number, default: null },

    // Our own idempotency handle, echoed back by Razorpay. Max 40 chars.
    receipt: { type: String, required: true, unique: true, index: true },

    // Whatever was sent as Razorpay `notes` (userId, packageId, couponCode).
    // The webhook will need these, since it arrives with no session.
    notes: { type: mongoose.Schema.Types.Mixed, default: {} },

    // --- Webhook audit trail ---------------------------------------------
    // Refunds are RECORDED here only. Entitlement is deliberately not
    // revoked: that is a policy decision, not a gateway one.
    refundId: { type: String, default: null },
    refundStatus: { type: String, default: null },
    refundedAt: { type: Date, default: null },

    // Every distinct event.event that has hit this order, deduped. Exists to
    // make duplicate and out-of-order webhook delivery debuggable — Razorpay
    // retries non-2xx, and payment.failed can legitimately be followed by
    // payment.captured on the same order (e.g. a UPI retry).
    webhookEventsSeen: { type: [String], default: [] },

    // Free-text reason when status is "failed".
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
