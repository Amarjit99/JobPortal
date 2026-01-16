import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { 
    addCertification, 
    updateCertification, 
    deleteCertification, 
    getCertifications 
} from "../controllers/certification.controller.js";

const router = express.Router();

router.route("/").post(isAuthenticated, addCertification);
router.route("/:id").put(isAuthenticated, updateCertification);
router.route("/:id").delete(isAuthenticated, deleteCertification);
router.route("/").get(isAuthenticated, getCertifications);

export default router;
