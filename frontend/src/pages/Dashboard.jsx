import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  PlayCircle,
  UserRound,
  Video,
  CalendarDays,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

const defaultState = {
  tests_completed: 0,
  tests_in_progress: 0,
  reports_ready: 0,
  counselling_sessions: 0,
  user: null,
  selected_package_id: "",
  purchased_packages: [],
  top_careers: [],
  result_status: "not_submitted",
};

const getPackageStatusMeta = (status) => {
  if (status === "completed") {
    return {
      label: "Completed",
      badgeClass: "bg-emerald-50 text-emerald-700",
      cardClass: "border-[#D8F3E6] bg-emerald-50/30 hover:border-[#52B788]",
      clickable: true,
    };
  }

  if (status === "in_progress") {
    return {
      label: "In Progress",
      badgeClass: "bg-amber-50 text-amber-700",
      cardClass: "border-[#F8D38B] bg-[#FFF9EE] hover:border-[#F2B53D]",
      actionLabel: "Resume Assessment",
      clickable: true,
    };
  }

  return {
    label: "Not Completed",
    badgeClass: "bg-slate-100 text-slate-700",
    cardClass: "border-[#E1E7EF] bg-white hover:border-[#9BD9D6] hover:bg-[#F6FDFC]",
    actionLabel: "Open Assessment",
    clickable: true,
  };
};

const getPackageActionMeta = (pkg) => {
  if (pkg.status === "completed") {
    if (pkg.publicationStatus === "pending_approval") {
      return {
        label: "View Submission Status",
        mode: "pending",
      };
    }

    return {
      label: "Open Results Hub",
      mode: "results",
    };
  }

  if (pkg.status === "in_progress") {
    return {
      label: "Resume Assessment",
      mode: "open",
    };
  }

  return {
    label: "Open Assessment",
    mode: "open",
  };
};

