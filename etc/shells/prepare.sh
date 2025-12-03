#!/bin/bash

echo "⚙️  Setup NPMRC"

# Define the source file to copy
NPMRC_CONFIG_FILE=".npmrc"

# Get the list of package directories in the monorepo
PACKAGE_DIRS=$(pnpm list --json --recursive --depth -1 --ignore-workspace | jq -r '.[].path' | tail -n +2)

# Loop through each package directory and copy the file
for DIR in $PACKAGE_DIRS; do
  NPMRC_FILE="$DIR/$NPMRC_CONFIG_FILE"

  if [ ! -f $NPMRC_FILE ]; then
    # Create the .npmrc config file
    cat <<EOF > "$NPMRC_FILE"
@tiket:registry=https://npm.pkg.github.com
EOF
  fi
done

echo "✅ Copy complete!"