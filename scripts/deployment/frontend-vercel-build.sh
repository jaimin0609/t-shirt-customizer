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

# Verify that Vite and dependencies are installed
echo "Installing Vite and dependencies..."
npm install --save-dev vite@6.2.2 @vitejs/plugin-react postcss tailwindcss autoprefixer --save-exact --force --legacy-peer-deps

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

# Try direct build with node to ensure the right version is used
echo "Attempting build with direct node command..."
if [ -f "node_modules/vite/bin/vite.js" ]; then
  echo "Using direct node command with Vite binary"
  node --experimental-vm-modules --no-warnings node_modules/vite/bin/vite.js build
else
  echo "Vite binary not found, falling back to npx"
  VITE_TEMP_RESOLVER=$TEMP_DIR npx --no-install vite@6.2.2 build
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