#!/bin/bash

# Microservices Backend Setup Script
# Author: GitHub Copilot
# Date: November 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker is installed and ready"
}

# Check if ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    local ports=(3000 3001 3002 3003 5432 5672 15672)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        print_warning "The following ports are already in use: ${occupied_ports[*]}"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Setup cancelled. Please free up the ports and try again."
            exit 1
        fi
    else
        print_success "All required ports are available"
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting all services..."
    
    # Build services
    if docker compose build; then
        print_success "Services built successfully"
    else
        print_error "Failed to build services"
        exit 1
    fi
    
    # Start services
    if docker compose up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    local count=0
    while ! docker compose exec postgres pg_isready -U postgres >/dev/null 2>&1; do
        sleep 2
        count=$((count + 1))
        if [ $count -gt 30 ]; then
            print_error "PostgreSQL failed to start within 60 seconds"
            exit 1
        fi
    done
    print_success "PostgreSQL is ready"
    
    # Wait for RabbitMQ
    print_status "Waiting for RabbitMQ..."
    count=0
    while ! curl -s http://localhost:15672 >/dev/null 2>&1; do
        sleep 2
        count=$((count + 1))
        if [ $count -gt 30 ]; then
            print_error "RabbitMQ failed to start within 60 seconds"
            exit 1
        fi
    done
    print_success "RabbitMQ is ready"
    
    # Wait for Nginx Gateway
    print_status "Waiting for Nginx Gateway..."
    count=0
    while ! curl -s http://localhost:3000/health >/dev/null 2>&1; do
        sleep 2
        count=$((count + 1))
        if [ $count -gt 30 ]; then
            print_error "Nginx Gateway failed to start within 60 seconds"
            exit 1
        fi
    done
    print_success "Nginx Gateway is ready"
}

# Display service information
show_services_info() {
    echo
    print_success "🎉 All services are up and running!"
    echo
    echo "📋 Service Information:"
    echo "├── 🌐 Nginx Gateway:        http://localhost:3000"
    echo "├── 🔐 Auth Service:         http://localhost:3011"  
    echo "├── 👤 User Service:         http://localhost:3012"
    echo "├── 👨‍💼 Admin Service:        http://localhost:3013"
    echo "├── 💪 Workout Service:      http://localhost:3015"
    echo "├── 🥗 Nutrition Service:    http://localhost:3016"
    echo "├── 📦 Order Service:        http://localhost:3017"
    echo "├── 💳 Payment Service:      http://localhost:3018"
    echo "├── 🏪 Partner Service:      http://localhost:3019"
    echo "├── 🚚 Delivery Service:     http://localhost:3020"
    echo "├── 📧 Notification Service: http://localhost:3021"
    echo "├── 🤖 Recommendation Service: http://localhost:3022"
    echo "├── 🐰 RabbitMQ UI:          http://localhost:15672 (admin/admin)"
    echo "└── 🗄️  PostgreSQL:          localhost:5432 (postgres/postgres_password)"
    echo
    echo "🧪 Test APIs via Nginx Gateway:"
    echo "curl http://localhost:3000/health"
    echo "curl http://localhost:3000/api/auth/"
    echo "curl http://localhost:3000/api/users/"
    echo "curl http://localhost:3000/api/workouts/"
    echo "curl http://localhost:3000/api/nutrition/"
    echo "curl http://localhost:3000/api/orders/"
    echo "curl http://localhost:3000/api/payments/"
    echo "curl http://localhost:3000/api/partners/"
    echo "curl http://localhost:3000/api/deliveries/"
    echo "curl http://localhost:3000/api/notifications/"
    echo "curl http://localhost:3000/api/recommendations/"
    echo
    echo "📊 Monitor logs:"
    echo "docker compose logs -f"
    echo
    echo "🛑 Stop services:"
    echo "docker compose down"
}

# Main execution
main() {
    echo "=================================================="
    echo "🚀 Microservices Backend Setup"
    echo "=================================================="
    echo
    
    check_docker
    check_ports
    start_services
    wait_for_services
    show_services_info
    
    echo "=================================================="
    print_success "Setup completed successfully! 🎉"
    echo "=================================================="
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@"