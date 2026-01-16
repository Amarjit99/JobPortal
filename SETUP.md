# 🚀 Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account

## Initial Setup

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=8000
NODE_ENV=development
LOG_LEVEL=info

MONGO_URI=mongodb://localhost:27017/jobportal
SECRET_KEY=your_super_secret_jwt_key_change_this

CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

FRONTEND_URL=http://localhost:5173

# Optional: reCAPTCHA Configuration (v2 Checkbox)
# Get keys from https://www.google.com/recaptcha/admin
RECAPTCHA_ENABLED=false
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Optional: OAuth Configuration (Disabled by default)
# Google OAuth - Get credentials from https://console.cloud.google.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# LinkedIn OAuth - Get credentials from https://www.linkedin.com/developers
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:8000/api/v1/auth/linkedin/callback

# GitHub OAuth - Get credentials from https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback
```

### 3. Configure Frontend Environment (Optional)

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` if needed:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1

# reCAPTCHA Configuration (must match backend)
VITE_RECAPTCHA_ENABLED=false
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

> **Note:** reCAPTCHA and OAuth are disabled by default for easier development. Enable them when ready by following the configuration guides.

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1

## Features

### User Roles
- **Student/Job Seeker**: Browse and apply for jobs
- **Recruiter**: Post jobs, manage companies, view applicants

### Available Routes

**Public:**
- `/` - Home page
- `/login` - Login
- `/signup` - Sign up
- `/jobs` - Browse jobs
- `/browse` - Browse companies
- `/description/:id` - Job details

**Student/Job Seeker:**
- `/profile` - User profile

**Recruiter (Protected):**
- `/admin/companies` - Manage companies
- `/admin/companies/create` - Create company
- `/admin/companies/:id` - Edit company
- `/admin/jobs` - Manage jobs
- `/admin/jobs/create` - Post job
- `/admin/jobs/:id/applicants` - View applicants

## API Endpoints

### Authentication
- `POST /api/v1/user/register` - Register user
- `POST /api/v1/user/login` - Login
- `GET /api/v1/user/logout` - Logout
- `POST /api/v1/user/profile/update` - Update profile

### Companies (Recruiter only)
- `POST /api/v1/company/register` - Register company
- `GET /api/v1/company/get` - Get user's companies
- `GET /api/v1/company/get/:id` - Get company details
- `PUT /api/v1/company/update/:id` - Update company

### Jobs
- `POST /api/v1/job/post` - Post job (Recruiter)
- `GET /api/v1/job/get` - Get all jobs
- `GET /api/v1/job/get/:id` - Get job details
- `GET /api/v1/job/getadminjobs` - Get recruiter's jobs

### Applications
- `GET /api/v1/application/apply/:id` - Apply for job
- `GET /api/v1/application/get` - Get applied jobs
- `GET /api/v1/application/:id/applicants` - Get job applicants (Recruiter)
- `POST /api/v1/application/status/:id/update` - Update application status (Recruiter)

## Security Features

✅ JWT authentication with httpOnly cookies  
✅ Password hashing with bcrypt  
✅ Account locking after 5 failed login attempts (30-minute lockout)  
✅ Email notifications for security events  
✅ Rate limiting on all routes  
✅ Input validation on all endpoints  
✅ File upload restrictions (5MB, specific types)  
✅ CORS protection  
✅ Optional: reCAPTCHA v2 protection (disabled by default)  
✅ Optional: OAuth integration (Google, LinkedIn, GitHub - disabled by default)  

### Enabling reCAPTCHA Protection

1. **Get reCAPTCHA v2 Keys**
   - Visit https://www.google.com/recaptcha/admin
   - Choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - Add your domains (localhost for development)
   - Copy Site Key and Secret Key

2. **Configure Backend**
   ```env
   RECAPTCHA_ENABLED=true
   RECAPTCHA_SITE_KEY=your_site_key_here
   RECAPTCHA_SECRET_KEY=your_secret_key_here
   ```

3. **Configure Frontend**
   ```env
   VITE_RECAPTCHA_ENABLED=true
   VITE_RECAPTCHA_SITE_KEY=your_site_key_here
   ```

4. **Restart Both Servers**

> ⚠️ **Important:** Both frontend and backend must use the same Site Key, and keys must be for reCAPTCHA v2 Checkbox (not v3).

