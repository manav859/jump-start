import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Mail, MapPin, Phone, UserRound } from "lucide-react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

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
      </div>
    </div>
  );
}
