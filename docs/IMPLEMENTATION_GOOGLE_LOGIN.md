# Google Login Implementation Guide

## Quick Start (5 minutes)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable Google Sign-In:
   - Click "Authentication" in left sidebar
   - Click "Sign-in method"
   - Enable "Google" provider
   - Add authorized domains: `localhost`, your domain
4. Get Service Account:
   - Settings → Service Accounts → Generate New Private Key
   - Copy and save JSON file

### 2. Backend Configuration

```bash
# Copy .env.example to .env and fill Firebase credentials
cd backend/auth-service
cp .env.example .env

# Edit .env with:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Frontend Configuration

```bash
# Copy .env.example to .env and fill Firebase web config
cd fe-foot
cp .env.example .env

# Get web config from Firebase Console → Project Settings → Web Apps
# Paste into:
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
# ... etc
```

### 4. Start Application

```bash
# Backend (already running in Docker)
cd backend && docker-compose up

# Frontend (new terminal)
cd fe-foot && npm run dev

# Open http://localhost:5174
# Click "Đăng nhập với Google"
```

---

## Complete Architecture

### 1. Database Schema

#### User Collection

```typescript
{
  _id: ObjectId; // MongoDB ID
  email: string; // Primary key (unique, lowercase)
  username: string; // Display name from Google
  password_hash: string; // Random hash (Google users can't login with email)

  // Login tracking
  login_methods: ["google", "email"]; // Methods user can use

  // Google-specific fields
  google_id: string; // Firebase UID (from Firebase token)
  google_email: string; // Email verified by Google
  google_verified_at: Date; // When linked to Google

  // Status
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  email_verified: boolean;
  last_login: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}
```

#### Session Collection

```typescript
{
  _id: ObjectId;
  user_id: ObjectId; // Reference to user
  refresh_token_hash: string; // Hashed refresh token
  login_method: "google"; // NEW: Track which method created session
  user_agent: string;
  ip: string;
  expires_at: Date; // TTL index for auto-cleanup
  created_at: Date;
}
```

#### Identity Collection

```typescript
{
  _id: ObjectId;
  user_id: ObjectId;
  provider: "google"; // Social provider
  provider_uid: string; // Firebase UID
  meta: {
    // Cached provider data
    email: string;
    name: string;
    picture: string;
  }
  created_at: Date;
}
```

### 2. Backend Flow

```
Client sends idToken
        ↓
POST /api/auth/google-login
        ↓
Backend verifies with Firebase Admin SDK
        ↓
Extract email from verified token
        ↓
Look up user by email
        ├─→ New email? Create user with login_methods: ['google']
        └─→ Existing? Add 'google' to login_methods if not present
        ↓
Create Identity document (provider_uid for quick lookup)
        ↓
Create Session with login_method: 'google'
        ↓
Generate JWT access token (15 min TTL)
Generate refresh token (30 day TTL)
        ↓
Return tokens to client
```

### 3. Frontend Flow

```
User clicks "Đăng nhập với Google"
        ↓
GoogleLoginButton.tsx renders
        ↓
Click → signInWithPopup(auth, googleProvider)
        ↓
Firebase handles Google OAuth popup
        ↓
User consents → Firebase returns user + ID token
        ↓
GoogleLoginButton calls ApiClient.post('/auth/google-login', { idToken })
        ↓
Backend validates, creates/updates user
        ↓
ApiClient receives access_token + refresh_token
        ↓
GoogleLoginButton saves to localStorage
        ↓
onSuccess callback → navigate('/onboarding')
        ↓
AppStore.checkAuth() picks up tokens on next mount
```

---

## File Structure

```
backend/auth-service/
├── src/
│   ├── controllers/
│   │   └── authController.ts      [MODIFIED] Added googleLogin()
│   ├── services/
│   │   └── authService.ts         [MODIFIED] Enhanced loginWithGoogle()
│   ├── models/
│   │   └── User.ts                [MODIFIED] Added google_id, login_methods
│   ├── routes/
│   │   └── authRoutes.ts          [EXISTING] Route already defined
│   └── config/
│       └── firebase.ts            [EXISTING] Config already exists
└── .env.example                   [NEW] Firebase credentials template

fe-foot/
├── src/
│   ├── lib/
│   │   └── firebase.ts            [NEW] Firebase initialization
│   ├── components/
│   │   ├── GoogleLoginButton.tsx   [NEW] Google login UI
│   │   └── ui/
│   │       └── OAuthButtons.tsx    [MODIFIED] Now uses GoogleLoginButton
│   └── pages/
│       └── auth/
│           └── Login.tsx           [EXISTING] Already includes OAuthButtons
└── .env.example                   [NEW] Firebase web config template

docs/
├── GOOGLE_LOGIN_SETUP.md          [NEW] Complete setup guide
└── GOOGLE_LOGIN_API.md            [NEW] API reference
```

---

## Environment Variables

### Backend (`backend/auth-service/.env`)

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@my-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### Frontend (`fe-foot/.env`)

```bash
# Firebase Web SDK
VITE_FIREBASE_API_KEY=AIzaSyD_tnWBi0qiQ_aFZHo6XeSRMA5Zm3FM_gg
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project-id
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## Testing

