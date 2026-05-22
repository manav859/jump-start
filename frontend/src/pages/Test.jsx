import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const formatPrice = (amount) => `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

// Plan-action meta factory takes `t` so labels translate live with the
// language toggle. `mode` keys stay english so the dispatch logic in
// handlePlanAction continues to work unchanged.
const getPlanActionMeta = (plan, t) => {
  if (plan.ownershipStatus === "completed") {
    if (plan.publicationStatus === "pending_approval") {
      return {
        badgeLabel: t("testCatalog.badgeResultPending"),
        badgeClass: "bg-amber-50 text-amber-700",
        helperText: t("testCatalog.helperPendingApproval"),
        actionLabel: t("testCatalog.actionPendingView"),
        mode: "pending",
      };
    }

    return {
      badgeLabel: t("testCatalog.badgePurchased"),
      badgeClass: "bg-emerald-50 text-emerald-700",
      helperText: t("testCatalog.helperPurchasedDone"),
      actionLabel: t("testCatalog.actionResultsHub"),
      mode: "results",
    };
  }

  if (plan.ownershipStatus === "in_progress") {
    return {
      badgeLabel: t("testCatalog.badgeInProgress"),
      badgeClass: "bg-amber-50 text-amber-700",
      helperText: t("testCatalog.helperInProgress"),
      actionLabel: t("testCatalog.actionResume"),
      mode: "open",
    };
  }

  if (plan.owned) {
    return {
      badgeLabel: t("testCatalog.badgePurchased"),
      badgeClass: "bg-[#E8F9F8] text-[#188B8B]",
      helperText: t("testCatalog.helperPurchasedReady"),
      actionLabel: t("testCatalog.actionStart"),
      mode: "open",
    };
  }

  if (Number(plan.amount || 0) <= 0) {
    return {
      badgeLabel: t("testCatalog.badgeFree"),
      badgeClass: "bg-sky-50 text-sky-700",
      helperText: t("testCatalog.helperFree"),
      actionLabel: t("testCatalog.actionStartFree"),
      mode: "unlock",
    };
  }

  return {
    badgeLabel: null,
    badgeClass: "",
    helperText: t("testCatalog.helperPurchase"),
    actionLabel: t("testCatalog.actionBuy"),
    mode: "purchase",
  };
};

// Look up a localised package field (title/badge/description/durationText/features)
// for one of the three seeded packages. Falls back to the API value when the
// locale has no entry, which is what keeps unknown / future package ids working.
const localisedPackageField = (t, packageId, field, fallback) => {
  if (!packageId) return fallback;
  const key = `testCatalog.packages.${packageId}.${field}`;
  const value = t(key, { defaultValue: "", returnObjects: field === "features" });
  if (field === "features") {
    return Array.isArray(value) && value.length ? value : fallback;
  }
  return value || fallback;
};

export default function Test() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, updateUser } = useContext(AuthContext);

  // Static benefit cards — title + description keys. Rebuilt at render
  // time so the language toggle updates them without a hot reload.
  const includedBenefits = [
    {
      titleKey: "testCatalog.benefitDashboard",
      descKey: "testCatalog.benefitDashboardBody",
      icon: LayoutDashboard,
    },
    {
      titleKey: "testCatalog.benefitValid",
      descKey: "testCatalog.benefitValidBody",
      icon: Sparkles,
    },
    {
      titleKey: "testCatalog.benefitLifetime",
      descKey: "testCatalog.benefitLifetimeBody",
      icon: ShieldCheck,
    },
  ];
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
              t("testCatalog.loadFailedDefault")
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
        setLoadError(err?.response?.data?.msg || err?.message || t("testCatalog.loadFailedDefault"));
        setPlans([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePlanAction = async (plan) => {
    const action = getPlanActionMeta(plan, t);

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
        err?.response?.data?.msg || t("testCatalog.openFailed")
      );
    } finally {
      setOpeningPlanId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAFA] px-4">
        <p className="text-[#65758B]">{t("testCatalog.loading")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F9F8] px-4 py-2 text-sm font-semibold text-[#188B8B]">
            <BadgeCheck className="h-4 w-4" />
            {t("testCatalog.badge")}
          </div>
          <h1 className="mt-6 text-4xl font-bold text-[#0F1729] sm:text-5xl">
            {t("testCatalog.heading")}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#65758B]">
            {t("testCatalog.subheading")}
          </p>
        </div>

        {loadError ? (
          <div className="surface-card mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#F3C7C7] bg-[#FFF5F5] p-5 text-center">
            <h2 className="text-xl font-bold text-[#0F1729]">
              {t("testCatalog.loadFailedHeading")}
            </h2>
            <p className="mt-2 text-sm text-[#B42318]">{loadError}</p>
            <p className="mt-2 text-sm text-[#65758B]">
              {t("testCatalog.loadFailedBody")}
            </p>
          </div>
        ) : null}

        {plans.length ? (
          <div className={planContainerClassName}>
            {plans.map((plan, index) => {
              const accent = accentStyles[index % accentStyles.length];
              const action = getPlanActionMeta(plan, t);
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
                      {localisedPackageField(t, plan.id, "badge", plan.badge) ||
                        (index === 1 ? t("testCatalog.bestValue") : t("testCatalog.popularChoice"))}
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
                    {localisedPackageField(t, plan.id, "title", plan.title)}
                  </h2>
                  <p className="mt-2 text-sm text-[#65758B]">
                    {localisedPackageField(t, plan.id, "description", plan.description) ||
                      t("testCatalog.fallbackDescription")}
                  </p>

                  <div className="mt-8">
                    <p className="text-4xl font-bold text-[#0F1729]">
                      {formatPrice(plan.amount)}
                    </p>
                    <p className="mt-2 text-sm text-[#65758B]">{action.helperText}</p>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm text-[#475467] flex-grow">
                    {localisedPackageField(t, plan.id, "features", plan.features || []).map(
                      (feature, featureIndex) => (
                        <li key={`${plan.id}-feat-${featureIndex}`} className="flex items-start gap-3">
                          <span className="mt-0.5 rounded-full bg-[#E8F9F8] p-1 text-[#188B8B]">
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handlePlanAction(plan)}
                    className={`mt-8 w-full rounded-2xl px-5 py-3 text-sm font-semibold ${buttonClass}`}
                  >
                    {openingPlanId === plan.id ? t("testCatalog.actionOpening") : action.actionLabel}
                  </button>

                  <p className="mt-4 text-center text-xs text-[#98A2B3]">
                    {localisedPackageField(t, plan.id, "durationText", plan.durationText) ||
                      t("testCatalog.fallbackDuration")}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-card mx-auto mt-12 max-w-2xl rounded-[30px] p-10 text-center">
            <h2 className="text-2xl font-bold text-[#0F1729]">
              {loadError ? t("testCatalog.loadingFailedHeading") : t("testCatalog.noPackagesHeading")}
            </h2>
            <p className="mt-3 text-[#65758B]">
              {loadError
                ? t("testCatalog.loadingFailedBody")
                : t("testCatalog.noPackagesBody")}
            </p>
          </div>
        )}

        <div className="surface-card mx-auto mt-14 max-w-5xl rounded-[32px] bg-[linear-gradient(180deg,#F0FCFB_0%,#FFFFFF_100%)] px-6 py-10 sm:px-10">
          <h2 className="text-center text-3xl font-bold text-[#0F1729]">
            {t("testCatalog.allPackagesInclude")}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {includedBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.titleKey} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#188B8B] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0F1729]">
                    {t(benefit.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#65758B]">
                    {t(benefit.descKey)}
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
