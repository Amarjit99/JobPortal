# OAuth Setup Guide

Complete guide to configure Google, LinkedIn, and GitHub OAuth authentication for Job Portal.

---

## 📋 Table of Contents

1. [Google OAuth Setup](#google-oauth-setup)
2. [LinkedIn OAuth Setup](#linkedin-oauth-setup)
3. [GitHub OAuth Setup](#github-oauth-setup)
4. [reCAPTCHA Setup](#recaptcha-setup)
5. [Environment Configuration](#environment-configuration)
6. [Testing OAuth](#testing-oauth)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name: "Job Portal" (or your preferred name)
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - Click "Create"
   
4. **Configure OAuth Consent Screen:**
   - App name: "Job Portal"
   - User support email: your-email@example.com
   - App logo: (optional)
   - App domain: your-domain.com (or localhost for development)
   - Authorized domains: localhost (for development)
   - Developer contact: your-email@example.com
   - Click "Save and Continue"
   
5. **Scopes:** (Skip for now, click "Save and Continue")
   
6. **Test Users:** (Add test users if using External user type)
   - Add your Gmail for testing
   - Click "Save and Continue"

### Step 4: Create OAuth Client ID

1. Back to "Credentials" tab
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Job Portal Web Client"
5. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-domain.com
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:8000/api/v1/auth/google/callback
   https://your-api-domain.com/api/v1/auth/google/callback
   ```
7. Click "Create"
8. **Copy your Client ID and Client Secret** - you'll need these!

### Step 5: Add to Environment Variables

Add to `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

---

## 💼 LinkedIn OAuth Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in app details:
   - App name: "Job Portal"
   - LinkedIn Page: Select or create a company page
   - App logo: Upload your logo
   - Legal agreement: Check the box
   - Click "Create app"

### Step 2: Get App Credentials

1. In your app dashboard, go to "Auth" tab
2. You'll see:
   - **Client ID**
   - **Client Secret** (click "Show" to reveal)
3. Copy both values

### Step 3: Configure OAuth Settings

1. In "Auth" tab, scroll to "OAuth 2.0 settings"
2. **Redirect URLs:**
   ```
   http://localhost:8000/api/v1/auth/linkedin/callback
   https://your-api-domain.com/api/v1/auth/linkedin/callback
   ```
3. Click "Add redirect URL" for each
4. Click "Update"

### Step 4: Request API Access

1. Go to "Products" tab
2. Request access to:
   - "Sign In with LinkedIn using OpenID Connect"
   - This gives access to profile and email scopes
3. Wait for approval (usually instant for basic access)

### Step 5: Add to Environment Variables

Add to `.env`:
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
LINKEDIN_CALLBACK_URL=http://localhost:8000/api/v1/auth/linkedin/callback
```

---

## 🐙 GitHub OAuth Setup

### Step 1: Register New OAuth Application

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps"
3. Click "New OAuth App"

### Step 2: Fill Application Details

- **Application name:** Job Portal
- **Homepage URL:** 
  ```
  http://localhost:5173
  ```
  (or your production URL)
  
- **Application description:** Job Portal Platform - Connect job seekers with employers
- **Authorization callback URL:**
  ```
  http://localhost:8000/api/v1/auth/github/callback
  ```
- Click "Register application"

### Step 3: Generate Client Secret

1. After registration, you'll see your **Client ID**
2. Click "Generate a new client secret"
3. **Copy the secret immediately** - it won't be shown again!

### Step 4: Add to Environment Variables

Add to `.env`:
```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback
```

---

## 🛡️ reCAPTCHA Setup

### Step 1: Register Site

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click "+" to create new site
3. Fill in details:
   - **Label:** Job Portal
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:**
     ```
     localhost
     your-production-domain.com
     ```
   - Accept terms and click "Submit"

### Step 2: Get Keys

After creation, you'll receive:
- **Site Key** (public key for frontend)
- **Secret Key** (private key for backend)

### Step 3: Add to Environment Variables

**Backend** `.env`:
```env
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
```

**Frontend** `.env`:
```env
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
VITE_RECAPTCHA_ENABLED=true
```

---

## ⚙️ Environment Configuration

### Backend `.env` Complete OAuth Section

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret
LINKEDIN_CALLBACK_URL=http://localhost:8000/api/v1/auth/linkedin/callback

GITHUB_CLIENT_ID=Iv1.your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret_here
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback

RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### Frontend `.env` Complete OAuth Section

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_RECAPTCHA_ENABLED=true
```

---

## 🧪 Testing OAuth

### 1. Test Google OAuth

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

**Test flow:**
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Select Google account
4. Grant permissions
5. Should redirect back with success message

### 2. Test LinkedIn OAuth

1. Click "Continue with LinkedIn"
2. Enter LinkedIn credentials
3. Grant permissions
4. Should redirect back successfully

### 3. Test GitHub OAuth

1. Click "Continue with GitHub"
2. Enter GitHub credentials
3. Authorize application
4. Should redirect back successfully

### 4. Test reCAPTCHA

1. Fill in login/signup form
2. reCAPTCHA should load automatically (v3 is invisible)
3. Submit form - should validate CAPTCHA score
4. Check browser console for CAPTCHA token

---

## 🐛 Troubleshooting

### Google OAuth Issues

**Problem:** "Redirect URI mismatch"
```
Solution:
1. Check exact URL in Google Console matches your callback
2. No trailing slashes
3. Include protocol (http/https)
4. Check port number
```

**Problem:** "Access blocked: Authorization Error"
```
Solution:
1. Add yourself as test user in OAuth consent screen
2. Verify app is not in production mode yet
3. Check authorized domains are correct
```

**Problem:** "idpiframe_initialization_failed"
```
Solution:
1. Check if third-party cookies are enabled
2. Clear browser cache
3. Try incognito mode
```

### LinkedIn OAuth Issues

**Problem:** "Unauthorized redirect_uri"
```
Solution:
1. Check redirect URL in LinkedIn app settings
2. Exact match required (including port)
3. May take a few minutes for settings to propagate
```

**Problem:** "Email not provided"
```
Solution:
1. Ensure you requested "Sign In with LinkedIn using OpenID Connect" product
2. Check email scope is included
3. Some old LinkedIn accounts may not have email - user needs to add one
```

### GitHub OAuth Issues

**Problem:** "Redirect URI mismatch"
```
Solution:
1. Update callback URL in GitHub OAuth app settings
2. Exact match required
3. Only ONE callback URL allowed - use development URL for testing
```

**Problem:** "Bad verification code"
```
Solution:
1. Check CLIENT_ID and CLIENT_SECRET are correct
2. Verify callback URL matches exactly
3. Regenerate client secret if needed
```

### reCAPTCHA Issues

**Problem:** "Invalid site key"
```
Solution:
1. Verify SITE_KEY is correct in frontend .env
2. Check domain is registered in reCAPTCHA console
3. Clear browser cache
```

**Problem:** "Failed to execute reCAPTCHA"
```
Solution:
1. Check if reCAPTCHA script is loaded
2. Verify network connectivity
3. Check browser console for errors
4. Temporarily disable ad blockers
```

**Problem:** "Low CAPTCHA score (spam detected)"
```
Solution:
1. Default threshold is 0.5
2. Adjust threshold in backend if needed
3. Legitimate users typically score 0.7-1.0
4. Bots typically score 0.0-0.3
```

### General OAuth Issues

**Problem:** "Session/Cookie issues"
```
Solution:
1. Check CORS configuration allows credentials
2. Verify cookie settings (sameSite, secure)
3. Use secure: false in development
4. Check browser allows third-party cookies
```

**Problem:** "OAuth providers not showing"
```
Solution:
1. Verify environment variables are loaded
2. Check backend logs for OAuth initialization messages
3. Ensure frontend OAUTH_ENABLED is true
4. Check network tab for API calls
```

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Update all OAuth callback URLs to production URLs
- [ ] Set `NODE_ENV=production` in backend
- [ ] Use `secure: true` for cookies
- [ ] Enable HTTPS for all domains
- [ ] Update Google OAuth consent screen to "Published"
- [ ] Add production domain to all OAuth apps
- [ ] Update frontend `.env` with production API URL
- [ ] Test all OAuth flows in production
- [ ] Set up proper error logging
- [ ] Monitor OAuth success/failure rates

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - Use `.env` files
   - Add `.env` to `.gitignore`
   - Use different credentials for dev/staging/production

2. **Rotate secrets regularly**
   - Change OAuth secrets every 6-12 months
   - Update reCAPTCHA keys annually
   - Log secret rotation events

3. **Validate OAuth state parameter**
   - Prevents CSRF attacks
   - Already implemented in passport.js

4. **Use HTTPS in production**
   - Required for OAuth callbacks
   - Required for secure cookies

5. **Limit OAuth scopes**
   - Only request necessary permissions
   - Current: profile and email (minimal)

6. **Monitor OAuth usage**
   - Log OAuth login attempts
   - Track success/failure rates
   - Alert on unusual patterns

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Passport.js Documentation](http://www.passportjs.org/)

---

## 🎉 Success!

Once configured, users can:
- ✅ Sign in with Google in one click
- ✅ Sign in with LinkedIn for professional networking
- ✅ Sign in with GitHub for developers
- ✅ Protected by reCAPTCHA from bots
- ✅ Automatic account creation and linking
- ✅ Pre-verified email addresses

**Your OAuth integration is complete!** 🚀

---

**Last Updated:** January 16, 2026  
**Version:** 1.0
