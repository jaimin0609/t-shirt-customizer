#!/bin/bash
# Unified build script for backend deployment
# This script runs the consolidated JavaScript build script
# and handles any platform-specific environment setup

echo "Starting unified backend build process..."

# Determine script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.." || { echo "Failed to change to Backend directory"; exit 1; }

# Show environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Parse arguments
RUN_MIGRATIONS=false
PLATFORM=""

for arg in "$@"; do
  case $arg in
    --migrations)
      RUN_MIGRATIONS=true
      ;;
    --platform=*)
      PLATFORM="${arg#*=}"
      ;;
    *)
      # unknown option
      ;;
  esac
done

# Set up environment variables based on platform
if [ -n "$PLATFORM" ]; then
  echo "Setting up environment for platform: $PLATFORM"
  
  case $PLATFORM in
    render)
      # Render-specific setup
      export NODE_ENV=production
      ;;
    heroku)
      # Heroku-specific setup
      export NODE_ENV=production
      ;;
    railway)
      # Railway-specific setup
      export NODE_ENV=production
      ;;
    *)
      echo "Unknown platform: $PLATFORM, using default environment"
      ;;
  esac
fi

# Build command options
BUILD_ARGS=""
if [ "$RUN_MIGRATIONS" = true ]; then
  BUILD_ARGS="--migrations"
  echo "Will run database migrations as part of the build."
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