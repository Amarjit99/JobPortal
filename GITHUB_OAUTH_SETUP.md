# GitHub OAuth Setup Guide

## Prerequisites
- GitHub account
- Job Portal backend running on `http://localhost:8000`
- Job Portal frontend running on `http://localhost:5173`

## Step-by-Step Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/profile)
2. In the left sidebar, scroll down and click **"Developer settings"**
3. Click **"OAuth Apps"** (or "OAuth Apps" under Applications)
4. Click **"New OAuth App"** button
5. Fill in the application details:
   - **Application name**: `Job Portal` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: `Job portal for students and recruiters` (optional)
   - **Authorization callback URL**: `http://localhost:8000/api/v1/auth/github/callback`
6. Click **"Register application"**

### 2. Get OAuth Credentials

After creating the app:

1. You'll see your **Client ID** - Copy this
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** immediately (you won't be able to see it again)
4. Save both credentials securely

### 3. Configure Email Privacy Settings

**Important**: GitHub users can hide their email addresses. To ensure your app receives email:

1. Recommend users to:
   - Go to [GitHub Email Settings](https://github.com/settings/emails)
   - Under "Keep my email addresses private", consider unchecking this option for OAuth
   - Or use the public email from their profile

2. Our app handles this by:
   - Requesting `user:email` scope
   - Falling back to public email if private email not available
   - Showing error if no email is accessible

### 4. Update Backend .env File

Open `backend/.env` and update:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/auth/github/callback
```

### 5. Test OAuth Flow

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

4. Click **"Continue with GitHub"**

5. You should be redirected to GitHub's authorization page

6. After authorization, you'll be redirected back to the app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI doesn't match what's configured in your GitHub OAuth app
- **Fix**: 
  - Go to your OAuth app settings on GitHub
  - Ensure **Authorization callback URL** is exactly: `http://localhost:8000/api/v1/auth/github/callback`
  - No trailing slashes, exact match required

### Error: "The redirect_uri MUST match the registered callback URL"
- **Cause**: URL mismatch or typo
- **Fix**: 
  - Check for http vs https
  - Check for trailing slashes
  - Verify port number (8000)
  - Ensure callback URL in app settings matches exactly

### Backend shows "GitHub OAuth: Email not provided"
- **Cause**: User's email is private or not accessible
- **Fix**: 
  - User needs to make their email public on GitHub profile
  - Or uncheck "Keep my email addresses private" in GitHub settings
  - Or grant `user:email` scope (which we request by default)

### Error: "bad_verification_code"
- **Cause**: Code expired or already used
- **Fix**: 
  - Try the authorization flow again
  - Codes are single-use and expire quickly
  - Clear cookies and try again

### Error: "Application suspended"
- **Cause**: GitHub suspended your OAuth app
- **Fix**: 
  - Check email from GitHub for suspension notice
  - Review GitHub's OAuth policies
  - Contact GitHub support if needed

## GitHub Scopes Explained

Our app requests these scopes:

- **`user:email`**: Access user's email addresses (required)
  - Without this, we can't get user email
  - Some users have private emails
  - This scope allows us to fetch verified emails

Additional optional scopes (not currently used):
- `read:user`: Read all user profile data
- `user:follow`: Follow/unfollow users
- `repo`: Full control of repositories
- `gist`: Create gists

**Note**: We only request what's necessary - just `user:email` for authentication.

## Email Privacy Considerations

### How GitHub Handles Email Privacy

1. **Public Email**: Set in user profile settings
2. **Private Email**: Hidden but accessible with `user:email` scope
3. **No Email**: Some users don't provide email at all

### Our Implementation

```javascript
// Backend tries to get email in this order:
1. Primary verified email from emails array
2. First email from emails array
3. Public email from profile
4. Error if no email found
```

### User Instructions

If login fails with "Email not provided":

1. Go to [GitHub Email Settings](https://github.com/settings/emails)
2. Add and verify an email address
3. Either:
   - Make email public in [Profile Settings](https://github.com/settings/profile)
   - Or uncheck "Keep my email addresses private"
4. Try logging in again

## Production Setup

For production deployment:

1. **Create a new OAuth App** (recommended) or update existing:
   - Go to GitHub Developer Settings
   - Create new OAuth App for production
   - Use production URLs

2. **Update OAuth App Settings**:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/v1/auth/github/callback`

3. **Update backend .env**:
   ```env
   GITHUB_CLIENT_ID=your_production_client_id
   GITHUB_CLIENT_SECRET=your_production_client_secret
   GITHUB_CALLBACK_URL=https://yourdomain.com/api/v1/auth/github/callback
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Security Considerations**:
   - Use HTTPS only in production
   - Separate OAuth apps for dev/staging/production
   - Rotate client secrets regularly
   - Monitor OAuth app usage

## Rate Limits

GitHub OAuth API has rate limits:
- **Unauthenticated requests**: 60 per hour
- **Authenticated requests**: 5,000 per hour
- **OAuth authorizations**: No strict limit for sign-in

Our authentication flow stays well within limits.

## Testing Checklist

- [ ] GitHub login button appears on login page
- [ ] Clicking button redirects to GitHub authorization
- [ ] Authorization page shows correct app name
- [ ] Requested scope (`user:email`) is displayed
- [ ] After authorization, redirects back to app
- [ ] User is logged in (check Redux state)
- [ ] User profile shows GitHub avatar
- [ ] Email is verified automatically
- [ ] Username is properly extracted
- [ ] Subsequent logins work without re-authorization
- [ ] Account linking works for existing emails
- [ ] Works with both public and private emails

## Common GitHub OAuth Flow

1. User clicks "Continue with GitHub"
2. Redirected to: `https://github.com/login/oauth/authorize?client_id=xxx&scope=user:email`
3. User authorizes the app
4. GitHub redirects to: `http://localhost:8000/api/v1/auth/github/callback?code=xxx`
5. Backend exchanges code for access token
6. Backend fetches user data with token
7. User created/linked in database
8. JWT token generated
9. Redirect to frontend with token

## Webhook Integration (Optional)

GitHub OAuth apps can also use webhooks for:
- Account changes
- Repository events
- Team notifications

For a job portal, this is usually not needed.

## Security Best Practices

1. **Client Secret Protection**:
   - Never commit to version control
   - Use environment variables
   - Rotate regularly (every 90 days recommended)

2. **State Parameter**:
   - We use Passport.js which handles CSRF protection
   - State parameter prevents authorization code injection

3. **Token Security**:
   - Don't store GitHub tokens in frontend
   - Backend validates all tokens
   - Tokens have expiration

4. **Scope Minimization**:
   - Only request `user:email`
   - Don't request repo access unless needed
   - Users trust apps that request minimal scopes

5. **HTTPS**:
   - Always use HTTPS in production
   - GitHub requires HTTPS for production apps

## Revoking Access

Users can revoke access at any time:
1. Go to [GitHub Applications](https://github.com/settings/applications)
2. Find your app under "Authorized OAuth Apps"
3. Click "Revoke"

Your app should handle revoked access gracefully.

## GitHub for Organizations

If users belong to GitHub organizations:
- They can authorize with their personal account
- Organization repos/data not accessed (we don't request those scopes)
- Suitable for individual job seeker profiles

## Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub OAuth Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Developer Settings](https://github.com/settings/developers)

## Differences from Other OAuth Providers

### GitHub vs Google/LinkedIn

**Advantages**:
- Popular among developers
- Easy setup process
- Good for tech-focused job portals
- No API review required
- Free and open

**Limitations**:
- Email privacy can be an issue
- Profile data less detailed than LinkedIn
- Not as universal as Google
- Users may not have professional info

**Best Use Case**:
- Tech job portals
- Developer-focused platforms
- Open source project hiring

## Next Steps

After GitHub OAuth is working:
1. Test with multiple GitHub accounts
2. Test email privacy scenarios
3. Test account linking
4. Add "Import from GitHub" feature (optional):
   - Show user's GitHub repositories
   - Display contribution graph
   - Link GitHub profile on resume
5. Consider adding GitHub stars/followers as profile stats

## GitHub Apps vs OAuth Apps

**OAuth Apps** (what we use):
- User authentication
- Simple setup
- Suitable for login

**GitHub Apps** (more advanced):
- Finer-grained permissions
- Repository access
- Webhook notifications
- Better for apps that integrate deeply with GitHub

For job portal authentication, OAuth Apps are sufficient.
