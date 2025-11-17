#!/bin/bash
# Start Localist Frontend (Expo)

set -e

cd "$(dirname "$0")/.."  # Go to project root

echo "📱 Starting Localist Frontend..."
echo ""

# Check if in frontend directory
if [ -f "frontend/package.json" ]; then
    cd frontend
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run setup.sh first:"
    echo "   bash scripts/setup.sh"
    exit 1
fi

echo "✅ Starting Expo development server..."
echo ""
echo "Options:"
echo "  • Press 'i' for iOS simulator"
echo "  • Press 'a' for Android emulator"
echo "  • Scan QR code with Expo Go app on physical device"
echo ""
echo "⚠️  Push notifications only work on physical devices!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
