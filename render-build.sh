#!/bin/bash
# Build script for Render.com deployment - Sharp-friendly version

echo "Starting build process with Sharp support..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Check if we're already in the Backend directory
if [[ "$(pwd)" == *"Backend"* ]]; then
  echo "Already in Backend directory, no need to change directories"
else
  # Change to Backend directory only if not already there
  echo "Changing to Backend directory..."
  cd Backend || { echo "Failed to cd into Backend directory"; exit 1; }
  echo "Now in: $(pwd)"
fi

echo "Directory contents: $(ls -la)"

# Step 1: First install with ignore-scripts to prevent loops for most packages
echo "Step 1: Initial installation with ignore-scripts to prevent loops..."
echo "ignore-scripts=true" > .npmrc
npm install --no-audit --no-fund --ignore-scripts --legacy-peer-deps

# Step 2: Specifically reinstall Sharp with the necessary compilation scripts
echo "Step 2: Reinstalling Sharp with its compilation scripts..."
echo "ignore-scripts=false" > .npmrc
npm install --no-audit --no-fund --no-save --foreground-scripts sharp

# Verify Sharp installation
echo "Verifying Sharp installation..."
node -e "try { require('sharp'); console.log('✅ Sharp loaded successfully!'); } catch(e) { console.error('❌ Sharp failed to load:', e.message); process.exit(1); }"

if [ $? -ne 0 ]; then
  echo "Sharp verification failed. Trying platform-specific installation..."
  npm install --platform=linux --arch=x64 sharp
  
  # Verify again
  node -e "try { require('sharp'); console.log('✅ Sharp loaded successfully with platform-specific installation!'); } catch(e) { console.error('❌ Sharp still failed to load:', e.message); process.exit(1); }"
  
  if [ $? -ne 0 ]; then
    echo "Could not install Sharp properly. Deployment may fail."
  fi
fi

echo "Build completed successfully!"
exit 0 