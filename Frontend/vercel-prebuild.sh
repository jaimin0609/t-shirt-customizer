#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Ensure the CSS and PostCSS plugins are properly installed
echo "Installing CSS-related dependencies..."
npm install --save-dev cssnano postcss tailwindcss autoprefixer

# Ensure we have the latest versions
npm update postcss tailwindcss autoprefixer cssnano

# Verify the installations
echo "Verifying installations..."
npm list cssnano postcss tailwindcss autoprefixer

echo "Vercel pre-build completed successfully" 