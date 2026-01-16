# API Quick Reference

## 🚀 Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://job-portal-api.onrender.com`

## 📖 Full Documentation

- **Swagger UI:** http://localhost:8000/api-docs
- **OpenAPI JSON:** http://localhost:8000/api-docs.json
- **Postman Collection:** `Job_Portal_API.postman_collection.json`
- **Usage Guide:** `API_USAGE_GUIDE.md`

---

## 🔐 Authentication

All authenticated endpoints require JWT token in HTTP-only cookie (automatically sent after login).

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/user/register` | ❌ | Register new user |
| POST | `/api/v1/user/login` | ❌ | Login user |
| GET | `/api/v1/user/logout` | ✅ | Logout user |
| POST | `/api/v1/user/forgot-password` | ❌ | Request password reset |
| POST | `/api/v1/user/reset-password` | ❌ | Reset password with token |
| POST | `/api/v1/user/verify-email` | ❌ | Verify email with token |
| POST | `/api/v1/user/resend-verification` | ❌ | Resend verification email |

---

## 👤 User Profile

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/user/profile` | ✅ | All | Get user profile |
| POST | `/api/v1/user/profile/update` | ✅ | All | Update profile |
| GET | `/api/v1/user/saved-jobs` | ✅ | Student | Get saved jobs |
| POST | `/api/v1/user/save-job` | ✅ | Student | Save a job |
| POST | `/api/v1/user/unsave-job` | ✅ | Student | Unsave a job |
| GET | `/api/v1/user/notification-preferences` | ✅ | All | Get notification settings |
| PUT | `/api/v1/user/email-notifications` | ✅ | All | Update email notifications |
| PUT | `/api/v1/user/job-alert-preferences` | ✅ | Student | Update job alerts |
| GET | `/api/v1/user/all` | ✅ | Admin | Get all users (paginated) |

---

## 💼 Jobs

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/job/get` | ❌ | All | Get all jobs (with filters) |
| GET | `/api/v1/job/get/:id` | ❌ | All | Get job by ID |
| GET | `/api/v1/job/getadminjobs` | ✅ | Recruiter | Get jobs created by recruiter |
| POST | `/api/v1/job/post` | ✅ | Recruiter | Create new job |
| PUT | `/api/v1/job/update/:id` | ✅ | Recruiter | Update job |
| DELETE | `/api/v1/job/delete/:id` | ✅ | Recruiter | Delete job |

### Query Parameters for GET /api/v1/job/get

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| keyword | string | Search in title/description | `keyword=software` |
| location | string | Filter by location | `location=San Francisco` |
| jobType | string | Filter by job type | `jobType=Full-time` |
| salary | number | Minimum salary | `salary=100000` |
| page | number | Page number | `page=1` |
| limit | number | Jobs per page | `limit=10` |

---

## 🏢 Companies

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/company/get` | ❌ | All | Get all companies |
| GET | `/api/v1/company/get/:id` | ❌ | All | Get company by ID |
| POST | `/api/v1/company/register` | ✅ | Recruiter | Register new company |
| PUT | `/api/v1/company/update/:id` | ✅ | Recruiter | Update company |

---

## 📝 Applications

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/application/apply/:id` | ✅ | Student | Apply for job |
| GET | `/api/v1/application/getallappliedjobs` | ✅ | Student | Get user's applications |
| GET | `/api/v1/application/:id/applicants` | ✅ | Recruiter | Get job applicants |
| POST | `/api/v1/application/status/:id/update` | ✅ | Recruiter | Update application status |
| GET | `/api/v1/application/get` | ✅ | All | Get applications |

---

## 📊 Analytics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/analytics/dashboard` | ✅ | Admin | Get platform analytics |
| GET | `/api/v1/recruiter-analytics/overview` | ✅ | Recruiter | Get recruiter overview |
| GET | `/api/v1/recruiter-analytics/jobs` | ✅ | Recruiter | Get jobs analytics |
| GET | `/api/v1/recruiter-analytics/applications` | ✅ | Recruiter | Get applications analytics |

---

