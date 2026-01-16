# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- Job Portal backend running on `http://localhost:8000`
- Job Portal frontend running on `http://localhost:5173`

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `Job Portal OAuth`
5. Click "Create"

### 2. Enable Google+ API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Click "Create"
4. Fill in the required information:
   - **App name**: `Job Portal`
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Add: `.../auth/userinfo.email`
   - Add: `.../auth/userinfo.profile`
7. Click "Save and Continue"
8. **Test users** (for development):
   - Add your email address
   - Add any other test users
9. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Application type**: `Web application`
4. **Name**: `Job Portal Web Client`
5. **Authorized JavaScript origins**:
   - Add: `http://localhost:5173`
   - Add: `http://localhost:8000`
6. **Authorized redirect URIs**:
   - Add: `http://localhost:8000/api/v1/auth/google/callback`
7. Click "Create"
8. **Save the credentials**:
   - Copy **Client ID**
   - Copy **Client Secret**

### 5. Update Backend .env File

Open `backend/.env` and update:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

### 6. Test OAuth Flow

1. Restart the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Open the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login`

4. Click "Continue with Google"

5. You should be redirected to Google's login page

6. After successful login, you'll be redirected back to the app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI doesn't match what's configured in Google Cloud Console
- **Fix**: Ensure `http://localhost:8000/api/v1/auth/google/callback` is added exactly in "Authorized redirect URIs"

### Error: "Access blocked: This app's request is invalid"
- **Cause**: OAuth consent screen not configured properly
- **Fix**: Complete the OAuth consent screen setup, especially adding your email as a test user

### Error: "idpiframe_initialization_failed"
- **Cause**: Cookie issues or third-party cookies blocked
- **Fix**: 
  - Enable third-party cookies in browser settings
  - Try in incognito mode
  - Clear browser cache

### Backend shows "Google OAuth: googleId undefined"
- **Cause**: Google profile data not being extracted correctly
- **Fix**: Check that Google+ API is enabled and scopes include `profile` and `email`

## Production Setup

For production deployment:

1. Update authorized origins:
   - Add: `https://yourapp.com`
   
2. Update redirect URIs:
   - Add: `https://yourapp.com/api/v1/auth/google/callback`

3. Update backend .env:
   ```env
   GOOGLE_CALLBACK_URL=https://yourapp.com/api/v1/auth/google/callback
   FRONTEND_URL=https://yourapp.com
   ```

4. Publish the OAuth consent screen:
   - Go to OAuth consent screen
   - Click "Publish App"
   - Note: May require verification if requesting sensitive scopes

## Testing Checklist

- [ ] Google login button appears on login page
- [ ] Clicking button redirects to Google login
- [ ] After Google login, redirects back to app
- [ ] User is logged in (check Redux state)
- [ ] User profile shows Google photo
- [ ] Email is verified automatically
- [ ] Subsequent logins work without re-authorization
- [ ] User can log out and log back in

## Security Notes

1. **Never commit credentials**: Keep `.env` files in `.gitignore`
2. **Client secret security**: Never expose in frontend code
3. **HTTPS in production**: Always use HTTPS for OAuth in production
4. **Token validation**: Backend validates all OAuth tokens
5. **Account linking**: Existing email accounts are properly linked to OAuth

## Next Steps

After Google OAuth is working:
1. Implement LinkedIn OAuth (similar process)
2. Implement GitHub OAuth (similar process)
3. Add account unlinking functionality
4. Add ability to link multiple OAuth providers to one account
