import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Portal API',
      version: '2.0.0',
      description: `
        Complete REST API for Job Portal platform.
        
        ## Features
        - User authentication (JWT)
        - Job posting and management
        - Company profiles
        - Job applications
        - Admin operations
        - File uploads (resume, logos)
        
        ## Authentication
        Most endpoints require authentication using JWT tokens.
        After login, a token is set in HTTP-only cookie.
        
        ## Rate Limiting
        - Authentication: 5 requests per 15 minutes
        - General API: 100 requests per 15 minutes
      `,
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
        url: 'https://api.jobportal.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in httpOnly cookie'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullname: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phoneNumber: { type: 'number' },
            role: { type: 'string', enum: ['student', 'recruiter'] },
            profile: {
              type: 'object',
              properties: {
                bio: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                resume: { type: 'string' },
                resumeOriginalName: { type: 'string' },
                company: { type: 'string' },
                profilePhoto: { type: 'string' }
              }
            }
          }
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            location: { type: 'string' },
            logo: { type: 'string' },
            userId: { type: 'string' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
            salary: { type: 'number' },
            experienceLevel: { type: 'number' },
            location: { type: 'string' },
            jobType: { type: 'string' },
            position: { type: 'number' },
            company: { type: 'string' },
            created_by: { type: 'string' },
            applications: { type: 'array', items: { type: 'string' } }
          }
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            job: { type: 'string' },
            applicant: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Email Verification', description: 'Email verification and password reset endpoints' },
      { name: 'Companies', description: 'Company management endpoints (Recruiter only)' },
      { name: 'Jobs', description: 'Job posting and listing endpoints' },
      { name: 'Applications', description: 'Job application endpoints' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
