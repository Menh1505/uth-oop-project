# Onboarding Flow Implementation - Complete Guide

## Overview
Implemented a complete authentication and user onboarding flow where:
1. User registers → Auth service creates user in database
2. User logs in → Backend returns access token & refresh token
3. Frontend immediately calls `/api/users/me` to check onboarding status
4. If profile doesn't exist → Frontend shows onboarding form
5. User completes onboarding → Profile is created with all info
6. User is redirected to dashboard

---

## Changes Made

### Backend Changes

#### 1. **User Service - Profile Endpoint** (`backend/user-service/src/controllers/UserController.ts`)
**Change**: Modified `getMe()` to return onboarding status instead of 404 error

```typescript
// Before: Returns 404 if profile not found
// After: Returns { onboarding: true, user_id, email } for new users
// This allows frontend to detect onboarding need

static async getMe(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'User not authenticated' });
  const data = await UserService.getProfile(userId);
  if (!data || !data.profile) {
    // Profile not found - user needs onboarding
    return res.status(200).json({ 
      onboarding: true, 
      message: 'Profile not setup yet, please complete onboarding',
      user_id: userId,
      email: req.user?.email
    });
  }
  res.json({ onboarding: false, ...data });
}
```

#### 2. **Profile Repository** (`backend/user-service/src/repositories/ProfileRepository.ts`)
**Change**: Enhanced `update()` method to create profile skeleton if it doesn't exist

```typescript
// Now uses upsert pattern:
// 1. First ensures profile exists (creates skeleton if needed)
// 2. Then updates with provided data
// This allows first-time onboarding submission to work

static async update(userId: string, data: UpdateProfilePayload) {
  // ... field setup ...
  
  // Ensure profile exists first (upsert skeleton if not)
  await this.upsertSkeleton(userId);
  
  // Then update with new data
  // ... rest of update logic ...
}
```

#### 3. **Nginx Configuration** (`backend/nginx/nginx.conf`)
**Changes**:
- Enabled user-service upstream (uncommented)
- Enabled user-service location block at `/api/users/`
- Fixed duplicate `log_format "main"` → renamed to `custom_main`
- Commented out non-existent `notification_service` location

```nginx
# Added upstream
upstream user_service { 
    server user-service:3002 max_fails=3 fail_timeout=30s;
}

# Enabled location
location /api/users/ {
    limit_req zone=api_limit burst=50 nodelay;
    proxy_pass http://user_service/;
}
```

### Frontend Changes

#### 1. **App Store** (`fe-foot/src/store/AppStore.tsx`)
**Changes**: Enhanced login flow to fetch profile after login

```typescript
// After login success:
// 1. Store access token
// 2. Immediately fetch /api/users/me
// 3. Check onboarding status
// 4. Set profile with needsOnboarding flag

const login = async (username: string, password: string) => {
  // ... login request ...
  const data = await response.json();
  localStorage.setItem('authToken', data.access_token); // Use access_token, not token
  
  // Fetch profile to check onboarding status
  const profileResponse = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  });
  
  if (profileResponse.ok) {
    const profileData = await profileResponse.json();
    setProfile({
      name: profileData.profile?.full_name || username,
      needsOnboarding: profileData.onboarding === true // KEY: Check onboarding flag
      // ... other fields ...
    });
  }
}
```

#### 2. **Onboarding Page** (`fe-foot/src/pages/Onboarding.tsx`)
**Complete Rewrite**: New comprehensive form with:
- Full name (required)
- Phone number
- Date of birth
- Gender
- Timezone selection
- Language preference
- Bio/Personal description

```typescript
// Key features:
// 1. Collects all profile information
// 2. Calls PUT /api/users/me with data
// 3. Waits for backend to create profile
// 4. Redirects to /journal after success
// 5. Handles errors gracefully

const submit = async (e: React.FormEvent<HTMLFormElement>) => {
  // Prepare data
  const profileData = {
    full_name: fd.get("fullName"),
    phone: fd.get("phone"),
    date_of_birth: fd.get("dateOfBirth"),
    gender: fd.get("gender"),
    bio: fd.get("bio"),
    timezone: fd.get("timezone"),
    language: fd.get("language")
  };

  // Send to backend
  const response = await fetch('/api/users/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  // Mark onboarding complete and redirect
  completeOnboarding(profile);
  navigate('/journal');
}
```

#### 3. **App Routes** (Already in place)
The routes in `App.tsx` already had proper guards:
- `RequireOnboardingOnly` - Only access /onboarding if `needsOnboarding === true`
- `RequireCompletedProfile` - Only access dashboard if `needsOnboarding === false`
- Automatic redirects handle all cases

---

## API Endpoints Reference

### Login Flow
```bash
# 1. Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

# 2. Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "abcd...",
  "expires_at": 1763177052000,
  "token_type": "Bearer"
}

# 3. Check Profile (Frontend calls this after login)
GET /api/users/me
Headers: Authorization: Bearer <access_token>

# Response if needs onboarding:
{
  "onboarding": true,
  "message": "Profile not setup yet, please complete onboarding",
  "user_id": "uuid",
  "email": "user@example.com"
}

# Response if profile exists:
{
  "onboarding": false,
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar_url": "...",
    "phone": "+84...",
    ...
  },
  "preferences": {...},
  "addresses": [...]
}
```