### Manual Test Scenario 1: New User Registration via Google

```bash
# 1. Open http://localhost:5174/login
# 2. Click "Đăng nhập với Google"
# 3. Firebase popup appears
# 4. Select/login with Google account
# 5. Redirected to onboarding page
# 6. Check database:

db.users.findOne({ email: "your-google-email@gmail.com" })
# Should show:
# - login_methods: ['google']
# - google_id: 'firebase-uid'
# - email_verified: true
```

### Manual Test Scenario 2: Existing Email User Adds Google Login

```bash
# 1. Create user account via email registration
# 2. Login with email
# 3. Logout
# 4. Go to login page
# 5. Click "Đăng nhập với Google" with SAME email
# 6. Check database:

db.users.findOne({ email: "user@gmail.com" })
# Should show:
# - login_methods: ['email', 'google']
# - google_id: 'new-firebase-uid'
```

### cURL Test

```bash
# Get Firebase ID token first (manual step via Firebase UI)
FIREBASE_ID_TOKEN="eyJhbGc..."

# Test Google login
curl -X POST http://localhost:3000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d "{\"idToken\":\"$FIREBASE_ID_TOKEN\"}" | jq .

# Expected response:
# {
#   "access_token": "eyJhbGc...",
#   "refresh_token": "a1b2c3...",
#   "expires_at": 1763823821000,
#   "token_type": "Bearer",
#   "loginMethod": "google"
# }
```

---

## MongoDB Setup

### Create Indexes

```javascript
// Run in MongoDB shell or Compass

// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ google_id: 1 }, { unique: true, sparse: true });
db.users.createIndex({ login_methods: 1 });

// Sessions collection
db.sessions.createIndex({ user_id: 1 });
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Identities collection
db.identities.createIndex({ provider: 1, provider_uid: 1 }, { unique: true });
db.identities.createIndex({ user_id: 1 });
```

### Migrate Existing Users

```javascript
// Add google fields to existing users
db.users.updateMany(
  { login_methods: { $exists: false } },
  {
    $set: {
      login_methods: ["email"],
      email_verified: true,
      google_id: null,
      google_email: null,
      google_verified_at: null,
    },
  }
);
```

---

## Security Best Practices

### 1. Firebase Token Validation

- ✅ Backend always validates ID token with Firebase Admin SDK
- ✅ Check token signature
- ✅ Verify expiration
- ❌ Never trust frontend token as-is

### 2. Password Management

```typescript
// Google-only users
- Random 32-byte password hash
- Cannot login with email/password
- No password reset option
- Enhanced security: stronger hash

// Email + Google users
- Both methods work
- Shared password (if existed before Google)
- Can update password
```

### 3. Session Tracking

- Track `login_method` in session for anomaly detection
- Alert if: "User usually logins via Google but just tried email"
- Monitor device/IP changes per login method

### 4. Email Verification

- Firebase guarantees Google email is verified
- Set `email_verified: true` automatically
- Timestamp verification with `google_verified_at`

### 5. Rate Limiting

```
POST /api/auth/google-login: 10/minute per IP
POST /api/auth/login: 5/minute per IP
```

---

## Troubleshooting

### Problem: "Firebase config incomplete" warning

**Cause:** Missing environment variables

**Fix:**

```bash
# Frontend
cp fe-foot/.env.example fe-foot/.env
# Edit .env with Firebase web config
```

### Problem: 401 Unauthorized on Google login

**Cause:** Invalid Firebase credentials

**Fix:**

```bash
# Backend
cp backend/auth-service/.env.example backend/auth-service/.env
# Edit .env with Firebase Admin SDK credentials
# Make sure FIREBASE_PRIVATE_KEY has literal \n (not actual newlines)
```

### Problem: "Unauthorized: Login method not allowed"

**Cause:** Session login_method mismatch

**Fix:** Check database, regenerate session

### Problem: User duplicates on multiple logins

**Cause:** Race condition or missing unique index

**Fix:**

```javascript
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## API Reference Summary

| Endpoint             | Method | Auth | Purpose            |
| -------------------- | ------ | ---- | ------------------ |
| `/auth/register`     | POST   | ❌   | Email registration |
| `/auth/login`        | POST   | ❌   | Email login        |
| `/auth/google-login` | POST   | ❌   | Google login       |
| `/auth/refresh`      | POST   | ❌   | Refresh JWT        |
| `/auth/logout`       | POST   | ✅   | Logout             |
| `/auth/verify`       | GET    | ✅   | Verify token       |
| `/auth/sessions`     | GET    | ✅   | List sessions      |
| `/auth/sessions/:id` | DELETE | ✅   | Revoke session     |

---

## Next Steps

1. **Setup Firebase Project** → Get credentials
2. **Update .env files** → Add Firebase config
3. **Restart containers** → Backend picks up new config
4. **Test Google login** → Verify flow works
5. **Monitor logs** → Check for errors
6. **Deploy to production** → Update Firebase authorized domains

---

## Support

For issues or questions:

1. Check GOOGLE_LOGIN_SETUP.md for detailed setup
2. Check GOOGLE_LOGIN_API.md for API reference
3. Review logs: `docker logs backend-auth-service-1`
4. Check Firebase Console for authentication events
