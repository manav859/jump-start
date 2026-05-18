import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Copy,
  GraduationCap,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

const formatDateOfBirth = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const studentProfileFields = (sp = {}) => [
  { label: "Date of Birth", value: formatDateOfBirth(sp.dateOfBirth) },
  { label: "Gender", value: sp.gender || "-" },
  { label: "Phone", value: sp.phone || "-" },
  { label: "School / College", value: sp.schoolOrCollege || "-" },
  { label: "Class / Grade", value: sp.classOrGrade || "-" },
  { label: "Stream", value: sp.stream || "-" },
  { label: "Board / University", value: sp.board || "-" },
  { label: "City", value: sp.city || "-" },
  { label: "State / UT", value: sp.state || "-" },
];

const formatUserId = (id) =>
  id ? `JS${String(id).slice(-6).toUpperCase()}` : "JS000000";

const profileFields = (profile) => [
  { label: "User ID", value: formatUserId(profile?._id || profile?.id) },
  { label: "Account", value: profile?.isSuspended ? "Suspended" : "Active" },
  { label: "Full Name", value: profile?.name || "-" },
  { label: "Email Id", value: profile?.email || "-" },
  { label: "Phone Number", value: profile?.mobile || "-" },
  { label: "City", value: profile?.city || "-" },
];

