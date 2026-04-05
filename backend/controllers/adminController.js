import User from "../models/User.js";
import AssessmentConfig from "../models/AssessmentConfig.js";
import {
  getResultPublicationState,
  RESULT_PUBLICATION_STATUS,
} from "../utils/resultApproval.js";
import {
  getStoredAssessmentReports,
  syncLegacyStateFromReports,
} from "../utils/assessmentReports.js";

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortAgo = (d) => {
  if (!d) return "Never";
  const now = Date.now();
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return "Never";
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const monthKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleString("en-IN", { month: "short" });
};

const getConfigLookup = (cfg) => {
  const map = new Map();
  for (const p of cfg?.packages || []) map.set(p.id, p);
  return map;
};

const buildPayments = (users, packageMap) => {
  const rows = [];
  for (const u of users) {
    const purchases = Array.isArray(u.purchasedPackages) ? u.purchasedPackages : [];
    purchases.forEach((pkgId, idx) => {
      const pkg = packageMap.get(pkgId);
      const amount = Number(pkg?.amount || 0);
      rows.push({
        id: `${String(u._id).slice(-6).toUpperCase()}-${String(pkgId).toUpperCase()}-${idx + 1}`,
        userId: String(u._id),
        name: u.name || "Unknown",
        email: u.email || "",
        package: pkg?.title || pkgId,
        amount,
        amountLabel: fmtCurrency(amount),
        method: idx % 2 === 0 ? "UPI" : "Card",
        status: "Completed",
        date: u.updatedAt || u.createdAt,
      });
    });
  }
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const toInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "NA";

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ success: false, msg: "Admin access required" });
    return false;
  }
  return true;
};

const getPublicationStatusLabel = (status) => {
  if (status === RESULT_PUBLICATION_STATUS.PENDING_APPROVAL) {
    return "Pending Approval";
  }
  if (status === RESULT_PUBLICATION_STATUS.APPROVED) {
    return "Published";
  }
  return "Submitted";
};

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const roundScoreValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number.isInteger(numeric) ? numeric : Number(numeric.toFixed(2));
};

const getQuestionPossibleValue = (question = {}) => {
  const weight = toFiniteNumber(question.weight, 1);
  if (String(question.type || "").toLowerCase() === "likert") {
    return 5 * weight;
  }
  return weight;
};

const getConfiguredSectionPossibleValue = (section = {}) =>
  (Array.isArray(section.questions) ? section.questions : []).reduce(
    (sum, question) => sum + getQuestionPossibleValue(question),
    0
  );

const getConfiguredSectionQuestionCount = (section = {}) =>
  Array.isArray(section.questions) ? section.questions.length : 0;

const buildFallbackSectionBreakdown = (profile = {}) =>
  (Array.isArray(profile.testResults) ? profile.testResults : []).map((section) => ({
    sectionId: section.sectionId,
    title: section.sectionName || section.testName || "Section",
    score: Number(section.score || 0),
    maxScore: Number(section.maxScore || 100),
    average: null,
    percentage: Number(section.score || 0),
    answeredCount: 0,
    totalQuestions: 0,
    status: "completed",
    interpretation: section.interpretation || "",
    careerImplication: "",
    scoringType: "",
    answerType: "",
    scoreType: "",
    questionNumbers: [],
    questionRangeLabel: "",
    subsections: [],
  }));

