# Google Login Integration Setup

## Database Schema Changes

### User Model (Added Fields)

```typescript
- login_methods: Array<'email' | 'google' | 'facebook' | 'apple'> // Track login methods
- google_id: string // Firebase UID (unique indexed)
- google_email: string // Email verified by Google
- google_verified_at: Date // When Google email was verified
```

### Session Model (Added Fields)

```typescript
- login_method: 'email' | 'google' | 'facebook' | 'apple' // Track session creation method
```

## Backend Setup

### 1. Firebase Admin Setup

**Get Firebase Service Account:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save the JSON file

**Add to `.env` (auth-service):**

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. API Endpoints

**POST `/api/auth/google-login`**

```json
{
  "idToken": "firebase-id-token-from-frontend"
}
```

**Response:**

```json
{
  "access_token": "jwt-token",
  "refresh_token": "opaque-refresh-token",
  "expires_at": 1763823821000,
  "token_type": "Bearer",
  "loginMethod": "google"
}
```

**Error Responses:**

- `400 Bad Request` - Missing idToken
- `401 Unauthorized` - Invalid token
- `500 Server Error` - Firebase/Database error

## Frontend Setup

### 1. Firebase Web Config

**Get Firebase Web Config:**

1. Firebase Console → Project Settings → Web App
2. Copy the config

**Create `src/lib/firebase.ts`:**

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmhM_FkQ4Oo40rUPv1B1xqzDHyBuXh47I",
  authDomain: "proj-mic-d4567.firebaseapp.com",
  projectId: "proj-mic-d4567",
  storageBucket: "proj-mic-d4567.firebasestorage.app",
  messagingSenderId: "910738020178",
  appId: "1:910738020178:web:e06ef6dca2d8a07ce80c8b",
  measurementId: "G-LPSLFK9YE9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

**Add to `.env` (frontend):**

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Install Firebase SDK

```bash
cd fe-foot
npm install firebase
```

### 3. Google Login Component

Use the `GoogleLoginButton` component in `/fe-foot/src/components/GoogleLoginButton.tsx`

**Usage in Login Page:**

```tsx
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export function LoginPage() {
  return (
    <div>
      <GoogleLoginButton onSuccess={handleLoginSuccess} />
    </div>
  );
}
```

## User Flow

### First-Time Google Login

1. User clicks "Login with Google"
2. Firebase Google Sign-In popup
3. User grants permissions
4. Firebase returns ID token
5. Frontend sends ID token to `/api/auth/google-login`
6. Backend creates new user with `login_methods: ['google']`
7. Backend returns JWT + refresh token
8. Frontend stores tokens → redirects to onboarding

### Existing User Login with Google

1. Same steps 1-4
2. Backend checks if email exists
3. If exists: Add 'google' to `login_methods` if not already present
4. Update `google_id`, `google_email`, `google_verified_at`
5. Return JWT + refresh token

## Database Queries

### Find users by login method:

```javascript
// Email-only users
db.users.find({ login_methods: { $eq: ["email"] } });

// Google users
db.users.find({ login_methods: "google" });

// Multi-method users (linked accounts)
db.users.find({ login_methods: { $size: { $gt: 1 } } });
```

### Get login history:

```javascript
// All sessions for a user
db.sessions.find({ user_id: ObjectId("...") }).sort({ created_at: -1 });

// Google login sessions
db.sessions.find({ user_id: ObjectId("..."), login_method: "google" });
```

### Analytics:

```javascript
// Count users by login method
db.users.aggregate([
  { $unwind: "$login_methods" },
  { $group: { _id: "$login_methods", count: { $sum: 1 } } },
]);

// Users with multiple login methods
db.users.find({ login_methods: { $size: { $gt: 1 } } }).count();
```

## Migration for Existing Users

If you have existing email-only users, update them:

```javascript
db.users.updateMany(
  { login_methods: { $exists: false } },
  {
    $set: {
      login_methods: ["email"],
      email_verified: true,
      google_verified_at: null,
    },
  }
);
```

## Security Considerations

1. **ID Token Validation:**

   - Always verify ID token on backend
   - Check token expiration
   - Validate signature

2. **Password Management:**

   - Google-only users get random password hash
   - Don't expose password hash in responses
   - Password recovery disabled for Google accounts

3. **Email Verification:**

   - Firebase guarantees email verification for Google
   - Set `email_verified: true` for Google logins
   - Set `google_verified_at` timestamp

4. **Session Tracking:**

   - Log login method for security audit
   - Track which device/IP used which method
   - Detect suspicious activity (e.g., switched login method)

5. **Rate Limiting:**
   - Implement rate limits on `/google-login`
   - Prevent token reuse attacks

## Troubleshooting

### Firebase Token Verification Fails

- Check Firebase credentials in `.env`
- Verify project ID matches
- Ensure FIREBASE_PRIVATE_KEY has escaped newlines

### Google Login Button Doesn't Appear

- Verify Firebase config in frontend
- Check browser console for errors
- Ensure DOM element exists for button

### "Invalid credentials" on Google Login

- Token may be expired (check token timestamp)
- Verify backend can reach Firebase
- Check firewall/proxy isn't blocking Firebase

### Users Can't Link Google to Existing Email Account

- Current design: If email exists, add google to login_methods
- Future enhancement: Add explicit account linking UI

## Future Enhancements

1. **Facebook/Apple Login** - Similar structure
2. **Account Linking UI** - User chooses to link Google to existing email
3. **Passwordless Login** - Email + magic link
4. **Multi-Factor Auth** - TOTP/SMS verification
5. **Session Management UI** - User sees all active sessions, can revoke
6. **Login History** - User sees login history with method + device
