import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST before any other imports
dotenv.config();

// Add process error handlers at the very top
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

import { xssProtection } from "./middlewares/xss.js";
import http from "http";
import connectDB from "./utils/db.js";
import { connectRedis } from "./utils/redis.js";
import passport from "./config/passport.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import cacheRoute from "./routes/cache.route.js";
import analyticsRoute from "./routes/analytics.route.js";
import monitoringRoute from "./routes/monitoring.route.js";
import adminRoute from "./routes/admin.route.js";
import recruiterAnalyticsRoute from "./routes/recruiter.analytics.route.js";
import authRoute from "./routes/auth.route.js";
import twoFactorRoute from "./routes/twoFactor.route.js";
import subAdminRoute from "./routes/subAdmin.route.js";
import educationRoute from "./routes/education.route.js";
import experienceRoute from "./routes/experience.route.js";
import certificationRoute from "./routes/certification.route.js";
import resumeRoute from "./routes/resume.route.js";
import preferencesRoute from "./routes/preferences.route.js";
import verificationRoute from "./routes/verification.route.js";
import moderationRoute from "./routes/moderation.route.js";
import messageRoute from "./routes/message.route.js";
import interviewRoute from "./routes/interview.route.js";
import notesRoute from "./routes/notes.route.js";
import templateRoute from "./routes/template.route.js";
import savedSearchRoute from "./routes/savedSearch.route.js";
import assessmentRoute from "./routes/assessment.route.js";
import notificationRoute from "./routes/notification.route.js";
import activityRoute from "./routes/activity.route.js";
import insightsRoute from "./routes/insights.route.js";
import interviewPrepRoute from "./routes/interviewPrep.route.js";
import emailCampaignRoute from "./routes/emailCampaign.route.js";
import referralRoute from "./routes/referral.route.js";
import workflowRoute from "./routes/workflow.route.js";
import aiRecommendationRoute from "./routes/aiRecommendation.route.js";
import nlpRoute from "./routes/nlp.route.js";
import gdprRoute from "./routes/gdpr.route.js";
import integrationRoute from "./routes/integration.route.js";
import reportingRoute from "./routes/reporting.route.js";
import widgetRoute from "./routes/widget.route.js";
import careerDevelopmentRoute from "./routes/careerDevelopment.route.js";
import csrfRoute from "./routes/csrf.route.js";
import bannerRoute from "./routes/banner.route.js";
import homeContentRoute from "./routes/homeContent.route.js";
import settingsRoute from "./routes/settings.route.js";
import emailTemplateRoute from "./routes/emailTemplate.route.js";
import faqRoute from "./routes/faq.route.js";
import employerPlanRoute from "./routes/employerPlan.route.js";
import paymentRoute from "./routes/payment.route.js";
import invoiceRoute from "./routes/invoice.route.js";
import resumeCreditRoute from "./routes/resumeCredit.route.js";
import featuredJobRoute from "./routes/featuredJob.route.js";
import { initializeDefaultTemplates } from "./controllers/emailTemplate.controller.js";
import { EmployerPlan } from "./models/employerPlan.model.js";
import morgan from "morgan";
import logger from "./utils/logger.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import { csrfProtection } from "./middlewares/csrf.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { scheduleJobAlerts } from './utils/jobAlertScheduler.js';
import { initializeSocket } from './utils/socket.js';
import { performanceMonitor } from './middlewares/performanceMonitor.js';

const app = express();

// Create Morgan stream to Winston
const morganStream = {
    write: (message) => logger.http(message.trim())
};

// Security middleware
// Helmet - Set security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// XSS Protection - sanitize all inputs
app.use(xssProtection);

// API response compression
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    level: 6 // Compression level (0-9, 6 is default)
}));

// Prevent HTTP Parameter Pollution
app.use(hpp({
    whitelist: ['location', 'jobType', 'experience', 'salary'] // Allow multiple query params for these
}));

// middleware
app.use(morgan('combined', { stream: morganStream }));
app.use(performanceMonitor); // Performance monitoring
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize()); // Initialize Passport
const corsOptions = {
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173'],
    credentials:true
}

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;


// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Job Portal API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));

// OpenAPI JSON endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// CSRF token endpoint (GET request - no CSRF protection needed)
app.use("/api/v1", csrfRoute);

