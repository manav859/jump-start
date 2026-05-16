import express from "express";
import { protect } from "../middleware/auth.js";
import {
  init,
  getResults,
  getResultDetail,
  updateResults,
  getTestProgress,
  patchTestProgress,
  postTestSubmit,
  selectPackage,
  purchasePackage,
  getCurrentPackage,
  getProfile,
  updateProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/init", protect, init);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.get("/profile/student", protect, getStudentProfile);
router.put("/profile/student", protect, updateStudentProfile);
router.get("/package/current", protect, getCurrentPackage);
router.post("/package/purchase", protect, purchasePackage);
router.patch("/package/select", protect, selectPackage);
router.get("/results", protect, getResults);
router.get("/results/:reportId", protect, getResultDetail);
router.patch("/results", protect, updateResults);
router.get("/test-progress", protect, getTestProgress);
router.patch("/test-progress", protect, patchTestProgress);
router.post("/test-submit", protect, postTestSubmit);

export default router;
