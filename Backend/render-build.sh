#!/bin/bash
# Wrapper script to call the unified build script
# Note: On Unix systems, ensure this file has executable permissions (chmod +x Backend/render-build.sh)

echo "Running render-build.sh wrapper script..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Make sure the unified build script is executable
chmod +x "$SCRIPT_DIR/scripts/deployment/build.sh"

# Call the unified build script with render platform
"$SCRIPT_DIR/scripts/deployment/build.sh" --platform=render

# Exit with the same status as the build script
exit $? 