const buildAdminReviewPayload = (user, cfg, reportOverride = null) => {
  const packageMap = getConfigLookup(cfg);
  const report =
    reportOverride ||
    getStoredAssessmentReports(user, packageMap)[0] || {
      _id: String(user._id),
      packageId: user.selectedPackageId || "",
      packageTitle: "",
      attemptNumber: Math.max(1, Number(user.testsCompleted || 1)),
      profile: user.resultProfile || {},
      publication: getResultPublicationState(user),
    };
  const publication = report.publication || getResultPublicationState(user);
  const profile = report.profile || user.resultProfile || {};
  const pkg = packageMap.get(report.packageId || user.selectedPackageId || "");
  const storedBreakdown =
    Array.isArray(profile.sectionBreakdown) && profile.sectionBreakdown.length
      ? profile.sectionBreakdown
      : buildFallbackSectionBreakdown(profile);
  const knownSectionIds = new Set(
    storedBreakdown.map((section) => Number(section.sectionId))
  );
  const pendingSections = Array.isArray(pkg?.sections)
    ? pkg.sections
        .filter((section) => section.enabled !== false)
        .filter((section) => !knownSectionIds.has(Number(section.sectionId)))
        .map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          score: 0,
          maxScore: roundScoreValue(getConfiguredSectionPossibleValue(section)),
          average: null,
          percentage: 0,
          answeredCount: 0,
          totalQuestions: getConfiguredSectionQuestionCount(section),
          status: "incomplete",
          interpretation: "Section not completed",
          careerImplication: "",
          scoringType: section.scoringType || "",
          answerType: "",
          scoreType: "",
          questionNumbers: [],
          questionRangeLabel: "",
          subsections: [],
        }))
    : [];
  const sectionBreakdown = [...storedBreakdown, ...pendingSections].sort(
    (a, b) => Number(a.sectionId || 0) - Number(b.sectionId || 0)
  );
  const completedSections = sectionBreakdown.filter(
    (section) => section.status !== "incomplete"
  ).length;
  const totalSections =
    Number(profile.totalTestsCount || 0) || sectionBreakdown.length || 0;
  const scoreTotals = sectionBreakdown.reduce(
    (totals, section) => ({
      score: totals.score + toFiniteNumber(section.score, 0),
      maxScore: totals.maxScore + toFiniteNumber(section.maxScore, 0),
    }),
    { score: 0, maxScore: 0 }
  );
  const overallScore = roundScoreValue(
    profile.overallScore != null ? Number(profile.overallScore) : scoreTotals.score
  );
  const hasSectionPercentages = sectionBreakdown.some((section) =>
    Number.isFinite(toFiniteNumber(section.percentage, NaN))
  );
  const inferredPercentStyleSummary =
    profile?.metadata?.overallMaxScore == null &&
    Number.isFinite(toFiniteNumber(profile?.overallScore, NaN)) &&
    hasSectionPercentages;
  const maxScore = roundScoreValue(
    inferredPercentStyleSummary
      ? 100
      : profile?.metadata?.overallMaxScore ??
          scoreTotals.maxScore ??
          Number(profile.totalTestsCount || 0) ??
          100
  );
  const percentage =
    inferredPercentStyleSummary
      ? roundScoreValue(overallScore)
      : maxScore > 0
      ? roundScoreValue((overallScore / maxScore) * 100)
      : roundScoreValue(Number(profile.overallScore || 0));
  const strongestSignals = Array.isArray(profile.reviewSummary?.strongestSignals)
    ? profile.reviewSummary.strongestSignals.filter(Boolean)
    : [];
  const topCareerTitles = Array.isArray(profile.reviewSummary?.topCareerTitles)
    ? profile.reviewSummary.topCareerTitles.filter(Boolean)
    : [];
  const observations = Array.isArray(profile.reviewSummary?.observations)
    ? profile.reviewSummary.observations.filter(Boolean)
    : [];
  const reviewStatusLabel =
    completedSections >= totalSections && totalSections > 0
      ? "Ready for Review"
      : "Incomplete Submission";
  const completionObservation =
    completedSections >= totalSections && totalSections > 0
      ? "All configured sections were completed and are ready for admin review."
      : "Some sections are incomplete and should be reviewed before publication.";
  const normalizedObservations = [
    ...observations.filter(
      (item) =>
        !/all available sections were completed|all configured sections were completed|some sections .* incomplete/i.test(
          item
        )
    ),
    completionObservation,
  ];

  return {
    id: String(report._id || user._id),
    userId: String(user._id),
    packageId: report.packageId || user.selectedPackageId || "",
    status: publication.status,
    statusLabel: getPublicationStatusLabel(publication.status),
    student: {
      name: user.name || "Unknown",
      referenceId: `JS-${String(user._id).slice(-8).toUpperCase()}`,
      email: user.email || "",
      phone: user.mobile || "",
      subscription: user.subscription || "Basic",
      testName:
        report.packageTitle ||
        pkg?.title ||
        report.packageId ||
        user.selectedPackageId ||
        "Assessment",
      testType: user.subscription || "Basic",
      submittedAt:
        publication.submittedAt || report.updatedAt || user.updatedAt || user.createdAt,
      attemptLabel: `Attempt ${Math.max(1, Number(report.attemptNumber || user.testsCompleted || 1))}`,
    },
    summary: {
      overallScore,
      maxScore,
      percentage,
      completionStatus:
        completedSections >= totalSections && totalSections > 0
          ? "Completed"
          : "Incomplete",
      completedSections,
      totalSections,
      statusLabel: getPublicationStatusLabel(publication.status),
      reportsReady: Number(user.reportsReady || 0),
    },
    sectionBreakdown,
    analysis: {
      reviewSummary: {
        statusLabel: reviewStatusLabel,
        strongestSignals:
          strongestSignals.length > 0
            ? strongestSignals
            : (profile.strengths || []).slice(0, 3).map((item) => item.name),
        topCareerTitles:
          topCareerTitles.length > 0
            ? topCareerTitles
            : (profile.careerRecommendations || [])
                .slice(0, 3)
                .map((item) => item.title),
        observations:
          normalizedObservations.length > 0
            ? normalizedObservations
            : (profile.strengths || []).length
                ? [
                    `Top strength: ${profile.strengths[0].name} (${profile.strengths[0].value}%).`,
                    completionObservation,
                  ]
                : [completionObservation],
      },
      strengths: Array.isArray(profile.strengths) ? profile.strengths : [],
      careers: Array.isArray(profile.careerRecommendations)
        ? profile.careerRecommendations
        : [],
      personalityType: profile.personalityType || null,
      testResults: Array.isArray(profile.testResults) ? profile.testResults : [],
    },
    actions: {
      canApprove: publication.status === RESULT_PUBLICATION_STATUS.PENDING_APPROVAL,
      canDelete: publication.status !== RESULT_PUBLICATION_STATUS.NOT_SUBMITTED,
      canPublish: publication.status === RESULT_PUBLICATION_STATUS.PENDING_APPROVAL,
    },
  };
};

