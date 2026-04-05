import express from "express";
import { register, login, socialLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/social-login", socialLogin);

export default router;
