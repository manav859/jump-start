import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

const formatUserId = (id) =>
  id ? `JS${String(id).slice(-6).toUpperCase()}` : "JS000000";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  dateOfBirth: "",
  schoolName: "",
  schoolLocation: "",
  residentialAddress: "",
  city: "",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    api
      .get("/v1/user/profile")
      .then((res) => {
        const nextProfile = res?.data?.data?.user || null;
        setProfile(nextProfile);
        setForm({
          name: nextProfile?.name || "",
          email: nextProfile?.email || "",
          mobile: nextProfile?.mobile || "",
          dateOfBirth: nextProfile?.dateOfBirth || "",
          schoolName: nextProfile?.schoolName || "",
          schoolLocation: nextProfile?.schoolLocation || "",
          residentialAddress: nextProfile?.residentialAddress || "",
          city: nextProfile?.city || "",
        });
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const initial = useMemo(
    () => (form.name || user?.name || "U").charAt(0).toUpperCase(),
    [form.name, user?.name]
  );

  const handleChange = (field, value) => {
    setMessage("");
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await api.patch("/v1/user/profile", form);
      const updatedUser = res?.data?.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
      }

      setMessage("Profile updated successfully.");
      window.setTimeout(() => navigate("/profile"), 450);
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white px-4">
        <p className="text-[#65758B]">Loading edit profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#0F1729]">Edit Profile</h1>
            <p className="mt-2 text-base text-[#65758B]">
              Update your details to keep your account and reports accurate.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="secondary-btn">
              Cancel
            </Link>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={saving}
              className="primary-btn disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        <form
          id="edit-profile-form"
          onSubmit={handleSubmit}
          className="mt-10 grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)]"
        >
          <div className="flex h-[160px] w-[120px] items-center justify-center rounded-[24px] bg-[#188B8B] text-white shadow-[0_20px_36px_rgba(24,139,139,0.18)]">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/50">
                <UserRound className="h-7 w-7" />
              </div>
              <p className="mt-4 text-3xl font-bold">{initial}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                User ID
              </label>
              <input
                value={formatUserId(profile?._id || user?.id)}
                disabled
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-[#F8FAFC] px-4 text-sm text-[#0F1729]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Account
              </label>
              <input
                value={profile?.isSuspended ? "Suspended" : "Active"}
                disabled
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-[#F8FAFC] px-4 text-sm text-[#0F1729]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Email Id
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Phone Number
              </label>
              <input
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Date of Birth
              </label>
              <input
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                placeholder="DD/MM/YYYY"
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                School Name
              </label>
              <input
                value={form.schoolName}
                onChange={(e) => handleChange("schoolName", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                School Location
              </label>
              <input
                value={form.schoolLocation}
                onChange={(e) => handleChange("schoolLocation", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                Residential Address
              </label>
              <textarea
                rows={4}
                value={form.residentialAddress}
                onChange={(e) =>
                  handleChange("residentialAddress", e.target.value)
                }
                className="w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 py-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344054]">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="h-[58px] w-full rounded-2xl border border-[#E1E7EF] bg-white px-4 text-sm text-[#0F1729] outline-none focus:border-[#188B8B]"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
