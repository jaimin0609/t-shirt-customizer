#!/bin/bash

# Set environment to production
export NODE_ENV=production

echo "Starting Vercel shell build script..."

# Ensure path includes node_modules/.bin
export PATH="$PATH:./node_modules/.bin:/vercel/path0/node_modules/.bin"

# Try direct build
echo "Attempting to build with direct vite command..."
./node_modules/.bin/vite build || {
  echo "Direct vite command failed, trying with npx..."
  npx vite build || {
    echo "Npx vite build failed, trying global vite..."
    vite build || {
      echo "All build attempts failed. Installing vite one more time..."
      npm install --save-dev vite cssnano postcss tailwindcss autoprefixer
      ./node_modules/.bin/vite build
    }
  }
}

echo "Build script completed" 