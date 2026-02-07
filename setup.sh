#!/bin/bash

# Nebula Installation Script
# This script installs Nebula as a global command and sets up the configuration directory.

set -e

echo "Installing Nebula..."

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is not installed. Please install Node.js >= 18."
    exit 1
fi

# Install dependencies if not already done
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build the project
echo "Building Nebula..."
npm run build

# Link the nebula command
echo "Linking nebula command..."
sudo npm link

# Initialize home directory
NEBULA_HOME_DIR=$(cat .nebula_home | sed "s|~|$HOME|")
echo "Initializing configuration directory at $NEBULA_HOME_DIR..."
mkdir -p "$NEBULA_HOME_DIR"

if [ ! -f "$NEBULA_HOME_DIR/config.js" ]; then
    echo "Creating default configuration..."
    nebula config > "$NEBULA_HOME_DIR/config.js" || true
fi

echo "Nebula has been installed successfully!"
echo "You can now start it by running 'nebula start'."
echo "To run it as a service, see the provided nebula.service file."
