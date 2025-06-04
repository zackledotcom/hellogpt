#!/bin/bash

# Exit on error
set -e

# Function to print colored messages
print_message() {
  echo -e "\033[1;34m[$(date)] $1\033[0m"
}

print_error() {
  echo -e "\033[1;31m[$(date)] [ERROR] $1\033[0m"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists node; then
  print_error "Node.js is not installed"
  exit 1
fi

if ! command_exists npm; then
  print_error "npm is not installed"
  exit 1
fi

# Set environment variables
export NODE_ENV=development
export VITE_DEV_SERVER_URL=http://localhost:5173

# Clean install dependencies if needed
if [ ! -d "node_modules" ] || [ "$1" == "--install" ]; then
  print_message "Installing packages from root..."
  npm install --legacy-peer-deps || { print_error "npm install failed"; exit 1; }
fi

# Build preload package
print_message "Building preload package..."
npm run build:preload || { print_error "Preload build failed"; exit 1; }

# Build main package
print_message "Building main package..."
npm run build:main || { print_error "Main build failed"; exit 1; }

# Build renderer package
print_message "Building renderer package..."
npm run build:renderer || { print_error "Renderer build failed"; exit 1; }

# Start the application
print_message "Starting Vite dev server and Electron..."
npm run dev || { print_error "Start failed"; exit 1; }
