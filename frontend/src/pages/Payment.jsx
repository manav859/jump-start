import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa";
import secure from "../assets/secure.svg";
import lck from "../assets/lck.svg";
import { GST_RATE } from "../data/testPackages";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { invalidateApiCache } from "../utils/apiCache";
import { loadRazorpayCheckout } from "../utils/loadRazorpay";

// The site's primary teal, handed to Razorpay's modal so the checkout does
// not look like a different product bolted on at the last step.
const BRAND_COLOR = "#188B8B";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [agree, setAgree] = useState(false);

  // True from the moment the buy button is pressed until the flow reaches a
  // terminal state. It covers the Razorpay modal being open too, so a second
  // click cannot create a second order.
  const [submitting, setSubmitting] = useState(false);
  // { tone: "error" | "info", text } — rendered above the buy button.
  const [checkoutNotice, setCheckoutNotice] = useState(null);

  // Coupon checkout state. `appliedCoupon` is the validated payload from
  // /v1/user/coupon/validate — null until the student successfully applies
  // a code. Once set, the order summary recalculates pre-GST.
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, finalPrice }
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const plan = location.state?.plan;

  useEffect(() => {
    if (!plan || !plan.id) {
      navigate("/test", { replace: true });
    }
  }, [plan, navigate]);

  const formatPrice = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  // Package prices are GST-INCLUSIVE. plan.amount already contains the GST,
  // so we must NOT add 18% on top. We back-calculate the base and the GST
  // component that is *already inside* the price so the invoice reads
  // base + GST = the inclusive price the student actually pays.
  const grossPrice = plan?.amount ?? 0; // GST-inclusive list price
  const baseAmount = Math.round(grossPrice / (1 + GST_RATE));
  const gstAmount = grossPrice - baseAmount; // included GST (base + gst = gross)
  // Coupons discount the inclusive price directly. Backend's
  // purchasePackage applies the discount to pkg.amount, so the two agree
  // on the final collected amount.
  const discount = appliedCoupon?.discountAmount || 0;
  const subtotal = baseAmount; // shown as "base price (excl. GST)"
  const total = Math.max(0, grossPrice - discount); // inclusive payable

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a code to apply.");
      return;
    }
    setCouponError("");
    setValidatingCoupon(true);
    try {
      const res = await api.post("/v1/user/coupon/validate", {
        code,
        packageId: plan.id,
      });
      const data = res?.data?.data;
      if (!data?.valid) {
        setCouponError(res?.data?.msg || "Coupon is not valid for this package.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: Number(data.discountAmount || 0),
        finalPrice: Number(data.finalPrice || 0),
        discountType: data.discountType,
        discountValue: data.discountValue,
      });
    } catch (err) {
      setCouponError(
        err?.response?.data?.msg || "Could not apply coupon — please try again."
      );
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponInput("");
  };

  // Everything the confirmation screen needs. `paidTotal` is passed in
  // because the authoritative figure differs per path: the server's
  // finalAmount for a Razorpay order, the locally computed total for a
  // zero-rupee activation.
  const buildConfirmationState = (paidTotal) => ({
    plan,
    subtotal,
    discount,
    couponCode: appliedCoupon?.code || null,
    gstAmount,
    total: paidTotal,
    paidAt: new Date().toISOString(),
  });

  // A 100%-off coupon or a free package has nothing to charge. Razorpay
  // cannot create a zero-amount order (the backend rejects it with 400 and
  // points here), so these keep the original free-activation route.
  const activateFreePackage = async () => {
    const payload = { packageId: plan.id };
    if (appliedCoupon?.code) payload.couponCode = appliedCoupon.code;

    try {
      await api.post("/v1/user/package/purchase", payload);
      invalidateApiCache("userInit");
      navigate("/payment-confirmation", {
        replace: true,
        state: buildConfirmationState(total),
      });
    } catch (err) {
      console.error("Free package activation failed", err);
      setCheckoutNotice({
        tone: "error",
        text: err?.response?.data?.msg || "Failed to activate package.",
      });
      setSubmitting(false);
    }
  };

  // Called from Razorpay's success handler. Note the failure branch: by the
  // time this runs the money has already moved, and the webhook grants
  // entitlement idempotently on its own. A failed /verify means we could not
  // CONFIRM the payment, never that it failed — so we say so honestly and
  // still send the student on, where the confirmation page's fallback
  // re-fetches the current package from the server.
  const verifyAndFinish = async (response, order) => {
    const paidTotal = Number(order.finalAmount ?? total);

    try {
      await api.post("/v1/user/payment/verify", {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    } catch (err) {
      console.error("Payment verification failed", err);
      invalidateApiCache("userInit");
      // Blocking on purpose: we are about to navigate away, and this is the
      // one message the student must not miss.
      window.alert(
        "Payment received — confirming your access. If it doesn't unlock in a minute, refresh your dashboard."
      );
      navigate("/payment-confirmation", {
        replace: true,
        state: buildConfirmationState(paidTotal),
      });
      return;
    }

    invalidateApiCache("userInit");
    navigate("/payment-confirmation", {
      replace: true,
      state: buildConfirmationState(paidTotal),
    });
  };

  const handleCompletePayment = async () => {
    if (!plan?.id || submitting) return;

    setCheckoutNotice(null);
    setSubmitting(true);

    if (total <= 0) {
      await activateFreePackage();
      return;
    }

    // 1. The checkout widget, fetched on demand.
    const sdkReady = await loadRazorpayCheckout();
    if (!sdkReady) {
      setCheckoutNotice({
        tone: "error",
        text: "Couldn't load the payment window. Check your connection and try again.",
      });
      setSubmitting(false);
      return;
    }

    // 2. The order. The coupon code goes up as the student entered it; the
    //    backend re-validates and re-prices, so the client total is display
    //    only and is never trusted.
    let order;
    try {
      const res = await api.post("/v1/user/payment/order", {
        packageId: plan.id,
        couponCode: appliedCoupon?.code || undefined,
      });
      order = res?.data?.data;
      if (!order?.orderId || !order?.keyId) {
        throw new Error("Incomplete order response");
      }
    } catch (err) {
      console.error("Create payment order failed", err);
      const status = err?.response?.status;

      if (status === 409) {
        // Already owned — nothing to pay for. Send them where the package is.
        invalidateApiCache("userInit");
        setSubmitting(false);
        navigate("/dashboard", { replace: true });
        return;
      }

      setCheckoutNotice({
        tone: "error",
        text:
          status === 503
            ? "Payments are temporarily unavailable. Please try again shortly."
            : err?.response?.data?.msg ||
              "Could not start the payment. Please try again.",
      });
      setSubmitting(false);
      return;
    }

    // 3. Hand over to Razorpay. `submitting` deliberately stays true while
    //    the modal is open so the button underneath cannot fire again.
    const checkout = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Jumpstart",
      description: order.packageTitle || plan.title,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      theme: { color: BRAND_COLOR },
      handler: (response) => {
        verifyAndFinish(response, order);
      },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          setCheckoutNotice({
            tone: "info",
            text: "Payment cancelled. You can try again whenever you're ready.",
          });
        },
      },
    });

    checkout.open();
  };

  if (!plan || !plan.id) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-[#65758B]">Redirecting to packages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1729]">
            Complete Your Payment
          </h2>
          <p className="!text-base text-[#65758B] mt-1">
            Secure checkout powered by industry‑standard encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-2xl p-8 border border-[#E6ECF5]">
              <h3 className="text-2xl text-[#0F1729] font-semibold">
                Billing Information
              </h3>
              <p className="!text-sm text-[#65758B] mt-1 mb-8">
                Enter your billing details
              </p>

              <div className="space-y-5 font-inter">
                <div>
                  <label className="block text-sm font-medium text-[#0F1729] mb-2">
                    Full Name *
                  </label>
                  <input
                    className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1729] mb-2">
                    Email Address *
                  </label>
                  <input
                    className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1729] mb-2">
                    Phone Number *
                  </label>
                  <input
                    className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1729] mb-2">
                    Address
                  </label>
                  <input
                    className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#0F1729] mb-2">
                      City
                    </label>
                    <input
                      className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F1729] mb-2">
                      Pincode
                    </label>
                    <input
                      className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                      placeholder="400001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1729] mb-2">
                    GST Number (Optional)
                  </label>
                  <input
                    className="w-full h-[46px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm outline-none"
                    placeholder="22AAAA0000A1Z5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white rounded-2xl p-8 border border-[#E6ECF5] h-fit">
            <h3 className="text-2xl text-[#0F1729] font-semibold">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm mt-4 font-inter">
              <div className="flex justify-between">
                <span className="text-[#0F1729] font-medium">{plan.title}</span>
                <span className="text-[#0F1729] text-base font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupon ? (
                <div className="flex justify-between text-emerald-700">
                  <span className="font-medium">Coupon ({appliedCoupon.code})</span>
                  <span className="font-semibold">− {formatPrice(discount)}</span>
                </div>
              ) : null}
              {/* GST is already INCLUDED in the package price (base + GST =
                  the total payable). It is shown for transparency, never
                  added on top. */}
              <div className="flex justify-between text-slate-500">
                <span className="text-[#65758B]">GST (18%, included)</span>
                <span>{formatPrice(gstAmount)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E1E7EF]">
              <p className="text-xs font-semibold text-[#0F1729] mb-2">Included in this package</p>
              <ul className="space-y-1.5 text-xs text-[#65758B]">
                {plan.features?.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FaCheck className={`${plan.checkColor || "text-[#0B908E]"} mt-0.5 shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 mt-2">{plan.duration}</p>
            </div>

            {/* Discount Code */}
            <div className="mt-6 mb-6 border-t border-[#E1E7EF] pt-4 font-inter">
              <label className="block text-sm font-medium text-[#0F1729] mb-2">
                Discount Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                  <div className="text-sm">
                    <span className="font-semibold text-emerald-800">
                      {appliedCoupon.code}
                    </span>
                    <span className="ml-2 text-emerald-700">
                      Coupon applied — {formatPrice(discount)} off
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-semibold text-emerald-800 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        if (couponError) setCouponError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="w-[100%] h-[42px] rounded-[14px] border border-[#E1E7EF] bg-[#FAFAFA] px-4 text-sm uppercase outline-none"
                      placeholder="Enter code"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="h-[42px] px-5 rounded-[14px] border-2 border-[#188B8B] text-[#188B8B] text-sm font-medium disabled:opacity-60"
                    >
                      {validatingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  {couponError ? (
                    <p className="mt-2 text-xs font-medium text-red-600">{couponError}</p>
                  ) : null}
                </>
              )}
            </div>

            <div className="border-t border-[#E1E7EF] my-6" />

            <div className="flex justify-between items-center mb-1 font-inter">
              <span className="font-semibold text-[#0F1729]">Total Amount</span>
              <span className="text-2xl font-bold text-[#188B8B]">{formatPrice(total)}</span>
            </div>
            <p className="text-[11px] text-[#65758B] mb-6 font-inter">
              Inclusive of all taxes (GST included)
            </p>

            <label className="grid auto-cols-auto grid-flow-col items-start gap-3 text-sm mb-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 appearance-none rounded-full border border-[#188B8B] checked:bg-[#188B8B] checked:border-[#188B8B] focus:outline-none relative"
              />
              <span className="text-[#0F1729]">
                I accept the{" "}
                <Link
                  to="/terms-of-service"
                  className="text-[#188B8B] hover:underline"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="text-[#188B8B] hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            {checkoutNotice ? (
              <div
                role="status"
                className={`mb-4 rounded-[14px] border px-4 py-3 text-sm font-medium ${
                  checkoutNotice.tone === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-[#65758B]"
                }`}
              >
                {checkoutNotice.text}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!agree || submitting}
              onClick={handleCompletePayment}
              className={`group w-full h-[48px] rounded-xl font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                agree && !submitting
                  ? "bg-[#F59F0A] text-[#0F1729] shadow-[0_10px_24px_rgba(245,159,10,0.22)] hover:-translate-y-0.5 hover:bg-[#E89206] hover:shadow-[0_14px_30px_rgba(245,159,10,0.32)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(245,159,10,0.24)] cursor-pointer"
                  : "bg-[#facf84] text-[#0f172994] cursor-not-allowed"
              }`}
            >
              <img
                src={lck}
                alt="secure"
                className={`w-4 h-4 transition-transform duration-200 ${
                  agree && !submitting ? "group-hover:scale-110" : "opacity-60"
                }`}
                style={{
                  filter: agree && !submitting ? "none" : "grayscale(100%)",
                }}
              />
              {submitting ? "Processing…" : "Complete Payment"}
            </button>

            <p className="!text-xs text-slate-400 text-center mt-4 flex items-center justify-center gap-1">
              <img src={secure} alt="secure" className="w-4 h-4" />
              <span>100% Secure Payment • SSL Encrypted</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment
