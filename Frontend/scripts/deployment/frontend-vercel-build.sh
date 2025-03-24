#!/bin/bash
# Wrapper script for the unified build script with Vercel-specific settings
# This script uses the new consolidated build process

echo "Starting Vercel build script (wrapper)..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v)
        log "Node version: $NODE_VERSION"
    else
        log "Node.js is not installed"
        exit 1
    fi
}

# Function to check npm version
check_npm_version() {
    if command_exists npm; then
        NPM_VERSION=$(npm -v)
        log "NPM version: $NPM_VERSION"
    else
        log "npm is not installed"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm install --no-audit --legacy-peer-deps
    
    # Install Tailwind CSS and its dependencies explicitly
    log "Installing Tailwind CSS dependencies..."
    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest postcss-import@latest --legacy-peer-deps
    
    # Verify installations
    if [ ! -d "node_modules/tailwindcss" ]; then
        log "Error: tailwindcss not installed"
        exit 1
    fi
    if [ ! -d "node_modules/postcss" ]; then
        log "Error: postcss not installed"
        exit 1
    fi
    if [ ! -d "node_modules/autoprefixer" ]; then
        log "Error: autoprefixer not installed"
        exit 1
    fi
}

# Function to build the application
build_application() {
    log "Building application..."
    
    # Ensure Vite is installed
    if [ ! -d "node_modules/vite" ]; then
        log "Installing Vite..."
        npm install -D vite@latest @vitejs/plugin-react --legacy-peer-deps
    fi
    
    # Run the build
    npm run build
    
    # Check if build was successful
    if [ ! -d "dist" ]; then
        log "Error: Build failed - dist directory not created"
        exit 1
    fi
}

# Main build process
main() {
    # Check current directory
    CURRENT_DIR=$(pwd)
    log "Current directory: $CURRENT_DIR"
    
    # Check Node.js and npm versions
    check_node_version
    check_npm_version
    
    # Install dependencies
    install_dependencies
    
    # Build the application
    build_application
    
    log "Build completed successfully"
}

# Run the main function
main

# Return the same exit status as the build script
exit $? 