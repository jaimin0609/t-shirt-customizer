#!/bin/bash
# Wrapper script to call the actual build script in the new location
# Note: On Unix systems, ensure this file has executable permissions (chmod +x Frontend/vercel-build.sh)

echo "Running vercel-build.sh wrapper script..."
echo "Calling scripts/deployment/frontend-vercel-build.sh"

# Make sure the script is executable
chmod +x ./scripts/deployment/frontend-vercel-build.sh

# Call the actual build script
./scripts/deployment/frontend-vercel-build.sh 