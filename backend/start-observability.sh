#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "🚀 Starting Microservices with Observability"
echo "=========================================="
echo

print_status "Building and starting all services..."
docker compose up -d

print_status "Waiting for services to be ready..."
sleep 30

print_status "Checking service health..."

# Check Gateway Service
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "✅ Gateway Service is healthy"
else
    print_error "❌ Gateway Service is not responding"
fi

# Check Prometheus
if curl -s http://localhost:9090/-/ready > /dev/null; then
    print_success "✅ Prometheus is ready"
else
    print_error "❌ Prometheus is not responding"
fi

# Check Grafana
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "✅ Grafana is ready"
else
    print_error "❌ Grafana is not responding"
fi

# Check Jaeger
if curl -s http://localhost:16686/api/services > /dev/null; then
    print_success "✅ Jaeger is ready"
else
    print_error "❌ Jaeger is not responding"
fi

echo
print_success "🎉 Observability Stack is ready!"
echo
echo "📋 Access URLs:"
echo "├── 🌐 Gateway Service:    http://localhost:3000"
echo "├── 📊 Grafana Dashboard:  http://localhost:3001 (admin/admin)"
echo "├── 📈 Prometheus:         http://localhost:9090"
echo "├── 🔍 Jaeger Tracing:     http://localhost:16686"
echo "├── 🐰 RabbitMQ UI:        http://localhost:15672 (admin/admin)"
echo "└── 🗄️  PostgreSQL:        localhost:5432"
echo
echo "🧪 Test Commands:"
echo "# Test gateway health"
echo "curl http://localhost:3000/health"
echo
echo "# Test API routing"
echo "curl http://localhost:3000/api/auth/status"
echo
echo "# View metrics"
echo "curl http://localhost:3000/metrics"
echo
echo "📊 Monitor logs:"
echo "docker compose logs -f gateway-service"
echo
echo "🛑 Stop services:"
echo "docker compose down"

echo
print_success "Setup completed successfully! 🎉"
echo "=========================================="