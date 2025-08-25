#!/bin/bash

# Orchestrator WebUI Startup Script

echo "🚀 Starting Orchestrator WebUI..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the orchestrator-webui directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. This project works best with Node.js 18+."
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies."
        exit 1
    fi
fi

# Check if Orchestrator API is running
echo "🔍 Checking Orchestrator API connectivity..."
API_URL="http://localhost:8080/health"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --connect-timeout 5)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Orchestrator API is running at http://localhost:8080"
    else
        echo "⚠️  Warning: Orchestrator API is not responding at http://localhost:8081"
        echo "   Please ensure the Orchestrator API is running before using the WebUI."
    fi
elif command -v wget &> /dev/null; then
    if wget --timeout=5 --tries=1 --spider "$API_URL" &> /dev/null; then
        echo "✅ Orchestrator API is running at http://localhost:8080"
    else
        echo "⚠️  Warning: Orchestrator API is not responding at http://localhost:8080"
        echo "   Please ensure the Orchestrator API is running before using the WebUI."
    fi
else
    echo "⚠️  Warning: Cannot check API connectivity (curl/wget not found)"
    echo "   Please ensure the Orchestrator API is running at http://localhost:8080"
fi

echo ""
echo "🌐 Starting development server..."
echo "📍 WebUI will be available at: http://localhost:5173"
echo "📍 API endpoint: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
