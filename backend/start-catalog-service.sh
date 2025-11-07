#!/bin/bash

# Catalog Service Startup Script
echo "🚀 Starting Catalog Service with Observability Stack..."

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
if [ ! -d "catalog-service/node_modules" ]; then
    echo "📦 Installing catalog service dependencies..."
    cd catalog-service
    npm install
    cd ..
fi

# Build the TypeScript code
echo "🔨 Building catalog service..."
cd catalog-service
npm run build
cd ..

# Start Docker Compose with catalog service
echo "🐳 Starting Docker Compose with catalog service..."
docker-compose up -d postgres rabbitmq prometheus grafana jaeger

# Wait for dependencies to be ready
echo "⏳ Waiting for dependencies to be ready..."
sleep 30

# Create database if it doesn't exist
echo "🗄️ Setting up catalog database..."
docker-compose exec postgres psql -U postgres -f /migrations/catalog_db.sql

# Start catalog service
echo "🎯 Starting catalog service..."
docker-compose up -d catalog-service

# Wait for service to start
sleep 10

# Start gateway service (updated with catalog routes)
echo "🌐 Starting gateway service..."
docker-compose up -d gateway-service

echo ""
echo "✅ Catalog Service and Observability Stack Started!"
echo ""
echo "📊 Service URLs:"
echo "   Catalog Service: http://localhost:3014"
echo "   Gateway (with catalog): http://localhost:3000"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo "   Jaeger: http://localhost:16686"
echo "   RabbitMQ Management: http://localhost:15672 (admin/admin)"
echo ""
echo "🔗 Catalog API Endpoints (via Gateway):"
echo "   GET  /api/catalog/products - List products"
echo "   GET  /api/catalog/products/:id - Get product"
echo "   POST /api/catalog/products - Create product (auth required)"
echo "   PUT  /api/catalog/products/:id - Update product (auth required)"
echo "   GET  /api/catalog/categories - List categories"
echo "   GET  /api/catalog/inventory/:productId - Get inventory"
echo "   PUT  /api/catalog/inventory/:productId - Update inventory (auth required)"
echo ""
echo "📈 Monitoring:"
echo "   Metrics: http://localhost:3014/metrics"
echo "   Health: http://localhost:3014/health"
echo "   Health via Gateway: http://localhost:3000/api/catalog/health"
echo ""
echo "🎉 All services are running! Check logs with:"
echo "   docker-compose logs catalog-service"
echo "   docker-compose logs gateway-service"