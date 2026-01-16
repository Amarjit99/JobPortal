# 🚀 Job Portal - Enterprise MERN Stack Application

A production-ready, full-featured job portal application built with MongoDB, Express.js, React, and Node.js. This enterprise-grade platform includes OAuth authentication, two-factor authentication, real-time notifications, advanced analytics, automated email campaigns, payment processing, AI-powered job recommendations, and comprehensive monitoring.

[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-red)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [📜 Available Scripts](#-available-scripts)
- [📁 Project Structure](#-project-structure)
- [🔐 Default User Roles](#-default-user-roles)
- [📊 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [📝 Environment Variables Reference](#-environment-variables-reference)
- [🔧 Development Tips](#-development-tips)
- [🐛 Troubleshooting](#-troubleshooting)
- [📦 Production Deployment](#-production-deployment)
- [🔒 Security Features](#-security-features)
- [📈 Monitoring & Performance](#-monitoring--performance)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Support](#-support)
- [🎉 Acknowledgments](#-acknowledgments)

---

## ✨ Features

### Authentication & Security 🔐
- 🔐 JWT-based authentication with refresh tokens
- 🌐 OAuth 2.0 integration (Google, GitHub, LinkedIn)
- 🔒 Two-Factor Authentication (2FA) with TOTP
- ✉️ Email verification for new users
- 🔑 Password reset with secure tokens
- 🍪 HttpOnly cookies with SameSite protection
- 🛡️ Advanced rate limiting (7 different limiters)
- 🛡️ CSRF protection on all state-changing operations
- 🧹 XSS protection and input sanitization
- ✅ Comprehensive input validation and file upload security
- 🚫 Account locking after failed login attempts

### For Job Seekers 👨‍💼
- 🔍 Advanced job search with multiple filters (location, type, experience, salary, remote options)
- 📋 Job application tracking with detailed status timeline
- 💾 Save/bookmark jobs for later viewing
- 📧 Smart email notifications for application updates
- 🔔 Real-time notifications for new matching jobs
- 📊 Profile completeness indicator with recommendations
- 🎯 Customizable job alert preferences and saved searches
- 📄 Resume builder and parser (multiple formats)
- 🤖 AI-powered job recommendations based on profile
- 📈 Career development resources and interview preparation
- 🏆 Skills assessment and certifications
- 💬 Direct messaging with recruiters
- 🔍 Company research and reviews

### For Recruiters 💼
- 📝 Post and manage job listings with templates
- 👥 Advanced applicant tracking system (ATS)
- 🏢 Company profile and branding management
- 📊 Comprehensive analytics dashboard with charts
- 🔔 Real-time notifications for new applications
- 📧 Automated email campaigns and templates
- 📈 Advanced performance monitoring and insights
- 🎯 AI-powered candidate matching and ranking
- 💳 Subscription plans and payment processing (Razorpay)
- 📱 Resume credit system for viewing applicant resumes
- 🎬 Video interview scheduling and management
- 📋 Custom application workflows
- 🌟 Featured job listings and job boosting
- 📧 Bulk email campaigns to candidates
- 👥 Team collaboration with sub-admin roles

### Admin Features 👑
- 👥 User management and verification queue
- 🏢 Company verification and approval system
- 🛡️ Job moderation queue for content review
- 📊 System-wide analytics and reporting
- 🎨 Dynamic home page content management
- 🎯 Banner and promotional content management
- ❓ FAQ management system
- 📧 Email template editor and campaign manager
- ⚙️ System settings and configuration
- 👤 Sub-admin management with role-based permissions
- 📈 Performance monitoring dashboard
- 🔍 Activity logs and audit trails
- 💰 Payment and refund management
- 📝 Widget configurator for external integrations

### Technical Features ⚡
- ⚡ Redis caching for optimized performance
- 🔄 Real-time updates with Socket.io
- 📧 Automated email system with job alerts and campaigns
- 🌍 Multi-language support (i18n) - English, Spanish, French
- 📊 Comprehensive analytics and reporting with charts
- 🔍 Slow query detection and database optimization
- 📝 Complete API documentation (Swagger/OpenAPI)
- ✅ Unit and integration tests with Jest
- 🎨 Responsive UI with Tailwind CSS and shadcn/ui
- 📈 APM (Application Performance Monitoring)
- 🔒 GDPR compliance tools (data export/deletion)
- 🔍 Advanced search with NLP capabilities
- 📱 Progressive Web App (PWA) ready
- 🐳 Docker containerization ready
- 🚀 CI/CD pipeline with GitHub Actions

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v22
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis (caching, sessions, rate limiting)
- **Authentication:** 
  - JWT (jsonwebtoken) for access/refresh tokens
  - Passport.js for OAuth 2.0 (Google, GitHub, LinkedIn)
  - Speakeasy for Two-Factor Authentication (TOTP)
- **File Upload:** Multer + Cloudinary
- **Payment Processing:** Razorpay integration
- **Validation:** express-validator
- **Email:** Nodemailer with templating
- **Logging:** Winston with daily rotation
- **Real-time:** Socket.io for WebSocket communication
- **Security:** 
  - Helmet.js for HTTP headers
  - express-rate-limit for rate limiting
  - bcryptjs for password hashing
  - DOMPurify for XSS protection
- **Testing:** Jest + Supertest
- **Documentation:** Swagger UI (OpenAPI 3.0)
- **Scheduling:** node-cron for scheduled jobs
- **Internationalization:** i18next

### Frontend
- **Framework:** React 18 with hooks
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** Redux Toolkit + Redux Persist
- **UI Components:** 
  - Radix UI primitives
  - shadcn/ui component library
  - Lucide React icons
- **Styling:** Tailwind CSS
- **Charts:** Recharts for data visualization
- **HTTP Client:** Axios with interceptors
- **Forms:** React Hook Form
- **Notifications:** Sonner (toast notifications)
- **Real-time:** Socket.io Client
- **Rich Text:** TipTap or Quill editor
- **Date Handling:** date-fns
- **Testing:** Vitest + React Testing Library

### DevOps & Deployment
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Reverse Proxy:** Nginx
- **Process Management:** PM2 (production)
- **Monitoring:** Custom APM + Winston logging
- **Cloud Storage:** Cloudinary

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Redis** (v6 or higher) - Local installation or [Redis Cloud](https://redis.com/try-free/)
- **Cloudinary Account** - [Sign up](https://cloudinary.com/) for file uploads
- **SMTP Server** - Gmail, SendGrid, or any SMTP provider
- **Optional:**
  - Razorpay account for payment processing
  - OAuth credentials (Google, GitHub, LinkedIn)
  - reCAPTCHA keys for bot protection

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd jobportal
```

### 2. Install All Dependencies
```bash
npm run install-all
```

### 3. Configure Environment Variables

#### Backend (.env)
Create `backend/.env` file (see `backend/.env.example` for reference):
```env
# Server Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/jobportal

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate random strings)
SECRET_KEY=your_secret_key_here_change_this
REFRESH_SECRET_KEY=your_refresh_secret_key_here_change_this

# Cloudinary (File Upload)
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

# Email Configuration (Gmail example)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@jobportal.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# OAuth 2.0 (Optional - see setup guides)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Payment (Optional - Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Security (Optional)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Logging
LOG_LEVEL=info
```

#### Frontend (.env)
Create `frontend/.env` file (see `frontend/.env.example` for reference):
```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

> **💡 Pro Tip:** Check the `.env.example` files in both directories for complete configuration options.

### 4. Run the Application

#### Option 1: Run Both (Backend + Frontend) - Single Command ⭐
```bash
npm run dev
```
or
```bash
npm start
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api-docs
- **Health Check:** http://localhost:8000/api/v1/monitoring/health

## 📜 Available Scripts

### Root Level
```bash
npm run dev              # Run both backend and frontend
npm start                # Same as dev (run both)
npm run backend          # Run backend only
npm run frontend         # Run frontend only
npm run install-all      # Install dependencies for all packages
npm run build            # Build frontend for production
npm test                 # Run backend tests
```

### Backend (cd backend)
```bash
npm run dev              # Start development server with nodemon
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Frontend (cd frontend)
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

## 📁 Project Structure

```
jobportal/
├── .github/
│   └── workflows/
│       └── ci-cd.yml         # GitHub Actions CI/CD pipeline
├── backend/
│   ├── __tests__/            # Jest test files
│   ├── __mocks__/            # Mock implementations for testing
│   ├── config/               # Configuration files
│   │   ├── env.js           # Environment validation
│   │   ├── passport.js      # OAuth strategies
│   │   ├── rateLimiter.js   # Rate limit configurations
│   │   └── swagger.js       # API documentation config
│   ├── controllers/          # Request handlers (50+ controllers)
│   │   ├── user.controller.js
│   │   ├── job.controller.js
│   │   ├── application.controller.js
│   │   ├── admin.controller.js
│   │   ├── analytics.controller.js
│   │   ├── payment.controller.js
│   │   ├── twoFactor.controller.js
│   │   └── ... (many more)
│   ├── middlewares/          # Custom middleware
│   │   ├── isAuthenticated.js
│   │   ├── isAdmin.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── csrf.js
│   │   ├── rateLimiter.js
│   │   ├── performanceMonitor.js
│   │   ├── sanitization.js
│   │   └── multer.js
│   ├── models/               # Mongoose schemas (30+ models)
│   │   ├── user.model.js
│   │   ├── job.model.js
│   │   ├── application.model.js
│   │   ├── company.model.js
│   │   ├── payment.model.js
│   │   └── ... (many more)
│   ├── routes/               # API routes (40+ route files)
│   │   ├── user.route.js
│   │   ├── job.route.js
│   │   ├── application.route.js
│   │   ├── admin.route.js
│   │   └── ... (many more)
│   ├── utils/                # Utility functions
│   │   ├── db.js            # Database connection
│   │   ├── redis.js         # Redis client
│   │   ├── logger.js        # Winston logger
│   │   ├── socket.js        # Socket.io setup
│   │   ├── metrics.js       # Performance metrics
│   │   ├── emailService.js  # Email functionality
│   │   ├── razorpay.js      # Payment integration
│   │   ├── i18n.js          # Internationalization
│   │   └── ... (many more)
│   ├── locales/              # Translation files
│   │   ├── en/
│   │   ├── es/
│   │   └── fr/
│   ├── logs/                 # Application logs (git-ignored)
│   ├── .env.example          # Environment variables template
│   ├── index.js              # Entry point
│   ├── jest.config.js        # Jest configuration
│   └── package.json          # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── admin/        # Admin/recruiter pages (20+ components)
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AnalyticsDashboard.jsx
│   │   │   │   ├── PostJob.jsx
│   │   │   │   ├── SubAdminManagement.jsx
│   │   │   │   └── ...
│   │   │   ├── auth/         # Authentication pages
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Signup.jsx
│   │   │   │   ├── OAuthButtons.jsx
│   │   │   │   ├── TwoFactorVerify.jsx
│   │   │   │   └── ...
│   │   │   ├── shared/       # Shared components
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── ...
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   └── ...
│   │   │   ├── Home.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── JobDescription.jsx
│   │   │   └── ... (60+ components)
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useGetAllJobs.jsx
│   │   │   ├── useGetAllCompanies.jsx
│   │   │   ├── useCSRFToken.jsx
│   │   │   ├── useSocket.jsx
│   │   │   └── ...
│   │   ├── redux/            # Redux store and slices
│   │   │   ├── store.js
│   │   │   ├── authSlice.js
│   │   │   ├── jobSlice.js
│   │   │   └── ...
│   │   ├── utils/            # Utility functions
│   │   │   ├── constant.js
│   │   │   ├── axios.js
│   │   │   └── csrfService.js
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── .env.example          # Environment variables template
│   ├── index.html            # HTML template
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── components.json       # shadcn/ui config
│   └── package.json          # Frontend dependencies
├── docs/                     # Comprehensive documentation
│   ├── ADMIN_MANUAL.md
│   ├── JOB_SEEKER_GUIDE.md
│   ├── RECRUITER_GUIDE.md
│   ├── OAUTH_SETUP_GUIDE.md
│   ├── TROUBLESHOOTING_GUIDE.md
│   └── FAQ.md
├── docker-compose.yml        # Docker orchestration
├── Dockerfile.backend        # Backend Docker image
├── Dockerfile.frontend       # Frontend Docker image
├── nginx.conf                # Nginx configuration
├── deploy.sh                 # Linux deployment script
├── deploy.bat                # Windows deployment script
├── .gitignore                # Git ignore rules
├── README.md                 # This file
├── SETUP.md                  # Detailed setup guide
├── DEPLOYMENT.md             # Production deployment guide
├── SECURITY_AUDIT.md         # Security documentation
└── package.json              # Root package.json (scripts)
```

## 🔐 Default User Roles

The system supports multiple user roles with different permissions:

### User Roles
- **student** (Job Seeker) - Can search and apply for jobs, manage applications
- **recruiter** (Employer) - Can post jobs, manage company, review applications
- **admin** (Super Admin) - Full system access, user management, moderation
- **sub_admin** - Limited admin access based on assigned permissions

### Initial Setup
For the first admin user, you can:
1. Register normally and manually update the role in MongoDB
2. Use the seed script: `cd backend && node seed-admin.js`
3. Set environment variable: `INITIAL_ADMIN_EMAIL=your@email.com`

## 📊 API Endpoints

### Authentication & Authorization
- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/login` - User login
- `GET /api/v1/user/logout` - User logout
- `POST /api/v1/user/verify-email` - Verify email address
- `POST /api/v1/user/forgot-password` - Request password reset
- `POST /api/v1/user/reset-password` - Reset password with token
- `POST /api/v1/user/refresh-token` - Refresh access token
- `GET /api/v1/auth/oauth/google` - Google OAuth login
- `GET /api/v1/auth/oauth/github` - GitHub OAuth login
- `GET /api/v1/auth/oauth/linkedin` - LinkedIn OAuth login

### Two-Factor Authentication
- `POST /api/v1/twofactor/setup` - Generate 2FA secret
- `POST /api/v1/twofactor/verify` - Verify 2FA code
- `POST /api/v1/twofactor/disable` - Disable 2FA
- `POST /api/v1/twofactor/validate` - Validate 2FA during login

### User Profile
- `GET /api/v1/user/profile` - Get user profile
- `POST /api/v1/user/profile/update` - Update profile
- `POST /api/v1/user/profile/photo` - Upload profile photo
- `POST /api/v1/user/profile/resume` - Upload resume

### Jobs
- `GET /api/v1/job/get` - Get all jobs (with advanced filters)
- `GET /api/v1/job/get/:id` - Get job details by ID
- `POST /api/v1/job/post` - Create a job (recruiter)
- `PUT /api/v1/job/update/:id` - Update job (recruiter)
- `DELETE /api/v1/job/delete/:id` - Delete job (recruiter)
- `GET /api/v1/job/getadminjobs` - Get recruiter's jobs
- `GET /api/v1/job/featured` - Get featured jobs
- `POST /api/v1/job/:id/save` - Save/bookmark job
- `GET /api/v1/job/saved` - Get saved jobs

### Applications
- `POST /api/v1/application/apply/:id` - Apply for job
- `GET /api/v1/application/get` - Get user's applications
- `GET /api/v1/application/:id/applicants` - Get job applicants (recruiter)
- `PUT /api/v1/application/status/:id/update` - Update application status
- `GET /api/v1/application/:id/timeline` - Get application timeline

### Companies
- `POST /api/v1/company/register` - Register company
- `GET /api/v1/company/get` - Get all companies
- `GET /api/v1/company/get/:id` - Get company details
- `PUT /api/v1/company/update/:id` - Update company
- `DELETE /api/v1/company/delete/:id` - Delete company

### Analytics (Recruiter)
- `GET /api/v1/analytics/overview` - Dashboard overview stats
- `GET /api/v1/analytics/jobs` - Jobs analytics with charts
- `GET /api/v1/analytics/applications` - Applications analytics
- `GET /api/v1/recruiter-analytics/dashboard` - Comprehensive recruiter analytics

### Admin Operations
- `GET /api/v1/admin/users` - Get all users (paginated)
- `PUT /api/v1/admin/users/:id/verify` - Verify user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/jobs/moderation` - Job moderation queue
- `PUT /api/v1/admin/jobs/:id/approve` - Approve job
- `GET /api/v1/admin/activity-logs` - System activity logs

### Payments (Razorpay)
- `GET /api/v1/payment/plans` - Get pricing plans
- `POST /api/v1/payment/create-order` - Create payment order
- `POST /api/v1/payment/verify` - Verify payment
- `GET /api/v1/payment/history` - Payment history
- `POST /api/v1/payment/refund` - Request refund

### Notifications
- `GET /api/v1/notification/get` - Get user notifications
- `PUT /api/v1/notification/:id/read` - Mark as read
- `PUT /api/v1/notification/read-all` - Mark all as read
- `DELETE /api/v1/notification/:id` - Delete notification

### Monitoring & Health
- `GET /api/v1/monitoring/health` - Health check (public)
- `GET /api/v1/monitoring/metrics` - Performance metrics (admin)
- `GET /api/v1/monitoring/system` - System information (admin)

### Full API Documentation
Visit `/api-docs` when server is running for interactive Swagger documentation.

## 🧪 Testing

Run backend tests:
```bash
cd backend
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## 📝 Environment Variables Reference

### Backend Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/jobportal |
| SECRET_KEY | JWT access token secret | random_string_here |
| REFRESH_SECRET_KEY | JWT refresh token secret | random_string_here |
| CLOUD_NAME | Cloudinary cloud name | your_cloud_name |
| API_KEY | Cloudinary API key | your_api_key |
| API_SECRET | Cloudinary API secret | your_api_secret |
| EMAIL_USER | SMTP email address | your_email@gmail.com |
| EMAIL_PASSWORD | SMTP password/app password | your_password |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |

### Frontend Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000 |

## 🔧 Development Tips

1. **Enable MongoDB Logging:** Set `mongoose.set('debug', true)` in `backend/utils/db.js` to see queries
2. **Check Logs:** Application logs are in `backend/logs/` directory (error.log, combined.log, access.log)
3. **Redis Monitoring:** Use Redis Commander (`npm install -g redis-commander`) or RedisInsight
4. **API Testing:** 
   - Interactive Swagger UI at `http://localhost:8000/api-docs`
   - Import Postman collection from `backend/Job_Portal_API.postman_collection.json`
5. **Performance Monitoring:** Check admin dashboard at `/admin/monitoring` for:
   - Response times
   - Memory usage
   - Cache hit rates
   - Slow queries
6. **Real-time Testing:** Open browser console to see Socket.io events
7. **Email Testing:** 
   - Use [Mailtrap](https://mailtrap.io/) for development email testing
   - Check email queue in Redis: `redis-cli LRANGE email_queue 0 -1`
8. **Hot Reload:** Both backend (nodemon) and frontend (Vite) support hot reloading
9. **Debug Mode:** Set `LOG_LEVEL=debug` in .env for verbose logging
10. **Clear Cache:** Use `/api/v1/cache/clear` endpoint (admin only) to flush Redis cache

### OAuth Setup Guides
- [Google OAuth Setup](GOOGLE_OAUTH_SETUP.md)
- [GitHub OAuth Setup](GITHUB_OAUTH_SETUP.md)
- [LinkedIn OAuth Setup](LINKEDIN_OAUTH_SETUP.md)

### Additional Documentation
- [Complete Setup Guide](SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Admin Manual](docs/ADMIN_MANUAL.md)
- [Job Seeker Guide](docs/JOB_SEEKER_GUIDE.md)
- [Recruiter Guide](docs/RECRUITER_GUIDE.md)
- [Two-Factor Auth Setup](TWO_FACTOR_AUTH_GUIDE.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Troubleshooting](docs/TROUBLESHOOTING_GUIDE.md)

## 🐛 Troubleshooting

### Backend Issues

**Backend won't start**
```bash
# Check if MongoDB is running
mongod --version
mongo --eval "db.stats()"

# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Verify all environment variables
node -e "require('dotenv').config({path:'backend/.env'}); console.log(process.env.MONGO_URI)"

# Check if port is already in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # macOS/Linux
```

**Database connection failed**
- Ensure MongoDB service is running
- Check MongoDB connection string in .env
- For MongoDB Atlas, whitelist your IP address
- Verify network connectivity: `ping your-mongodb-host.com`

**Redis connection issues**
- Start Redis: `redis-server` (or `brew services start redis` on macOS)
- Test connection: `redis-cli ping`
- Check REDIS_URL in .env
- For Redis Cloud, verify credentials and SSL settings

### Frontend Issues

**Frontend won't start**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if port 5173 is available
netstat -ano | findstr :5173  # Windows

# Verify backend URL
cat frontend/.env | grep VITE_API_URL
```

**API calls failing (CORS errors)**
- Ensure backend FRONTEND_URL matches your frontend URL
- Check if backend is running: `curl http://localhost:8000/api/v1/monitoring/health`
- Clear browser cache and cookies
- Check browser console for detailed error messages

**Login not working**
- Clear browser cookies and localStorage
- Check if JWT secrets are set in backend .env
- Verify user exists in database: `mongo jobportal --eval "db.users.find()"`
- Check backend logs for authentication errors

### Email Issues

**Emails not sending**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your@email.com', pass: 'your_password' }
});
transport.verify().then(console.log).catch(console.error);
"
```

**Gmail not working**
- Use App Password (not regular password)
- Enable 2-Step Verification in Google Account
- Generate App Password: Google Account → Security → 2-Step Verification → App passwords
- Check "Less secure app access" setting

### Payment Issues

**Razorpay integration not working**
- Verify Razorpay credentials in .env
- Test mode: Use test keys from Razorpay dashboard
- Check webhook URL is publicly accessible
- Review Razorpay logs in dashboard

### Performance Issues

**Slow API responses**
- Check MongoDB indexes: `db.collection.getIndexes()`
- Monitor slow queries in logs
- Verify Redis cache is working: `redis-cli INFO stats`
- Check system resources: `node -e "console.log(process.memoryUsage())"`

**High memory usage**
- Restart backend: `pm2 restart all` (production)
- Check for memory leaks in logs
- Reduce Redis cache TTL
- Optimize database queries

### Common Error Messages

**"EADDRINUSE: address already in use"**
```bash
# Kill process on port 8000
npx kill-port 8000
# Or find and kill manually
netstat -ano | findstr :8000
taskkill /PID <PID> /F  # Windows
```

**"MongoDB connection timeout"**
- Check firewall settings
- Verify MongoDB is accepting connections
- For Atlas: Check network access list

**"Redis connection refused"**
- Start Redis server
- Check if Redis is bound to correct interface
- Verify Redis URL format

**"Invalid token" or "jwt malformed"**
- Clear browser cookies
- Check JWT secret consistency
- Verify token expiration times

### Getting Help

1. **Check logs:** `backend/logs/error.log`
2. **Enable debug mode:** Set `LOG_LEVEL=debug` in .env
3. **Review documentation:** Check [docs/](docs/) folder
4. **Search issues:** Look for similar problems in GitHub issues
5. **Create issue:** Provide logs, error messages, and steps to reproduce

For detailed troubleshooting, see [docs/TROUBLESHOOTING_GUIDE.md](docs/TROUBLESHOOTING_GUIDE.md)

## 📦 Production Deployment

### Using Docker (Recommended) 🐳

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The docker-compose setup includes:
- Backend service (Node.js)
- Frontend service (Nginx)
- MongoDB database
- Redis cache
- Nginx reverse proxy

### Manual Deployment

#### 1. Build Frontend
```bash
cd frontend
npm run build
# Output will be in frontend/dist/
```

#### 2. Configure Backend for Production
```bash
# backend/.env
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobportal
REDIS_URL=redis://your-redis-host:6379
# ... other production values
```

#### 3. Start Backend with PM2
```bash
cd backend
npm install -g pm2
pm2 start index.js --name job-portal-backend
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

#### 4. Serve Frontend with Nginx
```bash
# Copy nginx.conf from project root
sudo cp nginx.conf /etc/nginx/sites-available/jobportal
sudo ln -s /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Environment Configuration

**Production Environment Variables:**
```env
# Set NODE_ENV to production
NODE_ENV=production

# Use production database
MONGO_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/jobportal

# Use production Redis (Redis Cloud, AWS ElastiCache, etc.)
REDIS_URL=redis://user:password@your-redis.cloud:6379

# Enable secure cookies
COOKIE_SECURE=true
COOKIE_SAMESITE=strict

# Use production URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Production secrets (generate strong random strings)
SECRET_KEY=your_production_secret_minimum_32_characters
REFRESH_SECRET_KEY=your_refresh_secret_minimum_32_characters

# Production SMTP
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your_production_smtp_password

# Production OAuth credentials
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# Enable production logging
LOG_LEVEL=error  # or 'warn' for production
```

### Deployment Platforms

#### **Backend Hosting Options:**
- **Heroku:** Easy deployment with add-ons for MongoDB and Redis
- **Railway:** Modern platform with simple deployment
- **AWS EC2:** Full control, requires server management
- **DigitalOcean:** App Platform or Droplet
- **Azure App Service:** Integrated with Azure services
- **Google Cloud Run:** Containerized deployments

#### **Frontend Hosting Options:**
- **Vercel:** ⭐ Recommended for React/Vite (zero config)
- **Netlify:** Great for static sites with CI/CD
- **AWS S3 + CloudFront:** Scalable CDN distribution
- **GitHub Pages:** Free for public repos
- **Cloudflare Pages:** Fast global CDN

#### **Database & Cache:**
- **MongoDB:** MongoDB Atlas (free tier available)
- **Redis:** Redis Cloud, AWS ElastiCache, Upstash
- **Files:** Cloudinary (already configured)

### SSL/HTTPS Setup

```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run  # Test auto-renewal
```

### CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
- Automated testing on push
- Build verification
- Optional deployment to cloud platforms

```yaml
# Configure secrets in GitHub repository settings:
# - MONGODB_URI
# - REDIS_URL
# - CLOUDINARY_URL
# - Other production secrets
```

### Performance Optimization

**Backend:**
- Enable Redis caching
- Use PM2 cluster mode: `pm2 start index.js -i max`
- Enable gzip compression in Nginx
- Set up CDN for static assets
- Use connection pooling for MongoDB

**Frontend:**
- Enable code splitting
- Lazy load routes and components
- Optimize images with Cloudinary
- Enable browser caching
- Use CDN for static assets

### Monitoring & Logs

**Application Monitoring:**
- Use PM2 monitoring: `pm2 monit`
- Set up log aggregation (ELK stack, Datadog, LogRocket)
- Configure error tracking (Sentry, Rollbar)
- Set up uptime monitoring (UptimeRobot, Pingdom)

**Health Checks:**
```bash
# Backend health
curl https://api.yourdomain.com/api/v1/monitoring/health

# Check PM2 status
pm2 status
pm2 logs
```

### Backup Strategy

**Database Backups:**
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/jobportal" --out=/backup/$(date +%Y%m%d)

# Automate with cron (daily at 2 AM)
0 2 * * * /usr/bin/mongodump --uri="$MONGO_URI" --out=/backup/$(date +\%Y\%m\%d)
```

**Redis Persistence:**
- Enable RDB snapshots in redis.conf
- Use AOF (Append Only File) for durability
- Regular backups of dump.rdb

### Security Checklist

- ✅ Use HTTPS everywhere (SSL/TLS certificates)
- ✅ Set secure cookie flags (`httpOnly`, `secure`, `sameSite`)
- ✅ Enable rate limiting on all endpoints
- ✅ Use strong JWT secrets (minimum 32 characters)
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Enable CSRF protection
- ✅ Configure proper CORS origins
- ✅ Use environment variables (never commit .env)
- ✅ Enable MongoDB authentication
- ✅ Use Redis password protection
- ✅ Set up firewall rules
- ✅ Regular security audits
- ✅ Monitor application logs
- ✅ Implement DDoS protection (Cloudflare)
- ✅ Enable 2FA for admin accounts

### Deployment Scripts

**Quick deployment (Linux/Mac):**
```bash
bash deploy.sh
```

**Quick deployment (Windows):**
```bash
deploy.bat
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔒 Security Features

- ✅ JWT authentication with access & refresh tokens
- ✅ OAuth 2.0 integration (Google, GitHub, LinkedIn)
- ✅ Two-Factor Authentication (TOTP)
- ✅ Email verification for new accounts
- ✅ Password reset with secure tokens (time-limited)
- ✅ Account locking after failed login attempts
- ✅ Comprehensive input validation (express-validator)
- ✅ XSS protection with DOMPurify
- ✅ SQL injection protection (Mongoose parameterized queries)
- ✅ CSRF protection with SameSite cookies
- ✅ Rate limiting on all endpoints (7 different limiters)
- ✅ Secure password hashing (bcrypt with salt rounds)
- ✅ HttpOnly cookies for token storage
- ✅ File upload validation (type, size, malware scanning)
- ✅ Error messages without sensitive data exposure
- ✅ Security headers (Helmet.js)
- ✅ CORS configuration with whitelist
- ✅ API request logging for audit trails
- ✅ GDPR compliance features (data export/deletion)
- ✅ Session management and token blacklisting
- ✅ Recaptcha integration for bot protection

## 📈 Monitoring & Performance

- **Health Checks:** `/api/v1/monitoring/health`
- **Metrics Dashboard:** `/admin/monitoring`
- **Slow Query Detection:** Logs queries > 100ms
- **Request Tracking:** All requests logged with timing
- **Error Tracking:** Comprehensive error logging
- **Cache Hit Rates:** Redis performance metrics

## 🤝 Contributing

We welcome contributions to improve the Job Portal! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Contribution Guidelines

**Code Style:**
- Follow existing code conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

**Testing:**
- Write tests for new features
- Ensure all existing tests pass
- Maintain test coverage above 70%

**Documentation:**
- Update README.md if adding new features
- Document API endpoints in Swagger
- Add inline code comments
- Update relevant guides in `/docs`

**Commit Messages:**
- Use clear, descriptive commit messages
- Format: `type: description` (e.g., `feat: add two-factor authentication`)
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Areas for Contribution

- 🐛 Bug fixes and issue resolution
- ✨ New feature development
- 📝 Documentation improvements
- ✅ Test coverage expansion
- 🎨 UI/UX enhancements
- 🌍 Internationalization (new languages)
- ♿ Accessibility improvements
- 🔒 Security enhancements
- ⚡ Performance optimizations

### Reporting Issues

Before creating an issue:
1. Check if the issue already exists
2. Include detailed steps to reproduce
3. Provide error messages and logs
4. Specify your environment (OS, Node version, etc.)

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the problem, not the person
- Welcome newcomers and help them learn

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

Need help? Here are your options:

### Documentation
- 📖 [Complete Setup Guide](SETUP.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 👨‍💼 [Job Seeker Guide](docs/JOB_SEEKER_GUIDE.md)
- 💼 [Recruiter Guide](docs/RECRUITER_GUIDE.md)
- 👑 [Admin Manual](docs/ADMIN_MANUAL.md)
- 🔧 [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
- ❓ [FAQ](docs/FAQ.md)

### Quick Help
- 📚 Check API documentation at `/api-docs` endpoint
- 📋 Review application logs in `backend/logs/`
- 🔍 Search existing GitHub issues
- 💬 Join discussions in GitHub Discussions

### Reporting Issues
When reporting bugs, please include:
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Feature Requests
We love new ideas! For feature requests:
- Check if it's already been suggested
- Explain the use case clearly
- Describe expected behavior
- Consider implementation complexity

### Professional Support
For enterprise deployments or custom development:
- Priority bug fixes
- Custom feature development
- Deployment assistance
- Performance optimization
- Security audits

## 🎉 Acknowledgments

This project is built with amazing open-source technologies:

### Core Technologies
- **MongoDB** - NoSQL database
- **Express.js** - Backend framework
- **React** - UI library
- **Node.js** - JavaScript runtime
- **Redis** - In-memory data store

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Beautiful icon library
- **Recharts** - Composable charting library

### Key Libraries
- **Passport.js** - OAuth authentication
- **Socket.io** - Real-time communication
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Media management
- **Nodemailer** - Email sending
- **Winston** - Logging library
- **Jest** - Testing framework

### Special Thanks
- All open-source contributors
- The MERN stack community
- Developers who reported bugs and suggested features
- Everyone who has starred or forked this project

---

## 📊 Project Statistics

- **Controllers:** 50+ 
- **Models:** 30+
- **API Routes:** 40+
- **React Components:** 60+
- **Total Features:** 100+
- **Lines of Code:** 25,000+

---

## 🌟 Star History

If you find this project helpful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ using the MERN Stack**

**Ready to launch your career platform?** Get started with `npm run dev` 🚀
