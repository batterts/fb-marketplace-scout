#!/bin/bash
# Start FB Marketplace Scout Browser

# Show help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  cat << EOF
🤖 FB Marketplace Scout - Automated listing evaluation

Usage: ./start-scout.sh [category|search_query]

Browse Categories:
  ./start-scout.sh                  Browse marketplace homepage
  ./start-scout.sh vehicles         🚗 Vehicles
  ./start-scout.sh property         🏠 Property Rentals
  ./start-scout.sh electronics      💻 Electronics
  ./start-scout.sh clothing         👕 Apparel
  ./start-scout.sh furniture        🛋️ Home Goods
  ./start-scout.sh sports           ⚽ Sporting Goods
  ./start-scout.sh free             🆓 Free Stuff
  ./start-scout.sh pets             🐾 Pet Supplies
  ./start-scout.sh toys             🧸 Toys & Games
  ./start-scout.sh hobbies          🎨 Hobbies
  ./start-scout.sh garden           🌱 Garden & Outdoor
  ./start-scout.sh entertainment    🎬 Entertainment
  ./start-scout.sh family           👶 Family

Search Examples:
  ./start-scout.sh "2019 Subaru"    Search for specific item
  ./start-scout.sh "Toyota Tacoma"  Search for Toyota Tacoma
  ./start-scout.sh "mountain bike"  Search for mountain bike

Features:
  • Automatic listing evaluation (flip potential, weirdness, scam risk)
  • Vehicle valuation with real comparable pricing from FB Marketplace
  • Condition detection (transmission damage, salvage, etc.)
  • Builds pricing database over time for instant lookups
  • Click any listing to see instant evaluation overlay

Press Ctrl+C to close the browser
EOF
  exit 0
fi

cd "$(dirname "$0")"
node scout-browser.js "$1"
