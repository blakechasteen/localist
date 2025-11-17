#!/bin/bash
# Start Localist Backend Server

set -e

cd "$(dirname "$0")/.."  # Go to project root

echo "🚀 Starting Localist Backend..."
echo ""

# Check if in backend directory
if [ -f "backend/main.py" ]; then
    cd backend
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first:"
    echo "   bash scripts/setup.sh"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default configuration."
    echo ""
fi

# Start server
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/docs"
echo "📡 WebSocket: ws://localhost:8000/ws/messages"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