### Enabling OAuth Login (Google, LinkedIn, GitHub)

All three OAuth providers are supported and disabled by default. Enable any or all of them:

#### Google OAuth

1. **Get Credentials**
   - Visit https://console.cloud.google.com
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `http://localhost:8000/api/v1/auth/google/callback`

2. **Configure Backend**
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
   ```

#### LinkedIn OAuth

1. **Get Credentials**
   - Visit https://www.linkedin.com/developers
   - Create an app and request "Sign In with LinkedIn" product
   - Add redirect URL: `http://localhost:8000/api/v1/auth/linkedin/callback`

2. **Configure Backend**
   ```env
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_CALLBACK_URL=http://localhost:8000/api/v1/auth/linkedin/callback
   ```

#### GitHub OAuth

1. **Get Credentials**
   - Visit https://github.com/settings/developers
   - Create OAuth App
   - Add callback URL: `http://localhost:8000/api/v1/auth/github/callback`

2. **Configure Backend**
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback
   ```

3. **Restart Backend Server**

For detailed setup guides, see:
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - Google OAuth configuration
- [LINKEDIN_OAUTH_SETUP.md](LINKEDIN_OAUTH_SETUP.md) - LinkedIn OAuth configuration
- [GITHUB_OAUTH_SETUP.md](GITHUB_OAUTH_SETUP.md) - GitHub OAuth configuration
- [ACCOUNT_LOCKING_GUIDE.md](ACCOUNT_LOCKING_GUIDE.md) - Account security details

## Logging

Logs are stored in `backend/logs/`:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `exceptions-YYYY-MM-DD.log` - Unhandled exceptions
- `rejections-YYYY-MM-DD.log` - Promise rejections

Logs rotate daily and are kept for 14 days.

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env
- For MongoDB Atlas, whitelist your IP

### Cloudinary Upload Error
- Verify Cloudinary credentials in .env
- Check file size (max 5MB)
- Ensure file type is supported (JPEG, PNG, WEBP, PDF)

### CORS Error
- Check FRONTEND_URL in backend .env
- Ensure frontend is running on correct port

### reCAPTCHA Error "Invalid key type"
- Ensure you're using **reCAPTCHA v2 Checkbox** keys (not v3)
- Both frontend and backend must use the same Site Key
- Set `VITE_RECAPTCHA_ENABLED=false` in frontend/.env to disable
- Set `RECAPTCHA_ENABLED=false` in backend/.env to disable
- Restart both servers after changing configuration

### OAuth Not Working (Google/LinkedIn/GitHub)
- Verify Client ID and Secret in backend/.env
- Check redirect URI matches exactly (no trailing slashes)
- **Google**: `http://localhost:8000/api/v1/auth/google/callback`
- **LinkedIn**: `http://localhost:8000/api/v1/auth/linkedin/callback`
- **GitHub**: `http://localhost:8000/api/v1/auth/github/callback`
- OAuth providers are disabled by default - add credentials to enable
- Restart backend server after adding credentials
- Check browser console for CORS errors

### Account Locked
- Wait 30 minutes for automatic unlock
- Or reset password using "Forgot Password" link
- Check email for lock notification with unlock time

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Backend uses `nodemon`
- Frontend uses Vite HMR

### Testing API with Postman/Thunder Client
1. Register/Login to get authentication cookie
2. Use cookie for authenticated requests
3. Set `withCredentials: true` in axios

### Database Inspection
```bash
mongosh
use jobportal
db.users.find()
db.jobs.find()
db.companies.find()
db.applications.find()
```

## Production Deployment

Before deploying:

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use production MongoDB URI
   - Update `FRONTEND_URL` to production domain
   - Generate strong `SECRET_KEY`

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Security Checklist**
   - ✅ All environment variables set
   - ✅ Strong JWT secret
   - ✅ MongoDB secured
   - ✅ HTTPS enabled
   - ✅ CORS configured for production domain

4. **Recommended Hosting**
   - Backend: Render, Railway, AWS
   - Frontend: Vercel, Netlify, Cloudflare Pages
   - Database: MongoDB Atlas

## Support

Refer to [IMPROVEMENTS.md](IMPROVEMENTS.md) for detailed information about all changes and improvements.