### Onboarding Submission
```bash
PUT /api/users/me
Headers: Authorization: Bearer <access_token>
{
  "full_name": "John Doe",
  "phone": "+84 9xx xxx xxx",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "bio": "Software engineer",
  "timezone": "Asia/Ho_Chi_Minh",
  "language": "vi"
}

Response: Same as above with updated profile data
```

---

## Database Schema

### User Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- = auth userId
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender ENUM,                            -- 'male', 'female', 'other', 'prefer_not_to_say'
  bio TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

---

## User Journey

### New User Flow
```
1. User opens app
   ↓
2. Clicks "Register"
   ↓
3. Fills email, password, username → submits
   ↓
4. Backend creates user in auth_db, publishes user.registered event
   ↓
5. User sees "Registration successful, please login"
   ↓
6. User fills email, password → clicks Login
   ↓
7. Backend authenticates, returns access_token + refresh_token
   ↓
8. Frontend stores access_token in localStorage
   ↓
9. Frontend calls GET /api/users/me
   ↓
10. Response: { onboarding: true, ... }
    ↓
11. AppStore detects onboarding needed
    ↓
12. Router redirects to /onboarding
    ↓
13. User fills full_name, phone, date_of_birth, gender, timezone, language, bio
    ↓
14. Frontend calls PUT /api/users/me with profile data
    ↓
15. Backend creates profile skeleton + updates with data
    ↓
16. Frontend marks onboarding complete: needsOnboarding = false
    ↓
17. Router redirects to /journal
    ↓
18. Dashboard loads successfully ✓
```

### Returning User Flow
```
1. User opens app
   ↓
2. Clicks "Login"
   ↓
3. Fills email, password → submits
   ↓
4. Backend returns tokens
   ↓
5. Frontend calls GET /api/users/me
   ↓
6. Response: { onboarding: false, profile: {...} }
   ↓
7. AppStore sets needsOnboarding = false
   ↓
8. Router redirects directly to /journal
   ↓
9. Dashboard loads ✓
```

---

## Testing

### Test Auth Flow
```bash
cd /home/mortal/do-an-xdpm/backend/auth-service
bash test.sh
```

### Test User Service Flow
```bash
cd /home/mortal/do-an-xdpm/backend/user-service
bash test.sh
```

### Manual Testing
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","username":"testuser"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# 3. Get profile (save token from step 2)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"

# 4. Update profile (submit onboarding)
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "+84901234567",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "bio": "Test bio",
    "timezone": "Asia/Ho_Chi_Minh",
    "language": "vi"
  }'
```

---

## Key Implementation Details

### 1. **Token Storage**
- Access token stored in localStorage
- Used for all subsequent API requests
- Should be in Authorization header as: `Bearer <access_token>`

### 2. **Onboarding Detection**
- Backend returns `onboarding: true` if profile missing
- Frontend checks this flag to decide navigation
- No 404 errors - all responses are 200 with status flag

### 3. **Profile Upsert Logic**
- When user submits onboarding form:
  1. PUT /api/users/me is called
  2. Backend checks if profile exists
  3. If not → creates skeleton profile with just ID
  4. Then updates with submitted data
  5. Returns full profile

### 4. **Error Handling**
- Frontend shows error messages from backend
- User can retry without re-logging in
- Token remains valid for retry

---

## Files Modified

### Backend
- `backend/auth-service/src/controllers/authController.ts`
- `backend/auth-service/src/services/authService.ts`
- `backend/auth-service/test.sh` (created)
- `backend/user-service/src/controllers/UserController.ts`
- `backend/user-service/src/repositories/ProfileRepository.ts`
- `backend/user-service/src/repositories/LoginEventRepository.ts`
- `backend/user-service/src/services/messageConsumer.ts`
- `backend/user-service/test.sh` (created)
- `backend/nginx/nginx.conf`
- `backend/docker-compose.yml`

### Frontend
- `fe-foot/src/store/AppStore.tsx`
- `fe-foot/src/pages/Onboarding.tsx`

---

## Next Steps / Future Enhancements

1. **Address Management** - Add address collection during onboarding
2. **Avatar Upload** - Allow avatar URL input or file upload
3. **Email Verification** - Send verification email before complete onboarding
4. **Password Reset** - Add forgot password flow
5. **Profile Editing** - Allow users to edit profile after onboarding
6. **Admin Dashboard** - Show registered users, manage accounts
7. **User Statistics** - Track registration, login, onboarding completion rates

---

## Troubleshooting

### Issue: "Missing bearer token" on /api/users/me
**Solution**: Ensure frontend is passing Authorization header with access token (not refresh token)

### Issue: Onboarding form shows but backend returns 404
**Solution**: Check that PUT /api/users/me endpoint is enabled in nginx config

### Issue: User stuck on onboarding page after submit
**Solution**: Check browser console for errors, check backend logs for why update failed

### Issue: Docker containers not communicating
**Solution**: Verify docker-compose services are running: `docker compose ps`

---

## Support & Contact

For questions about the implementation, check:
- Test files in backend/auth-service/test.sh and backend/user-service/test.sh
- Frontend routing in fe-foot/src/App.tsx
- Type definitions in fe-foot/src/types/index.ts
