#!/bin/bash
# Wrapper script for the unified build script with Netlify-specific settings
# This script uses the new consolidated build process

echo "Starting Netlify build script (wrapper)..."

# Determine script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Make sure the build script is executable
chmod +x "$SCRIPT_DIR/build.sh"

# Run the unified build script with platform=netlify
"$SCRIPT_DIR/build.sh" --platform=netlify

# Return the same exit status as the build script
exit $? 