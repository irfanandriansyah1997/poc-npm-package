#!/bin/bash

echo "⚙️  Init Dev"

if ! type "pnpm" > /dev/null; then
  npm install -g pnpm@^9.12.0
fi

pnpm setup
pnpm install
pnpm run prepare

if ! type "turbo" > /dev/null; then
  pnpm install turbo --global
fi

if ! type "jq" > /dev/null; then
  brew install jq
fi