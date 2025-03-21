#!/bin/bash
# Unified build script for frontend deployment
# This script runs the consolidated JavaScript build script
# and handles any platform-specific environment setup

echo "Starting unified frontend build process..."

# Determine script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.." || { echo "Failed to change to Frontend directory"; exit 1; }

# Show environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Parse arguments
PLATFORM="vercel"
SKIP_SPA=false

for arg in "$@"; do
  case $arg in
    --platform=*)
      PLATFORM="${arg#*=}"
      ;;
    --skip-spa-fallbacks)
      SKIP_SPA=true
      ;;
    *)
      # unknown option
      ;;
  esac
done

# Set up environment variables based on platform
echo "Setting up environment for platform: $PLATFORM"
case $PLATFORM in
  vercel)
    # Vercel-specific setup
    export NODE_ENV=production
    ;;
  netlify)
    # Netlify-specific setup
    export NODE_ENV=production
    export NETLIFY=true
    ;;
  github)
    # GitHub Pages specific setup
    export NODE_ENV=production
    ;;
  *)
    echo "Unknown platform: $PLATFORM, using default environment"
    ;;
esac

# Build command options
BUILD_ARGS="--platform=$PLATFORM"
if [ "$SKIP_SPA" = true ]; then
  BUILD_ARGS="$BUILD_ARGS --skip-spa-fallbacks"
fi

# Run the JavaScript build script
echo "Running consolidated build script with args: $BUILD_ARGS"
node --experimental-json-modules scripts/deployment/consolidated-build.js $BUILD_ARGS

# Check for build success
if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
  exit 0
else
  echo "Build failed. Check the logs for details."
  exit 1
fi 