# Google Login API Reference

## Authentication Endpoints

### POST /api/auth/google-login

Google/Firebase-based user authentication

**Request:**

```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Parameters:**

- `idToken` (required, string): Firebase ID token from client-side authentication

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expires_at": 1763823821000,
  "token_type": "Bearer",
  "loginMethod": "google"
}
```

**Error Responses:**

- **400 Bad Request** - Missing idToken

```json
{
  "message": "ID token required"
}
```

- **401 Unauthorized** - Invalid/expired token

```json
{
  "message": "Google login failed"
}
```

- **500 Internal Server Error** - Firebase/Database error

```json
{
  "message": "No email in token"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response Headers:**

```
Set-Cookie: refresh_token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

---

## Database Queries Reference

### User Collection Schema

```typescript
{
  _id: ObjectId;
  email: string; // Primary identifier
  username: string | null;
  password_hash: string; // Random hash for Google-only users
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  email_verified: boolean;
  login_methods: ["email" | "google" | "facebook" | "apple"];
  google_id: string | null; // Firebase UID
  google_email: string | null;
  google_verified_at: Date | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

### Session Collection Schema

```typescript
{
  _id: ObjectId;
  user_id: ObjectId;
  refresh_token_hash: string;
  user_agent: string;
  ip: string | null;
  login_method: "email" | "google" | "facebook" | "apple";
  expires_at: Date;
  created_at: Date;
}
```

### Identity Collection Schema

```typescript
{
  _id: ObjectId;
  user_id: ObjectId;
  provider: string; // 'google', 'facebook', 'apple'
  provider_uid: string; // Firebase UID
  meta: {
    email: string;
    name: string;
    picture: string;
  }
  created_at: Date;
}
```

---

## MongoDB Queries

### Find all Google users

```javascript
db.users.find({ login_methods: "google" });
```

### Find users with multiple login methods

```javascript
db.users.find({ login_methods: { $size: { $gt: 1 } } });
```

### Get last 10 Google logins

```javascript
db.sessions.find({ login_method: "google" }).sort({ created_at: -1 }).limit(10);
```

### Count unique users by login method

```javascript
db.users.aggregate([
  { $unwind: "$login_methods" },
  {
    $group: {
      _id: "$login_methods",
      count: { $sum: 1 },
    },
  },
]);
```

### Find user account linking history

```javascript
db.identities.find({ user_id: ObjectId("...") }).sort({ created_at: -1 });
```

### Merge duplicate user accounts (manual)

```javascript
// Find duplicates by email
db.users.aggregate([
  {
    $group: {
      _id: "$email",
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
]);

// Update secondary account to primary
db.users.updateOne(
  { _id: ObjectId("secondary_id") },
  { $rename: { login_methods: "old_login_methods" } }
);

// Merge login methods
db.users.updateOne(
  { _id: ObjectId("primary_id") },
  {
    $addToSet: {
      login_methods: {
        $each: ["google", "email"],
      },
    },
  }
);

// Delete secondary
db.users.deleteOne({ _id: ObjectId("secondary_id") });
```

---

## User Registration Flow

### First-Time Google User

1. User clicks "Login with Google"
2. Firebase popup
3. User grants permissions
4. Frontend receives ID token
5. Frontend sends to `/api/auth/google-login`
6. Backend:
   - Extracts email from token
   - Checks if email exists
   - If not: Creates user with `login_methods: ['google']`
   - If yes: Adds 'google' to existing login_methods
7. Backend creates session with `login_method: 'google'`
8. Returns JWT + refresh token
9. Frontend stores tokens
10. Frontend redirects to onboarding (if new user) or journal (if existing)

### Data Created

```javascript
// New User Document
{
  _id: ObjectId("..."),
  email: "user@gmail.com",
  username: "User Name", // From Google profile
  password_hash: "random_hash", // Random 32-byte hash
  status: "active",
  is_active: true,
  email_verified: true, // Guaranteed by Google
  login_methods: ["google"],
  google_id: "118234567890123456789",
  google_email: "user@gmail.com",
  google_verified_at: ISODate("2024-11-22T10:30:00Z"),
  last_login: ISODate("2024-11-22T10:30:00Z"),
  created_at: ISODate("2024-11-22T10:30:00Z"),
  updated_at: ISODate("2024-11-22T10:30:00Z")
}

// Session Document
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  refresh_token_hash: "hash_of_refresh_token",
  user_agent: "firebase-google",
  ip: null,
  login_method: "google",
  expires_at: ISODate("2024-12-22T10:30:00Z"),
  created_at: ISODate("2024-11-22T10:30:00Z")
}

// Identity Document
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  provider: "google",
  provider_uid: "118234567890123456789",
  meta: {
    email: "user@gmail.com",
    name: "User Name",
    picture: "https://lh3.googleusercontent.com/..."
  },
  created_at: ISODate("2024-11-22T10:30:00Z")
}
```

---

## Security Considerations

### Token Validation

- Firebase ID tokens are short-lived (~1 hour)
- Backend must validate signature using Firebase Admin SDK
- Automatic expiration handled by Firebase

### Password Security

- Google-only users get random password hash
- Never allow password login for Google-only accounts
- Support account linking for enhanced security

### Email Verification

- Google guarantees email verification
- Set `email_verified: true` automatically
- `google_verified_at` provides audit trail

### Session Security

- Track login method for anomaly detection
- Log all authentication events
- Support session revocation per device

### Rate Limiting

Apply rate limits to prevent abuse:

```
POST /api/auth/google-login: 10 requests/minute per IP
POST /api/auth/login: 5 requests/minute per IP
```

---

## Integration Checklist

- [ ] Firebase project created
- [ ] Service account credentials obtained
- [ ] `.env` variables set (backend)
- [ ] Firebase web config set (frontend)
- [ ] npm packages installed (`firebase`)
- [ ] `/lib/firebase.ts` configured
- [ ] `GoogleLoginButton.tsx` component created
- [ ] `OAuthButtons.tsx` updated
- [ ] Backend route `/google-login` working
- [ ] User model fields added
- [ ] Session tracking enabled
- [ ] Tests written
- [ ] Documentation reviewed

---

## Troubleshooting

### Firebase Token Verification Error

**Symptom:** 401 Unauthorized on `/google-login`

**Solutions:**

1. Verify Firebase credentials in `.env`
2. Check project ID matches Firebase console
3. Ensure private key has escaped newlines: `\n`
4. Verify backend can connect to Firebase (no firewall/proxy blocking)

### Token Expired Before Backend Verification

**Symptom:** Intermittent 401 errors, sometimes works, sometimes doesn't

**Solutions:**

1. Check client/server time synchronization
2. Increase token TTL in Firebase (if possible)
3. Implement retry logic with exponential backoff
4. Use token refresh before expiration

### User Account Duplication

**Symptom:** Same email creates multiple user documents

**Solutions:**

1. Ensure email uniqueness constraint: `db.users.createIndex({ email: 1 }, { unique: true })`
2. Check for race conditions during registration
3. Implement transaction-based user creation

### Permission Denied on Database Write

**Symptom:** 500 error when creating user

**Solutions:**

1. Check MongoDB connection string in `.env`
2. Verify credentials have write permissions
3. Check database exists and is accessible
4. Review MongoDB error logs

---

## Performance Optimization

### Indexes for Fast Queries

```javascript
// Already created
db.users.createIndex({ email: 1 });
db.users.createIndex({ google_id: 1 });
db.users.createIndex({ login_methods: 1 });

db.sessions.createIndex({ user_id: 1 });
db.sessions.createIndex({ expires_at: 1 });

db.identities.createIndex({ provider: 1, provider_uid: 1 });
```

### Query Optimization

```javascript
// Use projection to reduce data transfer
db.users.find(
  { email: "user@gmail.com" },
  { projection: { password_hash: 0 } }
);

// Use aggregation for analytics
db.users.aggregate([
  { $match: { login_methods: "google" } },
  { $group: { _id: null, count: { $sum: 1 } } },
]);
```

---

## Future Enhancements

1. **Passwordless Email Login**

   - Send magic link via email
   - No password required

2. **Multi-Factor Authentication**

   - TOTP (Google Authenticator)
   - SMS verification

3. **Social Account Linking UI**

   - User can link multiple providers
   - Choose primary login method

4. **Session Management UI**

   - View all active sessions
   - Revoke specific sessions
   - Device information (IP, user agent)

5. **Advanced Analytics**
   - Login method statistics
   - Device fingerprinting
   - Anomaly detection
