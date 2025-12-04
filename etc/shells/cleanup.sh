#!/bin/bash

echo "⚙️  Cleanup Node Modules"

# Find and remove all node_modules folders inside the monorepo
echo "Removing all node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# Remove root node_modules as well
rm -rf node_modules

echo "✅  All node_modules directories have been removed!"