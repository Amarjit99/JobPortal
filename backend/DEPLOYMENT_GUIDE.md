# Backend Deployment Guide - Render/Railway

## 📋 Overview

This guide covers deploying the Node.js/Express backend to cloud platforms:
- **Render** (Recommended - Free tier available)
- **Railway** (Alternative)
- **AWS EC2** (For advanced users)

---

## 🚀 Option 1: Deploy to Render (Recommended)

### Prerequisites
- Render account (free tier available)
- GitHub repository
- MongoDB Atlas database
- Cloudinary account

### Step 1: Prepare Backend

#### 1.1 Create `render.yaml`

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: job-portal-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
      - key: MONGO_URI
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: REFRESH_TOKEN_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://your-frontend.vercel.app
      - key: CLOUD_NAME
        sync: false
      - key: API_KEY
        sync: false
      - key: API_SECRET
        sync: false
    healthCheckPath: /health
    autoDeploy: true
```

#### 1.2 Add Health Check Endpoint

Add to `backend/index.js`:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

#### 1.3 Update CORS Configuration

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://job-portal-frontend.vercel.app',
  'https://www.yourdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Step 2: Deploy to Render

#### Via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** job-portal-backend
   - **Region:** Oregon (Free tier)
   - **Branch:** main
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8000
   MONGO_URI=mongodb+srv://...
   SECRET_KEY=your_jwt_secret_here
   REFRESH_TOKEN_SECRET=your_refresh_secret_here
   FRONTEND_URL=https://your-frontend.vercel.app
   CLOUD_NAME=your_cloudinary_name
   API_KEY=your_cloudinary_key
   API_SECRET=your_cloudinary_secret
   ```

6. Click **"Create Web Service"**

#### Via Render Blueprint (render.yaml)

1. Push `render.yaml` to repository
2. In Render Dashboard, click **"New +"** → **"Blueprint"**
3. Select your repository
4. Render will auto-detect `render.yaml`
5. Click **"Apply"**

### Step 3: Verify Deployment

Visit: `https://job-portal-backend.onrender.com/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-15T...",
  "uptime": 123.456,
  "environment": "production"
}
```

---

## 🚂 Option 2: Deploy to Railway

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

### Step 3: Initialize Project

```bash
cd backend
railway init
```

### Step 4: Add Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set MONGO_URI=mongodb+srv://...
railway variables set SECRET_KEY=your_jwt_secret
railway variables set REFRESH_TOKEN_SECRET=your_refresh_secret
railway variables set FRONTEND_URL=https://your-frontend.vercel.app
railway variables set CLOUD_NAME=your_cloudinary_name
railway variables set API_KEY=your_cloudinary_key
railway variables set API_SECRET=your_cloudinary_secret
```

### Step 5: Deploy

```bash
railway up
```

### Step 6: Get URL

```bash
railway domain
```

---

## ☁️ Option 3: Deploy to AWS EC2

### Prerequisites
- AWS Account
- SSH key pair
- Basic Linux knowledge

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click **"Launch Instance"**
3. Configure:
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** t2.micro (free tier)
   - **Key Pair:** Create or select existing
   - **Security Group:** Allow ports 22, 80, 443, 8000

### Step 2: Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 4: Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/jobportal.git
cd jobportal/backend
sudo npm install
```

### Step 5: Configure Environment

```bash
sudo nano .env
```

Add:
```env
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb+srv://...
SECRET_KEY=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
FRONTEND_URL=https://your-frontend.vercel.app
CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_key
API_SECRET=your_cloudinary_secret
```

### Step 6: Start with PM2

```bash
pm2 start index.js --name job-portal-backend
pm2 save
pm2 startup
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/jobportal
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Install SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

---

## 🗄️ MongoDB Atlas Setup

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Build a Database"**
3. Choose **"Shared"** (Free tier)
4. Select **"AWS"** provider
5. Choose nearest region
6. Click **"Create Cluster"**

### Step 2: Create Database User

1. Go to **"Database Access"**
2. Click **"Add New Database User"**
3. Set username and password
4. Grant **"Read and write to any database"**
5. Click **"Add User"**

### Step 3: Whitelist IP

1. Go to **"Network Access"**
2. Click **"Add IP Address"**
3. For Render/Railway: Add **"0.0.0.0/0"** (allow from anywhere)
4. For EC2: Add your EC2 instance IP
5. Click **"Confirm"**

### Step 4: Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy connection string:
   ```
   mongodb+srv://username:<password>@cluster.xxxxx.mongodb.net/jobportal?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your password
5. Replace `jobportal` with your database name

---

## 🔐 Environment Variables Checklist

### Required Variables

```env
# Application
NODE_ENV=production
PORT=8000

# Database
MONGO_URI=mongodb+srv://...

# JWT Secrets
SECRET_KEY=<generate-strong-secret>
REFRESH_TOKEN_SECRET=<generate-strong-secret>

# CORS
FRONTEND_URL=https://your-frontend.vercel.app

# Cloudinary
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret
```

### Optional Variables

```env
# Redis (if using)
REDIS_URL=redis://...

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Google OAuth (if implemented)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# reCAPTCHA (if implemented)
RECAPTCHA_SECRET_KEY=...

# Monitoring
SENTRY_DSN=https://...
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Frontend API URL

In Vercel environment variables:
```
VITE_API_URL=https://job-portal-backend.onrender.com/api/v1
```

### 2. Test API Endpoints

```bash
# Health check
curl https://your-backend-url.com/health

# Test login
curl -X POST https://your-backend-url.com/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Enable Monitoring

Add to `index.js`:

```javascript
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 1.0,
  });
}
```

---

## 📊 Performance Optimization

### 1. Enable Compression

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Add Caching Headers

```javascript
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
});
```

### 3. Database Indexing

```javascript
// In models
userSchema.index({ email: 1 });
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ location: 1, salaryRange: 1 });
```

### 4. Connection Pooling

Already configured in MongoDB connection.

---

## 🐛 Troubleshooting

### Application Crashes

```bash
# Check logs on Render
render logs

# Check logs on Railway
railway logs

# Check PM2 logs on EC2
pm2 logs job-portal-backend
```

### Database Connection Fails

1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Test connection locally first
4. Check network access in Atlas

### CORS Errors

1. Add frontend URL to allowed origins
2. Check credentials: true in CORS config
3. Verify frontend sends correct headers

### High Memory Usage

```bash
# Monitor on Render (Dashboard)
# Monitor on Railway (Dashboard)

# Monitor on EC2
pm2 monit
```

---

## 📝 Deployment Checklist

- [ ] Health check endpoint added
- [ ] Environment variables configured
- [ ] MongoDB Atlas database created
- [ ] Database indexes created
- [ ] CORS configured for frontend
- [ ] SSL certificate installed (if custom domain)
- [ ] Monitoring configured (Sentry)
- [ ] Error tracking enabled
- [ ] Logs accessible
- [ ] API endpoints tested
- [ ] Frontend connected successfully
- [ ] File uploads working
- [ ] Email sending working (if configured)
- [ ] Performance tested
- [ ] Security headers added
- [ ] Rate limiting enabled
- [ ] Backup strategy configured

---

## ✅ Success Criteria

- ✅ Backend deployed and accessible
- ✅ Health check returns 200
- ✅ Database connected
- ✅ API endpoints functional
- ✅ File uploads working
- ✅ Frontend can communicate
- ✅ No console errors
- ✅ Response time < 500ms
- ✅ Uptime > 99%

---

**Deployed URL:** https://job-portal-backend.onrender.com  
**Status:** ✅ Live  
**Last Deploy:** [Date]
