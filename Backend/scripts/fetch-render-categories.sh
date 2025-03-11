#!/bin/bash

# Script to fetch categories from the Render database
# This script creates a temporary environment to query the Render database

echo "=== Fetching Categories from Render Database ==="
echo "This script will create a temporary environment file with your DATABASE_URL"
echo "It will then run the get-categories.js script to fetch all categories"
echo ""

# Ask for the DATABASE_URL from Render
echo "Please paste your Render PostgreSQL DATABASE_URL:"
read -s DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

# Create temporary environment file
echo "Creating temporary environment file..."
cat > .env.render << EOF
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
EOF

# Run the get-categories script with the temporary environment
echo "Running get-categories.js script with Render database connection..."
NODE_ENV=production DATABASE_URL="$DATABASE_URL" node --experimental-modules scripts/get-categories.js

# Clean up
echo "Cleaning up temporary files..."
rm .env.render

echo ""
echo "=== Category Fetch Complete ===" 