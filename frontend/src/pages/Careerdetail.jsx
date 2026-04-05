import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LineChart,
  NotebookText,
  Sparkles,
} from "lucide-react";
import api from "../api/api";
import { getCareerDetailContent, matchCareerByTitle } from "../data/careerDetails";

const OUTLOOK_ITEMS = [
  { key: "marketDemand", label: "Market Demand" },
  { key: "jobSatisfaction", label: "Job Satisfaction" },
  { key: "workLifeBalance", label: "Work-Life Balance" },
];

const getStateCareer = (locationState) => {
  if (locationState?.career && typeof locationState.career === "object") {
    return locationState.career;
  }
  return null;
};

export default function Careerdetail() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const seededCareer = getStateCareer(location.state);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    hasResults: false,
    careerRecommendations: [],
  });

  useEffect(() => {
    api
      .get("/v1/user/results")
      .then((res) => {
        setData(res?.data?.data || {});
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load career details.");
      })
      .finally(() => setLoading(false));
  }, []);

  const requestedCareerTitle = searchParams.get("career") || seededCareer?.title || "";
  const selectedCareer = useMemo(() => {
    const matchedCareer = matchCareerByTitle(
      data.careerRecommendations || [],
      requestedCareerTitle
    );

    if (matchedCareer) return matchedCareer;
    if (seededCareer?.title) return seededCareer;
    return data.careerRecommendations?.[0] || null;
  }, [data.careerRecommendations, requestedCareerTitle, seededCareer]);

  const detail = useMemo(
    () => getCareerDetailContent(selectedCareer),
    [selectedCareer]
  );

  const topSkills = detail.skills.slice(0, 4);
  const hiddenSkillCount = Math.max(0, detail.skills.length - topSkills.length);
  const showBlockingError = Boolean(error) && !selectedCareer;

  if (loading && !selectedCareer) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <p className="text-[#65758B]">Loading career details...</p>
      </div>
    );
  }

  if (showBlockingError) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <div className="surface-card w-full max-w-xl rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">Career Detail Unavailable</h1>
          <p className="mt-3 text-[#65758B]">{error}</p>
          <Link to="/result" className="primary-btn mt-6">
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedCareer) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F8FA] px-4">
        <div className="surface-card w-full max-w-2xl rounded-[28px] p-8 text-center">
          <h1 className="text-3xl font-bold text-[#0F1729]">No Career Detail Yet</h1>
          <p className="mt-3 text-[#65758B]">
            Complete your assessment to unlock detailed career recommendations and
            explore them here.
          </p>
          <Link to="/result" className="primary-btn mt-6">
            Go to Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FA]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/result"
          className="inline-flex items-center gap-2 rounded-full border border-[#DFE7EE] bg-white px-4 py-2 text-sm font-semibold text-[#4E5D72] hover:border-[#C3D4DE] hover:bg-[#FBFCFD]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_340px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold leading-tight text-[#0F1729] sm:text-[2.7rem]">
                {detail.title}
              </h1>
              <span className="rounded-full bg-[#E2F8F7] px-4 py-2 text-sm font-semibold text-[#188B8B]">
                {detail.matchPercent}% Match
              </span>
            </div>

            <p className="mt-4 max-w-4xl text-base leading-8 text-[#65758B]">
              {detail.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[#157A7A] px-3 py-1 text-[11px] font-semibold text-white"
                >
                  {skill}
                </span>
              ))}
              {hiddenSkillCount ? (
                <span className="rounded-full bg-[#EEF4F7] px-3 py-1 text-[11px] font-semibold text-[#4E5D72]">
                  +{hiddenSkillCount} more
                </span>
              ) : null}
            </div>
          </div>

          <section className="surface-card rounded-[26px] border border-[#F4DCA8] bg-[linear-gradient(180deg,#FFF9EA_0%,#FFFFFF_100%)] p-6">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF1D3] text-[#F59F0A]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-[#4E5D72]">
              Ready to explore this career?
            </p>
            <Link to="/bookcounselling" className="primary-btn mt-4 flex w-full">
              Schedule a Call
            </Link>
            <p className="mt-3 text-center text-xs text-[#8A94A6]">
              Talk to a career counselor
            </p>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_340px]">
          <div className="space-y-6">
            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
                  <NotebookText className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">Career Overview</h2>
              </div>
              <p className="mt-4 text-sm leading-8 text-[#65758B]">{detail.overview}</p>
            </section>

            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FFF6DF] p-3 text-[#F59F0A]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F1729]">
                    Salary Range in India
                  </h2>
                  <p className="mt-1 text-sm text-[#8A94A6]">
                    Indicative range based on experience progression.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {detail.salaryBands.map((band) => (
                  <div
                    key={`${band.label}-${band.range}`}
                    className="rounded-[22px] border border-[#D5EDEF] bg-[#ECFCFC] px-5 py-5 text-center"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F8A9C]">
                      {band.label}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-[#0F1729]">{band.range}</p>
                    <p className="mt-2 text-xs font-medium text-[#8A94A6]">
                      {band.experience}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EEF7FF] p-3 text-[#188B8B]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">Key Responsibilities</h2>
              </div>

              <div className="mt-5 space-y-4">
                {detail.responsibilities.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAFBFB] text-xs font-bold text-[#188B8B]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-[#65758B]">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">
                  Required Skills & Technologies
                </h2>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {detail.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#157A7A] px-4 py-2 text-xs font-semibold text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FFF6DF] p-3 text-[#F59F0A]">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">Top Hiring Companies</h2>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {detail.companies.map((company) => (
                  <span
                    key={company}
                    className="rounded-full border border-[#DFE7EE] bg-white px-4 py-2 text-xs font-semibold text-[#4E5D72]"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">Education</h2>
              </div>

              <div className="mt-5 space-y-4">
                {detail.education.map((item) => (
                  <div key={item} className="flex gap-3">
                    <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#188B8B]" />
                    <p className="text-sm leading-7 text-[#65758B]">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[26px] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#EAFBFB] p-3 text-[#188B8B]">
                  <LineChart className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1729]">Career Outlook</h2>
              </div>

              <div className="mt-5 space-y-5">
                {OUTLOOK_ITEMS.map((item) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0F1729]">{item.label}</p>
                      <p className="text-sm font-semibold text-[#188B8B]">
                        {detail.outlook[item.key]}%
                      </p>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-[#DCE9EE]">
                      <div
                        className="h-2.5 rounded-full bg-[#188B8B]"
                        style={{ width: `${Math.min(100, detail.outlook[item.key] || 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[26px] border border-[#F4DCA8] bg-[linear-gradient(180deg,#FFF9EA_0%,#FFFFFF_100%)] p-6">
              <p className="text-2xl font-bold text-[#0F1729]">Need Guidance?</p>
              <p className="mt-3 text-sm leading-7 text-[#65758B]">
                Schedule a one-on-one session with our career counselors and get help
                turning this recommendation into a practical next step.
              </p>

              <div className="mt-5 space-y-3">
                {detail.guidancePoints.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF1D3] text-[#F59F0A]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-[#4E5D72]">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/bookcounselling" className="primary-btn mt-6 flex w-full gap-2">
                Schedule a Call
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
