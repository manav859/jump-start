import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  apiUnavailableMessage,
  getApiV1Url,
  googleClientId,
  googleConfigMessage,
  isGoogleAuthConfigured,
} from "../config/env";

/* ── static copy ─────────────────────────────────────── */

const loginHighlights = [
  "Resume assessments from where you paused them.",
  "Track purchased packages and results in one dashboard.",
  "Unlock career recommendations and counselling access.",
];

const signupBenefits = [
  "Unlock purchased tests and progress tracking.",
  "Save answers automatically during assessments.",
  "Access results, career matches, and counselling support.",
];

const getPostLoginDestination = (authResponse) =>
  authResponse?.data?.user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

/* ── component ───────────────────────────────────────── */

export default function Auth() {
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  /* Derive the initial mode from the current route */
  const initialIsLogin = !location.pathname.toLowerCase().startsWith("/signup");
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  /* form state */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const adminLoginRequired = Boolean(location.state?.adminLoginRequired);
  const switchAccountRequired = Boolean(location.state?.switchAccountRequired);

  /* keep the browser URL in sync */
  useEffect(() => {
    const target = isLogin ? "/login" : "/signup";
    if (location.pathname !== target) {
      navigate(target, { replace: true, state: location.state });
    }
  }, [isLogin]);

  /* ── Google OAuth ────────────────────────────────────── */

  const googleBtnRef = useRef(null);

  const handleGoogleResponse = async (response) => {
    try {
      const idToken = response.credential;
      if (isLogin) {
        const authResponse = await loginWithGoogle(idToken);
        navigate(getPostLoginDestination(authResponse), { replace: true });
      } else {
        await loginWithGoogle(idToken);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Google Authentication Failed");
    }
  };

  useEffect(() => {
    if (!isGoogleAuthConfigured) {
      setError(googleConfigMessage);
      return;
    }

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google script failed to load"));
        document.body.appendChild(script);
      });

    loadScript()
      .then(() => {
        if (!window.google?.accounts) {
          setError("Google Sign-In could not be loaded.");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          ux_mode: "popup",
        });

        const buttonRoot = document.getElementById("google-auth-btn");
        const buttonWidth = Math.max(buttonRoot?.clientWidth || 0, 280);

        window.google.accounts.id.renderButton(buttonRoot, {
          theme: "outline",
          size: "large",
          width: buttonWidth,
        });
      })
      .catch(() => {
        setError("Google Sign-In could not be loaded.");
      });
  }, []);

  /* ── handlers ────────────────────────────────────────── */

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const authResponse = await login({ email, password });
      navigate(getPostLoginDestination(authResponse), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(getApiV1Url("/user/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Signup successful!");
        window.setTimeout(() => {
          setIsLogin(true);
        }, 600);
      } else {
        setMsg(data.msg || data.message || "Signup failed");
      }
    } catch {
      setMsg(apiUnavailableMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupChange = (field, value) => {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setError("");
    setMsg("");
    setIsLogin((prev) => !prev);
  };

  /* ── shared input classes ────────────────────────────── */
  const inputClass =
    "h-[48px] w-full rounded-2xl border border-[#E1E7EF] px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B] transition-colors duration-200";

  /* ── JSX ─────────────────────────────────────────────── */

  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-6 sm:py-12 lg:grid-cols-2 lg:items-start lg:gap-8 lg:px-8">
        {/* ─────── LEFT: Form Panel ─────── */}
        <div
          className={`surface-card rounded-[24px] p-5 sm:rounded-[32px] sm:p-10 transition-all duration-500 ease-in-out ${
            isLogin ? "lg:order-1" : "lg:order-2"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F9F8] px-4 py-2 text-sm font-semibold text-[#188B8B]">
            {isLogin ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                {adminLoginRequired ? "Admin access" : "Welcome back"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get started
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-3xl font-bold text-[#0F1729] sm:mt-6 sm:text-4xl">
            {isLogin
              ? adminLoginRequired
                ? "Admin sign in"
                : "Log in"
              : "Sign up"}
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-sm text-[#65758B] sm:mt-3 sm:text-base">
            {isLogin
              ? adminLoginRequired
                ? "Enter an admin account email and password to continue to the admin panel."
                : "Continue your assessment journey and pick up right where you left off."
              : "Set up your account to unlock tests, dashboard access, and results."}
          </p>

          {switchAccountRequired && isLogin ? (
            <div className="mt-5 rounded-2xl border border-[#F4DCA8] bg-[#FFF9EE] px-4 py-3 text-sm text-[#8C5A00]">
              The current account does not have admin access. Sign in with an
              admin account.
            </div>
          ) : null}

          {/* ── Sliding form wrapper ── */}
          <div className="relative mt-5 overflow-hidden sm:mt-8">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: isLogin ? "translateX(0%)" : "translateX(-100%)" }}
            >
              {/* ── Login Form ── */}
              <div className="w-full shrink-0">
                <form className="space-y-4 sm:space-y-5" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344054]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((c) => !c)}
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

                  {error && isLogin ? (
                    <p className="text-sm text-red-600">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F1729] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                  >
                    {loading && isLogin ? "Signing in..." : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4" id="google-auth-btn" />

                <p className="mt-6 text-sm text-[#65758B]">
                  Do not have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-[#188B8B] hover:underline"
                  >
                    Create one now
                  </button>
                </p>
              </div>

              {/* ── Signup Form ── */}
              <div className="w-full shrink-0">
                <form className="space-y-3 sm:space-y-5" onSubmit={handleSignupSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344054]">
                      Name
                    </label>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(e) => handleSignupChange("name", e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344054]">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={signupForm.mobile}
                      onChange={(e) => handleSignupChange("mobile", e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344054]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => handleSignupChange("email", e.target.value)}
                      className={inputClass}
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
                        value={signupForm.password}
                        onChange={(e) =>
                          handleSignupChange("password", e.target.value)
                        }
                        className={`${inputClass} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((c) => !c)}
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
                        value={signupForm.password_confirmation}
                        onChange={(e) =>
                          handleSignupChange(
                            "password_confirmation",
                            e.target.value
                          )
                        }
                        className={`${inputClass} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((c) => !c)}
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

                  {error && !isLogin ? (
                    <p className="text-sm text-red-600">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F1729] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                  >
                    {loading && !isLogin ? "Creating account..." : "Create account"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-6 text-sm text-[#65758B]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-[#188B8B] hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─────── RIGHT: Info Panel ─────── */}
        <div
          className={`relative hidden overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(52,211,203,0.28),_transparent_35%),linear-gradient(180deg,#F4FEFE_0%,#EAFBFB_100%)] p-6 sm:p-10 lg:block transition-all duration-500 ease-in-out ${
            isLogin ? "lg:order-2" : "lg:order-1"
          }`}
        >
          {/* ── Login info ── */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              isLogin
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 -translate-y-4 opacity-0 p-6 sm:p-10"
            }`}
          >
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#188B8B]">
                Jumpstart account
              </p>
              <h2 className="mt-5 text-3xl font-bold text-[#0F1729] sm:text-4xl">
                Your dashboard, results, and package progress stay connected.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#65758B]">
                Log in to resume paused tests, review completed reports, and
                manage your profile without losing your saved progress.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {loginHighlights.map((item) => (
                <div
                  key={item}
                  className="surface-card rounded-[24px] bg-white/90 px-5 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#E8F9F8] p-2 text-[#188B8B]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-[#0F1729]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Signup info ── */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              !isLogin
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-y-4 opacity-0 p-6 sm:p-10"
            }`}
          >
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#188B8B]">
                Create your account
              </p>
              <h2 className="mt-5 text-3xl font-bold text-[#0F1729] sm:text-4xl">
                Start your career discovery journey with a saved Jumpstart
                profile.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#65758B]">
                Create your account once and keep your test purchases, saved
                answers, results, and counselling access tied together.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {signupBenefits.map((item) => (
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
        </div>
      </div>
    </div>
  );
}
