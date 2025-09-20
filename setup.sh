#!/bin/bash

# ScriptureStream Setup Script
# This script sets up the full-stack application for development

set -e

echo "🚀 Setting up ScriptureStream..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed. You'll need to install it or use Docker."
    print_status "To install PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    echo ""
    print_status "Or use Docker: docker-compose up postgres"
else
    print_success "PostgreSQL is installed"
fi

# Create environment files
print_status "Creating environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    print_success "Created backend/.env from template"
    print_warning "Please edit backend/.env with your database credentials"
else
    print_status "backend/.env already exists"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
EOF
    print_success "Created frontend/.env"
else
    print_status "frontend/.env already exists"
fi

# Database setup
print_status "Setting up database..."

# Check if database exists
if command -v psql &> /dev/null; then
    # Try to connect to PostgreSQL
    if psql -h localhost -U postgres -d scripture_stream -c '\q' 2>/dev/null; then
        print_success "Database 'scripture_stream' already exists"
    else
        print_status "Creating database 'scripture_stream'..."
        createdb scripture_stream 2>/dev/null || print_warning "Could not create database. Please create it manually."
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    cd backend
    npx prisma migrate dev --name init 2>/dev/null || print_warning "Could not run migrations. Please run manually: cd backend && npx prisma migrate dev"
    
    # Seed database
    print_status "Seeding database..."
    npx prisma db seed 2>/dev/null || print_warning "Could not seed database. Please run manually: cd backend && npx prisma db seed"
    cd ..
else
    print_warning "PostgreSQL not available. Please set up the database manually:"
    echo "  1. Create database: createdb scripture_stream"
    echo "  2. Run migrations: cd backend && npx prisma migrate dev"
    echo "  3. Seed database: cd backend && npx prisma db seed"
fi

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads
print_success "Created backend/uploads directory"

# Make scripts executable
chmod +x setup.sh

print_success "Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "  1. Edit backend/.env with your database credentials"
echo "  2. Start the development servers:"
echo "     npm run dev"
echo ""
print_status "Or use Docker:"
echo "  docker-compose up"
echo ""
print_status "Access the application:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:3001"
echo "  API Docs: http://localhost:3001/api-docs"
echo ""
print_status "Demo credentials:"
echo "  Email: user@scripturestream.com"
echo "  Password: admin123"
echo ""
print_success "Happy coding! 🙏"
