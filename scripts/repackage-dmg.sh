#!/bin/bash
# scripts/repackage-dmg.sh
# Repackage the quarantine-stripped .app back into a clean DMG.
# Run after strip-quarantine.sh.

APP_PATH="dist/mac-universal/Monica AI Hub.app"

if [ ! -d "$APP_PATH" ]; then
  echo "⚠  App not found at $APP_PATH — run npm run dist first"
  exit 1
fi

echo "Repackaging DMG from stripped app..."
npx electron-builder --mac dmg --prepackaged "$APP_PATH"
echo "✓ Clean DMG created in dist/"
