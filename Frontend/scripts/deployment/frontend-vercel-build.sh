#!/bin/bash
# Wrapper script for the unified build script with Vercel-specific settings
# This script uses the new consolidated build process

echo "Starting Vercel build script (wrapper)..."

# Determine script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Try to make the build script executable, but don't fail if it doesn't work
chmod +x "$SCRIPT_DIR/build.sh" || echo "Could not set executable permission (this is normal on some platforms)"

# Run the unified build script with platform=vercel using sh
sh "$SCRIPT_DIR/build.sh" --platform=vercel

# Return the same exit status as the build script
exit $? 