#!/bin/bash

# Exit on error
set -e

echo "Starting full build test..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "Installing dependencies..."
npm install

# Run type checking
echo "Running type checking..."
npm run type-check

# Run linting
echo "Running linting..."
npm run lint

# Run tests
echo "Running tests..."
npm test

# Build the application
echo "Building the application..."
npm run build

# Start the application in test mode
echo "Starting the application in test mode..."
npm run start:test &

# Wait for the application to start
sleep 5

# Check if the application is running
if ! pgrep -f "electron" > /dev/null; then
    echo "Error: Application failed to start"
    exit 1
fi

echo "Application started successfully"

# Test service status
echo "Testing service status..."
curl -s http://localhost:3000/api/health | grep -q "status"

# Test Ollama service
echo "Testing Ollama service..."
curl -s http://localhost:3000/api/ollama/status | grep -q "status"

# Kill the test process
pkill -f "electron"

echo "Full build test completed successfully!" 