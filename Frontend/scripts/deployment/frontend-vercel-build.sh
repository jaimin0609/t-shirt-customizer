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

# Verify that PostCSS and Tailwind are installed
echo "Checking for PostCSS and Tailwind..."
if [ ! -d "node_modules/postcss" ] || [ ! -d "node_modules/tailwindcss" ]; then
  echo "PostCSS or Tailwind not found, installing dependencies..."
  npm install --save-dev postcss tailwindcss autoprefixer cssnano
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

# Try direct build - MODIFIED TO BUILD DIRECTLY TO DIST ROOT
echo "Building client bundle directly to dist root..."
if [ -f "node_modules/.bin/vite" ]; then
  echo "Using local vite from node_modules/.bin"
  ./node_modules/.bin/vite build --outDir dist
elif command -v npx &> /dev/null; then
  echo "Using npx to run vite"
  npx vite build --outDir dist
elif command -v vite &> /dev/null; then
  echo "Using global vite"
  vite build --outDir dist
else
  echo "Vite not found, installing vite and dependencies..."
  npm install --save-dev vite cssnano postcss tailwindcss autoprefixer
  ./node_modules/.bin/vite build --outDir dist
fi

# Copy public files to ensure they're accessible
echo "Copying public files to dist directory..."
cp -r public/* dist/ || echo "No public files to copy or error copying"

# Make sure index.html exists in dist root
if [ ! -f "dist/index.html" ]; then
  echo "WARNING: No index.html found in dist root. This will cause routing issues."
fi

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