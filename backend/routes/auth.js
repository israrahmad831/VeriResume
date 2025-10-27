import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';
import {
  signup,
  login,
  googleCallback,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const successPath = "/auth/success";
    if (err) {
      const errMsg = err.message || String(err);
      const url = `${frontend}${successPath}?error=${encodeURIComponent(errMsg)}`;
      return res.redirect(url);
    }
    if (!user) {
      const infoStr = info ? JSON.stringify(info) : "no-info";
      const url = `${frontend}${successPath}?error=${encodeURIComponent(
        "No user returned from OAuth provider"
      )}&info=${encodeURIComponent(infoStr)}`;
      return res.redirect(url);
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || "devsecret";
      const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "7d" });
      const url = `${frontend}${successPath}?token=${encodeURIComponent(token)}`;
      return res.redirect(url);
    } catch (ex) {
      const url = `${frontend}${successPath}?error=${encodeURIComponent(
        "Token creation failed"
      )}`;
      return res.redirect(url);
    }
  })(req, res, next);
});

export default router;
