import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const router = express.Router();

// Google OAuth Routes
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    async (req, res) => {
        try {
            const user = req.user;

            // Generate JWT token
            const tokenData = {
                userId: user._id
            };

            const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
                expiresIn: "1d"
            });

            // Log successful OAuth login
            logger.info(`Google OAuth success: ${user.email}`);

            // Redirect to frontend with token
            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=google&user=${encodeURIComponent(
                    JSON.stringify({
                        _id: user._id,
                        fullname: user.fullname,
                        email: user.email,
                        role: user.role,
                        profile: user.profile
                    })
                )}`
            );
        } catch (error) {
            logger.error("Google OAuth callback error:", error);
            res.redirect(
                `${process.env.FRONTEND_URL}/login?error=auth_error`
            );
        }
    }
);

// LinkedIn OAuth Routes
router.get(
    "/linkedin",
    passport.authenticate("linkedin", {
        session: false
    })
);

router.get(
    "/linkedin/callback",
    passport.authenticate("linkedin", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    async (req, res) => {
        try {
            const user = req.user;

            // Generate JWT token
            const tokenData = {
                userId: user._id
            };

            const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
                expiresIn: "1d"
            });

            logger.info(`LinkedIn OAuth success: ${user.email}`);

            // Redirect to frontend with token
            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=linkedin&user=${encodeURIComponent(
                    JSON.stringify({
                        _id: user._id,
                        fullname: user.fullname,
                        email: user.email,
                        role: user.role,
                        profile: user.profile
                    })
                )}`
            );
        } catch (error) {
            logger.error("LinkedIn OAuth callback error:", error);
            res.redirect(
                `${process.env.FRONTEND_URL}/login?error=auth_error`
            );
        }
    }
);

// GitHub OAuth Routes
router.get(
    "/github",
    passport.authenticate("github", {
        scope: ["user:email"],
        session: false
    })
);

router.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    async (req, res) => {
        try {
            const user = req.user;

            // Generate JWT token
            const tokenData = {
                userId: user._id
            };

            const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
                expiresIn: "1d"
            });

            logger.info(`GitHub OAuth success: ${user.email}`);

            // Redirect to frontend with token
            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=github&user=${encodeURIComponent(
                    JSON.stringify({
                        _id: user._id,
                        fullname: user.fullname,
                        email: user.email,
                        role: user.role,
                        profile: user.profile
                    })
                )}`
            );
        } catch (error) {
            logger.error("GitHub OAuth callback error:", error);
            res.redirect(
                `${process.env.FRONTEND_URL}/login?error=auth_error`
            );
        }
    }
);

export default router;