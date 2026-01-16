# API Documentation Setup Guide

## 📋 Overview

Complete API documentation for Job Portal using Swagger/OpenAPI 3.0 specification.

---

## 🚀 Installation

```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
```

---

## 📝 Swagger Configuration

Create `backend/config/swagger.js`:

```javascript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Portal API',
      version: '2.0.0',
      description: 'Complete API documentation for Job Portal platform',
      contact: {
        name: 'API Support',
        email: 'support@jobportal.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
      {
        url: 'https://job-portal-api.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token in HTTP-only cookie',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'User not authenticated' },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'User lacks required permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Access denied' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Validation error' },
                  errors: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'User', description: 'User profile management' },
      { name: 'Job', description: 'Job posting management' },
      { name: 'Company', description: 'Company profile management' },
      { name: 'Application', description: 'Job application management' },
      { name: 'Admin', description: 'Admin operations' },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to API docs
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

## 🔧 Setup Swagger UI

Update `backend/index.js`:

```javascript
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Job Portal API Documentation',
}));

// JSON endpoint for OpenAPI spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ... rest of your app
```

---

## 📚 API Documentation Examples

### Authentication Endpoints

Add to `backend/routes/user.route.js`:

```javascript
/**
 * @swagger
 * /api/v1/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - phoneNumber
 *               - password
 *               - role
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: '+1234567890'
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [student, recruiter]
 *                 example: student
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [student, recruiter, admin]
 *                 example: student
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=abcde12345; Path=/; HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Welcome back, John Doe
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Incorrect password
 */

/**
 * @swagger
 * /api/v1/user/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
```

### Schemas

Add to `backend/config/swagger.js`:

```javascript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fullname: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        role: { type: 'string', enum: ['student', 'recruiter', 'admin'] },
        profile: {
          type: 'object',
          properties: {
            bio: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            resume: { type: 'string' },
            resumeOriginalName: { type: 'string' },
            company: { type: 'string' },
            profilePhoto: { type: 'string' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    Job: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        title: { type: 'string', example: 'Senior Software Engineer' },
        description: { type: 'string' },
        requirements: { type: 'array', items: { type: 'string' } },
        salary: { type: 'number', example: 120000 },
        location: { type: 'string', example: 'San Francisco, CA' },
        jobType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
        position: { type: 'number', example: 3 },
        company: { $ref: '#/components/schemas/Company' },
        created_by: { type: 'string' },
        applications: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    Company: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string', example: 'Tech Corp' },
        description: { type: 'string' },
        website: { type: 'string', example: 'https://techcorp.com' },
        location: { type: 'string', example: 'San Francisco, CA' },
        logo: { type: 'string' },
        userId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    Application: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        job: { $ref: '#/components/schemas/Job' },
        applicant: { $ref: '#/components/schemas/User' },
        status: {
          type: 'string',
          enum: ['pending', 'accepted', 'rejected'],
          example: 'pending',
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}
```

---

## 🔍 Access Documentation

Once implemented:

- **Swagger UI:** http://localhost:8000/api-docs
- **OpenAPI JSON:** http://localhost:8000/api-docs.json
- **Production:** https://your-api.com/api-docs

---

## 📖 Full Documentation Structure

1. **Authentication**
   - POST /api/v1/user/register
   - POST /api/v1/user/login
   - GET /api/v1/user/logout

2. **User Profile**
   - GET /api/v1/user/profile
   - POST /api/v1/user/profile/update

3. **Jobs**
   - GET /api/v1/job/get
   - GET /api/v1/job/getadminjobs
   - GET /api/v1/job/get/:id
   - POST /api/v1/job/post

4. **Companies**
   - GET /api/v1/company/get
   - GET /api/v1/company/get/:id
   - POST /api/v1/company/register
   - PUT /api/v1/company/update/:id

5. **Applications**
   - GET /api/v1/application/get
   - GET /api/v1/application/:id/applicants
   - GET /api/v1/application/getallappliedjobs
   - POST /api/v1/application/apply/:id
   - POST /api/v1/application/status/:id/update

6. **Admin**
   - GET /api/v1/admin/users
   - GET /api/v1/admin/stats
   - DELETE /api/v1/admin/users/:id
   - PUT /api/v1/admin/users/:id/role

---

**Next:** Apply documentation to all routes
