# API Usage Guide

## 📘 Complete API Documentation

This guide provides comprehensive documentation for the Job Portal API including authentication, endpoints, request/response examples, and best practices.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [Best Practices](#best-practices)
7. [Code Examples](#code-examples)

---

## 🚀 Getting Started

### Base URLs

- **Development:** `http://localhost:8000`
- **Production:** `https://job-portal-api.onrender.com`

### API Documentation

- **Swagger UI:** `http://localhost:8000/api-docs`
- **OpenAPI JSON:** `http://localhost:8000/api-docs.json`

### Postman Collection

Import the Postman collection: `Job_Portal_API.postman_collection.json`

1. Open Postman
2. Click Import
3. Select the JSON file
4. Set environment variable `baseUrl` to your API URL

---

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication. Tokens are stored in HTTP-only cookies.

### Authentication Flow

```
1. Register/Login → Receive JWT token in cookie
2. Make authenticated requests → Token sent automatically
3. Logout → Token cleared from cookie
```

### Register User

**Endpoint:** `POST /api/v1/user/register`

**Request (multipart/form-data):**
```javascript
{
  fullname: "John Doe",
  email: "john@example.com",
  phoneNumber: "+1234567890",
  password: "password123",
  role: "student", // or "recruiter"
  file: <profile_photo.jpg> // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

### Login User

**Endpoint:** `POST /api/v1/user/login`

**Request (application/json):**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Welcome back, John Doe",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "profile": {
      "bio": "",
      "skills": [],
      "profilePhoto": ""
    }
  }
}
```

**Headers:**
```
Set-Cookie: token=<jwt_token>; Path=/; HttpOnly; SameSite=Strict
```

### Logout User

**Endpoint:** `GET /api/v1/user/logout`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📚 API Endpoints

### User Profile

#### Get User Profile

**Endpoint:** `GET /api/v1/user/profile`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "role": "student",
    "profile": {
      "bio": "Software developer",
      "skills": ["JavaScript", "React", "Node.js"],
      "resume": "https://cloudinary.com/resume.pdf",
      "resumeOriginalName": "john_resume.pdf",
      "profilePhoto": "https://cloudinary.com/photo.jpg"
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Update User Profile

**Endpoint:** `POST /api/v1/user/profile/update`

**Authentication:** Required

**Request (multipart/form-data):**
```javascript
{
  fullname: "John Doe Updated",
  email: "john.new@example.com",
  phoneNumber: "+1234567890",
  bio: "Experienced software developer",
  skills: "JavaScript, React, Node.js, MongoDB",
  file: <resume.pdf> // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

### Jobs

#### Get All Jobs

**Endpoint:** `GET /api/v1/job/get`

**Authentication:** Optional (public endpoint)

**Query Parameters:**
- `keyword` (string): Search by job title or description
- `location` (string): Filter by location
- `jobType` (string): Filter by job type (Full-time, Part-time, Contract, Internship)
- `salary` (number): Minimum salary
- `page` (number): Page number (default: 1)
- `limit` (number): Jobs per page (default: 10)

**Example:** `GET /api/v1/job/get?keyword=software&location=San%20Francisco&jobType=Full-time`

**Response (200):**
```json
{
  "success": true,
  "jobs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Senior Software Engineer",
      "description": "We are looking for...",
      "requirements": ["5+ years", "React", "Node.js"],
      "salary": 120000,
      "experienceLevel": 5,
      "location": "San Francisco, CA",
      "jobType": "Full-time",
      "position": 3,
      "company": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Tech Corp",
        "logo": "https://cloudinary.com/logo.png"
      },
      "created_by": "507f1f77bcf86cd799439013",
      "applications": ["app1", "app2"],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalJobs": 45
  }
}
```

#### Get Job by ID

**Endpoint:** `GET /api/v1/job/get/:id`

**Authentication:** Optional

**Response (200):**
```json
{
  "success": true,
  "job": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Senior Software Engineer",
    "description": "We are looking for...",
    "requirements": ["5+ years", "React", "Node.js"],
    "salary": 120000,
    "experienceLevel": 5,
    "location": "San Francisco, CA",
    "jobType": "Full-time",
    "position": 3,
    "company": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Tech Corp",
      "description": "Leading tech company",
      "website": "https://techcorp.com",
      "location": "San Francisco, CA",
      "logo": "https://cloudinary.com/logo.png"
    },
    "applications": [],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Post Job (Recruiter Only)

**Endpoint:** `POST /api/v1/job/post`

**Authentication:** Required (recruiter role)

**Request (application/json):**
```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer...",
  "requirements": ["5+ years experience", "React", "Node.js", "MongoDB"],
  "salary": 120000,
  "location": "San Francisco, CA",
  "jobType": "Full-time",
  "experienceLevel": 5,
  "position": 3,
  "companyId": "507f1f77bcf86cd799439012"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "New job created successfully",
  "job": { /* job object */ }
}
```

#### Update Job (Recruiter Only)

**Endpoint:** `PUT /api/v1/job/update/:id`

**Authentication:** Required (recruiter role, must own the job)

**Request (application/json):**
```json
{
  "title": "Senior Software Engineer (Updated)",
  "salary": 130000,
  "position": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job information updated",
  "job": { /* updated job object */ }
}
```

#### Delete Job (Recruiter Only)

**Endpoint:** `DELETE /api/v1/job/delete/:id`

**Authentication:** Required (recruiter role, must own the job)

**Response (200):**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### Companies

#### Get All Companies

**Endpoint:** `GET /api/v1/company/get`

**Authentication:** Optional

**Response (200):**
```json
{
  "success": true,
  "companies": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Tech Corp Inc.",
      "description": "Leading technology company",
      "website": "https://techcorp.com",
      "location": "San Francisco, CA",
      "logo": "https://cloudinary.com/logo.png",
      "userId": "507f1f77bcf86cd799439013",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Register Company (Recruiter Only)

**Endpoint:** `POST /api/v1/company/register`

**Authentication:** Required (recruiter role)

**Request (application/json):**
```json
{
  "name": "Tech Corp Inc.",
  "description": "Leading technology company specializing in AI",
  "website": "https://techcorp.com",
  "location": "San Francisco, CA"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "company": { /* company object */ }
}
```

#### Update Company (Recruiter Only)

**Endpoint:** `PUT /api/v1/company/update/:id`

**Authentication:** Required (recruiter role, must own the company)

**Request (multipart/form-data):**
```javascript
{
  name: "Tech Corp Inc. (Updated)",
  description: "Leading AI and cloud technology company",
  website: "https://techcorp.com",
  location: "San Francisco, CA",
  file: <company_logo.png> // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Company information updated",
  "company": { /* updated company object */ }
}
```

### Applications

#### Apply for Job

**Endpoint:** `GET /api/v1/application/apply/:id`

**Authentication:** Required (student role)

**Parameters:**
- `:id` - Job ID

**Response (201):**
```json
{
  "success": true,
  "message": "Applied successfully"
}
```

**Error Responses:**
- `400` - Already applied to this job
- `404` - Job not found

#### Get Applied Jobs

**Endpoint:** `GET /api/v1/application/getallappliedjobs`

**Authentication:** Required (student role)

**Response (200):**
```json
{
  "success": true,
  "applications": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "job": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Senior Software Engineer",
        "company": {
          "name": "Tech Corp",
          "logo": "https://cloudinary.com/logo.png"
        }
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Get Job Applicants (Recruiter Only)

**Endpoint:** `GET /api/v1/application/:id/applicants`

**Authentication:** Required (recruiter role)

**Parameters:**
- `:id` - Job ID

**Response (200):**
```json
{
  "success": true,
  "job": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Senior Software Engineer",
    "applications": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "applicant": {
          "_id": "507f1f77bcf86cd799439015",
          "fullname": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "+1234567890",
          "profile": {
            "bio": "Software developer",
            "skills": ["JavaScript", "React"],
            "resume": "https://cloudinary.com/resume.pdf"
          }
        },
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

#### Update Application Status (Recruiter Only)

**Endpoint:** `POST /api/v1/application/status/:id/update`

**Authentication:** Required (recruiter role)

**Parameters:**
- `:id` - Application ID

**Request (application/json):**
```json
{
  "status": "accepted"  // or "rejected"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "application": { /* updated application object */ }
}
```

---

## ⚠️ Error Codes

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data, validation errors |
| 401 | Unauthorized | Not authenticated, invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Common Error Examples

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied. Recruiter role required"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Job not found"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## 🚦 Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication (/login, /register) | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| File Uploads | 10 requests | 15 minutes |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## 💡 Best Practices

### 1. Always Handle Errors

```javascript
try {
  const response = await axios.post('/api/v1/user/login', credentials);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error(error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    // Something else happened
    console.error('Error', error.message);
  }
}
```

### 2. Use Environment Variables

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### 3. Include Credentials

Always include credentials to send cookies:

```javascript
axios.defaults.withCredentials = true;

// or per request
axios.get('/api/v1/user/profile', { withCredentials: true });
```

### 4. Validate Data Client-Side

Validate data before sending to reduce API calls:

```javascript
if (!email || !password) {
  return { error: 'Email and password required' };
}
```

### 5. Handle File Uploads Properly

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fullname', 'John Doe');

await axios.post('/api/v1/user/profile/update', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 💻 Code Examples

### JavaScript/Node.js (Axios)

```javascript
import axios from 'axios';

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Register user
async function register(userData) {
  try {
    const formData = new FormData();
    formData.append('fullname', userData.fullname);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('phoneNumber', userData.phoneNumber);
    formData.append('role', userData.role);
    if (userData.file) {
      formData.append('file', userData.file);
    }

    const response = await api.post('/api/v1/user/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Login user
async function login(credentials) {
  try {
    const response = await api.post('/api/v1/user/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Get all jobs with filters
async function getJobs(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/v1/job/get?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Apply for job
async function applyForJob(jobId) {
  try {
    const response = await api.get(`/api/v1/application/apply/${jobId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
```

### React Example

```javascript
import { useState } from 'react';
import axios from 'axios';

function LoginForm() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/user/login',
        credentials,
        { withCredentials: true }
      );

      console.log('Login successful:', response.data);
      // Redirect or update state
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Password"
      />
      <select
        value={credentials.role}
        onChange={(e) => setCredentials({ ...credentials, role: e.target.value })}
      >
        <option value="student">Student</option>
        <option value="recruiter">Recruiter</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Python (Requests)

```python
import requests

class JobPortalAPI:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password, role='student'):
        url = f'{self.base_url}/api/v1/user/login'
        data = {
            'email': email,
            'password': password,
            'role': role
        }
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def get_jobs(self, **filters):
        url = f'{self.base_url}/api/v1/job/get'
        response = self.session.get(url, params=filters)
        response.raise_for_status()
        return response.json()
    
    def apply_for_job(self, job_id):
        url = f'{self.base_url}/api/v1/application/apply/{job_id}'
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

# Usage
api = JobPortalAPI()
api.login('john@example.com', 'password123')
jobs = api.get_jobs(keyword='software', location='San Francisco')
print(f'Found {len(jobs["jobs"])} jobs')
```

---

## 📞 Support

- **Documentation:** http://localhost:8000/api-docs
- **Email:** support@jobportal.com
- **GitHub:** [Repository Issues](https://github.com/yourrepo/issues)

---

**Last Updated:** January 2026  
**API Version:** 2.0.0
