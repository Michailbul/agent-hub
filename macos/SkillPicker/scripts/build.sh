#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "Building SkillPicker..."
swift build -c release 2>&1

APP="build/SkillPicker.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
mkdir -p "$APP/Contents/Resources"

cp .build/release/SkillPicker "$APP/Contents/MacOS/SkillPicker"
cp Info.plist "$APP/Contents/Info.plist"

echo "Built: $APP"
