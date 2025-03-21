#!/bin/bash

# Set environment to production
export NODE_ENV=production

echo "Starting Vercel shell build script..."

# Ensure proper error logging
set -e
set -o pipefail

# Print environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Ensure path includes node_modules/.bin
export PATH="$PATH:$(pwd)/node_modules/.bin:/vercel/path0/node_modules/.bin"
echo "PATH: $PATH"

# Verify that Vite, PostCSS and Tailwind are installed
echo "Checking for dependencies..."
if [ ! -d "node_modules/vite" ] || [ ! -d "node_modules/postcss" ] || [ ! -d "node_modules/tailwindcss" ]; then
  echo "Installing Vite and dependencies..."
  npm install --save-dev vite@6.2.2 postcss tailwindcss autoprefixer cssnano --force --legacy-peer-deps
fi

# Ensure critical CSS is generated
echo "Generating critical CSS if needed..."
if [ ! -f "public/critical.css" ]; then
  mkdir -p public
  
  # Check if we're using the new CSS structure
  if [ -f "src/styles/index.css" ]; then
    echo "Using new CSS structure with styles directory"
    cp src/styles/index.css public/critical.css
  else
    echo "Using legacy CSS structure"
    cp src/index.css public/critical.css
  fi
fi

# Try direct build with npx to ensure the right version is used
echo "Attempting to build with npx vite command..."
npx --yes vite@6.2.2 build

# Verify the build output
if [ -d "dist" ]; then
  echo "Build successful! Contents of dist directory:"
  ls -la dist
  echo "Assets directory:"
  ls -la dist/assets || echo "No assets directory found"
else
  echo "Build failed - no dist directory created"
  exit 1
fi

echo "Build script completed successfully" 