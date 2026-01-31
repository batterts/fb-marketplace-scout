#!/bin/bash
# LEGACY: Old Python-based status check (not used in current version)
# Quick status check
cd "$(dirname "$0")/.."
source venv/bin/activate 2>/dev/null || echo "Virtual env not found"
python3 scripts/legacy/status.py
