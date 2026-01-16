import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getCompany, getCompanyById, registerCompany, updateCompany, uploadVerificationDocuments } from "../controllers/company.controller.js";
import { singleUpload, multipleUpload } from "../middlewares/multer.js";
import { registerCompanyValidation, updateCompanyValidation, validate, mongoIdValidation } from "../middlewares/validation.js";
import { uploadLimiter, companyWriteLimiter, readLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.route("/register").post(isAuthenticated, companyWriteLimiter, registerCompanyValidation, validate, registerCompany);
router.route("/get").get(isAuthenticated, readLimiter, getCompany);
router.route("/get/:id").get(isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getCompanyById);
router.route("/update/:id").put(isAuthenticated, uploadLimiter, companyWriteLimiter, singleUpload, updateCompanyValidation, validate, updateCompany);
router.route("/:id/verification-documents").post(isAuthenticated, uploadLimiter, multipleUpload, ...mongoIdValidation('id'), validate, uploadVerificationDocuments);

export default router;

