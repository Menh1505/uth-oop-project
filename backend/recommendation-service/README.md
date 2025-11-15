# Recommendation Service

AI-powered recommendation service for the FitFood application using OpenAI GPT-4.

## Features

- **Personalized AI Recommendations**: Uses OpenAI GPT-4 to generate personalized nutrition and exercise recommendations
- **User Data Analysis**: Analyzes user profiles, goals, recent meals, and exercises
- **Multiple Recommendation Types**: Supports meal, exercise, nutrition, and general recommendations
- **Daily Recommendations**: Provides daily personalized tips
- **Recommendation History**: Stores and retrieves past recommendations
- **Rate Limiting**: Protects against API abuse
- **Comprehensive Logging**: Winston-based logging system

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Recommendations
- `POST /recommendations/generate` - Generate personalized recommendation
- `GET /recommendations/daily/:userId` - Get daily recommendation
- `GET /recommendations/history/:userId` - Get recommendation history

## Request Examples

### Generate Recommendation
```json
POST /recommendations/generate
{
  "user_id": 123,
  "type": "meal",
  "context": "I want something healthy for dinner"
}
```

### Response Example
```json
{
  "success": true,
  "recommendation": {
    "type": "meal",
    "title": "Balanced Dinner Recommendation",
    "content": "Based on your goals and recent activity...",
    "confidence": 0.85,
    "reasoning": "This recommendation considers your protein goals...",
    "actionable_items": [
      "Prepare grilled chicken with quinoa",
      "Add steamed vegetables",
      "Include a healthy fat source"
    ],
    "timestamp": "2025-11-15T19:30:00.000Z"
  }
}
```

## Environment Variables

```env
# Database
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=uth
DB_NAME=fitfood_db
DB_PORT=5432

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Service
PORT=3007
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
```

## AI Prompt Engineering

The service uses carefully crafted prompts to generate high-quality recommendations:

1. **System Prompt**: Defines the AI role as a nutrition and fitness expert
2. **User Context**: Includes comprehensive user data (profile, goals, history)
3. **Structured Output**: Ensures consistent JSON response format
4. **Safety Guidelines**: Incorporates health and safety considerations

## Installation

```bash
cd recommendation-service
npm install
npm run build
npm start
```

## Docker

```bash
docker build -t recommendation-service .
docker run -p 3007:3007 recommendation-service
```

## Dependencies

- **express**: Web framework
- **openai**: OpenAI API client
- **pg**: PostgreSQL client
- **winston**: Logging
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting
- **cors**: Cross-origin resource sharing