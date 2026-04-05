import express from "express";
import {
  getPublicConfig,
  getPublicPackageSections,
  getPublicSectionQuestions,
  getAdminConfig,
  postAdminPackage,
  putAdminPackage,
  deleteAdminPackage,
  putAdminPackageSections,
  postSyncSectionFromGoogleSheet,
} from "../controllers/configController.js";

const router = express.Router();

router.get("/public/config", getPublicConfig);
router.get("/public/packages/:packageId/sections", getPublicPackageSections);
router.get("/public/packages/:packageId/sections/:sectionId/questions", getPublicSectionQuestions);

router.get("/admin/config", getAdminConfig);
router.post("/admin/packages", postAdminPackage);
router.put("/admin/packages/:packageId", putAdminPackage);
router.delete("/admin/packages/:packageId", deleteAdminPackage);
router.put("/admin/packages/:packageId/sections", putAdminPackageSections);
router.post("/admin/packages/:packageId/sections/:sectionId/sync-google-sheet", postSyncSectionFromGoogleSheet);

export default router;
