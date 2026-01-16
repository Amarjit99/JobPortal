import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { 
    addExperience, 
    updateExperience, 
    deleteExperience, 
    getExperience 
} from "../controllers/experience.controller.js";

const router = express.Router();

router.route("/").post(isAuthenticated, addExperience);
router.route("/:id").put(isAuthenticated, updateExperience);
router.route("/:id").delete(isAuthenticated, deleteExperience);
router.route("/").get(isAuthenticated, getExperience);

export default router;
