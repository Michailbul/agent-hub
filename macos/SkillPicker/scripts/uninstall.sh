#!/bin/bash
echo "Uninstalling SkillPicker..."

pkill -f "SkillPicker.app" 2>/dev/null || true

LAUNCH_AGENT="$HOME/Library/LaunchAgents/com.laniameda.skillpicker.plist"
launchctl unload "$LAUNCH_AGENT" 2>/dev/null || true
rm -f "$LAUNCH_AGENT"

rm -rf /Applications/SkillPicker.app

echo "Done. You can remove it from Accessibility settings manually."