// Auth routes - NO CSRF protection (users must login/register first before getting token)
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/2fa", twoFactorRoute);
// User route contains login/register - must come BEFORE CSRF protection
app.use("/api/v1/user", userRoute);

// Protected routes with CSRF protection enabled
// Note: CSRF middleware automatically skips GET, HEAD, OPTIONS requests
// Only POST, PUT, PATCH, DELETE require CSRF tokens
app.use("/api/v1/sub-admin", csrfProtection, subAdminRoute);
app.use("/api/v1/user/education", csrfProtection, educationRoute);
app.use("/api/v1/user/experience", csrfProtection, experienceRoute);
app.use("/api/v1/user/certifications", csrfProtection, certificationRoute);
app.use("/api/v1/user/resume", csrfProtection, resumeRoute);
app.use("/api/v1/user/preferences", csrfProtection, preferencesRoute);
app.use("/api/v1/verification", csrfProtection, verificationRoute);
app.use("/api/v1/moderation", csrfProtection, moderationRoute);
app.use("/api/v1/messages", csrfProtection, messageRoute);
app.use("/api/v1/interviews", csrfProtection, interviewRoute);
app.use("/api/v1/company", csrfProtection, companyRoute);
app.use("/api/v1/job", csrfProtection, jobRoute);
app.use("/api/v1/application", csrfProtection, applicationRoute);
app.use("/api/v1/notes", csrfProtection, notesRoute);
app.use("/api/v1/templates", csrfProtection, templateRoute);
app.use("/api/v1/saved-searches", csrfProtection, savedSearchRoute);
app.use("/api/v1/assessments", csrfProtection, assessmentRoute);
app.use("/api/v1/notifications", csrfProtection, notificationRoute);
app.use("/api/v1/activity", csrfProtection, activityRoute);
app.use("/api/v1/insights", csrfProtection, insightsRoute);
app.use("/api/v1/resume", csrfProtection, resumeRoute);
app.use("/api/v1/interview-prep", csrfProtection, interviewPrepRoute);
app.use("/api/v1/email-campaigns", csrfProtection, emailCampaignRoute);
app.use("/api/v1/referrals", csrfProtection, referralRoute);
app.use("/api/v1/workflows", csrfProtection, workflowRoute);
app.use("/api/v1/ai-recommendations", csrfProtection, aiRecommendationRoute);
app.use("/api/v1/nlp", csrfProtection, nlpRoute);
app.use("/api/v1/gdpr", csrfProtection, gdprRoute);
app.use("/api/v1/integrations", csrfProtection, integrationRoute);
app.use("/api/v1/reports", csrfProtection, reportingRoute);
app.use("/api/v1/career-development", csrfProtection, careerDevelopmentRoute);
app.use("/api/v1/admin", csrfProtection, adminRoute);

// Read-only routes - NO CSRF protection (only GET requests)
app.use("/api/v1/cache", cacheRoute);
app.use("/api/v1/analytics", analyticsRoute);
app.use("/api/v1/monitoring", monitoringRoute);
app.use("/api/v1/widgets", widgetRoute);
app.use("/api/v1/recruiter/analytics", recruiterAnalyticsRoute);
app.use("/api/v1/banners", bannerRoute);
app.use("/api/v1/home-content", homeContentRoute);
app.use("/api/v1/settings", settingsRoute);
app.use("/api/v1/email-templates", emailTemplateRoute);
app.use("/api/v1/faqs", faqRoute);
app.use("/api/v1/plans", employerPlanRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/invoice", invoiceRoute);
app.use("/api/v1/resume-credit", resumeCreditRoute);
app.use("/api/v1/featured-jobs", featuredJobRoute);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Error handler for server errors
server.on('error', (err) => {
    console.error('Server error:', err);
    logger.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please change PORT in .env file.`);
    }
    process.exit(1);
});

server.listen(PORT, async ()=>{
    try {
        await connectDB();
        await connectRedis(); // Connect to Redis
        scheduleJobAlerts(); // Start job alert scheduler
        await EmployerPlan.initializeDefaultPlans(); // Initialize default subscription plans
        await initializeDefaultTemplates(); // Initialize default email templates
        
        logger.info(`Server running at port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info('WebSocket server initialized');
    } catch (error) {
        logger.error('Failed to start server:', error);
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});