#!/bin/bash
# Instructions to upgrade Node.js to version 23 using nvm

echo "Checking current Node.js version:"
node -v

echo "Installing Node.js version 23 using nvm..."
nvm install 23

echo "Switching to Node.js version 23..."
nvm use 23

echo "Verifying Node.js version after upgrade:"
node -v

echo "Please restart your terminal and development server after this upgrade."
