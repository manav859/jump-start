// Shared Suspense fallback for lazy-loaded routes. The spinner uses
// the Jumpstart teal so the loading state feels on-brand rather than
// a default gray placeholder.

import { useTranslation } from "react-i18next";

export default function PageLoader() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("loading.page")}
      className="flex min-h-[60vh] items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E1E7EF] border-t-[#188B8B]"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-[#4E5D72]">{t("loading.page")}</p>
      </div>
    </div>
  );
}