const findMutableReportSubdocument = (user, reportId) => {
  if (!Array.isArray(user?.assessmentReports)) return null;
  if (typeof user.assessmentReports.id === "function") {
    const report = user.assessmentReports.id(reportId);
    if (report) return report;
  }
  return user.assessmentReports.find(
    (report) => String(report?._id || "") === String(reportId || "")
  );
};

const getUserByReportId = async ({
  reportId,
  select = "",
  lean = false,
}) => {
  let query = User.findOne({
    role: { $ne: "admin" },
    "assessmentReports._id": reportId,
  });
  if (select) query = query.select(select);
  if (lean) query = query.lean();

  let user = await query;
  if (user) {
    return { user, isLegacyFallback: false };
  }

  query = User.findOne({ _id: reportId, role: { $ne: "admin" } });
  if (select) query = query.select(select);
  if (lean) query = query.lean();
  user = await query;

  if (!user) {
    return { user: null, isLegacyFallback: false };
  }

  if (Array.isArray(user.assessmentReports) && user.assessmentReports.length > 0) {
    return { user: null, isLegacyFallback: false };
  }

  const publication = getResultPublicationState(user);
  if (!publication.hasProfileData) {
    return { user: null, isLegacyFallback: false };
  }

  return { user, isLegacyFallback: true };
};

