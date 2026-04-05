export const ADMIN_RESULT_STATUS_META = {
  Submitted: {
    label: "Submitted",
    badgeClass: "border-[#D7E4EA] bg-[#F8FBFC] text-[#4E5D72]",
    dotClass: "bg-[#94A3B8]",
  },
  "Pending Approval": {
    label: "Pending Approval",
    badgeClass: "border-[#F4DCA8] bg-[#FFF9EE] text-[#B86D00]",
    dotClass: "bg-[#F59F0A]",
  },
  Approved: {
    label: "Approved",
    badgeClass: "border-[#BEE7D1] bg-[#F1FCF5] text-[#1D7D46]",
    dotClass: "bg-[#22C55E]",
  },
  Completed: {
    label: "Completed",
    badgeClass: "border-[#BEE7D1] bg-[#F1FCF5] text-[#1D7D46]",
    dotClass: "bg-[#22C55E]",
  },
  Published: {
    label: "Published",
    badgeClass: "border-[#BEE7D1] bg-[#F1FCF5] text-[#1D7D46]",
    dotClass: "bg-[#22C55E]",
  },
  Incomplete: {
    label: "Incomplete",
    badgeClass: "border-[#F5D0D0] bg-[#FFF5F5] text-[#B42318]",
    dotClass: "bg-[#EF4444]",
  },
  "Review Required": {
    label: "Review Required",
    badgeClass: "border-[#D7E4EA] bg-[#F5F8FB] text-[#1D4ED8]",
    dotClass: "bg-[#2563EB]",
  },
};

export const getAdminResultStatusMeta = (status) =>
  ADMIN_RESULT_STATUS_META[status] || ADMIN_RESULT_STATUS_META.Submitted;

export const formatAdminDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatScoreValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(1);
};

export const normalizeAdminReviewData = (raw = {}) => {
  const sectionBreakdown = Array.isArray(raw.sectionBreakdown)
    ? raw.sectionBreakdown
    : [];

  return {
    ...raw,
    student: raw.student || {},
    summary: raw.summary || {},
    sectionBreakdown,
    analysis: {
      reviewSummary: raw.analysis?.reviewSummary || {},
      strengths: Array.isArray(raw.analysis?.strengths) ? raw.analysis.strengths : [],
      careers: Array.isArray(raw.analysis?.careers) ? raw.analysis.careers : [],
      personalityType: raw.analysis?.personalityType || null,
      testResults: Array.isArray(raw.analysis?.testResults)
        ? raw.analysis.testResults
        : [],
    },
    actions: raw.actions || {},
  };
};
