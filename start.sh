#!/bin/bash

# Instagram Follower Analyzer Startup Script
echo "🚀 Starting Instagram Follower Analyzer..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Start the application
echo "🌟 Starting the web application..."
echo "📱 Open your browser and go to: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

python3 app.py