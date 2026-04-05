import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  apiUnavailableMessage,
  apiV1BaseUrl,
  googleConfigMessage,
  googleClientId,
  isGoogleAuthConfigured,
} from "../config/env";

const benefits = [
  "Unlock purchased tests and progress tracking.",
  "Save answers automatically during assessments.",
  "Access results, career matches, and counselling support.",
];

export default function Signup() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogleResponse = async (response) => {
    try {
      const idToken = response.credential;
      await loginWithGoogle(idToken);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Signup Error:", err);
      setMsg(err.message || "Google Signup Failed");
    }
  };

  useEffect(() => {
    if (!isGoogleAuthConfigured) {
      setMsg(googleConfigMessage);
      return;
    }

    const loadScript = () =>
      new Promise((resolve) => {
        if (window.google?.accounts) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        document.body.appendChild(script);
      });

    loadScript().then(() => {
      if (!window.google?.accounts) {
        setMsg("Google Sign-In could not be loaded.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
        ux_mode: "popup",
      });

      const buttonRoot = document.getElementById("google-signup");
      const buttonWidth = Math.max(buttonRoot?.clientWidth || 0, 280);

      window.google.accounts.id.renderButton(buttonRoot, {
        theme: "outline",
        size: "large",
        width: buttonWidth,
      });
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`${apiV1BaseUrl}/user/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Signup successful!");
        window.setTimeout(() => navigate("/login"), 500);
      } else {
        setMsg(data.msg || data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMsg(apiUnavailableMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(52,211,203,0.28),_transparent_35%),linear-gradient(180deg,#F4FEFE_0%,#EAFBFB_100%)] p-8 sm:p-10">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#188B8B]">
              Create your account
            </p>
            <h2 className="mt-5 text-4xl font-bold text-[#0F1729]">
              Start your career discovery journey with a saved Jumpstart profile.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#65758B]">
              Create your account once and keep your test purchases, saved
              answers, results, and counselling access tied together.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {benefits.map((item) => (
              <div
                key={item}
                className="surface-card rounded-[24px] bg-white/90 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#E8F9F8] p-2 text-[#188B8B]">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 text-[#0F1729]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-[32px] p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F9F8] px-4 py-2 text-sm font-semibold text-[#188B8B]">
            <Sparkles className="h-4 w-4" />
            Get started
          </div>
          <h1 className="mt-6 text-4xl font-bold text-[#0F1729]">Sign up</h1>
          <p className="mt-3 text-base text-[#65758B]">
            Set up your account to unlock tests, dashboard access, and results.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-[56px] w-full rounded-2xl border border-[#E1E7EF] px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Mobile
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                className="h-[56px] w-full rounded-2xl border border-[#E1E7EF] px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-[56px] w-full rounded-2xl border border-[#E1E7EF] px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-[56px] w-full rounded-2xl border border-[#E1E7EF] px-4 pr-12 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#65758B] transition hover:text-[#0F1729]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={(e) =>
                    handleChange("password_confirmation", e.target.value)
                  }
                  className="h-[56px] w-full rounded-2xl border border-[#E1E7EF] px-4 pr-12 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#65758B] transition hover:text-[#0F1729]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {msg ? (
              <p
                className={`text-sm ${
                  msg.toLowerCase().includes("successful")
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {msg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F1729] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4" id="google-signup" />

          <p className="mt-6 text-sm text-[#65758B]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#188B8B] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
