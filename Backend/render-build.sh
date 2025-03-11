#!/bin/bash
# Build script for Render.com deployment - Simplified version

echo "Starting simplified build process..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Check if we're already in the Backend directory
if [[ "$(pwd)" == *"Backend"* ]]; then
  echo "Already in Backend directory, no need to change directories"
else
  # Change to Backend directory only if not already there
  echo "Changing to Backend directory..."
  cd Backend || { echo "Failed to cd into Backend directory"; exit 1; }
  echo "Now in: $(pwd)"
fi

echo "Directory contents: $(ls -la)"

# Disable all lifecycle scripts to prevent loops
echo "Creating .npmrc file to disable scripts..."
echo "ignore-scripts=true" > .npmrc
cat .npmrc

# Direct installation with all safeguards enabled
echo "Installing dependencies with all safeguards..."
npm ci --no-audit --no-fund --ignore-scripts --legacy-peer-deps

# Check for errors
if [ $? -ne 0 ]; then
  echo "Error during npm ci. Trying with npm install..."
  npm install --no-audit --no-fund --ignore-scripts --legacy-peer-deps --no-package-lock
  
  if [ $? -ne 0 ]; then
    echo "Build failed even with fallback approach."
    exit 1
  fi
fi

echo "Build completed successfully!"
exit 0 