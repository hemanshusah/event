#!/bin/bash

# Growth Catalyst Platform Deployment Script
# This script handles deployment to different environments

set -e

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

# Default values
ENVIRONMENT="staging"
VERSION="latest"
DOCKER_USERNAME=""
SKIP_TESTS=false
SKIP_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -u|--docker-username)
            DOCKER_USERNAME="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment    Environment to deploy to (staging|production)"
            echo "  -v, --version        Docker image version (default: latest)"
            echo "  -u, --docker-username Docker Hub username"
            echo "  --skip-tests         Skip running tests"
            echo "  --skip-build         Skip building Docker images"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Must be 'staging' or 'production'"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."

# Set environment file
ENV_FILE=".env"
if [[ "$ENVIRONMENT" == "production" ]]; then
    ENV_FILE="env.production"
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file $ENV_FILE not found. Please create it first."
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Override Docker username if provided
if [[ -n "$DOCKER_USERNAME" ]]; then
    export DOCKER_USERNAME="$DOCKER_USERNAME"
fi

# Set version
export VERSION="$VERSION"

print_status "Environment: $ENVIRONMENT"
print_status "Version: $VERSION"
print_status "Docker Username: $DOCKER_USERNAME"

# Run tests if not skipped
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running tests..."
    
    # Install dependencies
    npm ci
    
    # Run backend tests
    print_status "Running backend tests..."
    cd backend/api-gateway
    npm ci
    npm test
    cd ../..
    
    # Run frontend tests
    print_status "Running frontend tests..."
    cd web-admin
    npm ci
    npm test -- --watchAll=false
    cd ..
    
    print_success "All tests passed!"
else
    print_warning "Skipping tests..."
fi

# Build Docker images if not skipped
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building Docker images..."
    
    # Build API Gateway
    print_status "Building API Gateway image..."
    docker build -t $DOCKER_USERNAME/growth-catalyst-api:$VERSION ./backend/api-gateway
    
    # Build Web Admin
    print_status "Building Web Admin image..."
    docker build -t $DOCKER_USERNAME/growth-catalyst-web:$VERSION ./web-admin
    
    print_success "Docker images built successfully!"
else
    print_warning "Skipping Docker build..."
fi

# Deploy based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    print_status "Deploying to staging environment..."
    
    # Use development compose file for staging
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    
elif [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Deploying to production environment..."
    
    # Use production compose file
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    # Check API Gateway
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_success "API Gateway is healthy"
    else
        print_error "API Gateway is not responding"
        exit 1
    fi
    
    # Check Web Admin
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Web Admin is healthy"
    else
        print_error "Web Admin is not responding"
        exit 1
    fi
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec api-gateway npm run db:migrate

# Seed database if staging
if [[ "$ENVIRONMENT" == "staging" ]]; then
    print_status "Seeding database..."
    docker-compose exec api-gateway npm run db:seed
fi

print_success "Deployment completed successfully!"

# Show service status
print_status "Service status:"
docker-compose ps

# Show access URLs
print_status "Access URLs:"
if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "  Web Admin: http://localhost:3001"
    echo "  API Gateway: http://localhost:3000"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo "  Web Admin: http://localhost"
    echo "  API Gateway: http://localhost/api"
    echo "  Monitoring: http://localhost:3001 (Grafana)"
fi

print_success "Deployment script completed!"