// GET /api/v1/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    const [users, cfg] = await Promise.all([User.find({ role: { $ne: "admin" } }).lean(), AssessmentConfig.getOrCreateDefault()]);
    const packageMap = getConfigLookup(cfg);
    const payments = buildPayments(users, packageMap);
    const completedTests = users.reduce((sum, u) => sum + Number(u.testsCompleted || 0), 0);
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const now = new Date();
    const growthData = [];
    const revenueData = [];
    for (let i = 5; i >= 0; i -= 1) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(dt);
      const label = dt.toLocaleString("en-IN", { month: "short" });
      const registered = users.filter((u) => monthKey(u.createdAt || now) === key).length;
      const monthRevenue = payments
        .filter((p) => monthKey(p.date || now) === key)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      growthData.push({ name: label, value: registered });
      revenueData.push({ name: label, value: monthRevenue });
    }

    const recentActivities = [
      ...payments.slice(0, 5).map((p, idx) => ({
        id: `pay-${idx}`,
        time: shortAgo(p.date),
        user: p.name,
        action: `Payment received (${p.package})`,
        status: "Completed",
      })),
      ...users
        .filter((u) => Number(u.testsCompleted || 0) > 0)
        .slice(0, 5)
        .map((u, idx) => ({
          id: `test-${idx}`,
          time: shortAgo(u.updatedAt),
          user: u.name || "Unknown",
          action: "Completed test",
          status: "Completed",
        })),
    ]
      .sort((a, b) => {
        const av = String(a.time).includes("s") ? 1 : String(a.time).includes("m") ? 2 : 3;
        const bv = String(b.time).includes("s") ? 1 : String(b.time).includes("m") ? 2 : 3;
        return av - bv;
      })
      .slice(0, 8);

    return res.status(200).json({
      success: true,
      data: {
        kpiData: [
          { title: "Total Users", value: users.length },
          { title: "Tests Purchased", value: payments.length },
          { title: "Completed Tests", value: completedTests },
          { title: "Revenue", value: fmtCurrency(revenue) },
        ],
        growthData,
        revenueData,
        recentActivities,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load admin dashboard" });
  }
};

// GET /api/v1/admin/users
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("name email mobile testsCompleted subscription lastLoginAt isSuspended createdAt selectedPackageId")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: users.map((u) => ({
        id: String(u._id),
        name: u.name || "Unknown",
        email: u.email || "",
        phone: u.mobile || "",
        initials: toInitials(u.name),
        tests: Number(u.testsCompleted || 0),
        subscription: u.subscription || "Basic",
        lastLogin: shortAgo(u.lastLoginAt),
        status: u.isSuspended ? "Suspended" : "Active",
        packageId: u.selectedPackageId || "",
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load users" });
  }
};

// PATCH /api/v1/admin/users/:userId
export const patchAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, mobile, subscription, status } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (mobile !== undefined) update.mobile = String(mobile).trim();
    if (subscription !== undefined) update.subscription = subscription;
    if (status !== undefined) update.isSuspended = String(status) === "Suspended";
    const user = await User.findOneAndUpdate({ _id: userId, role: { $ne: "admin" } }, { $set: update }, { new: true })
      .select("name email mobile testsCompleted subscription lastLoginAt isSuspended selectedPackageId")
      .lean();
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });
    return res.status(200).json({
      success: true,
      data: {
        id: String(user._id),
        name: user.name || "Unknown",
        email: user.email || "",
        phone: user.mobile || "",
        initials: toInitials(user.name),
        tests: Number(user.testsCompleted || 0),
        subscription: user.subscription || "Basic",
        lastLogin: shortAgo(user.lastLoginAt),
        status: user.isSuspended ? "Suspended" : "Active",
        packageId: user.selectedPackageId || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to update user" });
  }
};

// DELETE /api/v1/admin/users/:userId
export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndDelete({ _id: userId, role: { $ne: "admin" } }).lean();
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });
    return res.status(200).json({ success: true, data: { id: String(user._id) } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to delete user" });
  }
};

