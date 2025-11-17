#!/bin/bash
# Localist Local Development Setup Script
# Automates the setup process for local development

set -e  # Exit on error

echo "🚀 Setting up Localist for local development..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "README.md" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo "   cd /path/to/localist && bash scripts/setup.sh"
    exit 1
fi

# ============================================================================
# Backend Setup
# ============================================================================

echo -e "${YELLOW}📦 Setting up backend...${NC}"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}✅ Python dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://localist:dev_pass@localhost:5432/localist
JWT_SECRET_KEY=development-secret-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=localist-images
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your actual credentials${NC}"
else
    echo ".env file already exists"
fi

cd ..

# ============================================================================
# Database Setup
# ============================================================================

echo ""
echo -e "${YELLOW}🗄️  Setting up database...${NC}"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Docker found. Checking for existing database container..."

    # Check if container already exists
    if docker ps -a | grep -q localist-db; then
        echo "Database container already exists"

        # Check if it's running
        if docker ps | grep -q localist-db; then
            echo "Database container is already running"
        else
            echo "Starting database container..."
            docker start localist-db
            sleep 3
            echo -e "${GREEN}✅ Database container started${NC}"
        fi
    else
        echo "Creating new database container..."
        docker run -d \
          --name localist-db \
          -e POSTGRES_USER=localist \
          -e POSTGRES_PASSWORD=dev_pass \
          -e POSTGRES_DB=localist \
          -p 5432:5432 \
          postgis/postgis:15-3.3

        echo "Waiting for database to be ready..."
        sleep 5
        echo -e "${GREEN}✅ Database container created and running${NC}"
    fi

    # Run migrations
    echo "Running database migrations..."
    cd backend
    source venv/bin/activate
    python migrations/001_add_push_notifications.py || echo -e "${YELLOW}⚠️  Migration may have already been applied${NC}"
    cd ..
    echo -e "${GREEN}✅ Database migrations complete${NC}"

else
    echo -e "${YELLOW}⚠️  Docker not found. Please set up PostgreSQL manually:${NC}"
    echo "   1. Install PostgreSQL 15+ with PostGIS extension"
    echo "   2. Create database: createdb localist"
    echo "   3. Enable PostGIS: psql localist -c 'CREATE EXTENSION postgis;'"
    echo "   4. Run migrations: python backend/migrations/001_add_push_notifications.py"
fi

# ============================================================================
# Frontend Setup
# ============================================================================

echo ""
echo -e "${YELLOW}📱 Setting up frontend...${NC}"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo "Frontend dependencies already installed"
    echo "To reinstall, run: cd frontend && rm -rf node_modules && npm install"
fi

cd ..

# ============================================================================
# Verify Setup
# ============================================================================

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Access the app:"
echo "   • API: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • Frontend: Scan QR code with Expo Go app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For more information, see SETUP_AND_RUN.md"
echo ""
