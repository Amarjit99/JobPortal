# Frontend Deployment Guide - Vercel

## 📋 Prerequisites

- Vercel account (free tier available)
- GitHub repository connected
- Node.js 18+ installed locally
- Environment variables ready

---

## 🚀 Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Configure Environment Variables

Create these environment variables in Vercel Dashboard or `.env.production`:

```env
# API Configuration
VITE_API_URL=https://your-backend-domain.com/api/v1

# Google OAuth (if implemented)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# reCAPTCHA (if implemented)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Other configurations
VITE_APP_NAME=Job Portal
VITE_APP_VERSION=2.0.0
```

### 4. Deploy via CLI

```bash
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (first time)
- Project name? **job-portal-frontend**
- Directory? **.**
- Override settings? **No**

### 5. Deploy via GitHub (Recommended)

#### a. Push to GitHub

```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

#### b. Import Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### c. Add Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add each variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend.com/api/v1`
   - Environments: Production, Preview, Development
3. Click **Save**

### 6. Deploy

Click **"Deploy"** button in Vercel Dashboard.

---

## 🔧 Build Optimization

### 1. Update Vite Config

Edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['@radix-ui/react-avatar', '@radix-ui/react-dialog'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

### 2. Add Production Build Script

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:production": "NODE_ENV=production vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx",
    "analyze": "vite-bundle-visualizer"
  }
}
```

---

## 🌐 Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `www.jobportal.com`
4. Click **"Add"**

### 2. Configure DNS

Add these records in your domain provider:

**For Apex Domain (jobportal.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Wait for SSL Certificate

Vercel automatically provisions SSL certificate (Let's Encrypt).  
Wait 5-10 minutes for verification.

---

## 🔐 Security Headers

Security headers are configured in `vercel.json`:

- **X-Content-Type-Options:** Prevents MIME sniffing
- **X-Frame-Options:** Prevents clickjacking
- **X-XSS-Protection:** XSS filter
- **Referrer-Policy:** Controls referrer information
- **Cache-Control:** Optimizes static asset caching

---

## 📊 Performance Optimization

### 1. Enable Compression

Vercel automatically enables Brotli/Gzip compression.

### 2. Image Optimization

Use Vercel's Image Optimization:

```jsx
import Image from 'next/image'; // If using Next.js

// Or for Vite, use responsive images
<img 
  src="/assets/logo.png" 
  alt="Logo" 
  loading="lazy"
  decoding="async"
/>
```

### 3. Code Splitting

Already configured in `vite.config.js` with `manualChunks`.

### 4. Enable Edge Caching

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🔄 Automatic Deployments

### Production Deployments

- **Trigger:** Push to `main` branch
- **URL:** `https://job-portal-frontend.vercel.app`
- **Custom Domain:** `https://www.jobportal.com`

### Preview Deployments

- **Trigger:** Push to any branch or PR
- **URL:** `https://job-portal-frontend-[branch]-[hash].vercel.app`
- **Use:** Testing before merging to main

### Environment-Specific Variables

Set different values per environment:
1. **Production:** Used in `main` branch deployments
2. **Preview:** Used in branch/PR deployments
3. **Development:** Used locally

---

## 📝 Post-Deployment Checklist

- [ ] Verify homepage loads
- [ ] Test user login/signup
- [ ] Check API connectivity
- [ ] Verify job listings display
- [ ] Test file uploads
- [ ] Check mobile responsiveness
- [ ] Test all protected routes
- [ ] Verify redirects work
- [ ] Test search functionality
- [ ] Check console for errors
- [ ] Run Lighthouse audit (90+ score)
- [ ] Verify SSL certificate
- [ ] Test custom domain (if configured)
- [ ] Check analytics integration
- [ ] Verify error tracking (Sentry)

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error:** "Out of memory"
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### API Connection Issues

**Error:** CORS or "Network Error"

1. Check `VITE_API_URL` is correct
2. Verify backend has CORS enabled
3. Check backend allows Vercel domain:

```javascript
// backend/index.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://job-portal-frontend.vercel.app',
  'https://www.jobportal.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### Routes Not Working (404)

Ensure `vercel.json` has rewrites configured:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables Not Loading

1. Check variable names start with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache
4. Check variable in build logs

---

## 🔍 Monitoring

### 1. Vercel Analytics

Enable in **Project Settings** → **Analytics**

Tracks:
- Page views
- Unique visitors
- Page load times
- Core Web Vitals

### 2. Real User Monitoring

Add to `main.jsx`:

```javascript
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

Install:
```bash
npm install @vercel/analytics
```

### 3. Error Tracking

See **Monitoring & Logging** section for Sentry integration.

---

## 📈 Performance Metrics

### Target Lighthouse Scores

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+

### Run Lighthouse

```bash
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

Or use Chrome DevTools → Lighthouse tab.

---

## 🚀 Deployment Commands Reference

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove deployment
vercel rm [deployment-url]

# Rollback to previous deployment
vercel rollback [deployment-url]

# Set environment variable
vercel env add VITE_API_URL production

# Pull environment variables
vercel env pull
```

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Custom Domain Setup](https://vercel.com/docs/concepts/projects/domains)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Success Criteria

- ✅ Frontend deployed successfully
- ✅ Custom domain configured (optional)
- ✅ SSL certificate active
- ✅ Environment variables set
- ✅ Automatic deployments working
- ✅ Performance score 90+
- ✅ No console errors
- ✅ All routes accessible
- ✅ API connectivity working
- ✅ Monitoring enabled

---

**Deployment Date:** [Date]  
**Deployed By:** [Name]  
**Production URL:** https://job-portal-frontend.vercel.app  
**Status:** ✅ Live
