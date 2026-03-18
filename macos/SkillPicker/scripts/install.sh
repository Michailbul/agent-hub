#!/bin/bash
set -e
cd "$(dirname "$0")/.."

# Build first
bash scripts/build.sh

# Kill existing
pkill -f "SkillPicker.app" 2>/dev/null || true
sleep 1

# Copy to /Applications
echo "Installing to /Applications/SkillPicker.app..."
rm -rf /Applications/SkillPicker.app
cp -R build/SkillPicker.app /Applications/SkillPicker.app

# Install LaunchAgent (auto-start on login)
LAUNCH_AGENT="$HOME/Library/LaunchAgents/com.laniameda.skillpicker.plist"
cp com.laniameda.skillpicker.plist "$LAUNCH_AGENT"

# Unload if previously loaded, then load
launchctl unload "$LAUNCH_AGENT" 2>/dev/null || true
launchctl load "$LAUNCH_AGENT"

echo ""
echo "Installed! SkillPicker is now running."
echo ""
echo "IMPORTANT: Grant Accessibility permission:"
echo "  System Settings → Privacy & Security → Accessibility"
echo "  → Enable 'SkillPicker'"
echo ""
echo "  If already listed, toggle OFF then ON (needed after reinstall)."
echo ""
echo "Hotkey: Cmd+Shift+S"
echo "Auto-starts on login."
echo "Uninstall: bash scripts/uninstall.sh"
