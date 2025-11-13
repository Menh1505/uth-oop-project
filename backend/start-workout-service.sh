#!/bin/bash

# Workout Service Startup Script
echo "🏋️ Starting Workout Service..."

# Check if dependencies are available
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "workout-service/node_modules" ]; then
    echo "📦 Installing workout service dependencies..."
    cd workout-service
    npm install
    cd ..
fi

# Build the TypeScript code
echo "🔨 Building workout service..."
cd workout-service
npm run build
cd ..

# Start Docker Compose with workout service
echo "🐳 Starting Docker Compose with workout service..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Create database if it doesn't exist
echo "🗄️ Setting up workout database..."
docker-compose exec postgres psql -U postgres -f /migrations/workout_db.sql

# Start workout service
echo "💪 Starting workout service..."
docker-compose up -d workout-service

# Wait for service to start
sleep 10

echo ""
echo "✅ Workout Service Started!"
echo ""
echo "📊 Service URLs:"
echo "   Workout Service: http://localhost:3015"
echo "   Health Check: http://localhost:3015/"
echo ""
echo "🏋️ Workout API Endpoints:"
echo "   GET  /api/workout/plans - List workout plans"
echo "   POST /api/workout/plans - Create workout plan (auth required)"
echo "   GET  /api/workout/exercises - List exercises"
echo "   POST /api/workout/exercises - Create exercise (auth required)"
echo "   GET  /api/workout/logs - List workout logs"
echo "   POST /api/workout/logs - Log workout (auth required)"
echo "   GET  /api/workout/stats - Get workout statistics"
echo ""
echo "🔐 Authentication:"
echo "   All endpoints (except health) require JWT token"
echo "   Header: Authorization: Bearer <token>"
echo ""
echo "📋 Sample Data:"
echo "   - 10 public exercises added to database"
echo "   - 3 sample workout plans created"
echo "   - Ready for user data"
echo ""
echo "🎉 Workout service is running! Check logs with:"
echo "   docker-compose logs workout-service"