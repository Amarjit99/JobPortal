import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { updateJobPreferences, getJobPreferences } from "../controllers/preferences.controller.js";

const router = express.Router();

router.route("/").put(isAuthenticated, updateJobPreferences);
router.route("/").get(isAuthenticated, getJobPreferences);

export default router;
