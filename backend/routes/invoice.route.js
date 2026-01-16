import express from "express";
import {
    getUserInvoices,
    generateInvoicePDF,
    getInvoiceById
} from "../controllers/invoice.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/", isAuthenticated, getUserInvoices);
router.get("/:invoiceId", isAuthenticated, getInvoiceById);
router.get("/:invoiceId/download", isAuthenticated, generateInvoicePDF);

export default router;