// GET /api/v1/admin/payments
export const getAdminPayments = async (req, res) => {
  try {
    const [users, cfg] = await Promise.all([
      User.find({ role: { $ne: "admin" } }).select("name email purchasedPackages updatedAt createdAt").lean(),
      AssessmentConfig.getOrCreateDefault(),
    ]);
    const packageMap = getConfigLookup(cfg);
    const payments = buildPayments(users, packageMap);
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonth = payments.filter((p) => new Date(p.date) >= startOfMonth).reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalRevenueLabel: fmtCurrency(totalRevenue),
          thisMonth,
          thisMonthLabel: fmtCurrency(thisMonth),
          pendingAmount: 0,
          pendingAmountLabel: fmtCurrency(0),
          refundedAmount: 0,
          refundedAmountLabel: fmtCurrency(0),
        },
        rows: payments.map((p) => ({
          ...p,
          dateLabel: fmtDate(p.date),
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load payments" });
  }
};

// GET /api/v1/admin/submissions
export const getAdminSubmissions = async (req, res) => {
  try {
    const [users, cfg] = await Promise.all([
      User.find({ role: { $ne: "admin" } })
        .select(
          "name email subscription selectedPackageId resultProfile resultPublication assessmentReports testsCompleted updatedAt createdAt"
        )
        .lean(),
      AssessmentConfig.getOrCreateDefault(),
    ]);
    const packageMap = getConfigLookup(cfg);

    const rows = users
      .flatMap((user) =>
        getStoredAssessmentReports(user, packageMap).map((report) => ({
          id: String(report._id),
          userId: String(user._id),
          name: user.name || "Unknown",
          email: user.email || "",
          initials: toInitials(user.name),
          type:
            report.packageTitle || report.packageId || user.subscription || "Assessment",
          date:
            report.publication.submittedAt ||
            report.updatedAt ||
            user.updatedAt ||
            user.createdAt,
          duration: "N/A",
          status: getPublicationStatusLabel(report.publication.status),
          canApprove:
            report.publication.status ===
            RESULT_PUBLICATION_STATUS.PENDING_APPROVAL,
        }))
      )
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((row) => ({
        ...row,
        date: fmtDate(row.date),
      }));

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load submissions" });
  }
};

// GET /api/v1/admin/results
export const getAdminResults = async (req, res) => {
  try {
    const [users, cfg] = await Promise.all([
      User.find({ role: { $ne: "admin" } })
        .select(
          "name email subscription selectedPackageId resultProfile resultPublication assessmentReports updatedAt"
        )
        .lean(),
      AssessmentConfig.getOrCreateDefault(),
    ]);
    const packageMap = getConfigLookup(cfg);

    const rows = users
      .flatMap((user) =>
        getStoredAssessmentReports(user, packageMap)
          .filter(
            (report) =>
              report.publication.status === RESULT_PUBLICATION_STATUS.APPROVED &&
              report.profile?.overallScore != null
          )
          .map((report) => ({
            id: String(report._id),
            userId: String(user._id),
            name: user.name || "Unknown",
            email: user.email || "",
            initials: toInitials(user.name),
            type:
              report.packageTitle || report.packageId || user.subscription || "Assessment",
            date: report.publication.approvedAt || report.updatedAt || user.updatedAt,
            score: `${Number(report.profile?.overallScore || 0)}/100`,
            percentile: String(report.profile?.overallPercentile || "").replace("Top ", ""),
            rawResult: report.profile || {},
          }))
      )
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((row) => ({
        ...row,
        date: fmtDate(row.date),
      }));
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load results" });
  }
};

// GET /api/v1/admin/submissions/:reportId
export const getAdminSubmissionDetail = async (req, res) => {
  try {
    const { userId: reportId } = req.params;
    const cfg = await AssessmentConfig.getOrCreateDefault();
    const packageMap = getConfigLookup(cfg);
    const { user } = await getUserByReportId({
      reportId,
      select:
        "name email mobile subscription selectedPackageId testsCompleted reportsReady resultProfile resultPublication assessmentReports updatedAt createdAt",
      lean: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, msg: "Submission not found" });
    }

    const report =
      getStoredAssessmentReports(user, packageMap).find(
        (item) => String(item._id) === String(reportId || "")
      ) || null;

    return res.status(200).json({
      success: true,
      data: buildAdminReviewPayload(user, cfg, report),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to load submission detail",
    });
  }
};

// PATCH /api/v1/admin/results/:reportId/approve
export const approveAdminResult = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { userId: reportId } = req.params;
    const { user, isLegacyFallback } = await getUserByReportId({
      reportId,
      select:
        "role testsCompleted reportsReady topCareers resultProfile resultPublication assessmentReports",
      lean: false,
    });
    if (!user) {
      return res.status(404).json({ success: false, msg: "Submission not found" });
    }

    const report = isLegacyFallback
      ? {
          _id: String(user._id),
          profile: user.resultProfile || {},
          publication: getResultPublicationState(user),
        }
      : findMutableReportSubdocument(user, reportId);
    const normalizedReport = getStoredAssessmentReports(user).find(
      (item) => String(item._id) === String(reportId || "")
    );

    if (!report || !normalizedReport) {
      return res.status(404).json({ success: false, msg: "Submission not found" });
    }

    const publication =
      normalizedReport.publication || getResultPublicationState(user);
    if (!normalizedReport.profile) {
      return res.status(400).json({ success: false, msg: "No generated result available for approval" });
    }

    const nextPublication = {
      status: RESULT_PUBLICATION_STATUS.APPROVED,
      submittedAt: publication.submittedAt || new Date(),
      approvedAt: new Date(),
      approvedByName: req.user.name || req.user.email || "Admin",
    };

    if (isLegacyFallback) {
      user.resultPublication = nextPublication;
    } else {
      report.publication = nextPublication;
      report.updatedAt = new Date();
    }

    syncLegacyStateFromReports(user);
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: String(reportId),
        status: "Published",
        approvedAt: nextPublication.approvedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to approve result" });
  }
};

