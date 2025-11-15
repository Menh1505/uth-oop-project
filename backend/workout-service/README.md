# Workout Service

Workout management service for FitFood - manages workout plans, exercises, and activity logs.

## Features

- **Workout Plans**: Create and manage personalized workout routines
- **Exercise Library**: Personal and public exercise database
- **Workout Logging**: Track workout sessions and progress
- **Statistics**: User workout analytics and insights
- **User Isolation**: All data filtered by user ID for privacy

## API Endpoints

### Workout Plans
- `GET /api/workout/plans` - Get user's workout plans
- `GET /api/workout/plans/:id` - Get specific workout plan
- `POST /api/workout/plans` - Create new workout plan
- `PUT /api/workout/plans/:id` - Update workout plan
- `DELETE /api/workout/plans/:id` - Delete workout plan

### Exercises
- `GET /api/workout/exercises` - Get user's exercises (personal + public)
- `GET /api/workout/exercises/:id` - Get specific exercise
- `POST /api/workout/exercises` - Create new exercise
- `PUT /api/workout/exercises/:id` - Update exercise (own only)
- `DELETE /api/workout/exercises/:id` - Delete exercise (own only)

### Workout Logs
- `GET /api/workout/logs` - Get user's workout logs
- `GET /api/workout/logs/:id` - Get specific workout log
- `POST /api/workout/logs` - Create new workout log
- `PUT /api/workout/logs/:id` - Update workout log
- `DELETE /api/workout/logs/:id` - Delete workout log

### Statistics
- `GET /api/workout/stats` - Get user's workout statistics

### Query Parameters

#### Workout Plans
```
?goal=weight_loss&difficulty=beginner&maxDuration=60&isActive=true&limit=10&offset=0
```

#### Exercises
```
?category=cardio&difficulty=intermediate&muscleGroup=legs&equipment=dumbbells&isPublic=true&search=push&limit=20
```

#### Logs
```
?workoutPlanId=uuid&exerciseId=uuid&startDate=2024-01-01&endDate=2024-01-31&minRating=4&limit=50
```

## Data Models

### WorkoutPlan
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string;
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility' | 'general_fitness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  frequency: number; // times per week
  exerciseIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Exercise
```typescript
{
  id: string;
  userId: string;
  name: string;
  description: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'balance' | 'sports' | 'yoga' | 'pilates' | 'hiit';
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // seconds
  reps?: number;
  sets?: number;
  restTime?: number; // seconds
  caloriesPerMinute?: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### WorkoutLog
```typescript
{
  id: string;
  userId: string;
  workoutPlanId?: string;
  exerciseId: string;
  date: Date;
  duration: number; // actual minutes
  repsCompleted?: number;
  setsCompleted?: number;
  weightUsed?: number; // kg
  caloriesBurned?: number;
  notes?: string;
  rating?: number; // 1-5 stars
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

```
PORT=3004
DATABASE_URL=postgresql://username:password@localhost:5432/workout_db
JWT_SECRET=your_jwt_secret
```

## Example Requests

### Create Workout Plan
```bash
curl -X POST http://localhost:3004/api/workout/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Morning Cardio",
    "description": "Quick morning cardio routine",
    "goal": "weight_loss",
    "difficulty": "beginner",
    "duration": 30,
    "frequency": 5,
    "exerciseIds": ["exercise-uuid-1", "exercise-uuid-2"]
  }'
```

### Create Exercise
```bash
curl -X POST http://localhost:3004/api/workout/exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Custom Push-ups",
    "description": "My variation of push-ups",
    "category": "strength",
    "muscleGroups": ["chest", "arms", "core"],
    "equipment": ["none"],
    "instructions": ["Start in plank", "Lower to ground", "Push back up"],
    "difficulty": "beginner",
    "reps": 10,
    "sets": 3,
    "restTime": 60,
    "isPublic": false
  }'
```

### Log Workout
```bash
curl -X POST http://localhost:3004/api/workout/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "exerciseId": "exercise-uuid",
    "duration": 25,
    "repsCompleted": 12,
    "setsCompleted": 3,
    "caloriesBurned": 150,
    "rating": 4,
    "notes": "Felt great today!"
  }'
```

## User Data Isolation

All endpoints automatically filter data by the authenticated user's ID:
- Users can only see their own workout plans and logs
- Users can see their own exercises + public exercises
- Users can only modify their own data
- Statistics are calculated per user

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```