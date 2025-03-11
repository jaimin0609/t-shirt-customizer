#!/bin/bash
# Build script for Render.com deployment

echo "Starting build process..."
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

# Install dependencies with legacy-peer-deps flag
echo "Installing dependencies with --legacy-peer-deps flag..."
npm install --legacy-peer-deps

# Check for errors
if [ $? -ne 0 ]; then
  echo "Error during npm install. Trying with force..."
  npm install --force
  
  if [ $? -ne 0 ]; then
    echo "Build failed even with --force flag."
    exit 1
  fi
fi

echo "Build completed successfully!"
exit 0 