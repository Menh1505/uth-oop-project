# User Service API - Updated for ERD Compliance

This user service has been updated to match the database ERD and support the complete user registration, login, and onboarding flow.

## Database Schema

The service now works with the following main tables:
- `users` - Main user information table
- `goals` - Available fitness goals  
- `user_goals` - Junction table for user-goal assignments

## API Endpoints

### Authentication (No Auth Required)

#### Register User
```
POST /users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "gender": "Male",           // Optional: Male, Female, Other
  "age": 25,                  // Optional
  "weight": 70.5,            // Optional: in kg
  "height": 175.0,           // Optional: in cm
  "fitness_goal": "Build Muscle",  // Optional: Reduce Fat, Build Muscle, Maintain Weight, General Fitness
  "preferred_diet": "High Protein", // Optional: None, Vegetarian, Vegan, Keto, Mediterranean, Low Carb, High Protein
  "payment_method": "Credit Card"   // Optional: Apple Pay, PayOS, Credit Card, Bank Transfer
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "user_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "Male",
    "age": 25,
    "weight": 70.5,
    "height": 175.0,
    "fitness_goal": "Build Muscle",
    "preferred_diet": "High Protein",
    "subscription_status": "Basic",
    "payment_method": "Credit Card",
    "created_at": "2025-11-15T10:00:00Z",
    "updated_at": "2025-11-15T10:00:00Z",
    "is_active": true,
    "last_login": null,
    "email_verified": false,
    "profile_picture_url": null
  }
}
```

#### Login User
```
POST /users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "user_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    // ... other user fields
  },
  "needsOnboarding": false  // true if user needs to complete profile
}
```

### User Profile (Auth Required)

#### Get Current User Profile
```
GET /users/me
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "user": {
    "user_id": "uuid",
    "name": "John Doe",
    // ... complete user profile
  },
  "needsOnboarding": false
}
```

#### Update User Profile
```
PUT /users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "age": 26,
  "weight": 72.0,
  "height": 176.0,
  "fitness_goal": "Reduce Fat",
  "preferred_diet": "Keto",
  "payment_method": "Apple Pay",
  "profile_picture_url": "data:image/jpeg;base64,..."
}

Response:
{
  "success": true,
  "message": "Profile updated successfully", 
  "user": {
    // ... updated user profile
  },
  "needsOnboarding": false
}
```

#### Complete Onboarding
```
POST /users/onboarding
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "gender": "Male",
  "age": 25,
  "weight": 70.5,
  "height": 175.0,
  "fitness_goal": "Build Muscle",
  "preferred_diet": "High Protein",
  "payment_method": "Credit Card"
}

Response:
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    // ... updated user profile
  },
  "needsOnboarding": false
}
```

#### Upload Avatar
```
PUT /users/avatar
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "profile_picture_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}

Response:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "user": {
    // ... updated user profile with new avatar
  }
}
```

### Goals Management (Auth Required)

#### Get Available Goals
```
GET /users/goals/available
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "goals": [
    {
      "goal_id": "uuid",
      "goal_type": "Build Muscle",
      "target_calories": 2500,
      "target_protein": 120.0,
      "target_carbs": 250.0,
      "target_fat": 80.0,
      "target_weight": 75.0,
      "target_duration_weeks": 12,
      "description": "Build lean muscle mass",
      "created_at": "2025-11-15T10:00:00Z",
      "updated_at": "2025-11-15T10:00:00Z",
      "is_active": true
    }
    // ... more goals
  ]
}
```

#### Get User Goals
```
GET /users/goals
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "goals": [
    {
      "user_goal_id": "uuid",
      "user_id": "uuid",
      "goal_id": "uuid", 
      "assigned_date": "2025-11-15T10:00:00Z",
      "target_completion_date": "2025-02-15T10:00:00Z",
      "actual_completion_date": null,
      "progress_percentage": 25.5,
      "status": "Active",
      "notes": "Making good progress",
      "created_at": "2025-11-15T10:00:00Z",
      "updated_at": "2025-11-15T10:00:00Z",
      "goal": {
        "goal_id": "uuid",
        "goal_type": "Build Muscle",
        // ... complete goal details
      }
    }
  ],
  "activeGoals": [
    // ... only active goals
  ],
  "totalGoals": 3,
  "totalActiveGoals": 1
}
```

#### Assign Goal to User
```
POST /users/goals
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "goal_id": "uuid",
  "target_completion_date": "2025-02-15T10:00:00Z",  // Optional
  "notes": "Want to build muscle for summer"          // Optional
}

Response:
{
  "success": true,
  "message": "Goal assigned successfully",
  "userGoal": {
    "user_goal_id": "uuid",
    "user_id": "uuid",
    "goal_id": "uuid",
    // ... complete user goal details
  }
}
```

#### Update Goal Progress
```
PUT /users/goals/:goalId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "progress_percentage": 50.0,      // Optional: 0-100
  "status": "Active",               // Optional: Active, Completed, Paused, Cancelled
  "notes": "Halfway there!",        // Optional
  "target_completion_date": "2025-03-15T10:00:00Z"  // Optional
}

Response:
{
  "success": true,
  "message": "Goal progress updated successfully",
  "userGoal": {
    // ... updated user goal
  }
}
```

#### Remove Goal
```
DELETE /users/goals/:goalId
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Goal removed successfully"
}
```

### Dashboard (Auth Required)

#### Get User Dashboard
```
GET /users/dashboard
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "user": {
    // ... complete user profile
  },
  "activeGoals": [
    // ... user's active goals with goal details
  ],
  "needsOnboarding": false,
  "totalActiveGoals": 2
}
```

### Admin Endpoints (Admin Auth Required)

#### List All Users
```
GET /users/admin/users?limit=50&offset=0
Authorization: Bearer <admin_jwt_token>

Response:
{
  "success": true,
  "users": [
    // ... array of user profiles
  ],
  "limit": 50,
  "offset": 0,
  "total": 25
}
```

## User Flow Implementation

### 1. Registration Flow
1. User submits registration form
2. System validates input data
3. Password is hashed and user created in database
4. Response indicates if onboarding is needed

### 2. Login Flow  
1. User submits email/password
2. System validates credentials
3. JWT token is generated and returned
4. Response indicates if onboarding is needed

### 3. Onboarding Flow
1. Check if user needs onboarding via `/users/me` endpoint
2. If `needsOnboarding: true`, redirect to onboarding form
3. User fills health information (gender, age, weight, height, goals)
4. Submit via `/users/onboarding` endpoint
5. User profile is complete, redirect to dashboard

### 4. Goal Management Flow
1. User views available goals via `/users/goals/available`
2. User selects and assigns goals via `/users/goals`
3. User tracks progress via `/users/goals` (update progress)
4. System prevents duplicate active goals of same type

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Data Validation

### User Registration
- Name: Required, non-empty string
- Email: Required, valid email format, unique
- Password: Required, minimum 6 characters
- Age: Optional, 1-149
- Weight: Optional, greater than 0
- Height: Optional, greater than 0

### Goal Assignment
- Only one active goal per goal type per user
- Target completion date must be in future
- Progress percentage must be 0-100

### Profile Updates
- Name cannot be empty if provided
- Numeric fields must be positive
- Enum fields must match valid values