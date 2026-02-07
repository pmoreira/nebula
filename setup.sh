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

if [ ! -s "$NEBULA_HOME_DIR/config.js" ]; then
    echo "Creating default configuration..."
    cp defaults/config.js "$NEBULA_HOME_DIR/config.js"
fi

# 10. Automatic HTTPS Detection (Let's Encrypt)
echo "Checking for Let's Encrypt certificates..."
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_PATH=$(sudo find /etc/letsencrypt/live -name "fullchain.pem" | head -n 1)
    if [ -n "$CERT_PATH" ]; then
        KEY_PATH=$(echo "$CERT_PATH" | sed 's/fullchain\.pem/privkey.pem/')
        echo "Detected Let's Encrypt certificate at: $CERT_PATH"
        read -p "Do you want to enable HTTPS automatically? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Updating config.js to enable HTTPS..."
            # Enable https: enable: true
            sed -i "s/enable: false,/enable: true,/g" "$NEBULA_HOME_DIR/config.js"
            # Update paths
            sed -i "s|key: \"\",|key: \"$KEY_PATH\",|g" "$NEBULA_HOME_DIR/config.js"
            sed -i "s|certificate: \"\",|certificate: \"$CERT_PATH\",|g" "$NEBULA_HOME_DIR/config.js"
            echo "HTTPS has been enabled. Please ensure Nebula has read access to these files."
        fi
    fi
fi

echo "Nebula has been installed successfully!"
echo "You can now start it by running 'nebula start'."
echo "To run it as a service, see the provided nebula.service file."
