import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Check, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

const accentStyles = [
  {
    badge: "bg-[#E8F9F8] text-[#188B8B]",
    border: "border-[#D7ECEC]",
    button: "bg-[#188B8B] text-white hover:bg-[#147979]",
  },
  {
    badge: "bg-[#FFF2D8] text-[#B86D00]",
    border: "border-[#F6C465]",
    button: "bg-[#F59F0A] text-[#0F1729] hover:bg-[#E89206]",
  },
  {
    badge: "bg-[#E8F9F8] text-[#188B8B]",
    border: "border-[#188B8B]",
    button: "bg-[#0F1729] text-white hover:bg-[#1E293B]",
  },
];

const includedBenefits = [
  {
    title: "Dashboard Access",
    description: "Track section progress and revisit your purchased packages anytime.",
    icon: LayoutDashboard,
  },
  {
    title: "Scientifically Valid",
    description: "Tests are designed with psychologist-led methodology and scoring.",
    icon: Sparkles,
  },
  {
    title: "Lifetime Access",
    description: "Review your reports and recommendations whenever you need them.",
    icon: ShieldCheck,
  },
];

const formatPrice = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

const getPlanActionMeta = (plan) => {
  if (plan.ownershipStatus === "completed") {
    if (plan.publicationStatus === "pending_approval") {
      return {
        badgeLabel: "Result Pending",
        badgeClass: "bg-amber-50 text-amber-700",
        helperText:
          "Your latest submission is awaiting admin approval.",
        actionLabel: "View Submission Status",
        mode: "pending",
      };
    }

    return {
      badgeLabel: "Purchased",
      badgeClass: "bg-emerald-50 text-emerald-700",
      helperText: "This assessment is already completed. Review it from your results hub.",
      actionLabel: "Open Results Hub",
      mode: "results",
    };
  }

  if (plan.ownershipStatus === "in_progress") {
    return {
      badgeLabel: "In Progress",
      badgeClass: "bg-amber-50 text-amber-700",
      helperText: "Your answers are saved. Resume from your sections page.",
      actionLabel: "Resume Assessment",
      mode: "open",
    };
  }

  if (plan.owned) {
    return {
      badgeLabel: "Purchased",
      badgeClass: "bg-[#E8F9F8] text-[#188B8B]",
      helperText: "Already purchased and ready to start from your account.",
      actionLabel: "Start Assessment",
      mode: "open",
    };
  }

  if (Number(plan.amount || 0) <= 0) {
    return {
      badgeLabel: "Free",
      badgeClass: "bg-sky-50 text-sky-700",
      helperText: "Free access. Unlock and start this assessment instantly.",
      actionLabel: "Start Free Test",
      mode: "unlock",
    };
  }

  return {
    badgeLabel: null,
    badgeClass: "",
    helperText: "One-time payment",
    actionLabel: "Buy Assessment",
    mode: "purchase",
  };
};

