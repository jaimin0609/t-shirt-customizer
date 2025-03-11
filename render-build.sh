#!/bin/bash
# Build script for Render.com deployment

echo "Starting build process from root directory..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Install dependencies with legacy-peer-deps flag for the root package.json
echo "Installing root dependencies..."
npm install --legacy-peer-deps

# Change to Backend directory
echo "Changing to Backend directory..."
cd Backend || { echo "Failed to cd into Backend directory"; exit 1; }
echo "Now in: $(pwd)"
echo "Backend directory contents: $(ls -la)"

# Install dependencies with legacy-peer-deps flag for Backend
echo "Installing Backend dependencies with --legacy-peer-deps flag..."
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