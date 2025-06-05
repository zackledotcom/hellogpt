#!/bin/bash

# Exit on error
set -e

echo "🧪 Running test suite..."

# Clean previous coverage
rm -rf coverage/

# Run tests without coverage
npm run test

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed!"
    exit 1
fi

# Run tests in different environments
echo "🌍 Testing in different environments..."

# Test with Ollama unavailable
echo "Testing with Ollama unavailable..."
OLLAMA_AVAILABLE=false npm run test

# Test with high latency
echo "Testing with high latency..."
OLLAMA_LATENCY=1000 npm run test

# Test with limited resources
echo "Testing with limited resources..."
OLLAMA_MEMORY_LIMIT=512 npm run test

echo "✨ Test suite completed!" 