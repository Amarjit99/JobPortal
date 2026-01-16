# Administrator Manual

**Job Portal - Platform Administration Guide**

This comprehensive manual covers all administrative functions for managing the Job Portal platform, including user management, content moderation, analytics, system settings, and security.

---

## 📋 Table of Contents

1. [Admin Access & Roles](#admin-access--roles)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Content Moderation](#content-moderation)
5. [Job & Company Management](#job--company-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [System Settings](#system-settings)
8. [Email Templates](#email-templates)
9. [Payment Management](#payment-management)
10. [Security & Permissions](#security--permissions)
11. [Platform Maintenance](#platform-maintenance)
12. [Troubleshooting](#troubleshooting)

---

## 🔐 Admin Access & Roles

### Admin Role Types

#### **Super Admin**
- Full system access
- Manage all users, including other admins
- Configure system settings
- Access all features and data
- Delete or restore content
- View security logs

#### **Moderator**
- Content moderation (jobs, companies, user profiles)
- Review flagged content
- Ban/unban users
- View user reports
- Limited access to settings

#### **Support Admin**
- Handle user support tickets
- View user profiles (limited)
- Assist with account issues
- No system configuration access

### Accessing Admin Panel

1. Log in with admin credentials
2. Navigate to **Admin Dashboard** (appears in navigation for admins only)
3. Select desired admin function from sidebar

**Admin Panel URL:** https://jobportal.com/admin

### Admin Credentials Management

**Initial Setup:**
- Default super admin created during deployment
- Change default password immediately
- Enable 2FA for admin accounts

**Creating New Admins:**
1. Go to **Admin → Users**
2. Find user or create new account
3. Click **"Change Role"**
4. Select admin role type
5. Confirm changes
6. User receives email notification

**Removing Admin Access:**
1. Find admin user
2. Click **"Change Role"**
3. Select "User" (job seeker or recruiter)
4. Confirm demotion

---

## 📊 Dashboard Overview

### Admin Dashboard Widgets

#### Platform Statistics
- **Total Users:** All registered accounts
- **Active Jobs:** Currently posted positions
- **Total Applications:** Lifetime applications
- **Companies:** Registered employers
- **Daily Active Users:** Users active in last 24 hours
- **Growth Rate:** Week-over-week growth

#### Quick Actions
- Review flagged content (# pending)
- Moderate new company registrations
- Review reported users
- Check system health
- View error logs

#### Recent Activity
- New user registrations
- Job postings
- Application submissions
- Payments received
- Flagged content

#### System Health
- Server status
- Database status
- API response time
- Storage usage
- Error rate (last 24h)

### Navigating Admin Panel

**Main Navigation Sections:**

```
📊 Dashboard
👥 Users
💼 Jobs
🏢 Companies
📝 Applications
🚩 Moderation
📧 Email Templates
💳 Payments & Plans
⚙️ Settings
🔒 Security
📈 Analytics
📋 Logs
```

---

## 👥 User Management

### Viewing All Users

1. Navigate to **Admin → Users**
2. View paginated list of all users
3. Use filters and search:
   - **Role:** Job Seeker, Recruiter, Admin
   - **Status:** Active, Suspended, Banned
   - **Registration Date:** Date range
   - **Search:** Name, email, ID

### User Profile Management

#### Viewing User Details

Click on any user to see:
- Full profile information
- Account status
- Registration date
- Last login
- Activity history
- Applications (for job seekers)
- Posted jobs (for recruiters)
- Payment history (for recruiters)
- Reports/flags against user

#### Editing User Information

1. Open user profile
2. Click **"Edit User"**
3. Modify:
   - Name
   - Email
   - Phone number
   - Role
   - Status
   - Profile fields

4. Click **"Save Changes"**

**Use Cases:**
- Correct user information
- Fix email address typos
- Update phone numbers
- Merge duplicate accounts

### User Status Management

#### Suspending Users

**Temporary suspension for violations:**

1. Open user profile
2. Click **"Suspend User"**
3. Select suspension duration:
   - 7 days
   - 14 days
   - 30 days
   - Custom duration

4. Add reason (required)
5. Confirm suspension

**Effects:**
- User cannot log in
- Existing applications remain
- Jobs remain visible (for recruiters)
- User receives suspension notification

#### Banning Users

**Permanent ban for severe violations:**

1. Open user profile
2. Click **"Ban User"**
3. Add detailed reason (required)
4. Confirm ban

**Effects:**
- Permanent account deactivation
- Cannot create new accounts with same email
- All jobs removed (for recruiters)
- Applications withdrawn (for job seekers)
- User receives ban notification

#### Reactivating Suspended/Banned Users

1. Find user in **Suspended/Banned** filter
2. Click **"Reactivate Account"**
3. Add note explaining reactivation
4. Confirm action

### Deleting User Accounts

**Use with caution - this is permanent!**

1. Open user profile
2. Click **"Delete Account"**
3. Confirm deletion (requires admin password)
4. User data is permanently removed

**What Gets Deleted:**
- User profile
- All applications
- All posted jobs (for recruiters)
- Messages
- Activity logs (partial - compliance logs retained)

**Cannot Be Undone!**

### Bulk User Actions

Select multiple users to:
- Send mass email
- Export user data
- Change status (suspend/reactivate)
- Delete accounts (use carefully)

---

## 🚩 Content Moderation

### Flagged Content Dashboard

Access: **Admin → Moderation**

View all flagged content requiring review:
- Inappropriate job posts
- Fake company profiles
- Spam applications
- Inappropriate user profiles
- Reported messages

### Reviewing Flagged Jobs

**Job posts flagged by users or auto-moderation:**

1. Navigate to **Moderation → Flagged Jobs**
2. Click on flagged job to review
3. See:
   - Job details
   - Reason for flagging
   - Number of reports
   - Reporter information

4. Take action:
   - **Approve:** Remove flag, job stays live
   - **Edit & Approve:** Fix issues, then approve
   - **Remove Job:** Delete the posting
   - **Ban Poster:** Remove job and ban recruiter

5. Add moderator notes
6. User receives notification of decision

**Common Violations:**
- Misleading job titles
- Fake salary information
- Discriminatory language
- Multi-level marketing schemes
- Unpaid "internships" (illegal work)

### Reviewing Flagged Companies

**Company profiles reported for:**
- Fake company information
- Stolen logos/branding
- Scam operations
- Inappropriate content

**Moderation Actions:**

1. **Verify Company:**
   - Check company website
   - Verify business registration
   - Cross-reference with LinkedIn/other sources
   - Contact company if suspicious

2. **Action Options:**
   - **Approve:** Company verified, remove flag
   - **Request Verification:** Ask for proof of legitimacy
   - **Suspend:** Temporary suspension pending verification
   - **Remove:** Delete fake company profile
   - **Ban:** Permanent ban for scam operations

### Reviewing Reported Users

**Users reported for:**
- Inappropriate messages
- Spam behavior
- Fake profiles
- Harassment

**Review Process:**

1. View report details
2. Check user history
3. Review reported content/messages
4. Assess severity of violation

**Actions:**
- **Dismiss Report:** No violation found
- **Warning:** Send official warning
- **Suspend Account:** Temporary suspension
- **Ban Account:** Permanent ban
- **Legal Action:** Escalate to legal team (severe cases)

### Auto-Moderation System

**Automated flags triggered by:**
- Suspicious keywords (scam, pyramid, MLM)
- External links (phishing attempts)
- Excessive reports
- Unusual activity patterns
- Duplicate content

**Admin Review Required:**
- System flags content
- Admin reviews and makes final decision
- False positives should be approved quickly

---

## 💼 Job & Company Management

### Managing Job Postings

#### Viewing All Jobs

**Admin → Jobs**

View all jobs on the platform:
- Active jobs
- Expired jobs
- Closed jobs
- Flagged jobs

#### Job Actions

**For Any Job:**
- View details
- Edit information
- Feature job (promote)
- Remove job
- Extend deadline
- View applications

#### Featuring Jobs

Promote quality jobs:

1. Find job in job list
2. Click **"Feature Job"**
3. Select duration (7, 14, 30 days)
4. Job appears at top of search results
5. Company receives notification

**When to Feature:**
- High-quality opportunities
- From premium employers
- To fill important roles quickly
- As promotional campaigns

### Company Profile Management

#### Verifying Companies

**Verification Process:**

1. Review company profile
2. Check:
   - Website matches domain
   - Logo is authentic
   - Business registration is valid
   - Contact information is correct

3. Actions:
   - **Verify:** Add verified badge
   - **Request Info:** Ask for additional verification
   - **Flag:** Mark for further review
   - **Remove:** Delete fake profiles

**Verification Badge Benefits:**
- Increased trust from job seekers
- Higher application rates
- Better search ranking
- Premium company status

#### Managing Company Listings

**Admin → Companies**

- View all registered companies
- Edit company information
- Delete fake companies
- Merge duplicate company profiles
- Assign verified badges

---

## 📈 Analytics & Reporting

### Platform Analytics

**Admin → Analytics**

#### User Analytics
- Total registered users
- Active users (daily, weekly, monthly)
- User growth rate
- User demographics
- Geographic distribution
- Registration sources

#### Job Analytics
- Total jobs posted
- Active vs. closed jobs
- Jobs by category/industry
- Average time to fill
- Application rates
- Geographic distribution

#### Application Analytics
- Total applications submitted
- Application to interview ratio
- Application to hire ratio
- Average response time
- Peak application times

#### Revenue Analytics (For monetized platforms)
- Total revenue
- Revenue by plan type
- Subscription renewals
- Churn rate
- Average revenue per user (ARPU)
- Lifetime value (LTV)

### Custom Reports

#### Creating Reports

1. Go to **Analytics → Custom Reports**
2. Click **"New Report"**
3. Select:
   - Report type
   - Date range
   - Metrics to include
   - Filters

4. Generate report
5. Export as CSV or PDF

#### Scheduled Reports

Set up automated reports:

1. Create custom report
2. Click **"Schedule"**
3. Set frequency (daily, weekly, monthly)
4. Add email recipients
5. Reports sent automatically

**Use Cases:**
- Weekly user growth reports
- Monthly revenue reports
- Quarterly platform metrics
- Annual performance reviews

---

## ⚙️ System Settings

### General Settings

**Admin → Settings → General**

#### Platform Information
- **Site Name:** Display name
- **Tagline:** Site description
- **Contact Email:** Support email
- **Phone Number:** Support phone
- **Address:** Company address
- **Social Media Links:** Platform social profiles

#### Registration Settings
- **Allow Job Seeker Registration:** On/Off
- **Allow Recruiter Registration:** On/Off
- **Email Verification Required:** On/Off
- **Profile Approval Required:** On/Off (manual approval)

#### Job Posting Settings
- **Default Job Duration:** 30, 60, 90 days
- **Auto-close After Deadline:** On/Off
- **Require Salary Information:** On/Off
- **Maximum Active Jobs (Free Plan):** Number
- **Job Approval Required:** On/Off

### Email Configuration

**Admin → Settings → Email**

#### SMTP Settings
- **SMTP Host:** mail.server.com
- **SMTP Port:** 587 (TLS) or 465 (SSL)
- **SMTP Username:** Your email
- **SMTP Password:** App password
- **From Email:** noreply@jobportal.com
- **From Name:** Job Portal

**Test Email:** Send test to verify configuration

#### Email Notifications
Enable/disable notification types:
- User registration
- Email verification
- Password reset
- New application
- Application status update
- Job alerts
- Interview invitations
- Payment confirmations

### SEO Settings

**Admin → Settings → SEO**

- **Meta Title:** Site title for search engines
- **Meta Description:** Site description
- **Keywords:** Target keywords
- **Google Analytics ID:** GA tracking code
- **Google Search Console:** Verification
- **Robots.txt:** Configure crawling
- **Sitemap:** Auto-generate sitemap

### Security Settings

**Admin → Settings → Security**

#### Password Policy
- **Minimum Length:** 6-16 characters
- **Require Uppercase:** On/Off
- **Require Numbers:** On/Off
- **Require Special Characters:** On/Off
- **Password Expiry:** 30, 60, 90 days, Never

#### Session Management
- **Session Timeout:** Minutes of inactivity
- **Remember Me Duration:** Days
- **Force Logout on Password Change:** On/Off

#### Two-Factor Authentication
- **Require 2FA for Admins:** On/Off
- **Require 2FA for All Users:** On/Off
- **2FA Methods:** SMS, Email, Authenticator App

#### Rate Limiting
- **Login Attempts:** Max attempts before lockout
- **Lockout Duration:** Minutes
- **API Rate Limit:** Requests per minute
- **File Upload Limit:** MB per file

---

## 📧 Email Templates

### Managing Templates

**Admin → Email Templates**

View and edit all system email templates:
- Welcome email
- Email verification
- Password reset
- New application notification
- Application status update
- Interview invitation
- Payment confirmation
- Subscription renewal
- Account suspension
- Account ban

### Editing Templates

1. Select template from list
2. Click **"Edit Template"**
3. Modify:
   - Subject line
   - Email body (HTML or plain text)
   - Variables (e.g., {{user_name}}, {{job_title}})

4. Preview changes
5. Test email (send to yourself)
6. Save template

### Available Variables

Use dynamic variables in templates:

**User Variables:**
- `{{user_name}}` - User's full name
- `{{user_email}}` - User's email
- `{{user_role}}` - job seeker/recruiter

**Job Variables:**
- `{{job_title}}` - Job title
- `{{company_name}}` - Company name
- `{{job_location}}` - Job location
- `{{application_date}}` - Date applied

**System Variables:**
- `{{site_name}}` - Platform name
- `{{site_url}}` - Platform URL
- `{{current_date}}` - Current date
- `{{verification_link}}` - Email verification link
- `{{reset_link}}` - Password reset link

### Template Best Practices

✅ **Do:**
- Keep subject lines clear and concise
- Use personalization variables
- Provide clear call-to-action
- Include unsubscribe link (for marketing emails)
- Test templates before saving
- Use responsive HTML for mobile

❌ **Don't:**
- Use all caps or excessive punctuation
- Include too many links
- Use generic greetings
- Forget to test email rendering
- Send without spell checking

---

## 💳 Payment Management

### Subscription Plans

**Admin → Payments → Plans**

#### Managing Plans

View and edit subscription tiers:
- Free Plan
- Standard Plan
- Professional Plan
- Enterprise Plan

#### Editing Plans

1. Select plan
2. Click **"Edit Plan"**
3. Modify:
   - Plan name
   - Price
   - Billing cycle (monthly/yearly)
   - Features included
   - Job posting limits
   - Resume view limits
   - Support level

4. Save changes

**Note:** Changes apply to new subscriptions. Existing subscribers keep their current plan until renewal.

### Payment Transactions

**Admin → Payments → Transactions**

View all payment transactions:
- Date and time
- User/company
- Amount
- Plan purchased
- Payment method
- Status (success, pending, failed)
- Invoice link

#### Transaction Actions
- View details
- Download invoice
- Issue refund
- Mark as paid (for manual payments)
- Export transactions

### Issuing Refunds

1. Find transaction
2. Click **"Refund"**
3. Select:
   - Full refund
   - Partial refund (enter amount)
   - Reason for refund

4. Confirm refund
5. User receives refund notification
6. Subscription downgraded if applicable

### Payment Settings

**Admin → Settings → Payments**

#### Payment Gateway Configuration
- **Stripe:** API keys
- **PayPal:** Client ID and Secret
- **Razorpay:** API credentials
- **Test Mode:** On/Off

#### Currency Settings
- **Default Currency:** USD, EUR, INR, etc.
- **Currency Symbol:** $, €, ₹
- **Decimal Places:** 2

#### Tax Settings
- **Enable Tax:** On/Off
- **Tax Rate:** Percentage
- **Tax Label:** VAT, GST, Sales Tax
- **Tax ID Required:** On/Off

---

## 🔒 Security & Permissions

### Admin Permissions

Configure what each admin role can do:

**Super Admin Permissions:**
- ✅ All permissions enabled

**Moderator Permissions:**
- ✅ View and moderate content
- ✅ Ban/suspend users
- ✅ Edit user profiles
- ❌ Delete users
- ❌ Change system settings
- ❌ Manage payments

**Support Admin Permissions:**
- ✅ View user profiles
- ✅ Send messages to users
- ❌ Ban users
- ❌ Moderate content
- ❌ Access system settings
- ❌ View payments

### Security Logs

**Admin → Security → Logs**

Monitor all security events:
- Admin logins
- Failed login attempts
- User bans/suspensions
- Permission changes
- Settings modifications
- Data exports
- Bulk actions

**Log Details:**
- Timestamp
- Admin user
- Action performed
- IP address
- User agent
- Result (success/failure)

### IP Blocking

Block suspicious IP addresses:

1. Go to **Security → IP Management**
2. Click **"Block IP"**
3. Enter IP address or range
4. Add reason
5. Set duration (permanent or temporary)
6. Save

**Use Cases:**
- Block spam sources
- Prevent brute force attacks
- Geographic restrictions
- Known malicious IPs

---

## 🔧 Platform Maintenance

### Database Management

**Admin → Maintenance → Database**

#### Database Backup

1. Click **"Create Backup"**
2. Backup is generated and stored
3. Download backup file
4. Store securely off-site

**Automated Backups:**
- Daily backups enabled by default
- Stored for 30 days
- Download from **Backups** list

#### Database Restore

**Use with extreme caution!**

1. Go to **Database → Restore**
2. Select backup file
3. Confirm restoration (requires password)
4. System restarts with restored data

### Cache Management

**Admin → Maintenance → Cache**

Clear cached data:
- **Clear All Cache:** Entire cache
- **Clear User Cache:** User-specific data
- **Clear Job Cache:** Job listings
- **Clear Application Cache:** Application data

**When to Clear Cache:**
- After major updates
- If seeing stale data
- Performance issues
- After settings changes

### System Updates

**Admin → Maintenance → Updates**

Check for platform updates:
- View current version
- View available updates
- Read update changelog
- Install updates

**Update Process:**
1. Backup database
2. Put site in maintenance mode
3. Install update
4. Test functionality
5. Take site live

---

## 🔧 Troubleshooting

### Common Admin Issues

#### "Can't Access Admin Panel"

**Solutions:**
1. Verify admin role is assigned
2. Clear browser cache
3. Check if 2FA is enabled and codes are accessible
4. Verify IP isn't blocked
5. Contact super admin

#### "Email Notifications Not Sending"

**Solutions:**
1. Check SMTP settings
2. Verify email credentials
3. Test email configuration
4. Check spam/junk folders
5. Verify email templates are active
6. Check server email logs

#### "Payment Processing Failing"

**Solutions:**
1. Verify payment gateway credentials
2. Check if in test mode
3. Verify webhook URLs configured
4. Check payment gateway status page
5. Review transaction logs for errors

#### "Reports Not Generating"

**Solutions:**
1. Check date range selection
2. Verify data exists for selected period
3. Try smaller date range
4. Clear cache
5. Check server logs for errors

---

## 📞 Admin Support

### Getting Help

**Email:** admin-support@jobportal.com  
**Response Time:** 4-8 hours

### Emergency Support

For critical issues:
- Database failures
- Security breaches
- System downtime

**Emergency Hotline:** 1-800-JOB-PORT (24/7)

### Documentation

- **API Documentation:** /admin/api-docs
- **Developer Guide:** /docs/developer-guide
- **System Architecture:** /docs/architecture
- **Change Log:** /docs/changelog

---

## ✅ Admin Checklist

### Daily Tasks
- [ ] Review flagged content
- [ ] Check new user registrations
- [ ] Monitor system health
- [ ] Review error logs
- [ ] Respond to support tickets

### Weekly Tasks
- [ ] Review analytics and metrics
- [ ] Check payment transactions
- [ ] Verify company profiles
- [ ] Test system functionality
- [ ] Review user feedback

### Monthly Tasks
- [ ] Generate platform reports
- [ ] Review and update email templates
- [ ] Check security logs
- [ ] Update documentation
- [ ] Plan improvements

### Quarterly Tasks
- [ ] Full system backup and test restore
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature planning
- [ ] User satisfaction survey

---

**Platform administration is a critical role. Handle user data with care, make decisions objectively, and maintain the trust of the community.**

---

**Last Updated:** January 15, 2026  
**Version:** 1.0  
**Support:** admin-support@jobportal.com
