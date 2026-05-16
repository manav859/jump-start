import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import {
  getAdminDashboard,
  getAdminNotifications,
  getAdminUsers,
  patchAdminUser,
  deleteAdminUser,
  getAdminPayments,
  getAdminSubmissions,
  getAdminSubmissionDetail,
  getAdminResults,
  getAdminAnalytics,
  approveAdminResult,
  deleteAdminResult,
  getManualReviewItems,
  submitManualDecision,
  finalizeManualReview,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getAdminDashboard);
router.get("/notifications", getAdminNotifications);
router.get("/users", getAdminUsers);
router.patch("/users/:userId", patchAdminUser);
router.delete("/users/:userId", deleteAdminUser);
router.get("/payments", getAdminPayments);
router.get("/submissions", getAdminSubmissions);
router.get("/submissions/:userId", getAdminSubmissionDetail);
router.get("/results", getAdminResults);
router.patch("/results/:userId/approve", approveAdminResult);
router.delete("/results/:userId", deleteAdminResult);
// Manual review queue for Section 4 image/diagram items. :reportId here is
// the same value used by /submissions/:reportId and /results/:reportId — the
// per-attempt assessmentReport sub-document id.
router.get("/results/:reportId/manual-review", getManualReviewItems);
router.patch(
  "/results/:reportId/manual-review/:questionId",
  submitManualDecision
);
router.post(
  "/results/:reportId/manual-review/complete",
  finalizeManualReview
);
router.get("/analytics", getAdminAnalytics);

export default router;
