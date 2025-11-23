# Google Login Quick Reference

## 📋 Files Modified

| File                               | Type     | Change                                               |
| ---------------------------------- | -------- | ---------------------------------------------------- |
| `models/User.ts`                   | Backend  | Added google_id, login_methods, Session.login_method |
| `controllers/authController.ts`    | Backend  | Added googleLogin()                                  |
| `services/authService.ts`          | Backend  | Enhanced loginWithGoogle()                           |
| `lib/firebase.ts`                  | Frontend | Created - Firebase init                              |
| `components/GoogleLoginButton.tsx` | Frontend | Created - Google login UI                            |
| `components/ui/OAuthButtons.tsx`   | Frontend | Modified - Use GoogleLoginButton                     |

## 🚀 Quick Setup (5 minutes)

### Backend

```bash
cd backend/auth-service
cp .env.example .env
# Edit with Firebase credentials:
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="...\n..."
docker-compose restart auth-service
```

### Frontend

```bash
cd fe-foot
cp .env.example .env
# Edit with Firebase web config:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# ... etc
npm install firebase
npm run dev
```

## 🔌 API Endpoint

**POST** `/api/auth/google-login`

```json
{
  "idToken": "firebase-token-from-frontend"
}
```

**Response:**

```json
{
  "access_token": "jwt...",
  "refresh_token": "token...",
  "expires_at": 1763823821000,
  "token_type": "Bearer",
  "loginMethod": "google"
}
```

## 📊 Database Fields Added

### User

- `login_methods`: `['email' | 'google' | ...]`
- `google_id`: Firebase UID
- `google_email`: Google email
- `google_verified_at`: Timestamp

### Session

- `login_method`: Which auth method created session

## 🧪 Test Locally

```bash
# 1. Go to http://localhost:5174/login
# 2. Click "Đăng nhập với Google"
# 3. Firebase popup
# 4. Redirect to onboarding
# 5. Check DB:
db.users.findOne({ email: "your@gmail.com" })
# Should have: login_methods: ['google']
```

## 🔒 Security

✅ ID token validated on backend  
✅ Email verified by Firebase  
✅ Random password for Google-only users  
✅ Session tracking by method  
✅ Email uniqueness enforced

## 📁 Documentation

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `GOOGLE_LOGIN_SETUP.md`          | Complete setup + database schema |
| `GOOGLE_LOGIN_API.md`            | API reference + examples         |
| `IMPLEMENTATION_GOOGLE_LOGIN.md` | Step-by-step implementation      |
| `GOOGLE_LOGIN_CHANGES.md`        | Summary of all changes           |

## 🐛 Troubleshooting

**401 Unauthorized**
→ Check Firebase credentials in .env

**Button doesn't appear**
→ Check browser console for Firebase config error

**"No email in token"**
→ Google account may not have email verified

**Duplicate users**
→ Ensure email unique index: `db.users.createIndex({ email: 1 }, { unique: true })`

## 📝 User Flows

### New Google User

```
Google login → Create user with login_methods: ['google']
→ Redirect to onboarding
```

### Existing Email User + Google

```
Google login (same email) → Add 'google' to login_methods
→ Redirect to journal
```

## 🎯 Key Components

```typescript
// Frontend - Use this component:
<GoogleLoginButton
  onSuccess={(data) => {
    /* handle tokens */
  }}
  onError={(err) => {
    /* handle error */
  }}
/>;

// Backend - This endpoint:
POST / api / auth / google - login;
// Expects: { idToken: string }
// Returns: { access_token, refresh_token, ... }
```

## 📱 Environment Variables

**Backend** (`backend/auth-service/.env`)

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

**Frontend** (`fe-foot/.env`)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## ✅ Deployment Checklist

- [ ] Firebase project created & configured
- [ ] Service account credentials obtained
- [ ] .env files filled with credentials
- [ ] Backend restarted with new config
- [ ] Frontend firebase package installed
- [ ] Manual testing completed
- [ ] Production Firebase authorized domains updated
- [ ] Logs monitored for errors
- [ ] Database indexes created
- [ ] Rate limiting configured

## 🔗 Related APIs

| Endpoint                    | Purpose            |
| --------------------------- | ------------------ |
| `POST /auth/google-login`   | Google login       |
| `POST /auth/login`          | Email login        |
| `POST /auth/register`       | Email registration |
| `POST /auth/refresh`        | Refresh JWT        |
| `POST /auth/logout`         | Logout             |
| `GET /auth/verify`          | Verify token       |
| `GET /auth/sessions`        | List sessions      |
| `DELETE /auth/sessions/:id` | Revoke session     |

## 🎓 Learning Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Sign-In Guide](https://developers.google.com/identity/sign-in)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Flow](https://tools.ietf.org/html/rfc6749)

---

**Created:** Nov 22, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