const getPackagePublicationMeta = (publicationStatus) => {
  if (publicationStatus === "pending_approval") {
    return {
      label: "Result Pending",
      badgeClass: "bg-amber-50 text-amber-700",
      note: "Latest attempt submitted. Result is awaiting admin approval.",
      noteClass: "text-amber-700",
    };
  }

  if (publicationStatus === "approved") {
    return {
      label: "Report Ready",
      badgeClass: "bg-blue-50 text-blue-700",
      note: "Published report is available in your results.",
      noteClass: "text-blue-700",
    };
  }

  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(defaultState);
  const [packageError, setPackageError] = useState("");
  const [openingPackageId, setOpeningPackageId] = useState("");
  const [showAdminAccessNotice, setShowAdminAccessNotice] = useState(
    Boolean(location.state?.adminAccessRequired)
  );

  useEffect(() => {
    if (!location.state?.adminAccessRequired) return;

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/v1/user/init")
      .then((res) => {
        const data = res?.data?.data;
        if (!data) return;

        setStats({
          tests_completed: data.tests_completed ?? 0,
          tests_in_progress: data.tests_in_progress ?? 0,
          reports_ready: data.reports_ready ?? 0,
          counselling_sessions: data.counselling_sessions ?? 0,
          user: data.user || user || null,
          selected_package_id: data.user?.selectedPackageId || user?.selectedPackageId || "",
          purchased_packages: data.purchased_packages || [],
          top_careers: data.top_careers || [],
          result_status: data.result_status || "not_submitted",
        });
      })
      .catch((err) => {
        console.error("Failed to load dashboard", err);
        setStats((prev) => ({
          ...prev,
          user: user || null,
        }));
      })
      .finally(() => setLoading(false));
  }, [token, user]);

  const statCards = useMemo(
    () => [
      {
        label: "Tests Completed",
        value: stats.tests_completed,
        icon: CheckCircle2,
        accent: "text-emerald-500",
        bg: "bg-emerald-50",
      },
      {
        label: "Tests in Progress",
        value: stats.tests_in_progress,
        icon: PlayCircle,
        accent: "text-amber-500",
        bg: "bg-amber-50",
      },
      {
        label: "Reports Ready",
        value: stats.reports_ready,
        icon: FileText,
        accent: "text-blue-500",
        bg: "bg-blue-50",
      },
      {
        label: "Counselling Sessions",
        value: stats.counselling_sessions,
        icon: Video,
        accent: "text-slate-500",
        bg: "bg-slate-100",
      },
    ],
    [
      stats.counselling_sessions,
      stats.reports_ready,
      stats.tests_completed,
      stats.tests_in_progress,
    ]
  );

  const openAssessmentPath = (path) => {
    navigate(path);
    window.setTimeout(() => {
      if (window.location.pathname !== path) {
        window.location.assign(path);
      }
    }, 0);
  };

  const handleOpenPackage = async (pkg) => {
    const statusMeta = getPackageStatusMeta(pkg.status);
    const actionMeta = getPackageActionMeta(pkg);
    if (!statusMeta.clickable) return;

    if (actionMeta.mode === "pending") {
      navigate("/test-completed");
      return;
    }

    if (actionMeta.mode === "results") {
      navigate(pkg.publishedReportId ? `/result/${pkg.publishedReportId}` : "/result");
      return;
    }

    setPackageError("");
    setOpeningPackageId(pkg.id);

    try {
      if (stats.selected_package_id !== pkg.id) {
        await api.patch("/v1/user/package/select", {
          packageId: pkg.id,
          resetProgress: false,
        });
        setStats((prev) => ({
          ...prev,
          selected_package_id: pkg.id,
          user: prev.user ? { ...prev.user, selectedPackageId: pkg.id } : prev.user,
        }));

        if (user) {
          updateUser({ ...user, selectedPackageId: pkg.id });
        }
      }

      openAssessmentPath("/pretest/sections");
    } catch (err) {
      console.error("Failed to open assessment package", err);
      setPackageError(
        err?.response?.data?.msg ||
          err?.message ||
          "Failed to open this assessment."
      );
    } finally {
      setOpeningPackageId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAFA] px-4">
        <p className="text-[#65758B]">Loading dashboard...</p>
      </div>
    );
  }

  const displayName = stats.user?.name || user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {showAdminAccessNotice ? (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-[24px] border border-[#F8D38B] bg-[#FFF9EE] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0F1729]">
                Admin panel access is limited to admin accounts
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#65758B]">
                You were redirected back to your dashboard because this account
                does not have admin access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminAccessNotice(false)}
              className="shrink-0 rounded-full border border-[#E8C16A] px-3 py-1 text-xs font-semibold text-[#8C5A00] hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#0F1729]">
              Welcome, {displayName}!
            </h1>
            <p className="mt-2 text-base text-[#65758B]">
              Track your progress and continue your career discovery journey.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-3 rounded-full border border-[#D9E5EC] bg-white px-5 py-3 text-sm font-semibold text-[#0F1729] shadow-sm hover:border-[#188B8B] hover:bg-[#F6FDFC]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F9F8] text-[#188B8B]">
              <UserRound className="h-4 w-4" />
            </span>
            Manage Profile
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="surface-card rounded-[26px] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#65758B]">{card.label}</p>
                    <p className={`mt-4 text-5xl font-bold ${card.accent}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.bg} ${card.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
          <section className="surface-card rounded-[30px] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#0F1729]">
                  Purchased Packages
                </h2>
                <p className="mt-2 text-base text-[#65758B]">
                  Only packages you have unlocked will appear here.
                </p>
              </div>
              <div className="hidden rounded-full bg-[#F6FDFC] px-4 py-2 text-sm font-semibold text-[#188B8B] sm:block">
                {stats.purchased_packages.length} unlocked
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {stats.purchased_packages.length ? (
                stats.purchased_packages.map((pkg) => {
                  const statusMeta = getPackageStatusMeta(pkg.status);
                  const actionMeta = getPackageActionMeta(pkg);
                  const publicationMeta = getPackagePublicationMeta(
                    pkg.publicationStatus
                  );
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleOpenPackage(pkg)}
                      disabled={!statusMeta.clickable || openingPackageId === pkg.id}
                      className={`w-full rounded-[26px] border p-6 text-left shadow-sm transition ${statusMeta.cardClass} disabled:cursor-default disabled:opacity-100`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-[#0F1729]">
                            {pkg.title}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-5 text-sm text-[#65758B]">
                            <span>Sections: {pkg.totalSections ?? 0}</span>
                            <span>Total Questions: {pkg.totalQuestions ?? 0}</span>
                            <span>
                              Total Duration: {pkg.totalDurationMinutes ?? 0} Minutes
                            </span>
                          </div>
                          {publicationMeta ? (
                            <p
                              className={`mt-3 text-sm font-medium ${publicationMeta.noteClass}`}
                            >
                              {publicationMeta.note}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                          {publicationMeta ? (
                            <span
                              className={`rounded-full px-4 py-2 text-xs font-semibold ${publicationMeta.badgeClass}`}
                            >
                              {publicationMeta.label}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-[#188B8B]">
                          {openingPackageId === pkg.id
                            ? "Opening..."
                            : actionMeta.label}
                        </p>
                        {statusMeta.clickable ? (
                          <ArrowRight className="h-5 w-5 text-[#188B8B]" />
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[26px] border border-dashed border-[#C8D7E1] bg-[#FBFCFD] p-8 text-center">
                  <h3 className="text-2xl font-semibold text-[#0F1729]">
                    No purchased packages yet
                  </h3>
                  <p className="mt-3 text-[#65758B]">
                    Choose a test package to unlock your assessment workflow.
                  </p>
                </div>
              )}
            </div>

            {packageError ? (
              <p className="mt-4 text-sm text-red-600">{packageError}</p>
            ) : null}

            <Link
              to="/test"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#188B8B] px-5 py-3 text-sm font-semibold text-[#188B8B] hover:bg-[#F6FDFC]"
            >
              Browse More Tests
            </Link>
          </section>

          <div className="space-y-6">
            <section className="surface-card rounded-[30px] p-7">
              <h2 className="text-2xl font-bold text-[#0F1729]">
                Top Career Matches
              </h2>
              <p className="mt-2 text-sm text-[#65758B]">
                {stats.result_status === "pending_approval"
                  ? "Awaiting admin approval"
                  : "Based on your results"}
              </p>

              <div className="mt-5 space-y-3">
                {stats.result_status === "pending_approval" ? (
                  <div className="rounded-2xl border border-[#F8D38B] bg-[#FFF9EE] p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-[#F59F0A]">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0F1729]">
                          Result pending approval
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#65758B]">
                          Your assessment was submitted successfully. Your report
                          will appear here after an admin reviews and approves it.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : stats.top_careers.length ? (
                  stats.top_careers.slice(0, 3).map((career) => (
                    <div
                      key={career.title}
                      className="rounded-2xl bg-[#EAFBFB] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-2 text-[#188B8B]">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0F1729]">
                            {career.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#65758B]">
                            {career.matchPercent ?? 0}% match
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#65758B]">
                    Complete your assessments to unlock personalized career
                    matches here.
                  </div>
                )}
              </div>

              <Link
                to={stats.result_status === "pending_approval" ? "/test-completed" : "/result"}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#188B8B] hover:underline"
              >
                {stats.result_status === "pending_approval"
                  ? "View Submission Status"
                  : "Open Results Hub"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            <section className="surface-card rounded-[30px] bg-[linear-gradient(180deg,#F8FEFE_0%,#FFFFFF_100%)] p-7">
              <h2 className="text-2xl font-bold text-[#0F1729]">
                Book Counselling
              </h2>
              <p className="mt-2 text-sm text-[#65758B]">
                Get expert guidance after your assessment.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#65758B]">
                Schedule a one-on-one session with our psychologists to discuss
                your report and next steps.
              </p>
              <Link
                to="/bookcounselling"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F59F0A] px-5 py-3 text-sm font-semibold text-[#0F1729] shadow-[0_14px_28px_rgba(245,159,10,0.18)] hover:bg-[#E89206]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Session
              </Link>
            </section>

            <section className="surface-card rounded-[30px] p-7">
              <h2 className="text-2xl font-bold text-[#0F1729]">Need Help?</h2>
              <div className="mt-5 space-y-3">
                <Link
                  to="/bookcounselling"
                  className="flex items-center gap-3 rounded-2xl border border-[#D9E5EC] px-4 py-3 text-sm font-semibold text-[#0F1729] hover:bg-[#F8FAFC]"
                >
                  <HelpCircle className="h-4 w-4 text-[#188B8B]" />
                  Help Center
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-[#D9E5EC] px-4 py-3 text-sm font-semibold text-[#0F1729] hover:bg-[#F8FAFC]"
                >
                  <UserRound className="h-4 w-4 text-[#188B8B]" />
                  My Profile
                </Link>
              </div>
            </section>

            <section className="surface-card rounded-[30px] p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#188B8B] text-2xl font-bold text-white">
                  {initial}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0F1729]">
                    {displayName}
                  </h2>
                  <p className="text-sm text-[#65758B]">
                    {stats.user?.email || user?.email || "No email available"}
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#188B8B] hover:underline"
              >
                View profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
