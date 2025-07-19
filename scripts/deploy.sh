#!/bin/bash

# StoryAdventureBot Deployment Script

set -e

echo "🚀 Starting StoryAdventureBot deployment..."

# Check if required environment variables are set
check_env_vars() {
    echo "🔍 Checking environment variables..."
    
    required_vars=(
        "LINE_CHANNEL_ACCESS_TOKEN"
        "LINE_CHANNEL_SECRET" 
        "OPENAI_API_KEY"
        "MONGODB_URI"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables:"
        printf '   - %s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm ci --only=production
    echo "✅ Dependencies installed"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    npm run build
    echo "✅ Application built successfully"
}

# Run health check
health_check() {
    echo "🏥 Running health check..."
    
    # Start the application in background
    npm start &
    APP_PID=$!
    
    # Wait for the app to start
    sleep 5
    
    # Check health endpoint
    if curl -f http://localhost:${PORT:-8080}/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        kill $APP_PID
        wait $APP_PID 2>/dev/null || true
    else
        echo "❌ Health check failed"
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        exit 1
    fi
}

# Main deployment flow
main() {
    check_env_vars
    install_deps
    build_app
    health_check
    
    echo "🎉 Deployment completed successfully!"
    echo "📝 To start the application, run: npm start"
}

# Run main function
main "$@"