const extraProfileFields = (profile) => [
  { label: "Date of Birth", value: profile?.dateOfBirth || "-" },
  { label: "School Name", value: profile?.schoolName || "-" },
  { label: "School Location", value: profile?.schoolLocation || "-" },
  { label: "Residential Address", value: profile?.residentialAddress || "-" },
];

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  // Prompt-9 Fix 1: copy-to-clipboard for the Jumpstart ID. `copied`
  // returns to false after a short delay so the button reads as a
  // transient acknowledgement rather than a sticky state.
  const [copiedJumpstartId, setCopiedJumpstartId] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api
      .get("/v1/user/profile")
      .then((res) => {
        setProfile(res?.data?.data?.user || null);
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const fullName = profile?.name || user?.name || "User";
  const initial = useMemo(() => fullName.charAt(0).toUpperCase(), [fullName]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white px-4">
        <p className="text-[#65758B]">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white px-4">
        <div className="surface-card w-full max-w-xl rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">Profile Unavailable</h1>
          <p className="mt-3 text-[#65758B]">{error}</p>
          <Link to="/dashboard" className="primary-btn mt-6">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fields = profileFields(profile || user || {});
  const extraFields = extraProfileFields(profile || user || {});

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#0F1729]">My Profile</h1>
            <p className="mt-2 text-base text-[#65758B]">
              Keep your personal details updated for a smoother assessment experience.
            </p>
          </div>
          <Link to="/profile/edit" className="secondary-btn">
            Edit Profile
          </Link>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : null}

        {/* Prompt-9 Fix 1: Jumpstart ID card. Shown above the warning
            banner so students can quote their ID to support / counsellors
            even before they finish the profile form. Copy button uses the
            modern clipboard API with a fallback notice for browsers that
            block it (mostly older Safari over http://). */}
        {profile?.jumpstartId || user?.jumpstartId ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#D4EEED] bg-[linear-gradient(180deg,#F6FDFC_0%,#FFFFFF_100%)] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAFBFB] text-[#188B8B]">
                <Hash className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
                  Your Jumpstart ID
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-[#0F1729]">
                  {profile?.jumpstartId || user?.jumpstartId}
                </p>
                <p className="mt-1 text-xs text-[#65758B]">
                  Quote this ID when contacting Jumpstart support or your
                  counsellor — it identifies your account uniquely.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const id = profile?.jumpstartId || user?.jumpstartId || "";
                if (!id) return;
                try {
                  if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(id);
                  } else {
                    const temp = document.createElement("textarea");
                    temp.value = id;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand("copy");
                    document.body.removeChild(temp);
                  }
                  setCopiedJumpstartId(true);
                  setTimeout(() => setCopiedJumpstartId(false), 2000);
                } catch {
                  // Best-effort — clipboard blocked. No-op; the ID is
                  // still readable on screen.
                }
              }}
              className="inline-flex items-center gap-2 rounded-[12px] border border-[#188B8B] bg-white px-4 py-2 text-sm font-semibold text-[#188B8B] transition hover:bg-[#F6FDFC]"
              aria-label="Copy your Jumpstart ID to the clipboard"
            >
              {copiedJumpstartId ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy ID
                </>
              )}
            </button>
          </div>
        ) : null}

        {profile?.studentProfile && !profile.studentProfile.isComplete ? (
          <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[#F5D9A6] bg-[#FFF9EE] px-5 py-4 text-[#8C5A00]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59F0A]" />
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium leading-6">
                Please complete your student profile to unlock the assessment.
              </p>
              <Link
                to="/profile/student"
                state={{ returnTo: "/profile" }}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#F59F0A] px-4 py-1.5 text-xs font-semibold text-[#0F1729] hover:bg-[#E89206]"
              >
                Complete now
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="flex h-[160px] w-[120px] items-center justify-center rounded-[24px] bg-[#188B8B] text-white shadow-[0_20px_36px_rgba(24,139,139,0.18)]">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/50">
                <UserRound className="h-7 w-7" />
              </div>
              <p className="mt-4 text-3xl font-bold">{initial}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <p className="mb-2 text-sm font-semibold text-[#344054]">
                  {field.label}
                </p>
                <div className="flex min-h-[58px] items-center rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] shadow-sm">
                  {field.label === "Phone Number" && field.value && field.value !== "-" ? (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span>{field.value}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F9F8] px-3 py-1 text-xs font-semibold text-[#188B8B]">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                  ) : (
                    field.value
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="surface-card rounded-[26px] p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#188B8B]" />
              <h2 className="text-lg font-semibold text-[#0F1729]">Email Contact</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#65758B]">
              {profile?.email || user?.email || "No email added yet."}
            </p>
          </div>
          <div className="surface-card rounded-[26px] p-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#188B8B]" />
              <h2 className="text-lg font-semibold text-[#0F1729]">Phone</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#65758B]">
              {profile?.mobile || "Add your phone number to keep your account details complete."}
            </p>
          </div>
          <div className="surface-card rounded-[26px] p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#188B8B]" />
              <h2 className="text-lg font-semibold text-[#0F1729]">Location</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#65758B]">
              {profile?.city || "Add your city to personalize your profile and counselling follow-up."}
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-[#0F1729]">
            Education & Location
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {extraFields.map((field) => (
              <div key={field.label}>
                <p className="mb-2 text-sm font-semibold text-[#344054]">
                  {field.label}
                </p>
                <div className="min-h-[58px] rounded-2xl border border-[#E1E7EF] bg-white px-4 py-4 text-sm text-[#0F1729] shadow-sm">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAFBFB] text-[#188B8B]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-3xl font-bold text-[#0F1729]">
                  Student Details
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#65758B]">
                  The structured profile collected before your assessment.
                  {profile?.studentProfile?.isComplete ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#E2F8F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#188B8B]">
                      <BadgeCheck className="h-3 w-3" />
                      Complete
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF1D3] px-2.5 py-0.5 text-[11px] font-semibold text-[#B86D00]">
                      Incomplete
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Link
              to="/profile/student"
              state={{ returnTo: "/profile" }}
              className="secondary-btn shrink-0"
            >
              {profile?.studentProfile?.isComplete ? "Edit" : "Complete now"}
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {studentProfileFields(profile?.studentProfile || {}).map(
              (field) => (
                <div key={field.label}>
                  <p className="mb-2 text-sm font-semibold text-[#344054]">
                    {field.label}
                  </p>
                  <div className="min-h-[58px] rounded-2xl border border-[#E1E7EF] bg-white px-4 py-4 text-sm text-[#0F1729] shadow-sm">
                    {field.value}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
