#!/bin/bash
# Summary script wrapper for easy access

cd "$(dirname "$0")"
node summary.js "$@"