// DELETE /api/v1/admin/results/:reportId
export const deleteAdminResult = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { userId: reportId } = req.params;
    const { user, isLegacyFallback } = await getUserByReportId({
      reportId,
      select:
        "role testsCompleted reportsReady topCareers resultProfile resultPublication assessmentReports",
      lean: false,
    });
    if (!user) {
      return res.status(404).json({ success: false, msg: "Submission not found" });
    }

    if (isLegacyFallback) {
      user.resultProfile = {
        overallScore: null,
        overallPercentile: "",
        completedTestsCount: 0,
        totalTestsCount: 0,
        careerPathwaysCount: 0,
        testResults: [],
        sectionBreakdown: [],
        strengths: [],
        careerRecommendations: [],
        personalityType: {
          code: "",
          title: "",
          description: "",
          traits: [],
        },
        reviewSummary: {
          statusLabel: "",
          strongestSignals: [],
          topCareerTitles: [],
          observations: [],
        },
      };
      user.resultPublication = {
        status: RESULT_PUBLICATION_STATUS.NOT_SUBMITTED,
        submittedAt: null,
        approvedAt: null,
        approvedByName: "",
      };
      user.topCareers = [];
      user.reportsReady = 0;
    } else {
      const nextReports = (user.assessmentReports || []).filter(
        (report) => String(report?._id || "") !== String(reportId || "")
      );
      user.assessmentReports = nextReports;
      syncLegacyStateFromReports(user);
    }

    user.testsCompleted = Math.max(0, Number(user.testsCompleted || 0) - 1);
    await user.save();

    return res.status(200).json({
      success: true,
      data: { id: String(reportId), deleted: true },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to delete result" });
  }
};

// GET /api/v1/admin/analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const [users, cfg] = await Promise.all([User.find({ role: { $ne: "admin" } }).lean(), AssessmentConfig.getOrCreateDefault()]);
    const packageMap = getConfigLookup(cfg);
    const payments = buildPayments(users, packageMap);

    const registered = users.length;
    const started = users.filter((u) => Object.keys(u.testProgress?.answers || {}).length > 0).length;
    const completed = users.filter((u) => Number(u.testsCompleted || 0) > 0).length;
    const paid = users.filter((u) => (u.purchasedPackages || []).length > 0).length;
    const counselling = users.filter((u) => Number(u.counsellingSessions || 0) > 0).length;

    const completionByPackage = (cfg.packages || []).map((p) => {
      const buyers = users.filter((u) => (u.purchasedPackages || []).includes(p.id));
      const done = buyers.filter((u) => Number(u.testsCompleted || 0) > 0).length;
      return { name: p.title, started: buyers.length, completed: done };
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const revenueByPackage = (cfg.packages || []).map((p) => {
      const amount = payments.filter((pm) => pm.package === p.title).reduce((s, pm) => s + Number(pm.amount || 0), 0);
      const value = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
      return { name: p.title, value };
    });

    const regMap = new Map();
    users.forEach((u) => {
      const key = monthKey(u.createdAt || new Date());
      regMap.set(key, (regMap.get(key) || 0) + 1);
    });
    const regKeys = [...regMap.keys()].sort().slice(-7);
    const registrationTrend = regKeys.map((k) => ({ date: monthLabel(k), value: regMap.get(k) || 0 }));

    const careerCounts = new Map();
    users.forEach((u) => {
      const top = Array.isArray(u.resultProfile?.careerRecommendations) ? u.resultProfile.careerRecommendations : [];
      top.forEach((c) => {
        const title = c.title || "Unknown";
        careerCounts.set(title, (careerCounts.get(title) || 0) + 1);
      });
    });
    const careerPaths = [...careerCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const avgScoreUsers = users.filter((u) => u.resultProfile?.overallScore != null);
    const avgScore =
      avgScoreUsers.length > 0
        ? (avgScoreUsers.reduce((sum, u) => sum + Number(u.resultProfile?.overallScore || 0), 0) / avgScoreUsers.length).toFixed(1)
        : "0.0";

    return res.status(200).json({
      success: true,
      data: {
        funnel: { registered, started, completed, paid, counselling },
        completionData: completionByPackage,
        revenueDistribution: revenueByPackage,
        registrationTrend,
        careerPaths,
        performanceMetrics: [
          { metric: "Avg. Score", current: `${avgScore}/100`, previous: "-", change: "-", trend: "up" },
          { metric: "Users Completed", current: String(completed), previous: "-", change: "-", trend: "up" },
          { metric: "Payments", current: String(payments.length), previous: "-", change: "-", trend: "up" },
        ],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load analytics" });
  }
};
