#!/bin/bash
# scripts/strip-quarantine.sh
# Run on your Mac after building to remove Apple quarantine flag
# before uploading the DMG to Google Drive.
# This runs automatically via "postdist" in package.json.

APP_PATH="dist/mac-universal/Monica AI Hub.app"

if [ "$(uname)" != "Darwin" ]; then
  echo "ℹ  Not running on macOS — skipping quarantine strip"
  exit 0
fi

if [ -d "$APP_PATH" ]; then
  xattr -cr "$APP_PATH"
  echo "✓ Quarantine flag removed from $APP_PATH"
else
  echo "⚠  App not found at $APP_PATH — run npm run dist first"
fi
