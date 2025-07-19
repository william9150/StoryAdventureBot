#!/bin/bash

# Health Check Script for StoryAdventureBot

set -e

PORT=${PORT:-8080}
HOST=${HOST:-localhost}
ENDPOINT="http://${HOST}:${PORT}/health"

echo "🏥 Running health check on ${ENDPOINT}..."

# Function to check health endpoint
check_health() {
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" "$ENDPOINT" 2>/dev/null || echo -e "\nERROR")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Health check passed"
        echo "📊 Response: $body"
        return 0
    elif [ "$http_code" = "503" ]; then
        echo "⚠️  Service unhealthy (503)"
        echo "📊 Response: $body"
        return 1
    else
        echo "❌ Health check failed (HTTP $http_code)"
        [ -n "$body" ] && echo "📊 Response: $body"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_health; then
            return 0
        fi
        
        echo "🔄 Attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Service failed to become ready after $max_attempts attempts"
    return 1
}

# Main function
main() {
    case "${1:-check}" in
        "check")
            check_health
            ;;
        "wait")
            wait_for_service
            ;;
        *)
            echo "Usage: $0 [check|wait]"
            echo "  check: Run a single health check"
            echo "  wait:  Wait for service to become healthy"
            exit 1
            ;;
    esac
}

main "$@"