export default function Test() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingPlanId, setOpeningPlanId] = useState("");
  const [loadError, setLoadError] = useState("");
  const hasSinglePlan = plans.length === 1;
  const planContainerClassName = hasSinglePlan
    ? "mx-auto mt-12 max-w-xl"
    : "mt-12 grid gap-6 lg:grid-cols-3";

  useEffect(() => {
    const configRequest = api.get("/v1/public/config");
    const initRequest = token ? api.get("/v1/user/init") : Promise.resolve(null);

    Promise.allSettled([configRequest, initRequest])
      .then(([configRes, initRes]) => {
        const configError =
          configRes.status === "rejected"
            ? configRes.reason?.response?.data?.msg ||
              configRes.reason?.message ||
              "Failed to load available packages."
            : "";
        const publicPackages =
          configRes.status === "fulfilled"
            ? configRes.value?.data?.data?.packages || []
            : [];
        const purchasedPackages =
          initRes.status === "fulfilled"
            ? initRes.value?.data?.data?.purchased_packages || []
            : [];
        const purchasedMap = new Map(
          purchasedPackages.map((pkg) => [pkg.id, pkg])
        );

        setLoadError(configError);

        setPlans(
          publicPackages.map((plan) => {
            const ownedPackage = purchasedMap.get(plan.id);
            return {
              ...plan,
              owned: Boolean(ownedPackage),
              ownershipStatus: ownedPackage?.status || "available",
              publicationStatus:
                ownedPackage?.publicationStatus || "not_submitted",
            };
          })
        );
      })
      .catch((err) => {
        console.error("Failed to load packages", err);
        setLoadError(err?.response?.data?.msg || err?.message || "Failed to load available packages.");
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePlanAction = async (plan) => {
    const action = getPlanActionMeta(plan);

    if (action.mode === "purchase") {
      navigate("/payment", { state: { plan } });
      return;
    }

    if (action.mode === "pending") {
      navigate("/test-completed");
      return;
    }

    if (action.mode === "results") {
      navigate(plan.publishedReportId ? `/result/${plan.publishedReportId}` : "/result");
      return;
    }

    setOpeningPlanId(plan.id);
    try {
      if (action.mode === "unlock") {
        await api.post("/v1/user/package/purchase", { packageId: plan.id });
      }
      await api.patch("/v1/user/package/select", {
        packageId: plan.id,
        resetProgress: false,
      });
      if (user) {
        updateUser({ ...user, selectedPackageId: plan.id });
      }
      navigate("/pretest/sections", { replace: true });
    } catch (err) {
      console.error("Failed to open package", err);
      window.alert(
        err?.response?.data?.msg || "Unable to open this package right now."
      );
    } finally {
      setOpeningPlanId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAFA] px-4">
        <p className="text-[#65758B]">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F9F8] px-4 py-2 text-sm font-semibold text-[#188B8B]">
            <BadgeCheck className="h-4 w-4" />
            Assessment Packages
          </div>
          <h1 className="mt-6 text-4xl font-bold text-[#0F1729] sm:text-5xl">
            Career Aptitude Tests
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#65758B]">
            Start with the quick dummy test for a fast dry run, or take the
            comprehensive 500-question assessment for full career-fit analysis.
          </p>
        </div>

        {loadError ? (
          <div className="surface-card mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#F3C7C7] bg-[#FFF5F5] p-5 text-center">
            <h2 className="text-xl font-bold text-[#0F1729]">
              Unable to Load Packages
            </h2>
            <p className="mt-2 text-sm text-[#B42318]">{loadError}</p>
            <p className="mt-2 text-sm text-[#65758B]">
              This is different from having no packages configured. Once the backend config loads correctly, your packages will appear here.
            </p>
          </div>
        ) : null}

        {plans.length ? (
          <div className={planContainerClassName}>
            {plans.map((plan, index) => {
              const accent = accentStyles[index % accentStyles.length];
              const action = getPlanActionMeta(plan);
              const buttonClass =
                action.mode === "purchase"
                  ? accentStyles[0].button
                  : accent.button;
              return (
                <article
                  key={plan.id || plan.title || index}
                  className={`surface-card flex h-full flex-col rounded-[30px] border-2 p-8 ${accent.border}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent.badge}`}>
                      <BadgeCheck className="h-4 w-4" />
                      {plan.badge || (index === 1 ? "Best Value" : "Popular Choice")}
                    </div>
                    {action.badgeLabel ? (
                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${action.badgeClass}`}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {action.badgeLabel}
                      </div>
                    ) : null}
                  </div>

                  <h2 className="mt-6 text-3xl font-bold text-[#0F1729]">
                    {plan.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#65758B]">
                    {plan.description || "Career assessment package."}
                  </p>

                  <div className="mt-8">
                    <p className="text-4xl font-bold text-[#0F1729]">
                      {formatPrice(plan.amount)}
                    </p>
                    <p className="mt-2 text-sm text-[#65758B]">{action.helperText}</p>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm text-[#475467]">
                    {(plan.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full bg-[#E8F9F8] p-1 text-[#188B8B]">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handlePlanAction(plan)}
                    className={`mt-8 w-full rounded-2xl px-5 py-3 text-sm font-semibold ${buttonClass}`}
                  >
                    {openingPlanId === plan.id ? "Opening..." : action.actionLabel}
                  </button>

                  <p className="mt-4 text-center text-xs text-[#98A2B3]">
                    {plan.durationText || "Total duration depends on selected sections"}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-card mx-auto mt-12 max-w-2xl rounded-[30px] p-10 text-center">
            <h2 className="text-2xl font-bold text-[#0F1729]">
              {loadError ? "Package Loading Failed" : "No packages are available right now"}
            </h2>
            <p className="mt-3 text-[#65758B]">
              {loadError
                ? "The package API did not return data successfully. Check the backend config or restart the backend so the seeded packages can load."
                : "Please check back shortly. Your administrator may still be configuring the assessment packages."}
            </p>
          </div>
        )}

        <div className="surface-card mx-auto mt-14 max-w-5xl rounded-[32px] bg-[linear-gradient(180deg,#F0FCFB_0%,#FFFFFF_100%)] px-6 py-10 sm:px-10">
          <h2 className="text-center text-3xl font-bold text-[#0F1729]">
            All Packages Include
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {includedBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#188B8B] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0F1729]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#65758B]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
