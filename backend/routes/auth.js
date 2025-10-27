import express from "express";
import passport from "passport";
import jwt from 'jsonwebtoken';
import {
  signup,
  login,
  googleCallback,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
// Use a custom callback so errors from the OAuth exchange are handled gracefully
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const successPath = "/auth/success";
    if (err) {
      console.error("Google OAuth error:", err);
      const body = err && err.data ? err.data : undefined;
      const status = err && err.statusCode ? err.statusCode : undefined;
      const errMsg = err.message || String(err);
      // Redirect to frontend with error information
      const url = `${frontend}${successPath}?error=${encodeURIComponent(
        errMsg
      )}${status ? `&status=${status}` : ""}`;
      return res.redirect(url);
    }
    if (!user) {
      console.warn("Google OAuth did not return a user. Info:", info);
      const infoStr = info ? JSON.stringify(info) : "no-info";
      const url = `${frontend}${successPath}?error=${encodeURIComponent(
        "No user returned from OAuth provider"
      )}&info=${encodeURIComponent(infoStr)}`;
      return res.redirect(url);
    }

    // Create JWT and redirect to frontend success route with token
    try {
      const jwtSecret = process.env.JWT_SECRET || "devsecret";
      const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "7d" });
      const url = `${frontend}${successPath}?token=${encodeURIComponent(
        token
      )}`;
      return res.redirect(url);
    } catch (ex) {
      console.error("Error creating JWT after OAuth:", ex);
      const url = `${frontend}${successPath}?error=${encodeURIComponent(
        "Token creation failed"
      )}`;
      return res.redirect(url);
    }
  })(req, res, next);
});

export default router;
