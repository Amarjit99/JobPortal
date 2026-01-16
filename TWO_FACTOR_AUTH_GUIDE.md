# Two-Factor Authentication (2FA) Implementation

## Overview
The job portal now supports Two-Factor Authentication (2FA) using Time-based One-Time Password (TOTP). Users can enable 2FA to add an extra layer of security to their accounts.

## Features
- ✅ TOTP-based 2FA using Google Authenticator, Authy, or similar apps
- ✅ QR code generation for easy setup
- ✅ 10 backup codes for recovery (single-use)
- ✅ Integrated with login flow
- ✅ Enable/disable 2FA from profile settings
- ✅ Secure storage of 2FA secrets (excluded from queries by default)

## Backend Implementation

### Database Schema Updates

**User Model** (`backend/models/user.model.js`):
```javascript
{
  twoFactorEnabled: Boolean (default: false),
  twoFactorSecret: String (select: false),
  backupCodes: [String] (select: false, hashed)
}
```

### API Endpoints

All 2FA endpoints require authentication (`isAuthenticated` middleware).

#### 1. Check 2FA Status
```http
GET /api/v1/2fa/status
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "twoFactorEnabled": false
  }
}
```

#### 2. Setup 2FA
Initiates 2FA setup by generating a secret and QR code.

```http
GET /api/v1/2fa/setup
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "2FA setup initiated. Scan the QR code with your authenticator app.",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "manualEntry": "otpauth://totp/Job%20Portal..."
  }
}
```

#### 3. Verify TOTP Token
Verify a token before enabling 2FA.

```http
POST /api/v1/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token verified successfully"
}
```

#### 4. Enable 2FA
Enable 2FA after successful verification. Returns backup codes (show only once).

```http
POST /api/v1/2fa/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": {
    "backupCodes": [
      "A1B2C3D4",
      "E5F6G7H8",
      "I9J0K1L2",
      "M3N4O5P6",
      "Q7R8S9T0",
      "U1V2W3X4",
      "Y5Z6A7B8",
      "C9D0E1F2",
      "G3H4I5J6",
      "K7L8M9N0"
    ]
  }
}
```

**⚠️ Important**: Backup codes are shown only once. User must save them securely.

#### 5. Disable 2FA
Disable 2FA by providing password.

```http
POST /api/v1/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "userPassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

#### 6. Regenerate Backup Codes
Generate new backup codes (old ones will be invalidated).

```http
POST /api/v1/2fa/regenerate-backup-codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "userPassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Backup codes regenerated successfully",
  "data": {
    "backupCodes": ["...", "..."]
  }
}
```

### Updated Login Flow

The login endpoint now supports 2FA verification:

```http
POST /api/v1/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "twoFactorToken": "123456"     // Optional: TOTP code
  // OR
  "backupCode": "A1B2C3D4"       // Optional: Backup code
}
```

**Response (2FA Required)**:
```json
{
  "message": "Two-factor authentication required",
  "success": false,
  "requires2FA": true,
  "email": "user@example.com"
}
```

**Response (2FA Success)**:
```json
{
  "message": "Welcome back John Doe",
  "user": {...},
  "success": true
}
```

## User Flow

### Enabling 2FA

1. **User logs in** to their account
2. **Navigate to profile settings** → Security
3. **Click "Enable 2FA"**
4. **Backend generates** a secret and QR code (`GET /api/v1/2fa/setup`)
5. **User scans QR code** with authenticator app (Google Authenticator, Authy, etc.)
6. **User enters 6-digit code** from app (`POST /api/v1/2fa/verify`)
7. **User confirms** to enable (`POST /api/v1/2fa/enable`)
8. **Backend returns 10 backup codes** - User must save these!
9. **2FA is now enabled**

### Logging in with 2FA

1. **User enters** email, password, and role
2. **If password correct** and 2FA enabled:
   - Backend responds with `requires2FA: true`
   - Frontend shows 2FA input field
3. **User enters**:
   - 6-digit TOTP code from authenticator app
   - OR a backup code if app unavailable
4. **Backend verifies** token/code
5. **If valid**: User is logged in
6. **If backup code used**: Code is removed from list

### Disabling 2FA

1. **User navigates** to profile settings → Security
2. **Clicks "Disable 2FA"**
3. **Enters password** to confirm
4. **Backend disables** 2FA and removes secrets
5. **2FA is now disabled**

## Security Features

### Secret Storage
- `twoFactorSecret` has `select: false` - not included in queries by default
- `backupCodes` has `select: false` - not included in queries by default
- Must explicitly select using `.select('+twoFactorSecret +backupCodes')`

### Backup Codes
- 10 codes generated during 2FA enable
- Each code is hashed (SHA-256) before storage
- Single-use: Removed after successful login
- Can be regenerated (requires password)

### TOTP Verification
- Uses speakeasy library
- 30-second time window
- `window: 2` allows ±2 time steps for clock skew
- Prevents timing attacks

### Password Protection
- Disabling 2FA requires password verification
- Regenerating backup codes requires password
- Prevents unauthorized 2FA changes

## Testing 2FA

### With Google Authenticator

1. **Install** Google Authenticator on mobile
2. **Setup 2FA** via API
3. **Scan QR code** in the response
4. **Enter 6-digit code** that refreshes every 30 seconds
5. **Login** with email, password, and 2FA code

### With Backup Code

```bash
curl -X POST http://localhost:8000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "student",
    "backupCode": "A1B2C3D4"
  }'
