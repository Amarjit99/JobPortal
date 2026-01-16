# Email Configuration Guide

## Overview
The Job Portal now includes email functionality for:
- Email verification after registration
- Password reset requests
- Welcome emails after verification

## Email Service Setup

### 1. Gmail Setup (Recommended for Development)

#### Create App Password:
1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification (enable if not already)
3. Scroll to "App passwords"
4. Select "Mail" and your device
5. Copy the generated 16-character password

#### Environment Variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_character_app_password
FRONTEND_URL=http://localhost:5173
```

### 2. Outlook/Hotmail Setup

#### Environment Variables:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your.email@outlook.com
SMTP_PASS=your_outlook_password
FRONTEND_URL=http://localhost:5173
```

### 3. SendGrid Setup (Recommended for Production)

#### Setup:
1. Sign up at https://sendgrid.com
2. Create an API key
3. Verify your sender identity

#### Environment Variables:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FRONTEND_URL=https://your-production-domain.com
```

### 4. Other SMTP Providers

Popular alternatives:
- **Mailgun**: smtp.mailgun.org (port 587)
- **AWS SES**: email-smtp.us-east-1.amazonaws.com (port 587)
- **Mailchimp (Mandrill)**: smtp.mandrillapp.com (port 587)

## Email Features

### Registration Flow
1. User registers → Account created with `isVerified: false`
2. Verification email sent with 24-hour token
3. User clicks link → Email verified, `isVerified: true`
4. Welcome email sent
5. User can now login

### Password Reset Flow
1. User clicks "Forgot Password"
2. Enters email → Reset email sent with 1-hour token
3. User clicks link → Enters new password
4. Password updated → User can login

### API Endpoints

#### Verify Email
```
GET /api/v1/user/verify-email?token=<verification_token>
```

#### Resend Verification
```
POST /api/v1/user/resend-verification
Body: { "email": "user@example.com" }
```

#### Forgot Password
```
POST /api/v1/user/forgot-password
Body: { "email": "user@example.com" }
```

#### Reset Password
```
POST /api/v1/user/reset-password?token=<reset_token>
Body: { "password": "newpassword123" }
```

## Frontend Routes

New routes added:
- `/verify-email` - Email verification page
- `/forgot-password` - Request password reset
- `/reset-password` - Set new password

## Testing

### Local Testing
1. Set up SMTP credentials in `.env`
2. Register a new user
3. Check email for verification link
4. Click link to verify
5. Test login with verified account

### Development Tips
- Use Gmail for quick setup
- Check spam folder if emails don't arrive
- Ensure 2FA is enabled for Gmail
- Use app-specific password, not your regular password
- For production, use dedicated email service (SendGrid, AWS SES)

## Email Templates

All email templates are in `backend/utils/emailService.js`:
- `sendVerificationEmail()` - Registration verification
- `sendWelcomeEmail()` - Post-verification welcome
- `sendPasswordResetEmail()` - Password reset

Customize HTML templates for branding.

## Security Features

- Tokens are hashed (SHA-256) before storage
- Verification tokens expire in 24 hours
- Reset tokens expire in 1 hour
- Failed login returns same message for non-verified users
- Rate limiting on all auth endpoints (5 requests/15 min)

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials
2. Verify SMTP_HOST and SMTP_PORT
3. Check firewall/antivirus blocking port 587
4. Look at backend logs (`logs/error.log`)
5. Test SMTP connection:
```bash
npm install -g nodemailer-cli
nodemailer-cli --host smtp.gmail.com --port 587 --user your@email.com --pass yourpass
```

### Gmail "Less Secure Apps" Error
- Enable 2FA on your Google account
- Create and use an App Password instead

### Token Expired
- Tokens expire after set time
- Use "Resend verification email" feature
- Request new password reset if expired

## Production Recommendations

1. **Use Professional Email Service**
   - SendGrid: 100 emails/day free
   - Mailgun: 5,000 emails/month free
   - AWS SES: Pay as you go, very cheap

2. **Set Up Domain Authentication**
   - SPF records
   - DKIM signatures
   - DMARC policies

3. **Monitor Delivery**
   - Track bounce rates
   - Monitor spam complaints
   - Check delivery logs

4. **Email Best Practices**
   - Use branded sender name
   - Include unsubscribe for marketing emails
   - Test across email clients
   - Mobile-responsive templates

## Support

For issues:
1. Check backend logs: `logs/error.log`
2. Verify environment variables
3. Test SMTP connection manually
4. Check email provider documentation
