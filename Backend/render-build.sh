#!/bin/bash
# Build script for Render.com deployment

echo "Starting build process..."

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