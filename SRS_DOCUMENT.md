# Software Requirements Specification (SRS)
## Job Portal Platform

**Version:** 2.0  
**Date:** January 16, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [Appendices](#7-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete description of the Job Portal platform. It describes the functional and non-functional requirements for the system, which connects job seekers with employers through an advanced web-based platform.

### 1.2 Scope

The Job Portal is a full-stack MERN (MongoDB, Express.js, React, Node.js) application designed to facilitate job searching, application management, and recruitment processes. The system supports three primary user roles: Job Seekers (Students), Recruiters (Employers), and Administrators.

**Key Capabilities:**
- User authentication and authorization with OAuth support
- Job posting and management
- Application tracking and workflow management
- Real-time notifications and messaging
- Payment processing for premium features
- Analytics and reporting
- Advanced search and recommendations
- Email notifications and campaigns

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| MERN | MongoDB, Express.js, React, Node.js |
| JWT | JSON Web Token |
| OAuth | Open Authorization |
| 2FA | Two-Factor Authentication |
| RBAC | Role-Based Access Control |
| CSRF | Cross-Site Request Forgery |
| XSS | Cross-Site Scripting |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| SMTP | Simple Mail Transfer Protocol |
| CAPTCHA | Completely Automated Public Turing test |
| ATS | Applicant Tracking System |
| GDPR | General Data Protection Regulation |

### 1.4 References

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [API_DOCUMENTATION_GUIDE.md](backend/API_DOCUMENTATION_GUIDE.md)
- [README.md](README.md)
- [SECURITY_AUDIT_RESULTS.md](SECURITY_AUDIT_RESULTS.md)

### 1.5 Overview

This document is organized into seven main sections covering all aspects of the system requirements, from functional capabilities to technical constraints and data specifications.

---

## 2. Overall Description

### 2.1 Product Perspective

The Job Portal is a standalone web application that integrates with various third-party services:

- **Authentication Providers:** Google OAuth, LinkedIn OAuth, GitHub OAuth
- **Cloud Storage:** Cloudinary for file uploads
- **Payment Gateway:** Razorpay for subscription and credit purchases
- **Email Service:** SMTP/Nodemailer for transactional emails
- **Cache Layer:** Redis for session management and performance
- **Real-time Communication:** Socket.io for live updates
- **Monitoring:** Sentry for error tracking

### 2.2 Product Functions

**For Job Seekers:**
- Create and manage professional profiles
- Upload multiple resumes and documents
- Search and filter job listings
- Apply to jobs with custom screening answers
- Track application status in real-time
- Save jobs for later review
- Receive email and in-app notifications
- Take skill assessments
- Message recruiters
- Access career development resources

**For Recruiters:**
- Post and manage job listings
- Review and manage applications
- Screen candidates with custom questions
- Schedule and track interviews
- Make job offers through the platform
- Access analytics and insights
- Purchase resume unlocks and job credits
- Verify company credentials
- Send bulk email campaigns

**For Administrators:**
- User management (activate/deactivate/delete)
- Content moderation (jobs, companies, users)
- Sub-admin management with granular permissions
- System monitoring and analytics
- Email template management
- Settings configuration
- Audit log review
- Support ticket management

### 2.3 User Classes and Characteristics

| User Class | Technical Expertise | Primary Activities | Frequency of Use |
|------------|--------------------|--------------------|------------------|
| Job Seeker | Low to Medium | Profile creation, job search, application | Daily to Weekly |
| Recruiter | Medium | Job posting, candidate screening, hiring | Daily |
| Admin | High | System management, moderation, analytics | Daily |
| Sub-Admin | Medium to High | Delegated admin tasks per permissions | Daily to Weekly |

### 2.4 Operating Environment

**Client-Side:**
- Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Responsive design supporting desktop, tablet, and mobile devices
- Minimum screen resolution: 320px width
- JavaScript enabled

**Server-Side:**
- Node.js v18+ runtime environment
- MongoDB 5.0+ database
- Redis 6.0+ cache server
- Linux/Unix hosting environment (production)
- Windows/macOS/Linux (development)

### 2.5 Design and Implementation Constraints

- Must use MERN stack (MongoDB, Express.js, React, Node.js)
- RESTful API architecture
- JWT-based authentication with HttpOnly cookies
- HTTPS required for production
- GDPR compliance for data protection
- Maximum file upload size: 10MB for resumes, 5MB for images
- Response time: < 3 seconds for 95% of requests
- Cloudinary storage limits apply
- Razorpay payment gateway regional restrictions

### 2.6 Assumptions and Dependencies

**Assumptions:**
- Users have stable internet connectivity
- Users provide valid email addresses
- Third-party services (Cloudinary, Razorpay) remain available
- OAuth providers maintain their APIs

**Dependencies:**
- MongoDB database availability
- Redis cache availability
- SMTP server for email delivery
- Cloudinary API for file storage
- Razorpay API for payments
- OAuth provider APIs (Google, LinkedIn, GitHub)

---

## 3. System Features

### 3.1 User Authentication and Authorization

#### 3.1.1 Description
Comprehensive authentication system supporting multiple login methods, email verification, password recovery, and role-based access control.

#### 3.1.2 Functional Requirements

**FR-1.1:** The system shall allow users to register with email and password.  
**FR-1.2:** The system shall send verification emails to new users.  
**FR-1.3:** The system shall support OAuth login via Google, LinkedIn, and GitHub.  
**FR-1.4:** The system shall implement JWT-based session management.  
**FR-1.5:** The system shall support password reset via email tokens.  
**FR-1.6:** The system shall implement Two-Factor Authentication (2FA) with TOTP.  
**FR-1.7:** The system shall enforce account locking after 5 failed login attempts.  
**FR-1.8:** The system shall implement CAPTCHA verification for suspicious login attempts.  
**FR-1.9:** The system shall maintain login history for security auditing.  
**FR-1.10:** The system shall support role-based access control (student, recruiter, admin, sub-admin).

#### 3.1.3 Priority
**HIGH** - Critical for system security and user access.

---

### 3.2 User Profile Management

#### 3.2.1 Description
Comprehensive profile management for job seekers and recruiters with document uploads, skills tracking, and verification.

#### 3.2.2 Functional Requirements

**FR-2.1:** The system shall allow users to create and edit profile information.  
**FR-2.2:** The system shall support uploading and managing multiple resumes.  
**FR-2.3:** The system shall allow users to add education history with dates and details.  
**FR-2.4:** The system shall allow users to add work experience with company and role details.  
**FR-2.5:** The system shall allow users to add certifications with validation.  
**FR-2.6:** The system shall support skills tagging with proficiency levels.  
**FR-2.7:** The system shall upload profile photos to Cloudinary.  
**FR-2.8:** The system shall calculate profile completion percentage.  
**FR-2.9:** The system shall allow users to set job alert preferences.  
**FR-2.10:** The system shall maintain profile visibility settings (public/private).

#### 3.2.3 Priority
**HIGH** - Essential for job matching and recruitment.

---

### 3.3 Company Management

#### 3.3.1 Description
Company profile creation, verification, and management system for recruiters.

#### 3.3.2 Functional Requirements

**FR-3.1:** The system shall allow recruiters to create company profiles.  
**FR-3.2:** The system shall support uploading company logos and documents.  
**FR-3.3:** The system shall implement company verification workflow (pending/approved/rejected).  
**FR-3.4:** The system shall require verification documents (GST, PAN, Registration).  
**FR-3.5:** The system shall allow admins to approve/reject company verifications.  
**FR-3.6:** The system shall track verification history and resubmissions.  
**FR-3.7:** The system shall display verification badges on approved companies.  
**FR-3.8:** The system shall allow company profile editing by authorized users.  
**FR-3.9:** The system shall support company size and industry categorization.

#### 3.3.3 Priority
**HIGH** - Critical for trust and credibility.

---

### 3.4 Job Posting and Management

#### 3.4.1 Description
Complete job lifecycle management from creation to expiration, including draft support, screening questions, and moderation.

#### 3.4.2 Functional Requirements

**FR-4.1:** The system shall allow recruiters to create job postings.  
**FR-4.2:** The system shall support job draft saving.  
**FR-4.3:** The system shall allow adding custom screening questions.  
**FR-4.4:** The system shall support multiple question types (text, multiple choice, yes/no).  
**FR-4.5:** The system shall set automatic job expiration dates.  
**FR-4.6:** The system shall allow manual job activation/deactivation.  
**FR-4.7:** The system shall implement spam detection for job content.  
**FR-4.8:** The system shall support job editing and updates.  
**FR-4.9:** The system shall track job view counts and engagement.  
**FR-4.10:** The system shall allow job duplication for similar positions.  
**FR-4.11:** The system shall support featured job promotion.  
**FR-4.12:** The system shall implement job templates for recurring positions.

#### 3.4.3 Priority
**HIGH** - Core business functionality.

---

### 3.5 Job Search and Discovery

#### 3.5.1 Description
Advanced search capabilities with multiple filters, recommendations, and saved searches.

#### 3.5.2 Functional Requirements

**FR-5.1:** The system shall support keyword-based job search.  
**FR-5.2:** The system shall allow filtering by location, job type, experience level, and salary range.  
**FR-5.3:** The system shall implement job recommendations based on user profile.  
**FR-5.4:** The system shall display recently viewed jobs.  
**FR-5.5:** The system shall allow users to save job searches.  
**FR-5.6:** The system shall support sorting by relevance, date, salary.  
**FR-5.7:** The system shall show similar jobs based on current viewing.  
**FR-5.8:** The system shall track search history for analytics.  
**FR-5.9:** The system shall implement infinite scroll pagination.  
**FR-5.10:** The system shall display featured jobs prominently.

#### 3.5.3 Priority
**HIGH** - Essential for user experience.

---

### 3.6 Application Management

#### 3.6.1 Description
Complete application lifecycle tracking with stage management, interview scheduling, and offer processing.

#### 3.6.2 Functional Requirements

**FR-6.1:** The system shall allow job seekers to apply to jobs.  
**FR-6.2:** The system shall validate one application per job per user.  
**FR-6.3:** The system shall collect screening question responses during application.  
**FR-6.4:** The system shall track application stages (applied, screening, interview, offer, hired, rejected).  
**FR-6.5:** The system shall maintain stage history with timestamps and notes.  
**FR-6.6:** The system shall allow recruiters to update application status.  
**FR-6.7:** The system shall support interview scheduling with date/time/type/location.  
**FR-6.8:** The system shall send notifications on status changes.  
**FR-6.9:** The system shall allow applicants to withdraw applications.  
**FR-6.10:** The system shall support bulk status updates.  
**FR-6.11:** The system shall track offer details (salary, start date, benefits).  
**FR-6.12:** The system shall allow offer acceptance/rejection.

#### 3.6.3 Priority
**HIGH** - Core recruitment workflow.

---

### 3.7 Notification System

#### 3.7.1 Description
Real-time and email notification system for application updates, messages, and system alerts.

#### 3.7.2 Functional Requirements

**FR-7.1:** The system shall send real-time in-app notifications.  
**FR-7.2:** The system shall send email notifications for important events.  
**FR-7.3:** The system shall group similar notifications to prevent spam.  
**FR-7.4:** The system shall support notification preferences per user.  
**FR-7.5:** The system shall mark notifications as read/unread.  
**FR-7.6:** The system shall show unread notification count.  
**FR-7.7:** The system shall auto-delete old notifications (90+ days).  
**FR-7.8:** The system shall support notification filtering by type.  
**FR-7.9:** The system shall implement notification priority levels.  
**FR-7.10:** The system shall send digest emails for accumulated notifications.

#### 3.7.3 Priority
**MEDIUM** - Enhances user engagement.

---

### 3.8 Messaging System

#### 3.8.1 Description
Direct messaging between recruiters and job seekers with conversation threading.

#### 3.8.2 Functional Requirements

**FR-8.1:** The system shall allow direct messaging between users.  
**FR-8.2:** The system shall organize messages into conversations.  
**FR-8.3:** The system shall support real-time message delivery via Socket.io.  
**FR-8.4:** The system shall show online/offline status indicators.  
**FR-8.5:** The system shall mark messages as read/unread.  
**FR-8.6:** The system shall support file attachments in messages.  
**FR-8.7:** The system shall implement message search functionality.  
**FR-8.8:** The system shall show typing indicators.  
**FR-8.9:** The system shall maintain message history.  
**FR-8.10:** The system shall allow message deletion.

#### 3.8.3 Priority
**MEDIUM** - Improves communication.

---

### 3.9 Payment and Subscription System

#### 3.9.1 Description
Razorpay-integrated payment processing for credits, subscriptions, and resume unlocks with invoice generation.

#### 3.9.2 Functional Requirements

**FR-9.1:** The system shall integrate Razorpay payment gateway.  
**FR-9.2:** The system shall support credit purchases for resume unlocks.  
**FR-9.3:** The system shall support subscription plans for recruiters.  
**FR-9.4:** The system shall generate PDF invoices for all transactions.  
**FR-9.5:** The system shall track payment history.  
**FR-9.6:** The system shall support refund processing.  
**FR-9.7:** The system shall implement automatic subscription renewal.  
**FR-9.8:** The system shall send payment confirmation emails.  
**FR-9.9:** The system shall track credit balance and deductions.  
**FR-9.10:** The system shall implement payment webhooks for status updates.

#### 3.9.3 Priority
**HIGH** - Revenue generation.

---

### 3.10 Admin Panel

#### 3.10.1 Description
Comprehensive administrative dashboard for system management, moderation, and analytics.

#### 3.10.2 Functional Requirements

**FR-10.1:** The system shall provide user management (view, edit, delete, suspend).  
**FR-10.2:** The system shall implement content moderation for jobs and companies.  
**FR-10.3:** The system shall provide system analytics and metrics.  
**FR-10.4:** The system shall support sub-admin creation with granular permissions.  
**FR-10.5:** The system shall maintain activity logs for audit purposes.  
**FR-10.6:** The system shall allow email template management.  
**FR-10.7:** The system shall support system settings configuration.  
**FR-10.8:** The system shall provide verification queue management.  
**FR-10.9:** The system shall show real-time monitoring dashboard.  
**FR-10.10:** The system shall support bulk user operations.  
**FR-10.11:** The system shall generate exportable reports.

#### 3.10.3 Priority
**HIGH** - Essential for platform management.

---

### 3.11 Assessment System

#### 3.11.1 Description
Skill assessment platform for candidates with multiple question types and automated scoring.

#### 3.11.2 Functional Requirements

**FR-11.1:** The system shall allow creation of skill assessments.  
**FR-11.2:** The system shall support multiple question types (MCQ, True/False, Coding).  
**FR-11.3:** The system shall implement time limits for assessments.  
**FR-11.4:** The system shall auto-calculate scores.  
**FR-11.5:** The system shall provide detailed results with correct answers.  
**FR-11.6:** The system shall track assessment attempts and pass rates.  
**FR-11.7:** The system shall issue certificates for passed assessments.  
**FR-11.8:** The system shall prevent cheating with random question ordering.  
**FR-11.9:** The system shall allow assessments to be job-specific or general.

#### 3.11.3 Priority
**MEDIUM** - Value-added feature.

---

### 3.12 Analytics and Reporting

#### 3.12.1 Description
Comprehensive analytics for users, jobs, applications, and system performance.

#### 3.12.2 Functional Requirements

**FR-12.1:** The system shall track application metrics (acceptance rate, time-to-hire).  
**FR-12.2:** The system shall provide job performance analytics (views, applications, conversion).  
**FR-12.3:** The system shall show user engagement metrics.  
**FR-12.4:** The system shall generate revenue reports for admins.  
**FR-12.5:** The system shall provide search analytics and trends.  
**FR-12.6:** The system shall track system performance (response times, error rates).  
**FR-12.7:** The system shall support custom date range filtering.  
**FR-12.8:** The system shall export reports to CSV/PDF.  
**FR-12.9:** The system shall visualize data with charts and graphs.

#### 3.12.3 Priority
**MEDIUM** - Business intelligence.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements

- **Responsive Design:** All pages must be fully responsive (mobile, tablet, desktop)
- **Framework:** React 18 with Vite 5 build system
- **Styling:** TailwindCSS with Shadcn/ui component library
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

#### 4.1.2 Key Interface Components

**Navigation:**
- Top navigation bar with role-based menu items
- User profile dropdown menu
- Notification bell with badge counter
- Search bar for jobs/users (context-dependent)

**Forms:**
- Client-side validation with real-time feedback
- Clear error messages
- Progress indicators for multi-step forms
- Auto-save for drafts

**Dashboards:**
- Card-based metric displays
- Interactive charts and graphs (Recharts)
- Filterable data tables
- Quick action buttons

### 4.2 Hardware Interfaces

The system is web-based and does not require specific hardware interfaces beyond:
- Standard computer/device with network connectivity
- Camera (optional, for profile photos)
- File system access for document uploads

### 4.3 Software Interfaces

#### 4.3.1 Database Interface

**MongoDB 5.0+**
- Connection via Mongoose ODM
- Connection string format: `mongodb://[username:password@]host[:port]/database`
- Connection pooling enabled
- Replica set support for production

#### 4.3.2 Cache Interface

**Redis 6.0+**
- Connection via `ioredis` client
- Used for session storage, rate limiting, and caching
- TTL-based key expiration
- Pub/Sub for real-time features

#### 4.3.3 Email Service Interface

**SMTP/Nodemailer**
- SMTP server configuration via environment variables
- Support for Gmail, SendGrid, AWS SES, custom SMTP
- HTML email templates with variable substitution
- Attachment support for invoices and documents

#### 4.3.4 Cloud Storage Interface

**Cloudinary API**
- REST API for file uploads
- Image transformation and optimization
- Folder-based organization (resumes, logos, documents)
- Secure signed URLs for access control

#### 4.3.5 Payment Gateway Interface

**Razorpay API**
- Razorpay Checkout integration for frontend
- Server-side order creation and verification
- Webhook handling for payment status
- Refund API integration

#### 4.3.6 OAuth Providers

**Google OAuth 2.0**
- Passport.js Google Strategy
- Scopes: profile, email
- Redirect URL configuration

**LinkedIn OAuth 2.0**
- Passport.js LinkedIn Strategy
- Scopes: r_liteprofile, r_emailaddress
- Redirect URL configuration

**GitHub OAuth 2.0**
- Passport.js GitHub Strategy
- Scopes: user:email
- Redirect URL configuration

#### 4.3.7 Real-time Communication

**Socket.io**
- WebSocket-based real-time communication
- Fallback to long-polling
- Room-based messaging for conversations
- Event-driven notifications

### 4.4 Communication Interfaces

**HTTP/HTTPS Protocol**
- RESTful API architecture
- HTTPS required for production
- CORS enabled for cross-origin requests
- Rate limiting on all endpoints

**API Specifications:**
- Base URL: `https://api.jobportal.com` (production)
- Content-Type: `application/json`
- Authentication: JWT in HttpOnly cookies
- Error format: Standard JSON error objects

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

**Response Time:**
- API endpoints: < 500ms for 95% of requests
- Page load time: < 3 seconds on 4G connection
- Database queries: < 100ms for indexed queries
- Real-time message delivery: < 200ms latency

**Throughput:**
- Support 1,000 concurrent users
- Handle 10,000 API requests per minute
- Process 100 file uploads simultaneously

**Resource Utilization:**
- Database connection pooling (max 50 connections)
- Redis cache hit ratio > 80%
- Memory usage: < 2GB per Node.js instance
- CPU usage: < 70% under normal load

### 5.2 Security Requirements

**Authentication & Authorization:**
- JWT tokens with 1-hour expiration
- Refresh tokens with 7-day expiration
- HttpOnly cookies to prevent XSS
- CSRF token validation on state-changing requests
- Role-based access control (RBAC)

**Data Protection:**
- Password hashing with bcrypt (10 rounds)
- Sensitive data encryption at rest
- HTTPS/TLS 1.3 encryption in transit
- Regular security audits

**Input Validation:**
- Server-side validation for all inputs
- XSS prevention with sanitization
- SQL injection prevention (parameterized queries)
- File upload validation (type, size, content)

**Rate Limiting:**
- Authentication endpoints: 5 requests per 15 minutes per IP
- General API: 100 requests per 15 minutes per user
- File uploads: 10 per hour per user

**Account Security:**
- Account locking after 5 failed login attempts
- CAPTCHA on suspicious login attempts
- 2FA support with TOTP
- Password strength requirements

### 5.3 Reliability and Availability

**Uptime:**
- Target: 99.9% availability (< 8.76 hours downtime/year)
- Scheduled maintenance windows: announced 48 hours in advance

**Fault Tolerance:**
- Database replica sets for failover
- Redis cluster for high availability
- Graceful error handling with user-friendly messages
- Automatic retry logic for external API calls

**Backup and Recovery:**
- Daily automated database backups
- Point-in-time recovery capability
- Backup retention: 30 days
- Recovery Time Objective (RTO): < 4 hours
- Recovery Point Objective (RPO): < 24 hours

### 5.4 Scalability

**Horizontal Scaling:**
- Stateless API servers for easy scaling
- Load balancing across multiple instances
- Database sharding support
- CDN integration for static assets

**Vertical Scaling:**
- Database and cache can be scaled independently
- Support for increased memory and CPU resources

**Design Considerations:**
- Microservices-ready architecture
- Event-driven design for async processing
- Queue-based job processing (future)

### 5.5 Maintainability

**Code Quality:**
- ESLint and Prettier for code formatting
- Comprehensive JSDoc comments
- Modular architecture with separation of concerns
- 80%+ code coverage for critical paths

**Documentation:**
- API documentation with Swagger/OpenAPI
- README files in all major directories
- Inline code comments for complex logic
- Architecture diagrams and ERDs

**Logging and Monitoring:**
- Winston logger with daily rotation
- Sentry for error tracking and alerting
- Slow query detection and logging
- Audit logs for sensitive operations

**Version Control:**
- Git-based version control
- Semantic versioning
- Feature branch workflow
- Automated testing in CI/CD pipeline

### 5.6 Usability

**Ease of Use:**
- Intuitive navigation and layout
- Consistent design patterns
- Clear error messages and help text
- Progress indicators for long operations

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

**Internationalization (Future):**
- i18next integration ready
- Multi-language support framework
- Date/time localization
- Currency conversion

### 5.7 Portability

**Platform Independence:**
- Web-based application accessible from any modern browser
- No platform-specific dependencies
- Docker containerization support
- Cloud-agnostic deployment

**Data Portability:**
- Export user data in JSON/CSV format
- Import existing resumes (PDF, DOCX)
- API access for third-party integrations

### 5.8 Compliance

**Data Protection:**
- GDPR compliance for EU users
- User consent management
- Right to data deletion
- Data processing agreements

**Accessibility:**
- WCAG 2.1 Level AA standards
- Section 508 compliance

**Payment Security:**
- PCI DSS compliance via Razorpay
- No storage of credit card details
- Secure payment processing

---

## 6. Data Requirements

### 6.1 Database Schema

#### 6.1.1 Core Collections

**Users Collection**
```javascript
{
  _id: ObjectId,
  fullname: String (required),
  email: String (required, unique),
  phoneNumber: String (validated),
  password: String (hashed, optional for OAuth),
  role: String (enum: student, recruiter, admin, sub-admin),
  googleId: String (unique, sparse),
  linkedinId: String (unique, sparse),
  githubId: String (unique, sparse),
  oauthProvider: String (enum: local, google, linkedin, github),
  profile: {
    bio: String,
    skills: [String],
    profilePhoto: String (URL),
    location: String,
    experience: String
  },
  resumes: [{
    fileName: String,
    originalName: String,
    cloudinaryUrl: String,
    uploadedAt: Date,
    fileSize: Number,
    parsed: {
      skills: [String],
      education: [Object],
      experience: [Object]
    }
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    grade: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String,
    current: Boolean
  }],
  certifications: [{
    name: String,
    issuingOrg: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    url: String
  }],
  savedJobs: [ObjectId (ref: Job)],
  twoFactorAuth: {
    enabled: Boolean,
    secret: String,
    backupCodes: [String]
  },
  isVerified: Boolean,
  isActive: Boolean,
  loginAttempts: Number,
  lockUntil: Date,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Jobs Collection**
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  requirements: [String],
  salary: Number (required),
  experienceLevel: Number (required),
  location: String (required),
  jobType: String (required),
  position: Number (required),
  company: ObjectId (ref: Company, required),
  created_by: ObjectId (ref: User, required),
  applications: [ObjectId (ref: Application)],
  screeningQuestions: [{
    question: String,
    answerType: String (enum: text, multipleChoice, yesNo),
    required: Boolean,
    options: [String]
  }],
  isDraft: Boolean,
  expiresAt: Date,
  isActive: Boolean,
  isFeatured: Boolean,
  views: Number,
  spam: {
    flagged: Boolean,
    reason: String,
    moderatedBy: ObjectId (ref: User),
    moderatedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Applications Collection**
```javascript
{
  _id: ObjectId,
  job: ObjectId (ref: Job, required),
  applicant: ObjectId (ref: User, required),
  status: String (enum: pending, accepted, rejected...),
  currentStage: String (enum: applied, screening, interview...),
  stageHistory: [{
    stage: String,
    changedAt: Date,
    changedBy: ObjectId (ref: User),
    notes: String,
    metadata: Mixed
  }],
  screeningAnswers: [{
    questionId: ObjectId,
    question: String,
    answer: String
  }],
  interviewDetails: {
    scheduledAt: Date,
    interviewType: String,
    duration: Number,
    meetingLink: String,
    location: String,
    interviewers: [Object],
    feedback: String,
    rating: Number,
    completed: Boolean
  },
  offerDetails: {
    offeredAt: Date,
    salary: Number,
    startDate: Date,
    benefits: [String],
    offerLetterUrl: String,
    expiresAt: Date,
    acceptedAt: Date,
    rejectedAt: Date
  },
  withdrawnAt: Date,
  withdrawalReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Companies Collection**
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  website: String,
  location: String,
  logo: String (URL),
  userId: ObjectId (ref: User, required),
  verification: {
    status: String (enum: pending, approved, rejected...),
    documents: {
      gstCertificate: { url: String, uploadedAt: Date },
      panCard: { url: String, uploadedAt: Date },
      registrationCertificate: { url: String, uploadedAt: Date }
    },
    verifiedAt: Date,
    verifiedBy: ObjectId (ref: User),
    rejectionReason: String,
    submittedAt: Date,
    resubmissionCount: Number
  },
  industry: String,
  companySize: String,
  foundedYear: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.1.2 Supporting Collections

- **Notifications:** User notifications with read status and metadata
- **Messages:** Direct messages between users
- **Conversations:** Message threads with participants
- **Payments:** Transaction records with Razorpay details
- **Invoices:** Generated PDF invoices for payments
- **Subscriptions:** Employer subscription plans and status
- **Assessments:** Skill assessment definitions
- **UserAssessments:** User assessment attempts and scores
- **ActivityLogs:** System activity audit trail
- **SearchHistory:** User search patterns for analytics
- **SavedSearches:** User-saved search criteria
- **EmailTemplates:** Admin-managed email templates
- **Settings:** System configuration settings
- **Referrals:** User referral tracking
- **SubAdmins:** Sub-administrator permissions

### 6.2 Data Constraints

**Size Limits:**
- Resume files: 10MB maximum
- Profile photos: 5MB maximum
- Company logos: 5MB maximum
- Message attachments: 10MB maximum

**Data Retention:**
- Notifications: 90 days
- Activity logs: 365 days
- Deleted user data: 30 days (soft delete)
- Email queue: 7 days

**Validation Rules:**
- Email: RFC 5322 compliant
- Phone: International format support
- URLs: Valid HTTP/HTTPS format
- Dates: ISO 8601 format

### 6.3 Data Integrity

**Referential Integrity:**
- Cascade delete for dependent records
- Orphan cleanup jobs for dangling references
- Foreign key constraints via Mongoose refs

**Data Consistency:**
- Atomic operations for critical updates
- Transaction support for multi-document operations
- Optimistic locking for concurrent updates

**Backup and Recovery:**
- Automated daily backups
- Point-in-time recovery capability
- Backup testing quarterly

---

## 7. Appendices

### 7.1 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.x | UI framework |
| Frontend | Vite | 5.3.x | Build tool |
| Frontend | Redux Toolkit | - | State management |
| Frontend | TailwindCSS | - | Styling |
| Frontend | Shadcn/ui | - | Component library |
| Backend | Node.js | 22.x | Runtime |
| Backend | Express.js | 4.x | Web framework |
| Database | MongoDB | 5.x | NoSQL database |
| Cache | Redis | 6.x | Caching layer |
| Real-time | Socket.io | 4.x | WebSocket |
| Authentication | Passport.js | - | OAuth strategies |
| File Storage | Cloudinary | - | Cloud storage |
| Payments | Razorpay | - | Payment gateway |
| Email | Nodemailer | - | Email service |
| Monitoring | Sentry | - | Error tracking |
| Documentation | Swagger | - | API docs |
| Testing | Jest | - | Unit testing |

### 7.2 API Endpoint Summary

**Total Endpoints:** 200+

**Categories:**
- Authentication: 15 endpoints
- User Management: 25 endpoints
- Job Management: 30 endpoints
- Application Management: 20 endpoints
- Company Management: 10 endpoints
- Payment & Subscription: 15 endpoints
- Admin Operations: 40 endpoints
- Notifications: 10 endpoints
- Messaging: 12 endpoints
- Analytics: 15 endpoints
- Assessments: 18 endpoints

**Full documentation:** `/api-docs` (Swagger UI)

### 7.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   LOAD BALANCER                      │
│                   (Nginx/AWS ELB)                    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌───────────────┐     ┌───────────────┐  ┌───────────────┐
│  Frontend     │     │  Frontend     │  │  Frontend     │
│  (Vercel/S3)  │     │  (Replica 2)  │  │  (Replica 3)  │
└───────────────┘     └───────────────┘  └───────────────┘
        │
        │ API Calls
        ▼
┌─────────────────────────────────────────────────────┐
│              API GATEWAY / RATE LIMITER              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌───────────────┐     ┌───────────────┐  ┌───────────────┐
│  Backend API  │     │  Backend API  │  │  Backend API  │
│  (Node.js 1)  │     │  (Node.js 2)  │  │  (Node.js 3)  │
└───────┬───────┘     └───────┬───────┘  └───────┬───────┘
        │                     │                  │
        └──────────┬──────────┴──────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌───────────────┐     ┌───────────────┐  ┌───────────────┐
│   MongoDB     │     │     Redis     │  │   Cloudinary  │
│  (Replica Set)│     │   (Cluster)   │  │  (File Store) │
└───────────────┘     └───────────────┘  └───────────────┘
        │
        ▼
┌───────────────┐
│    Backup     │
│   Storage     │
└───────────────┘
```

### 7.4 Security Checklist

- [x] HTTPS/TLS encryption
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] CSRF protection
- [x] XSS prevention
- [x] SQL injection prevention (NoSQL)
- [x] Rate limiting
- [x] Input validation
- [x] File upload validation
- [x] CORS configuration
- [x] Security headers (helmet)
- [x] OAuth integration
- [x] 2FA support
- [x] Account locking
- [x] CAPTCHA verification
- [x] Audit logging
- [x] Error monitoring (Sentry)
- [x] Regular security audits

### 7.5 Future Enhancements (Phase 7)

See [IMPLEMENTATION_PLAN.md - Phase 7](IMPLEMENTATION_PLAN.md#phase-7-future-enhancements) for detailed roadmap including:

- AI Resume Parser
- ML-based Skill Matching
- Predictive Analytics
- React Native Mobile App
- Video Interview Integration
- Multi-language Support
- Multi-currency Support
- Gamification Features

### 7.6 Glossary

| Term | Definition |
|------|------------|
| Application Stage | Current status of a job application in the recruitment pipeline |
| Assessment | Skill test or quiz to evaluate candidate abilities |
| Company Verification | Admin approval process for company authenticity |
| Credit | Virtual currency for unlocking candidate resumes |
| Draft Job | Incomplete job posting saved for later publication |
| Featured Job | Promoted job listing with enhanced visibility |
| OAuth | Third-party authentication protocol |
| Resume Unlock | Payment-based access to full candidate resume |
| Screening Question | Custom question added by recruiter during job posting |
| Sub-Admin | Limited admin with specific module permissions |
| Subscription Plan | Recurring payment plan for recruiters |
| Two-Factor Auth | Additional security layer with TOTP codes |

---

## Document Approval

**Prepared by:** Development Team  
**Review Date:** January 16, 2026  
**Approved by:** Project Stakeholders  
**Version:** 2.0  
**Status:** Production Ready  

---

**End of Software Requirements Specification**
