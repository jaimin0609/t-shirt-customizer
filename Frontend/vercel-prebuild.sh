#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Ensure the CSS and PostCSS plugins are properly installed
echo "Installing CSS-related dependencies..."
npm install --save-dev cssnano postcss tailwindcss autoprefixer

# Make sure Vite is also installed globally on Vercel
echo "Installing Vite globally to ensure it's available in PATH..."
npm install -g vite

# Ensure we have the latest versions
npm update postcss tailwindcss autoprefixer cssnano

# Verify the installations
echo "Verifying installations..."
npm list cssnano postcss tailwindcss autoprefixer
which vite || echo "Vite not found in PATH"

echo "Vercel pre-build completed successfully" 