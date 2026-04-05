import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleAlert,
  Clock3,
  FileText,
  LaptopMinimal,
  ShieldCheck,
} from "lucide-react";
import api from "../api/api";

const timingRules = [
  "Each section is timed individually.",
  "Your progress is saved automatically after each answer.",
  "The timer continues from where you left off if you resume later.",
  "Finish every section before submitting the final assessment.",
];

const technicalRequirements = [
  "Use a stable internet connection for the smoothest experience.",
  "Keep your browser updated to the latest version.",
  "Desktop or laptop is recommended, but mobile is supported.",
  "Avoid opening extra tabs or pop-up blockers during the test.",
];

const importantRules = [
  "Answer honestly. There are no right or wrong answers for many sections.",
  "Once your final assessment is submitted, it will be used to generate your report.",
  "Do not refresh the page repeatedly during a section.",
  "Take the test in a calm environment without distractions.",
];

export default function Pretest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sections, setSections] = useState([]);
  const [packageInfo, setPackageInfo] = useState(null);
  const [checks, setChecks] = useState({
    connection: false,
    rules: false,
  });

  useEffect(() => {
    Promise.all([api.get("/v1/user/package/current"), api.get("/v1/user/test-progress")])
      .then(([pkgRes]) => {
        setPackageInfo(pkgRes?.data?.data?.package || null);
        setSections(pkgRes?.data?.data?.sections || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.msg || "Failed to load pre-test instructions.");
      })
      .finally(() => setLoading(false));
  }, []);

  const totalQuestions = useMemo(
    () => sections.reduce((sum, section) => sum + Number(section.totalQuestions || 0), 0),
    [sections]
  );

  const totalDuration = useMemo(
    () => sections.reduce((sum, section) => sum + Number(section.durationMinutes || 0), 0),
    [sections]
  );

  const sectionNames = useMemo(
    () => sections.map((section) => section.title).join(", "),
    [sections]
  );

  const canStart = checks.connection && checks.rules && sections.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-[#65758B]">Loading pre-test instructions...</p>
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold text-[#0F1729]">
            Test Setup Unavailable
          </h2>
          <p className="mt-3 text-[#65758B]">
            {error || "We could not load your purchased assessment right now."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard", { replace: true })}
            className="mt-6 rounded-xl bg-[#188B8B] px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#188B8B]">
            Pre-Test Instructions
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#0F1729] sm:text-4xl">
            Before You Begin
          </h1>
          <p className="mt-2 text-base text-[#65758B]">
            Please review these important instructions carefully before starting
            your assessment.
          </p>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#E1E7EF] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-[#0F1729]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="w-full">
                <h2 className="text-xl font-semibold text-[#0F1729]">Test Overview</h2>
                <div className="mt-5 space-y-3 text-sm text-[#65758B]">
                  <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-3">
                    <span>Total Sections</span>
                    <span className="font-semibold text-[#0F1729]">{sections.length} Sections</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-3">
                    <span>Total Questions</span>
                    <span className="font-semibold text-[#0F1729]">{totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] pb-3">
                    <span>Total Duration</span>
                    <span className="font-semibold text-[#0F1729]">{totalDuration} Minutes</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Sections</span>
                    <span className="max-w-[60%] text-right font-semibold text-[#0F1729]">
                      {sectionNames}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E1E7EF] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-[#F59F0A]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#0F1729]">Timing & Progress</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#65758B]">
                  {timingRules.map((rule) => (
                    <li key={rule}>• {rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E1E7EF] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-50 p-3 text-[#188B8B]">
                <LaptopMinimal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#0F1729]">Technical Requirements</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#65758B]">
                  {technicalRequirements.map((rule) => (
                    <li key={rule}>• {rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#B9E5E5] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#0F1729]">Important Rules</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#65758B]">
                  {importantRules.map((rule) => (
                    <li key={rule}>• {rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-[#E1E7EF] bg-white p-5 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks.connection}
              onChange={(e) =>
                setChecks((prev) => ({ ...prev, connection: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border border-[#188B8B] text-[#188B8B] focus:ring-[#188B8B]"
            />
            <span className="text-sm text-[#0F1729]">
              I have checked my internet connection and browser compatibility.
            </span>
          </label>
          <label className="mt-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks.rules}
              onChange={(e) =>
                setChecks((prev) => ({ ...prev, rules: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border border-[#188B8B] text-[#188B8B] focus:ring-[#188B8B]"
            />
            <span className="text-sm text-[#0F1729]">
              I have read and understood all the instructions and rules.
            </span>
          </label>
        </div>

        {error ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => navigate("/pretest/sections")}
          disabled={!canStart}
          className="mt-6 w-full rounded-xl bg-[#F6C465] px-6 py-3.5 font-semibold text-[#0F1729] transition hover:bg-[#EDB84A] disabled:cursor-not-allowed disabled:bg-[#F6DCA1] disabled:text-[#8A7449]"
        >
          I'm Ready to Start
        </button>

        <p className="mt-3 text-sm text-[#65758B]">
          Package:{" "}
          <span className="font-semibold text-[#0F1729]">
            {packageInfo?.title || "Selected assessment"}
          </span>
        </p>
      </div>
    </div>
  );
}