```

## Frontend Integration (To Be Implemented)

### Components Needed

1. **TwoFactorSetup.jsx**
   - Display QR code image
   - Show manual entry key
   - Input field for verification
   - Display backup codes after enable

2. **TwoFactorVerify.jsx**
   - Input field for 6-digit code
   - Link to use backup code instead
   - "Trust this device" option (future)

3. **TwoFactorSettings.jsx**
   - Enable/Disable toggle
   - Status indicator
   - Regenerate backup codes button
   - View remaining backup codes count

### Example Frontend Usage

```javascript
// Enable 2FA
const setup2FA = async () => {
  const response = await axios.get('/api/v1/2fa/setup');
  setQRCode(response.data.data.qrCode);
  setSecret(response.data.data.secret);
};

const verify2FA = async (token) => {
  await axios.post('/api/v1/2fa/verify', { token });
};

const enable2FA = async (token) => {
  const response = await axios.post('/api/v1/2fa/enable', { token });
  setBackupCodes(response.data.data.backupCodes);
  // Show backup codes to user - they must save them!
};

// Login with 2FA
const loginWith2FA = async (email, password, role, twoFactorToken) => {
  const response = await axios.post('/api/v1/user/login', {
    email,
    password,
    role,
    twoFactorToken
  });
  
  if (response.data.requires2FA) {
    // Show 2FA input
    setShow2FAInput(true);
  } else {
    // Login successful
    setUser(response.data.user);
  }
};
```

## Dependencies

- **speakeasy**: TOTP generation and verification
- **qrcode**: QR code generation
- **crypto**: Hashing backup codes

Already installed via:
```bash
npm install speakeasy qrcode
```

## Error Handling

### Common Errors

**"2FA is already enabled"**
- User tried to setup 2FA when it's already active
- Must disable first to generate new secret

**"Invalid token"**
- TOTP code incorrect or expired
- Code is time-sensitive (30-second window)
- Check device clock is synchronized

**"Invalid backup code"**
- Code already used or incorrect
- Each code is single-use
- Must regenerate if all codes used

**"Please setup 2FA first"**
- Tried to verify/enable without running setup
- Must call `/2fa/setup` first

## Logging

All 2FA operations are logged:
- Setup initiation
- Token verification attempts (success/failure)
- Enable/disable actions
- Backup code usage
- Password verification failures

Check logs: `backend/logs/combined-YYYY-MM-DD.log`

## Best Practices

1. **Backup Codes**
   - User must save backup codes in a secure location
   - Show codes only once during enable
   - Provide download/print option in frontend

2. **User Education**
   - Explain what 2FA is and why it's important
   - Show instructions for authenticator app setup
   - Warn about losing access if phone lost

3. **Recovery**
   - Backup codes are the only recovery method
   - If all backup codes used, user must disable and re-enable 2FA
   - Consider admin override for account recovery (future feature)

4. **Security**
   - Never log TOTP tokens or backup codes
   - Never return unhashed backup codes except during enable
   - Always require password for disable/regenerate

## Future Enhancements

- [ ] SMS backup option
- [ ] "Remember this device" for 30 days
- [ ] Admin ability to disable 2FA for locked users
- [ ] 2FA recovery via support ticket
- [ ] Multiple authenticator apps support
- [ ] Push notifications as 2FA method
- [ ] WebAuthn/FIDO2 support

## Status

✅ Backend implementation complete  
✅ API endpoints functional  
✅ Login flow updated  
⏳ Frontend components (to be created)  
⏳ User documentation  
⏳ Testing  

## Next Steps

1. Create frontend 2FA components
2. Integrate 2FA setup in Profile page
3. Update Login component to handle 2FA flow
4. Test complete user journey
5. Create user-facing documentation
6. Add 2FA status indicator in navbar
