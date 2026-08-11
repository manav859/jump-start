// Shared Suspense fallback for lazy-loaded routes. The spinner uses
// the Jumpstart teal so the loading state feels on-brand rather than
// a default gray placeholder.
//
// Height note (CLS): this is min-h-screen rather than the 60vh it used
// to be. Every route is lazy(), so this fallback is what paints first on
// a cold load — and MainLayout renders the Footer directly beneath it.
// At 60vh the footer landed *inside* the first viewport and was then
// shoved down by a full page of content the moment the real chunk
// resolved. That single swap was the largest contributor to the 0.52
// desktop CLS. Reserving a viewport's worth of height keeps the footer
// below the fold in both states, so the swap moves nothing visible.

import { useTranslation } from "react-i18next";
import jumpstartIcon from "../assets/jumpstart-icon.png";

export default function PageLoader() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("loading.page")}
      className="flex min-h-screen items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Brand icon mark pulses, ringed by a teal spinner. */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#E1E7EF] border-t-[#188B8B]"
            aria-hidden="true"
          />
          <img
            src={jumpstartIcon}
            alt=""
            aria-hidden="true"
            width="187"
            height="187"
            className="h-9 w-9 animate-pulse"
          />
        </div>
        <p className="text-sm font-semibold text-[#4E5D72]">{t("loading.page")}</p>
      </div>
    </div>
  );
}
