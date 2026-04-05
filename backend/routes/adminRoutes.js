import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import {
  getAdminDashboard,
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
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAdminUsers);
router.patch("/users/:userId", patchAdminUser);
router.delete("/users/:userId", deleteAdminUser);
router.get("/payments", getAdminPayments);
router.get("/submissions", getAdminSubmissions);
router.get("/submissions/:userId", getAdminSubmissionDetail);
router.get("/results", getAdminResults);
router.patch("/results/:userId/approve", approveAdminResult);
router.delete("/results/:userId", deleteAdminResult);
router.get("/analytics", getAdminAnalytics);

export default router;
