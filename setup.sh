#!/bin/bash

# Growth Catalyst Platform Setup Script
# This script sets up the development environment for the Growth Catalyst Platform

echo "🚀 Setting up Growth Catalyst Platform..."

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need Docker for database and Redis."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. You'll need it for local development."
    fi
    
    print_success "System requirements check completed"
}

# Install root dependencies
install_root_dependencies() {
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
}

# Install backend dependencies
install_backend_dependencies() {
    print_status "Installing backend dependencies..."
    cd backend/api-gateway
    npm install
    cd ../..
    print_success "Backend dependencies installed"
}

# Install web admin dependencies
install_web_dependencies() {
    print_status "Installing web admin dependencies..."
    cd web-admin
    npm install
    cd ..
    print_success "Web admin dependencies installed"
}

# Install mobile dependencies
install_mobile_dependencies() {
    print_status "Installing mobile app dependencies..."
    cd mobile-apps/ios
    npm install
    cd ../android
    npm install
    cd ../..
    print_success "Mobile app dependencies installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy example env file if it doesn't exist
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Created .env file from example"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Create mobile app env files
    if [ ! -f mobile-apps/ios/.env ]; then
        echo "REACT_APP_API_URL=http://localhost:3000" > mobile-apps/ios/.env
        print_success "Created iOS .env file"
    fi
    
    if [ ! -f mobile-apps/android/.env ]; then
        echo "REACT_APP_API_URL=http://localhost:3000" > mobile-apps/android/.env
        print_success "Created Android .env file"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Starting PostgreSQL and Redis with Docker..."
        docker-compose up -d postgres redis
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
        
        # Run migrations
        print_status "Running database migrations..."
        cd backend/api-gateway
        npm run db:migrate
        npm run db:seed
        cd ../..
        
        print_success "Database setup completed"
    else
        print_warning "Docker not available. Please set up PostgreSQL and Redis manually."
        print_warning "Database URL: postgresql://gc_user:gc_password@localhost:5432/growth_catalyst"
        print_warning "Redis URL: redis://localhost:6379"
    fi
}

# Create development scripts
create_scripts() {
    print_status "Creating development scripts..."
    
    # Create start script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Growth Catalyst Platform in development mode..."

# Start database services
docker-compose up -d postgres redis

# Start backend
cd backend/api-gateway
npm run dev &
BACKEND_PID=$!

# Start web admin
cd ../../web-admin
npm start &
WEB_PID=$!

# Start mobile (iOS)
cd ../mobile-apps/ios
npm start &
MOBILE_PID=$!

echo "✅ All services started!"
echo "📊 Web Admin: http://localhost:3001"
echo "🔧 API Gateway: http://localhost:3000"
echo "📱 Mobile: Metro bundler running"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
wait
EOF

    chmod +x start-dev.sh
    
    # Create stop script
    cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Growth Catalyst Platform..."

# Kill all Node.js processes
pkill -f "npm run dev"
pkill -f "npm start"

# Stop Docker services
docker-compose down

echo "✅ All services stopped"
EOF

    chmod +x stop-dev.sh
    
    print_success "Development scripts created"
}

# Main setup function
main() {
    echo "🎯 Growth Catalyst Platform Setup"
    echo "=================================="
    
    check_requirements
    install_root_dependencies
    install_backend_dependencies
    install_web_dependencies
    install_mobile_dependencies
    setup_environment
    setup_database
    create_scripts
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Run './start-dev.sh' to start all services"
    echo "3. Open http://localhost:3001 for web admin"
    echo "4. Use 'npx react-native run-ios' or 'npx react-native run-android' for mobile"
    echo ""
    echo "For more information, check the README.md file"
}

# Run main function
main
