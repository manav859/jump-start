import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import api from "../api/api";
import {
  fallbackSupportPages,
  supportPageDefinitions,
} from "../data/supportPages";

const splitLegacyFaqItem = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return null;

  const questionBreakIndex = text.indexOf("? ");
  if (questionBreakIndex >= 0) {
    return {
      heading: text.slice(0, questionBreakIndex + 1).trim(),
      content: text.slice(questionBreakIndex + 2).trim(),
    };
  }

  const colonBreakIndex = text.indexOf(": ");
  if (colonBreakIndex >= 0) {
    return {
      heading: text.slice(0, colonBreakIndex).trim(),
      content: text.slice(colonBreakIndex + 2).trim(),
    };
  }

  return {
    heading: text,
    content: "",
  };
};

export default function SupportContentPage({ pageKey }) {
  const definition = supportPageDefinitions[pageKey] || null;
  const fallbackPage = fallbackSupportPages[pageKey] || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(fallbackPage);
  const [openFaqIndex, setOpenFaqIndex] = useState(-1);

  useEffect(() => {
    if (!definition) {
      setLoading(false);
      setError("Support page not found.");
      return;
    }

    let cancelled = false;

    api
      .get("/v1/public/support-pages")
      .then((res) => {
        if (cancelled) return;
        const nextPage = res?.data?.data?.pages?.[pageKey];
        setPage(nextPage || fallbackPage);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.msg || "");
        setPage(fallbackPage);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [definition, fallbackPage, pageKey]);

  const visibleItems = useMemo(
    () =>
      Array.isArray(page?.items)
        ? page.items.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    [page?.items]
  );
  const visibleFaqItems = useMemo(() => {
    const normalizedFaqItems = Array.isArray(page?.faqItems)
      ? page.faqItems
          .map((item) => ({
            heading: String(item?.heading || "").trim(),
            content: String(item?.content || "").trim(),
          }))
          .filter((item) => item.heading || item.content)
      : [];

    if (normalizedFaqItems.length) {
      return normalizedFaqItems;
    }

    return visibleItems.map((item) => splitLegacyFaqItem(item)).filter(Boolean);
  }, [page?.faqItems, visibleItems]);
  const isFaqPage = definition?.contentType === "faq";

  useEffect(() => {
    if (!isFaqPage) {
      setOpenFaqIndex(-1);
      return;
    }

    setOpenFaqIndex(visibleFaqItems.length ? 0 : -1);
  }, [isFaqPage, pageKey, visibleFaqItems.length]);

  if (!definition) {
    return (
      <main className="bg-[#F7F8FA]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#0F1729]">Page Unavailable</h1>
          <Link to="/" className="primary-btn mt-6">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!loading && page?.enabled === false) {
    return (
      <main className="bg-[#F7F8FA]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#0F1729]">Page Unavailable</h1>
          <p className="mt-3 text-[#65758B]">
            This support page is currently hidden by the administrator.
          </p>
          <Link to="/" className="primary-btn mt-6">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F8FA]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E5D72] hover:text-[#188B8B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="surface-card mt-6 rounded-[30px] overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_15%_0%,rgba(24,139,139,0.16),transparent_38%),linear-gradient(180deg,#FFFFFF_0%,#FCFEFF_100%)] px-6 py-8 sm:px-8 sm:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F9F8] px-4 py-2 text-sm font-semibold text-[#188B8B]">
              <ShieldCheck className="h-4 w-4" />
              Support Page
            </div>

            <h1 className="mt-5 text-4xl font-bold text-[#0F1729]">
              {page?.title || definition.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[#65758B]">
              {page?.summary || fallbackPage?.summary || "Information will appear here soon."}
            </p>
            {loading ? (
              <p className="mt-3 text-sm text-[#8A94A6]">Loading page content...</p>
            ) : null}
            {!loading && error ? (
              <p className="mt-3 text-sm text-[#8A94A6]">
                Showing the saved default content because the latest page data could not be loaded.
              </p>
            ) : null}
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {isFaqPage ? (
              visibleFaqItems.length ? (
                <div className="space-y-4">
                  {visibleFaqItems.map((item, index) => {
                    const isOpen = openFaqIndex === index;

                    return (
                      <div
                        key={`${pageKey}-faq-${index}`}
                        className="overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaqIndex((current) => (current === index ? -1 : index))
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                        >
                          <p className="text-base font-semibold leading-7 text-[#0F1729]">
                            {item.heading || `Question ${index + 1}`}
                          </p>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-[#65758B] transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen ? (
                          <div className="border-t border-[#E2E8F0] px-5 py-5">
                            <p className="text-sm leading-7 text-[#4E5D72]">
                              {item.content || "Answer will be added soon."}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#D8E6EC] bg-[#FBFCFD] px-5 py-8 text-center text-sm text-[#65758B]">
                  No FAQ entries have been added for this page yet.
                </div>
              )
            ) : visibleItems.length ? (
              <div className="space-y-4">
                {visibleItems.map((item, index) => (
                  <div
                    key={`${pageKey}-${index}`}
                    className="rounded-[22px] border border-[#E2E8F0] bg-white px-5 py-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-[#EAFBFB] p-1.5 text-[#188B8B]">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-[#4E5D72]">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#D8E6EC] bg-[#FBFCFD] px-5 py-8 text-center text-sm text-[#65758B]">
                No content has been added for this page yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
