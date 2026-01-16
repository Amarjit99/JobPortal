# System Architecture Documentation
## Job Portal Platform

**Version:** 2.0  
**Date:** January 16, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Components](#3-system-components)
4. [Data Flow](#4-data-flow)
5. [Security Architecture](#5-security-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Scalability & Performance](#7-scalability--performance)
8. [Integration Architecture](#8-integration-architecture)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

The Job Portal follows a **3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   React     │  │   Redux     │  │  Socket.io       │   │
│  │   (UI)      │  │  (State)    │  │  (Real-time)     │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTPS / WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Express  │  │  Auth    │  │Business  │  │  Socket   │  │
│  │ Router   │  │Middleware│  │  Logic   │  │  Server   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │Controllers│ │Validation│  │  Caching │  │ Rate      │  │
│  │          │  │          │  │  (Redis) │  │ Limiting  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                      Database Layer
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       DATA LAYER                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   MongoDB    │  │    Redis     │  │   Cloudinary     │ │
│  │  (Primary)   │  │   (Cache)    │  │  (File Store)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Pattern

**Pattern:** Monolithic with Microservices-Ready Design

**Key Principles:**
- **Separation of Concerns:** Routes → Controllers → Services → Models
- **Dependency Injection:** Services are injected where needed
- **Modular Design:** Features organized in separate modules
- **Stateless API:** Enables horizontal scaling
- **Event-Driven:** Socket.io for real-time features
- **Caching Layer:** Redis for performance optimization

### 1.3 Request Flow

```
User Request
    ↓
[Load Balancer] (Nginx/ALB)
    ↓
[Rate Limiter] (Redis-based)
    ↓
[CORS & Security Headers] (Helmet)
    ↓
[Authentication Middleware] (JWT Validation)
    ↓
[Route Handler] (Express Router)
    ↓
[Controller] (Business Logic)
    ↓
[Service Layer] (Data Operations)
    ↓
[Model Layer] (Mongoose ORM)
    ↓
[MongoDB Database]
    ↓
[Response with Cache Headers]
    ↓
User Receives Response
```

---

## 2. Technology Stack

### 2.1 Frontend Technologies

```
┌─────────────────────────────────────────────────┐
│              FRONTEND STACK                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  React 18.x          - UI Framework             │
│  Vite 5.3.x          - Build Tool & Dev Server  │
│  Redux Toolkit       - State Management         │
│  Redux Persist       - State Persistence        │
│  React Router v6     - Client-side Routing      │
│  TailwindCSS         - Utility-first CSS        │
│  Shadcn/ui           - Component Library        │
│  Radix UI            - Accessible Components    │
│  Recharts            - Data Visualization       │
│  Axios               - HTTP Client              │
│  Socket.io Client    - Real-time Connection     │
│  Sonner              - Toast Notifications      │
│  React Hook Form     - Form Management          │
│  Zod                 - Schema Validation        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2.2 Backend Technologies

```
┌─────────────────────────────────────────────────┐
│              BACKEND STACK                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  Node.js 22.x        - Runtime Environment      │
│  Express.js 4.x      - Web Framework            │
│  Mongoose            - MongoDB ODM              │
│  JWT                 - Token Authentication     │
│  Passport.js         - OAuth Strategies         │
│  Bcrypt              - Password Hashing         │
│  Multer              - File Upload Handling     │
│  Cloudinary          - Cloud Storage SDK        │
│  Nodemailer          - Email Service            │
│  Winston             - Logging Framework        │
│  Socket.io           - WebSocket Server         │
│  Express-validator   - Input Validation         │
│  Helmet              - Security Headers         │
│  CORS                - Cross-Origin Support     │
│  Cookie-parser       - Cookie Management        │
│  Dotenv              - Environment Config       │
│  Swagger/OpenAPI     - API Documentation        │
│  Jest                - Testing Framework        │
│  Supertest           - API Testing              │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2.3 Database & Infrastructure

```
┌─────────────────────────────────────────────────┐
│         DATABASE & INFRASTRUCTURE                │
├─────────────────────────────────────────────────┤
│                                                  │
│  MongoDB 5.x         - NoSQL Database           │
│  Redis 6.x           - In-memory Cache          │
│  Cloudinary          - File/Image Storage       │
│  Razorpay            - Payment Gateway          │
│  Sentry              - Error Tracking           │
│  Vercel              - Frontend Hosting         │
│  Render/Railway      - Backend Hosting          │
│  Docker              - Containerization         │
│  Nginx               - Reverse Proxy            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 3. System Components

### 3.1 Frontend Component Architecture

```
src/
├── components/
│   ├── shared/              # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── auth/                # Authentication components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── TwoFactorVerify.jsx
│   │   └── OAuthCallback.jsx
│   │
│   ├── profile/             # Profile management
│   │   ├── Profile.jsx
│   │   ├── EducationSection.jsx
│   │   ├── ExperienceSection.jsx
│   │   └── ResumeManager.jsx
│   │
│   ├── jobs/                # Job-related components
│   │   ├── Jobs.jsx
│   │   ├── JobDescription.jsx
│   │   ├── JobFilters.jsx
│   │   └── SavedJobs.jsx
│   │
│   ├── admin/               # Admin dashboard
│   │   ├── AdminDashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── Analytics.jsx
│   │   └── SubAdminManagement.jsx
│   │
│   └── ui/                  # Shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       └── ... (50+ components)
│
├── redux/
│   ├── store.js
│   ├── authSlice.js
│   ├── jobSlice.js
│   ├── applicationSlice.js
│   └── notificationSlice.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useJobs.js
│   ├── useSocket.js
│   └── useNotifications.js
│
└── utils/
    ├── api.js
    ├── constants.js
    └── helpers.js
```

**Component Design Patterns:**
- **Container/Presentational:** Separation of logic and UI
- **Custom Hooks:** Reusable stateful logic
- **Higher-Order Components:** Cross-cutting concerns
- **Compound Components:** Complex UI patterns

### 3.2 Backend Component Architecture

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── redis.js             # Redis client
│   ├── cloudinary.js        # Cloudinary config
│   ├── passport.js          # OAuth strategies
│   └── swagger.js           # API documentation
│
├── models/                  # 35+ Mongoose models
│   ├── user.model.js
│   ├── job.model.js
│   ├── application.model.js
│   ├── company.model.js
│   ├── payment.model.js
│   └── ... (30+ more models)
│
├── controllers/             # 48+ controllers
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── job.controller.js
│   ├── application.controller.js
│   └── ... (44+ more controllers)
│
├── routes/                  # 48+ route files
│   ├── user.route.js
│   ├── job.route.js
│   ├── application.route.js
│   ├── admin.route.js
│   └── ... (44+ more routes)
│
├── middlewares/
│   ├── auth.middleware.js   # JWT validation
│   ├── rbac.middleware.js   # Role-based access
│   ├── rateLimiter.js       # Rate limiting
│   ├── validate.js          # Input validation
│   ├── errorHandler.js      # Error handling
│   └── upload.middleware.js # File upload handling
│
├── utils/
│   ├── sendEmail.js         # Email utility
│   ├── generateToken.js     # JWT generation
│   ├── logger.js            # Winston logger
│   ├── cacheManager.js      # Redis caching
│   └── pdfGenerator.js      # Invoice generation
│
└── services/
    ├── notification.service.js
    ├── email.service.js
    ├── payment.service.js
    └── analytics.service.js
```

**Backend Design Patterns:**
- **MVC Pattern:** Model-View-Controller separation
- **Repository Pattern:** Data access abstraction
- **Service Layer:** Business logic encapsulation
- **Middleware Chain:** Request processing pipeline
- **Factory Pattern:** Object creation (JWT, emails)

---

## 4. Data Flow

### 4.1 User Registration Flow

```
┌────────────┐
│   User     │
│  (Browser) │
└──────┬─────┘
       │ POST /api/v1/user/register
       │ { email, password, role, ... }
       ▼
┌────────────────────────┐
│  Express Router        │
│  /user/register        │
└──────┬─────────────────┘
       │ Validate Input
       ▼
┌────────────────────────┐
│  Auth Controller       │
│  registerUser()        │
└──────┬─────────────────┘
       │ Check if user exists
       │ Hash password (bcrypt)
       │ Create verification token
       ▼
┌────────────────────────┐
│  User Model            │
│  user.save()           │
└──────┬─────────────────┘
       │ Store in MongoDB
       ▼
┌────────────────────────┐
│  Email Service         │
│  sendVerificationEmail()│
└──────┬─────────────────┘
       │ Queue email
       ▼
┌────────────────────────┐
│  Response to Client    │
│  { success, message }  │
└────────────────────────┘
```

### 4.2 Job Search Flow with Caching

```
┌────────────┐
│   User     │
│  (Browser) │
└──────┬─────┘
       │ GET /api/v1/job/search?keyword=react&location=remote
       ▼
┌────────────────────────┐
│  Rate Limiter          │
│  (Redis-based)         │
└──────┬─────────────────┘
       │ Check request count
       ▼
┌────────────────────────┐
│  Cache Check (Redis)   │
│  Key: search:react:... │
└──────┬─────────────────┘
       │
       ├─ Cache HIT ──────────┐
       │                       │
       │ Cache MISS            │
       ▼                       │
┌────────────────────────┐    │
│  Job Controller        │    │
│  searchJobs()          │    │
└──────┬─────────────────┘    │
       │ Build query           │
       ▼                       │
┌────────────────────────┐    │
│  MongoDB Query         │    │
│  Job.find().populate() │    │
└──────┬─────────────────┘    │
       │ Store in cache        │
       │ (TTL: 5 min)          │
       ▼                       │
┌────────────────────────┐    │
│  Response to Client    │◄───┘
│  { jobs: [...] }       │
└────────────────────────┘
```

### 4.3 Real-time Notification Flow

```
┌───────────────┐
│  Recruiter    │
│ Updates Status│
└───────┬───────┘
        │ PATCH /api/v1/application/:id/status
        ▼
┌────────────────────────┐
│  Application Controller│
│  updateStatus()        │
└───────┬────────────────┘
        │ Update MongoDB
        │ Create notification
        ▼
┌────────────────────────┐
│  Notification Service  │
│  createNotification()  │
└───────┬────────────────┘
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  Socket.io  │  │  MongoDB     │  │ Email Queue  │
│  Emit Event │  │  Save Record │  │ Send Email   │
└───────┬─────┘  └──────────────┘  └──────────────┘
        │
        │ notification:new
        ▼
┌─────────────────────┐
│  Job Seeker Client  │
│  (Connected via WS) │
└─────────────────────┘
        │
        ▼
    UI Updates
   (Toast, Badge)
```

### 4.4 Payment Processing Flow

```
┌────────────┐
│  Recruiter │
└──────┬─────┘
       │ POST /api/v1/payment/create-order
       │ { amount, type: 'credits' }
       ▼
┌────────────────────────┐
│  Payment Controller    │
│  createOrder()         │
└──────┬─────────────────┘
       │ Create Razorpay order
       ▼
┌────────────────────────┐
│  Razorpay API          │
│  orders.create()       │
└──────┬─────────────────┘
       │ Return order_id
       ▼
┌────────────────────────┐
│  Frontend Checkout     │
│  Razorpay.js SDK       │
└──────┬─────────────────┘
       │ User completes payment
       ▼
┌────────────────────────┐
│  Razorpay Webhook      │
│  POST /webhook/payment │
└──────┬─────────────────┘
       │ Verify signature
       ▼
┌────────────────────────┐
│  Payment Controller    │
│  verifyPayment()       │
└──────┬─────────────────┘
       │ Update user credits
       │ Generate invoice PDF
       │ Send confirmation email
       ▼
┌────────────────────────┐
│  Payment Success       │
│  Credits Added         │
└────────────────────────┘
```

---

## 5. Security Architecture

### 5.1 Authentication Architecture

```
┌──────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                      │
└──────────────────────────────────────────────────────┘

LOGIN REQUEST
     │
     ▼
┌─────────────────┐
│ Email + Password│ ──── OR ───┐
└────────┬────────┘             │
         │                      ▼
         │               ┌──────────────┐
         │               │ OAuth Consent│
         │               │ (Google/     │
         │               │  LinkedIn/   │
         │               │  GitHub)     │
         │               └──────┬───────┘
         │                      │
         ▼                      ▼
┌────────────────────────────────────┐
│      Validate Credentials          │
│  - Check password (bcrypt.compare) │
│  - OR validate OAuth token         │
└────────┬───────────────────────────┘
         │
         ├─ INVALID ──► Return 401
         │
         ▼ VALID
┌────────────────────┐
│  Check 2FA Status  │
└────────┬───────────┘
         │
         ├─ 2FA ENABLED ──► Require TOTP Code
         │                  └─ Verify with speakeasy
         │
         ▼ 2FA DISABLED or VERIFIED
┌──────────────────────────────────┐
│     Generate JWT Tokens          │
│  - Access Token (1 hour)         │
│  - Refresh Token (7 days)        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Set HttpOnly Secure Cookies     │
│  - token (Access)                │
│  - refreshToken                  │
└────────┬─────────────────────────┘
         │
         ▼
    Return Success
```

### 5.2 Authorization Middleware

```javascript
// RBAC Middleware Chain

Request ──► isAuthenticated() ──► hasRole(['admin']) ──► Route Handler
                    │                      │
                    │                      │
                    ▼                      ▼
            Verify JWT              Check user.role
            Check expiry            Match against allowed
            Extract user            Roles array
                    │                      │
                    │                      │
            401 Unauthorized       403 Forbidden
            (Invalid token)        (Insufficient permissions)
```

**Permission Levels:**

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Student** | User | Profile, Applications, Job Search, Messaging |
| **Recruiter** | User + Company | Job Posting, Application Management, Analytics, Payments |
| **Sub-Admin** | Limited Admin | Module-specific permissions (configurable) |
| **Admin** | Full System | All operations, User management, System settings |

### 5.3 Security Layers

```
┌──────────────────────────────────────────────────────┐
│                 SECURITY LAYERS                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. NETWORK LAYER                                    │
│     ✓ HTTPS/TLS 1.3                                  │
│     ✓ CORS with whitelist                            │
│     ✓ DDoS protection (Cloudflare/AWS Shield)        │
│                                                       │
│  2. APPLICATION LAYER                                │
│     ✓ Rate Limiting (Redis-based)                    │
│     ✓ CSRF Token Validation                          │
│     ✓ Security Headers (Helmet.js)                   │
│     ✓ Input Validation (express-validator)           │
│     ✓ XSS Prevention (sanitization)                  │
│                                                       │
│  3. AUTHENTICATION LAYER                             │
│     ✓ JWT with expiration                            │
│     ✓ HttpOnly + Secure cookies                      │
│     ✓ Refresh token rotation                         │
│     ✓ OAuth 2.0 integration                          │
│     ✓ 2FA with TOTP                                  │
│     ✓ CAPTCHA verification                           │
│                                                       │
│  4. AUTHORIZATION LAYER                              │
│     ✓ Role-Based Access Control (RBAC)               │
│     ✓ Route-level permissions                        │
│     ✓ Resource ownership validation                  │
│     ✓ Sub-admin granular permissions                 │
│                                                       │
│  5. DATA LAYER                                       │
│     ✓ Password hashing (bcrypt, 10 rounds)           │
│     ✓ Sensitive data encryption                      │
│     ✓ MongoDB parameterized queries                  │
│     ✓ File upload validation                         │
│     ✓ Cloudinary signed URLs                         │
│                                                       │
│  6. MONITORING LAYER                                 │
│     ✓ Sentry error tracking                          │
│     ✓ Winston audit logging                          │
│     ✓ Activity log for admin actions                 │
│     ✓ Failed login tracking                          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 5.4 Data Protection

**Encryption at Rest:**
- MongoDB: Encryption enabled in production
- Redis: Password-protected
- Cloudinary: Private resource type for sensitive files
- Passwords: bcrypt hashing (10 salt rounds)

**Encryption in Transit:**
- HTTPS/TLS 1.3 for all API calls
- WSS (WebSocket Secure) for Socket.io
- Signed URLs for Cloudinary uploads

**Sensitive Data Handling:**
```javascript
// Example: User password never exposed in API responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.twoFactorAuth.secret;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  return user;
};
```

---

## 6. Deployment Architecture

### 6.1 Production Deployment Diagram

```
                           ┌──────────────────┐
                           │    INTERNET      │
                           └────────┬─────────┘
                                    │
                        ┌───────────▼────────────┐
                        │   DNS / CDN            │
                        │   (Cloudflare)         │
                        └───────────┬────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │   FRONTEND       │  │    BACKEND       │  │   STATIC ASSETS  │
    │   (Vercel)       │  │ (Render/Railway) │  │   (Cloudinary)   │
    │                  │  │                  │  │                  │
    │  - React App     │  │  - Node.js API   │  │  - Images        │
    │  - SSR Support   │  │  - Socket.io     │  │  - Resumes       │
    │  - Edge Caching  │  │  - Rate Limiter  │  │  - Documents     │
    └──────────────────┘  └────────┬─────────┘  └──────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌────────────────┐ ┌──────────┐ ┌─────────────┐
          │   MongoDB      │ │  Redis   │ │  Razorpay   │
          │   (Atlas)      │ │ (Cloud)  │ │   (API)     │
          │                │ │          │ │             │
          │ - Replica Set  │ │ - Cache  │ │ - Payments  │
          │ - Auto Backup  │ │ - Session│ │ - Webhooks  │
          └────────────────┘ └──────────┘ └─────────────┘
                    │              │
                    ▼              ▼
          ┌────────────────┐ ┌──────────┐
          │   Monitoring   │ │  Email   │
          │   (Sentry)     │ │ (SMTP)   │
          └────────────────┘ └──────────┘
```

### 6.2 Container Architecture (Docker)

```yaml
# Docker Compose Structure

┌──────────────────────────────────────────────────┐
│           Docker Compose Network                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  frontend-container                      │    │
│  │  - Image: node:22-alpine                │    │
│  │  - Port: 5173:5173                      │    │
│  │  - Volume: ./frontend:/app              │    │
│  │  - Command: npm run dev                 │    │
│  └─────────────────────────────────────────┘    │
│                    ▲                             │
│                    │ HTTP                        │
│                    ▼                             │
│  ┌─────────────────────────────────────────┐    │
│  │  backend-container                       │    │
│  │  - Image: node:22-alpine                │    │
│  │  - Port: 8000:8000                      │    │
│  │  - Volume: ./backend:/app               │    │
│  │  - Depends: mongodb, redis              │    │
│  │  - Command: npm start                   │    │
│  └─────────────────────────────────────────┘    │
│              ▲           ▲                       │
│              │           │                       │
│  ┌───────────┘           └──────────┐           │
│  │                                   │           │
│  ▼                                   ▼           │
│  ┌──────────────────┐   ┌─────────────────┐    │
│  │  mongodb         │   │  redis          │    │
│  │  - Port: 27017   │   │  - Port: 6379   │    │
│  │  - Volume: data  │   │  - Volume: cache│    │
│  └──────────────────┘   └─────────────────┘    │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 6.3 Environment Configuration

**Development:**
```
Frontend: localhost:5173
Backend:  localhost:8000
MongoDB:  localhost:27017 (local)
Redis:    localhost:6379 (local)
```

**Staging:**
```
Frontend: staging.jobportal.com
Backend:  api-staging.jobportal.com
MongoDB:  MongoDB Atlas (Shared Cluster)
Redis:    Redis Cloud (Free Tier)
```

**Production:**
```
Frontend: app.jobportal.com
Backend:  api.jobportal.com
MongoDB:  MongoDB Atlas (Dedicated Cluster, Replica Set)
Redis:    Redis Cloud (Standard Tier, HA)
CDN:      Cloudflare
Monitoring: Sentry
```

### 6.4 Load Balancing Strategy

```
┌─────────────────────────────────────────────┐
│        Nginx Load Balancer (Layer 7)        │
│                                              │
│  upstream backend {                          │
│    least_conn;  # Connection-based routing   │
│    server backend1:8000 weight=3;           │
│    server backend2:8000 weight=2;           │
│    server backend3:8000 weight=1 backup;    │
│  }                                           │
│                                              │
│  location /api {                             │
│    proxy_pass http://backend;               │
│    proxy_cache backend_cache;               │
│    proxy_cache_valid 200 5m;                │
│  }                                           │
└─────────────────────────────────────────────┘
           │         │         │
           ▼         ▼         ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Backend #1│ │Backend #2│ │Backend #3│
    │(Primary) │ │(Primary) │ │ (Backup) │
    └──────────┘ └──────────┘ └──────────┘
```

---

## 7. Scalability & Performance

### 7.1 Caching Strategy

```
┌──────────────────────────────────────────────────┐
│              CACHING LAYERS                       │
├──────────────────────────────────────────────────┤
│                                                   │
│  1. BROWSER CACHE                                │
│     - Static assets (images, CSS, JS)            │
│     - Cache-Control headers                      │
│     - Service Worker (PWA ready)                 │
│                                                   │
│  2. CDN CACHE (Cloudflare/Vercel)               │
│     - Frontend static files                      │
│     - Edge caching                               │
│     - Automatic purging                          │
│                                                   │
│  3. REDIS APPLICATION CACHE                      │
│     - Job search results (TTL: 5 min)            │
│     - User sessions                              │
│     - Rate limiting counters                     │
│     - Frequently accessed data                   │
│                                                   │
│  4. DATABASE QUERY CACHE                         │
│     - MongoDB index usage                        │
│     - Aggregation pipeline optimization          │
│     - Read replicas for queries                  │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Cache Keys Pattern:**
```
user:profile:{userId}           TTL: 10 min
job:search:{query}:{filters}    TTL: 5 min
company:{companyId}             TTL: 30 min
stats:dashboard:{userId}        TTL: 15 min
ratelimit:{ip}:{endpoint}       TTL: 15 min
```

### 7.2 Database Optimization

**Indexes:**
```javascript
// User Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ 'profile.skills': 1 })
db.users.createIndex({ isVerified: 1, isActive: 1 })

// Job Collection
db.jobs.createIndex({ title: 'text', description: 'text' })
db.jobs.createIndex({ company: 1, isActive: 1 })
db.jobs.createIndex({ location: 1, jobType: 1 })
db.jobs.createIndex({ createdAt: -1 })
db.jobs.createIndex({ expiresAt: 1 })

// Application Collection
db.applications.createIndex({ job: 1, applicant: 1 }, { unique: true })
db.applications.createIndex({ applicant: 1, createdAt: -1 })
db.applications.createIndex({ job: 1, status: 1 })
```

**Query Optimization:**
- Use `.lean()` for read-only operations (faster)
- Populate only required fields
- Limit result sets with pagination
- Use aggregation pipeline for complex queries
- Monitor slow queries with profiling

### 7.3 Horizontal Scaling

```
┌─────────────────────────────────────────────────┐
│         HORIZONTAL SCALING STRATEGY              │
├─────────────────────────────────────────────────┤
│                                                  │
│  FRONTEND:                                       │
│  ✓ Stateless React app                          │
│  ✓ Deploy to CDN (infinite scaling)             │
│  ✓ No session management                        │
│                                                  │
│  BACKEND:                                        │
│  ✓ Stateless API (JWT-based auth)               │
│  ✓ No server-side sessions                      │
│  ✓ Scale out with load balancer                 │
│  ✓ Auto-scaling based on CPU/Memory             │
│                                                  │
│  DATABASE:                                       │
│  ✓ MongoDB Replica Set (3+ nodes)               │
│  ✓ Read from secondaries                        │
│  ✓ Sharding for large datasets (future)         │
│                                                  │
│  CACHE:                                          │
│  ✓ Redis Cluster mode                           │
│  ✓ Sentinel for failover                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 7.4 Performance Metrics

**Target Metrics:**

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 500ms | ~300ms |
| Page Load Time | < 3s | ~2s |
| Database Query Time | < 100ms | ~50ms |
| Cache Hit Ratio | > 80% | ~85% |
| Concurrent Users | 1000+ | Tested up to 500 |
| Throughput | 10k req/min | Tested up to 5k |
| Uptime | 99.9% | Target |

---

## 8. Integration Architecture

### 8.1 Third-Party Integrations

```
┌─────────────────────────────────────────────────┐
│          EXTERNAL INTEGRATIONS                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  AUTHENTICATION                                  │
│  ├─ Google OAuth 2.0                            │
│  ├─ LinkedIn OAuth 2.0                          │
│  └─ GitHub OAuth 2.0                            │
│                                                  │
│  FILE STORAGE                                    │
│  └─ Cloudinary                                  │
│     ├─ Image uploads & transformation           │
│     ├─ Resume storage                           │
│     └─ Document management                      │
│                                                  │
│  PAYMENTS                                        │
│  └─ Razorpay                                    │
│     ├─ Order creation                           │
│     ├─ Payment verification                     │
│     ├─ Webhook handling                         │
│     └─ Refund processing                        │
│                                                  │
│  EMAIL                                           │
│  └─ SMTP (Nodemailer)                           │
│     ├─ Gmail SMTP                               │
│     ├─ SendGrid                                 │
│     └─ AWS SES (future)                         │
│                                                  │
│  MONITORING                                      │
│  └─ Sentry                                      │
│     ├─ Error tracking                           │
│     ├─ Performance monitoring                   │
│     └─ Alerting                                 │
│                                                  │
│  REAL-TIME                                       │
│  └─ Socket.io                                   │
│     ├─ Notifications                            │
│     ├─ Messaging                                │
│     └─ Live updates                             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.2 API Gateway Pattern

```
┌──────────────────────────────────────────┐
│           API Gateway                     │
│                                           │
│  ┌────────────────────────────────────┐ │
│  │  Rate Limiting (Redis)             │ │
│  └────────┬───────────────────────────┘ │
│           │                               │
│  ┌────────▼───────────────────────────┐ │
│  │  Authentication (JWT)              │ │
│  └────────┬───────────────────────────┘ │
│           │                               │
│  ┌────────▼───────────────────────────┐ │
│  │  Request Logging                   │ │
│  └────────┬───────────────────────────┘ │
│           │                               │
│  ┌────────▼───────────────────────────┐ │
│  │  Router (Express)                  │ │
│  └────────┬───────────────────────────┘ │
└───────────┼───────────────────────────────┘
            │
     ┌──────┴────────┬────────────┐
     │               │            │
     ▼               ▼            ▼
┌─────────┐    ┌─────────┐  ┌─────────┐
│  User   │    │   Job   │  │ Payment │
│ Service │    │ Service │  │ Service │
└─────────┘    └─────────┘  └─────────┘
```

### 8.3 Event-Driven Architecture

```
┌──────────────────────────────────────────────────┐
│         EVENT-DRIVEN FLOW (Socket.io)            │
└──────────────────────────────────────────────────┘

APPLICATION STATUS UPDATED
          │
          ▼
┌─────────────────────┐
│  Event Emitter      │
│  emit('statusUpdate'│
│   , applicationData)│
└────────┬────────────┘
         │
         ├─────────────┬─────────────┬─────────────┐
         │             │             │             │
         ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Socket.io    │ │ Database │ │  Email   │ │  Audit   │
│ Broadcast    │ │  Save    │ │  Queue   │ │   Log    │
└──────┬───────┘ └──────────┘ └──────────┘ └──────────┘
       │
       │ To: applicant's room
       ▼
┌──────────────────┐
│ Connected Clients│
│ (Job Seekers)    │
└──────────────────┘
       │
       ▼
   UI Updates
```

---

## Appendices

### A. Technology Versions

```
Node.js:        v22.x
MongoDB:        v5.x
Redis:          v6.x
React:          v18.x
Express:        v4.x
Socket.io:      v4.x
Mongoose:       v8.x
```

### B. Port Configuration

```
Development:
- Frontend:     5173
- Backend:      8000
- MongoDB:      27017
- Redis:        6379
- Socket.io:    8000 (same as backend)

Production:
- All via HTTPS (443)
- Internal ports behind load balancer
```

### C. Monitoring Dashboards

**Available Metrics:**
- API Response Times (p50, p95, p99)
- Error Rates
- Database Query Performance
- Cache Hit/Miss Ratios
- User Activity Metrics
- System Resource Usage

**Tools:**
- Sentry: Error tracking & performance
- MongoDB Atlas: Database metrics
- Redis Cloud: Cache metrics
- Vercel/Render: Deployment metrics

---

**Last Updated:** January 16, 2026  
**Version:** 2.0  
**Status:** Production Ready
