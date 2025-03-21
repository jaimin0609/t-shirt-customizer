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

# Enable experimental modules for ESM compatibility
export NODE_OPTIONS="--experimental-vm-modules --no-warnings"
echo "NODE_OPTIONS: $NODE_OPTIONS"

# Install Vite globally for immediate availability
echo "Installing Vite globally..."
npm install -g vite@6.2.2

# Install Vite and dependencies locally
echo "Installing Vite and dependencies locally..."
npm install --save-dev vite@6.2.2 @vitejs/plugin-react postcss tailwindcss autoprefixer --save-exact --force --legacy-peer-deps

# Create a temporary vite resolver directory
echo "Creating temporary vite resolver..."
TEMP_DIR=".vite-temp"
mkdir -p $TEMP_DIR
cat > $TEMP_DIR/package.json << EOL
{
  "type": "module",
  "dependencies": {
    "vite": "6.2.2"
  }
}
EOL

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

# Try multiple build approaches to ensure success
echo "Attempting Vite build with multiple strategies..."

# Strategy 1: Direct global Vite command
echo "Strategy 1: Using global Vite command"
vite build || true

# Strategy 2: NPX with yes flag
if [ ! -d "dist" ]; then
  echo "Strategy 2: Using NPX with yes flag"
  npx --yes vite@6.2.2 build || true
fi

# Strategy 3: Direct Node execution
if [ ! -d "dist" ]; then
  echo "Strategy 3: Direct Node execution"
  if [ -f "node_modules/vite/bin/vite.js" ]; then
    node --experimental-vm-modules --no-warnings node_modules/vite/bin/vite.js build || true
  fi
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