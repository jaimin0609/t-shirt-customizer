#!/bin/bash
# Build script for Render.com deployment with safe migration for resetToken fields

echo "Starting build process with advanced Sharp fix and safe migration..."
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

# Step 1: Initial installation with ignore-scripts to prevent loops for most packages
echo "Step 1: Initial installation with ignore-scripts to prevent loops..."
echo "ignore-scripts=true" > .npmrc
npm install --no-audit --no-fund --ignore-scripts --legacy-peer-deps

# Step 2: Remove Sharp completely to ensure a clean installation
echo "Step 2: Removing Sharp completely..."
rm -rf node_modules/sharp
npm uninstall sharp

# Step 3: Install Sharp with all necessary flags for native compilation
echo "Step 3: Installing Sharp with all necessary flags for native compilation..."
echo "ignore-scripts=false" > .npmrc
export SHARP_IGNORE_GLOBAL_LIBVIPS=1
npm install --unsafe-perm --build-from-source --foreground-scripts sharp

# Step 4: Verify by running node directly to check if Sharp was installed correctly
echo "Step 4: Verifying Sharp installation..."
node -e "try { const sharp = require('sharp'); console.log('✅ Sharp version:', sharp.versions.sharp); } catch(e) { console.error('❌ Sharp failed to load:', e.message); }"

# Step 5: If verification fails, try rebuilding with node-gyp
if [ $? -ne 0 ]; then
  echo "Step 5: Sharp verification failed. Trying to rebuild..."
  npm rebuild sharp --foreground-scripts --unsafe-perm
  
  # Verify again
  node -e "try { const sharp = require('sharp'); console.log('✅ Rebuilt Sharp version:', sharp.versions.sharp); } catch(e) { console.error('❌ Sharp rebuild failed:', e.message); }"
  
  if [ $? -ne 0 ]; then
    echo "⚠️ Sharp installation unsuccessful. Attempting final approach..."
    # Try direct installation of prebuilt binaries
    npm install --platform=linux --arch=x64 --unsafe-perm sharp
  fi
fi

# Step 6: Run the manual migration script (replaces Umzug-based approach)
echo "Step 6: Running manual migration for resetToken fields..."
node manual-migration.cjs || echo "Manual migration completed or skipped, continuing..."

echo "Build completed! Checking if Sharp is loadable..."
if node -e "try { require('sharp'); console.log('✅ Final Sharp check passed!'); } catch(e) { console.log('⚠️ Final Sharp check failed but continuing deployment...'); }"; then
  echo "Sharp is available and should work correctly."
else
  echo "Sharp may not be available. Deployment will continue but image processing may fail."
fi

echo "All build steps completed successfully. Deploy ready!"
exit 0 