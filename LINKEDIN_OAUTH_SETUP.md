# LinkedIn OAuth Setup Guide

## Prerequisites
- LinkedIn Developer account
- Job Portal backend running on `http://localhost:8000`
- Job Portal frontend running on `http://localhost:5173`

## Step-by-Step Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **"Create app"**
3. Fill in the required information:
   - **App name**: `Job Portal`
   - **LinkedIn Page**: Select or create a LinkedIn page (required)
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload your app logo
4. Check the agreement box
5. Click **"Create app"**

### 2. Configure OAuth Settings

1. In your app dashboard, go to the **"Auth"** tab
2. Under **"OAuth 2.0 settings"**, find:
   - **Client ID** - Copy this        ----- 77cykxq1ig7nvf
   - **Client Secret** - Click "Show" and copy this

3. **Authorized redirect URLs for your app**:
   - Click **"+ Add redirect URL"**
   - Add: `http://localhost:8000/api/v1/auth/linkedin/callback`
   - Click **"Update"**

4. **Authorized JavaScript origins** (if available):
   - Add: `http://localhost:5173`
   - Add: `http://localhost:8000`

### 3. Request API Access

1. Go to the **"Products"** tab
2. Request access to:
   - **Sign In with LinkedIn** (required for basic auth)
   - Review and accept terms
   - Wait for approval (usually instant for Sign In with LinkedIn)

### 4. Configure Scopes

In the **"Auth"** tab, verify that these OAuth 2.0 scopes are enabled:
- `r_liteprofile` - Basic profile information
- `r_emailaddress` - Email address

Note: These scopes are included with "Sign In with LinkedIn" product.

### 5. Update Backend .env File

Open `backend/.env` and update:

```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_actual_client_id_here
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here
LINKEDIN_CALLBACK_URL=http://localhost:8000/api/v1/auth/linkedin/callback
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

4. Click **"Continue with LinkedIn"**

5. You should be redirected to LinkedIn's authorization page

6. After authorization, you'll be redirected back to the app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI doesn't match what's configured in LinkedIn app settings
- **Fix**: Ensure `http://localhost:8000/api/v1/auth/linkedin/callback` is added exactly in "Authorized redirect URLs"

### Error: "invalid_request - redirect_uri is not whitelisted"
- **Cause**: Redirect URL not added or not approved
- **Fix**: 
  - Go to Auth tab
  - Add the exact redirect URL
  - Click "Update" to save

### Error: "access_denied"
- **Cause**: User denied permission or app not approved
- **Fix**: 
  - Ensure "Sign In with LinkedIn" product is approved
  - Try authorizing again
  - Check if your LinkedIn account has necessary permissions

### Backend shows "LinkedIn OAuth: Email not provided"
- **Cause**: `r_emailaddress` scope not granted
- **Fix**: 
  - Verify "Sign In with LinkedIn" product is approved
  - Check that `r_emailaddress` scope is enabled
  - Clear LinkedIn cookies and try again

### Error: "unauthorized_scope_error"
- **Cause**: Requesting scopes not available for your app
- **Fix**: 
  - Only use `r_liteprofile` and `r_emailaddress`
  - Ensure "Sign In with LinkedIn" product is approved
  - Some scopes require additional products/verification

## Important Notes About LinkedIn OAuth

### Email Address Access
- LinkedIn doesn't always provide email addresses
- Email access requires the `r_emailaddress` scope
- Users can choose not to share their email
- Our implementation requires email, so login will fail if not provided

### Profile Data
- With `r_liteprofile`, you get:
  - Name
  - Profile picture
  - LinkedIn ID
- Full profile data requires additional products and verification

### LinkedIn API Changes
- LinkedIn regularly updates their API
- Some features may require additional verification
- Consumer apps (like job portals) have limited access compared to enterprise

## Production Setup

For production deployment:

1. **Update redirect URLs** in LinkedIn app settings:
   - Add: `https://yourdomain.com/api/v1/auth/linkedin/callback`
   - Keep localhost URLs for development

2. **Update backend .env**:
   ```env
   LINKEDIN_CALLBACK_URL=https://yourdomain.com/api/v1/auth/linkedin/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. **App Verification**:
   - Verify your app for production use
   - Update privacy policy and terms of service
   - Provide company information

4. **Security**:
   - Use HTTPS only in production
   - Never commit credentials to version control
   - Rotate secrets regularly

## Testing Checklist

- [ ] LinkedIn login button appears on login page
- [ ] Clicking button redirects to LinkedIn authorization
- [ ] Authorization page shows correct app name and logo
- [ ] Requested scopes are displayed to user
- [ ] After authorization, redirects back to app
- [ ] User is logged in (check Redux state)
- [ ] User profile shows LinkedIn photo
- [ ] Email is verified automatically
- [ ] Subsequent logins work without re-authorization
- [ ] Account linking works for existing emails

## API Rate Limits

LinkedIn OAuth has rate limits:
- **Consumer apps**: 100 requests per day per user
- **Sign In with LinkedIn**: Sufficient for authentication
- For higher limits, consider enterprise products

## Common LinkedIn OAuth Flow

1. User clicks "Continue with LinkedIn"
2. Redirected to LinkedIn: `https://www.linkedin.com/oauth/v2/authorization`
3. User grants permissions
4. LinkedIn redirects to: `http://localhost:8000/api/v1/auth/linkedin/callback?code=xxx`
5. Backend exchanges code for access token
6. Backend fetches user profile with token
7. User created/linked in database
8. JWT token generated
9. Redirect to frontend with token

## Security Best Practices

1. **State Parameter**: Include CSRF protection (our implementation uses session-less approach)
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Storage**: Never store LinkedIn tokens in frontend
4. **Scope Minimization**: Only request necessary scopes
5. **Token Expiration**: LinkedIn tokens expire, refresh as needed

## Additional Resources

- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [LinkedIn API Console](https://www.linkedin.com/developers/apps)
- [Sign In with LinkedIn](https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin)

## Next Steps

After LinkedIn OAuth is working:
1. Test account linking with existing users
2. Test profile photo synchronization
3. Implement account unlinking functionality
4. Add LinkedIn profile URL to user profile (optional)
5. Consider adding "Import from LinkedIn" for job seekers to auto-fill experience/education
