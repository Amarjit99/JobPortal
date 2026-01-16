import express from "express";
import { 
    createOrder, 
    verifyPayment, 
    getPaymentHistory,
    requestRefund,
    processRefundRequest,
    getAllRefunds
} from "../controllers/payment.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// User routes
router.post("/create-order", isAuthenticated, createOrder);
router.post("/verify", isAuthenticated, verifyPayment);
router.get("/history", isAuthenticated, getPaymentHistory);
router.post("/refund/request", isAuthenticated, requestRefund);

// Admin routes
router.post("/refund/process", isAuthenticated, processRefundRequest);
router.get("/refunds", isAuthenticated, getAllRefunds);

export default router;
