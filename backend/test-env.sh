#!/bin/bash

# Script quản lý Testing Environment cho API Gateway
# Sử dụng: ./test-env.sh [start|stop|restart|logs|status|clean]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="uth-api-gateway-test"
COMPOSE_FILE="docker-compose.yml"

show_help() {
    echo -e "${BLUE}UTH API Gateway Testing Environment${NC}"
    echo ""
    echo "Sử dụng: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Khởi động testing environment"
    echo "  stop      - Dừng tất cả services"
    echo "  restart   - Restart tất cả services"
    echo "  logs      - Hiển thị logs của tất cả services"
    echo "  status    - Kiểm tra trạng thái services"
    echo "  clean     - Dọn dẹp containers, volumes và networks"
    echo "  test      - Chạy API tests"
    echo "  help      - Hiển thị help"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Khởi động environment"
    echo "  $0 logs gateway   # Xem logs của API Gateway"
    echo "  $0 status         # Kiểm tra trạng thái"
}

start_services() {
    echo -e "${YELLOW}🚀 Đang khởi động Testing Environment...${NC}"
    
    # Build và start services
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --build
    
    echo -e "${GREEN}✅ Services đang khởi động...${NC}"
    echo ""
    echo "Endpoints:"
    echo "  🌐 API Gateway:     http://localhost:3000"
    echo "  🔒 Auth Service:    http://localhost:3011"  
    echo "  👤 User Service:    http://localhost:3012"
    echo "  📊 Prometheus:      http://localhost:9090"
    echo "  📈 Grafana:         http://localhost:3001 (admin/admin)"
    echo "  🔍 Jaeger:          http://localhost:16686"
    echo "  🐰 RabbitMQ:        http://localhost:15672 (admin/admin)"
    echo ""
    echo -e "${YELLOW}⏳ Đợi services sẵn sàng (có thể mất 1-2 phút)...${NC}"
    
    # Wait for services to be ready
    wait_for_services
}

wait_for_services() {
    local max_wait=120
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if check_health; then
            echo -e "${GREEN}🎉 Tất cả services đã sẵn sàng!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    echo -e "${RED}❌ Timeout waiting for services${NC}"
    return 1
}

check_health() {
    # Check API Gateway health
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
        return 1
    fi
    
    # Check Auth Service health  
    if ! curl -s http://localhost:3011/health > /dev/null 2>&1; then
        return 1
    fi
    
    # Check User Service health
    if ! curl -s http://localhost:3012/health > /dev/null 2>&1; then
        return 1
    fi
    
    return 0
}

stop_services() {
    echo -e "${YELLOW}🛑 Đang dừng Testing Environment...${NC}"
    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ Services đã được dừng${NC}"
}

restart_services() {
    echo -e "${YELLOW}🔄 Đang restart Testing Environment...${NC}"
    stop_services
    start_services
}

show_logs() {
    local service=$1
    if [ -n "$service" ]; then
        echo -e "${BLUE}📋 Logs cho service: $service${NC}"
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f $service
    else
        echo -e "${BLUE}📋 Logs cho tất cả services:${NC}"
        docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f
    fi
}

show_status() {
    echo -e "${BLUE}📊 Trạng thái Services:${NC}"
    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE ps
    
    echo ""
    echo -e "${BLUE}🏥 Health Check:${NC}"
    
    # Check API Gateway
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "  API Gateway:    ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  API Gateway:    ${RED}❌ Unhealthy${NC}"
    fi
    
    # Check Auth Service
    if curl -s http://localhost:3011/health > /dev/null 2>&1; then
        echo -e "  Auth Service:   ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  Auth Service:   ${RED}❌ Unhealthy${NC}"
    fi
    
    # Check User Service
    if curl -s http://localhost:3012/health > /dev/null 2>&1; then
        echo -e "  User Service:   ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  User Service:   ${RED}❌ Unhealthy${NC}"
    fi
    
    # Check Prometheus
    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo -e "  Prometheus:     ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  Prometheus:     ${RED}❌ Unhealthy${NC}"
    fi
    
    # Check Grafana
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "  Grafana:        ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  Grafana:        ${RED}❌ Unhealthy${NC}"
    fi
}

clean_environment() {
    echo -e "${YELLOW}🧹 Đang dọn dẹp Testing Environment...${NC}"
    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Environment đã được dọn dẹp${NC}"
}

run_tests() {
    echo -e "${YELLOW}🧪 Đang chạy API Tests...${NC}"
    
    # Kiểm tra xem services có sẵn sàng không
    if ! check_health; then
        echo -e "${RED}❌ Services chưa sẵn sàng. Chạy './test-env.sh start' trước${NC}"
        exit 1
    fi
    
    # Chạy basic tests
    echo -e "${BLUE}Test 1: Gateway Health Check${NC}"
    curl -s http://localhost:3000/health | jq .
    
    echo -e "\n${BLUE}Test 2: Auth Service via Gateway${NC}"
    curl -s http://localhost:3000/api/auth/health | jq .
    
    echo -e "\n${BLUE}Test 3: User Service via Gateway${NC}"
    curl -s http://localhost:3000/api/users/health | jq .
    
    echo -e "\n${BLUE}Test 4: Circuit Breaker Status${NC}"
    curl -s http://localhost:3000/admin/circuit-breakers | jq .
    
    echo -e "\n${GREEN}✅ Basic tests completed${NC}"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs $2
        ;;
    status)
        show_status
        ;;
    clean)
        clean_environment
        ;;
    test)
        run_tests
        ;;
    help|*)
        show_help
        ;;
esac