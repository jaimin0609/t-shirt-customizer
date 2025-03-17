#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Ensure we have the latest version of npm
echo "Updating npm..."
npm install -g npm@latest

# Install vite both locally and globally
echo "Installing Vite globally and locally..."
npm install -g vite
npm install vite --save-dev --force

# Ensure the CSS and PostCSS plugins are properly installed
echo "Installing CSS-related dependencies..."
npm install --save-dev cssnano postcss tailwindcss autoprefixer

# Ensure we have the latest versions
echo "Updating dependencies..."
npm update postcss tailwindcss autoprefixer cssnano vite

# Install npx globally if not already available
npm install -g npx

# Verify the installations
echo "Verifying installations..."
npm list vite cssnano postcss tailwindcss autoprefixer
which vite || echo "Vite not found in PATH"
which npx || echo "npx not found in PATH"

# Create a npx configuration
echo "Creating npx configuration..."
mkdir -p ~/.npm-global/bin
export PATH=~/.npm-global/bin:$PATH
npm config set prefix '~/.npm-global'

echo "Vercel pre-build completed successfully" 