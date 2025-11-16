#!/bin/bash

# UTH Fitness Backend - Docker Compose Management Script
echo "🏃 UTH Fitness Backend - Docker Management"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker and Docker Compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Function to show service status
show_status() {
    print_status "Current service status:"
    docker compose ps
}

# Function to start all services
start_services() {
    print_status "Starting all UTH Fitness Backend services..."
    
    # Ensure databases are ready first
    print_status "Starting databases and infrastructure..."
    docker compose up -d postgres redis rabbitmq
    
    print_status "Waiting for databases to be ready..."
    sleep 10
    
    # Start application services
    print_status "Starting application services..."
    docker compose up -d auth-service user-service meal-service exercise-service
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Start API Gateway
    print_status "Starting API Gateway..."
    docker compose up -d api-gateway
    
    # Start observability stack
    print_status "Starting observability stack..."
    docker compose up -d prometheus grafana jaeger
    
    print_success "All services started!"
    show_status
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    docker compose down
    print_success "All services stopped!"
}

# Function to restart all services
restart_services() {
    print_status "Restarting all services..."
    stop_services
    sleep 5
    start_services
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker compose logs -f
    else
        print_status "Showing logs for $1..."
        docker compose logs -f "$1"
    fi
}

# Function to build services
build_services() {
    print_status "Building all services..."
    docker compose build --no-cache
    print_success "Build completed!"
}

# Function to run health checks
health_check() {
    print_status "Running health checks..."
    
    services=("api-gateway" "auth-service" "user-service" "meal-service" "exercise-service")
    ports=("3000" "3011" "3012" "3014" "3015")
    
    for i in "${!services[@]}"; do
        service="${services[$i]}"
        port="${ports[$i]}"
        
        print_status "Checking $service on port $port..."
        
        if curl -f http://localhost:$port/health &> /dev/null; then
            print_success "$service is healthy ✅"
        else
            print_error "$service is not responding ❌"
        fi
    done
}

# Function to show service endpoints
show_endpoints() {
    print_status "UTH Fitness Backend Service Endpoints:"
    echo ""
    echo "🌐 API Gateway:        http://localhost:3000"
    echo "   - Health Check:     http://localhost:3000/health"
    echo "   - Metrics:          http://localhost:3000/metrics"
    echo ""
    echo "🔐 Auth Service:       http://localhost:3011"
    echo "👥 User Service:       http://localhost:3012"  
    echo "🍽️  Meal Service:       http://localhost:3014"
    echo "🏋️  Exercise Service:   http://localhost:3015"
    echo ""
    echo "📊 Observability:"
    echo "   - Prometheus:       http://localhost:9090"
    echo "   - Grafana:          http://localhost:3001 (admin/admin)"
    echo "   - Jaeger:           http://localhost:16686"
    echo ""
    echo "🗄️ Infrastructure:"
    echo "   - PostgreSQL:       localhost:5432"
    echo "   - Redis:            localhost:6379"
    echo "   - RabbitMQ:         http://localhost:15672 (admin/admin)"
}

# Main menu
case "$1" in
    start)
        check_dependencies
        start_services
        show_endpoints
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_dependencies
        restart_services
        show_endpoints
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    build)
        check_dependencies
        build_services
        ;;
    health)
        health_check
        ;;
    endpoints)
        show_endpoints
        ;;
    *)
        echo "UTH Fitness Backend Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|build|health|endpoints}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services" 
        echo "  restart   - Restart all services"
        echo "  status    - Show service status"
        echo "  logs      - Show logs (optional: specify service name)"
        echo "  build     - Build all services"
        echo "  health    - Run health checks"
        echo "  endpoints - Show service endpoints"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs api-gateway"
        echo "  $0 health"
        ;;
esac