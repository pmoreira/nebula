#!/bin/bash

# Nebula Uninstallation Script
# This script removes the linked binary, build artifacts, and optionally the configuration directory.

set -e

echo "Uninstalling Nebula..."

# 1. Unlink the nebula command
if command -v nebula >/dev/null 2>&1; then
    echo "Unlinking nebula command..."
    sudo npm unlink -g nebula || echo "Warning: Failed to unlink nebula. It might not be linked globally."
fi

# 2. Stop and remove systemd service if it exists
SERVICE_FILE="/etc/systemd/system/nebula.service"
if [ -f "$SERVICE_FILE" ]; then
    echo "Detected nebula.service. Stopping and disabling..."
    sudo systemctl stop nebula || true
    sudo systemctl disable nebula || true
    echo "Removing $SERVICE_FILE..."
    sudo rm "$SERVICE_FILE"
    sudo systemctl daemon-reload
fi

# 3. Clean up build artifacts and node_modules
echo "Cleaning up build artifacts and node_modules..."
rm -rf dist public node_modules

# 4. Optional: Remove home directory
NEBULA_HOME_DIR=$(cat .nebula_home | sed "s|~|$HOME|")
if [ -d "$NEBULA_HOME_DIR" ]; then
    read -p "Do you want to remove the configuration directory and ALL user data at $NEBULA_HOME_DIR? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing configuration directory..."
        rm -rf "$NEBULA_HOME_DIR"
    else
        echo "Keeping configuration directory at $NEBULA_HOME_DIR."
    fi
fi

echo "Nebula has been uninstalled."