## 🔧 Admin Operations

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/admin/users` | ✅ | Admin | Get all users |
| DELETE | `/api/v1/admin/users/:id` | ✅ | Admin | Delete user |
| PUT | `/api/v1/admin/users/:id/role` | ✅ | Admin | Update user role |
| GET | `/api/v1/moderation/flagged-content` | ✅ | Admin | Get flagged content |
| POST | `/api/v1/moderation/review/:id` | ✅ | Admin | Review flagged content |
| GET | `/api/v1/settings` | ✅ | Admin | Get site settings |
| PUT | `/api/v1/settings` | ✅ | Admin | Update settings |
| GET | `/api/v1/email-templates` | ✅ | Admin | Get email templates |
| PUT | `/api/v1/email-templates/:id` | ✅ | Admin | Update email template |

---

## 💳 Payments & Plans

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/employer-plans` | ❌ | All | Get all employer plans |
| POST | `/api/v1/payment/create-order` | ✅ | Recruiter | Create payment order |
| POST | `/api/v1/payment/verify-payment` | ✅ | Recruiter | Verify payment |
| GET | `/api/v1/payment/history` | ✅ | Recruiter | Get payment history |
| GET | `/api/v1/resume-credits` | ✅ | Recruiter | Get resume credits |
| POST | `/api/v1/resume-credits/use` | ✅ | Recruiter | Use resume credit |

---

## 🎯 Featured Jobs

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/featured-jobs` | ❌ | All | Get featured jobs |
| POST | `/api/v1/featured-jobs` | ✅ | Recruiter | Create featured job |
| DELETE | `/api/v1/featured-jobs/:id` | ✅ | Recruiter | Remove featured job |

---

## 💬 Messages & Interviews

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/messages` | ✅ | All | Get messages |
| POST | `/api/v1/messages/send` | ✅ | All | Send message |
| GET | `/api/v1/interviews` | ✅ | All | Get interviews |
| POST | `/api/v1/interviews` | ✅ | Recruiter | Schedule interview |
| PUT | `/api/v1/interviews/:id` | ✅ | All | Update interview |

---

## 📄 Resume & Education

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/user/resume` | ✅ | Student | Get resume |
| POST | `/api/v1/user/resume` | ✅ | Student | Create/update resume |
| POST | `/api/v1/user/education` | ✅ | Student | Add education |
| PUT | `/api/v1/user/education/:id` | ✅ | Student | Update education |
| DELETE | `/api/v1/user/education/:id` | ✅ | Student | Delete education |
| POST | `/api/v1/user/experience` | ✅ | Student | Add experience |
| PUT | `/api/v1/user/experience/:id` | ✅ | Student | Update experience |
| DELETE | `/api/v1/user/experience/:id` | ✅ | Student | Delete experience |
| POST | `/api/v1/user/certifications` | ✅ | Student | Add certification |
| DELETE | `/api/v1/user/certifications/:id` | ✅ | Student | Delete certification |

---

## 🔒 Security

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/csrf-token` | ❌ | All | Get CSRF token |
| POST | `/api/v1/2fa/enable` | ✅ | All | Enable 2FA |
| POST | `/api/v1/2fa/verify` | ✅ | All | Verify 2FA code |
| POST | `/api/v1/2fa/disable` | ✅ | All | Disable 2FA |

---

## 🏥 Health & Monitoring

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Basic health check |
| GET | `/api/v1/monitoring/health` | ✅ | Detailed health status |
| GET | `/api/v1/monitoring/metrics` | ✅ | System metrics |

---

## ⚠️ Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🚦 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| File Uploads | 10 requests | 15 minutes |

---

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detail 1", "Detail 2"]
}
```

---

## 🔑 Required Headers

### For JSON Requests
```
Content-Type: application/json
```

### For File Uploads
```
Content-Type: multipart/form-data
```

### For CSRF Protected Endpoints
```
X-CSRF-Token: <token_from_/csrf-token>
```

---

## 💡 Quick Start Examples

### Login
```bash
curl -X POST http://localhost:8000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","role":"student"}'
```

### Get Jobs
```bash
curl http://localhost:8000/api/v1/job/get?keyword=software&location=SF
```

### Apply for Job
```bash
curl -X GET http://localhost:8000/api/v1/application/apply/JOB_ID \
  -b "token=YOUR_JWT_TOKEN"
```

---

## 📚 Additional Resources

- **Swagger UI:** Interactive API testing at `/api-docs`
- **Postman Collection:** Pre-configured requests in `Job_Portal_API.postman_collection.json`
- **Usage Guide:** Comprehensive guide in `API_USAGE_GUIDE.md`
- **Setup Guide:** Implementation details in `API_DOCUMENTATION_GUIDE.md`

---

**Last Updated:** January 2026  
**API Version:** 2.0.0
