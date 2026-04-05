export const STUDENT_RESULT_META = {
  purchase: {
    purchased: {
      label: "Purchased",
      className: "border-[#D4EEED] bg-[#EAFBFB] text-[#188B8B]",
    },
  },
  attempt: {
    not_attempted: {
      label: "Not Attempted",
      className: "border-[#E2E8F0] bg-[#F8FAFC] text-[#4E5D72]",
    },
    in_progress: {
      label: "In Progress",
      className: "border-[#F6D59B] bg-[#FFF9EE] text-[#B86D00]",
    },
    attempted: {
      label: "Attempted",
      className: "border-[#D7E4EA] bg-white text-[#4E5D72]",
    },
  },
  result: {
    not_submitted: {
      label: "Result Unavailable",
      className: "border-[#E2E8F0] bg-[#F8FAFC] text-[#4E5D72]",
    },
    pending_approval: {
      label: "Under Review",
      className: "border-[#F6D59B] bg-[#FFF9EE] text-[#B86D00]",
    },
    approved: {
      label: "Published",
      className: "border-[#CFEFDD] bg-[#F1FCF5] text-[#1D7D46]",
    },
  },
  action: {
    view_report: "View Report",
    continue_test: "Continue Test",
    result_pending: "Result Pending",
    start_test: "Start Test",
  },
};

export const formatStudentDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const normalizeStudentResultsPayload = (raw = {}) => ({
  hasResults: Boolean(raw.hasResults),
  resultStatus: raw.resultStatus || "not_submitted",
  submittedAt: raw.submittedAt || null,
  approvedAt: raw.approvedAt || null,
  estimatedReadyHours: raw.estimatedReadyHours ?? null,
  overallScore: raw.overallScore ?? null,
  overallPercentile: raw.overallPercentile || "",
  scoredTestsCount: Number(raw.scoredTestsCount || 0),
  completedTestsCount: Number(raw.completedTestsCount || 0),
  totalTestsCount: Number(raw.totalTestsCount || 0),
  careerPathwaysCount: Number(raw.careerPathwaysCount || 0),
  testResults: Array.isArray(raw.testResults) ? raw.testResults : [],
  strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
  careerRecommendations: Array.isArray(raw.careerRecommendations)
    ? raw.careerRecommendations
    : [],
  personalityType: raw.personalityType || null,
  tests: Array.isArray(raw.tests) ? raw.tests : [],
  testsSummary: raw.testsSummary || {
    totalPurchased: 0,
    attemptedCount: 0,
    inProgressCount: 0,
    pendingCount: 0,
    publishedCount: 0,
  },
  latestPublishedReportId: raw.latestPublishedReportId || "",
});

export const normalizeStudentReportPayload = (raw = {}) => ({
  hasAccess: Boolean(raw.hasAccess),
  resultStatus: raw.resultStatus || "not_submitted",
  submittedAt: raw.submittedAt || null,
  approvedAt: raw.approvedAt || null,
  estimatedReadyHours: raw.estimatedReadyHours ?? null,
  report: raw.report || null,
});

export const getResultMeta = (group, key) =>
  STUDENT_RESULT_META[group]?.[key] || {
    label: key || "-",
    className: "border-[#E2E8F0] bg-[#F8FAFC] text-[#4E5D72]",
  };

export const getPrimaryActionLabel = (actionKey) =>
  STUDENT_RESULT_META.action[actionKey] || "Open";
