#!/bin/bash
# Wrapper script to call the actual build script in the new location
# Note: On Unix systems, ensure this file has executable permissions (chmod +x Backend/render-build.sh)

echo "Running render-build.sh wrapper script..."
echo "Calling scripts/deployment/render-build.sh"

# Make sure the script is executable
chmod +x ./scripts/deployment/render-build.sh

# Call the actual build script
./scripts/deployment/render-build.sh 