#!/bin/bash
cd "$(dirname "$0")"
swift build -c release 2>&1 && .build/release/SkillPicker
