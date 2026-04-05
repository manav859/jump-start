import { CheckCircle2, ClipboardCheck, Percent, Trophy } from "lucide-react";
import { formatScoreValue } from "../../data/adminReview";
import ResultStatusBadge from "./ResultStatusBadge";

const summaryItems = (summary = {}) => [
  {
    key: "overallScore",
    label: "Overall Score",
    value: `${formatScoreValue(summary.overallScore)} / ${formatScoreValue(
      summary.maxScore
    )}`,
    icon: Trophy,
    accent: "bg-[#EAFBFB] text-[#188B8B]",
  },
  {
    key: "percentage",
    label: "Percentage",
    value: `${formatScoreValue(summary.percentage)}%`,
    icon: Percent,
    accent: "bg-[#FFF6DF] text-[#F59F0A]",
  },
  {
    key: "completionStatus",
    label: "Completion Status",
    value: summary.completionStatus || "Pending",
    icon: ClipboardCheck,
    accent: "bg-[#F4F8FF] text-[#3B82F6]",
  },
  {
    key: "completedSections",
    label: "Completed Sections",
    value: `${summary.completedSections ?? 0} / ${summary.totalSections ?? 0}`,
    icon: CheckCircle2,
    accent: "bg-[#F1FCF5] text-[#16A34A]",
  },
];

export default function OverallScoreSummaryCard({ summary }) {
  return (
    <section className="surface-card rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#188B8B]">
            Overall Result Summary
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#0F1729]">Review Snapshot</h2>
        </div>
        <ResultStatusBadge status={summary?.statusLabel} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {summaryItems(summary).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="rounded-[22px] border border-[#E5EEF2] bg-white px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-2.5 ${item.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A94A6]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#0F1729]">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
