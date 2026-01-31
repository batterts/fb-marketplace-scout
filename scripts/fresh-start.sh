#!/bin/bash
# Fresh Start - Stop everything, clean database, and restart Scout

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║     🔄 Scout - Fresh Start           ║"
echo "║  Clean database and restart          ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Change to project root
cd "$(dirname "$0")/.."

# Stop everything
echo -e "${YELLOW}🛑 Stopping all Scout services...${NC}"
./scripts/scout-stop.sh

# Remove database
if [ -f marketplace.db ]; then
    echo -e "${YELLOW}🗑️  Removing old database...${NC}"
    rm marketplace.db
    echo -e "${GREEN}✅ Database removed${NC}"
fi

# Remove database directory if it exists (Docker bug)
if [ -d marketplace.db ]; then
    echo -e "${YELLOW}🗑️  Removing marketplace.db directory...${NC}"
    rm -rf marketplace.db
    echo -e "${GREEN}✅ Directory removed${NC}"
fi

# Initialize fresh database
echo -e "${YELLOW}📋 Initializing fresh database...${NC}"
npm run init

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Fresh Start Complete!         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Ready to start Scout with clean database${NC}"
echo -e "${YELLOW}Run:${NC} ./scripts/scout.sh"
echo ""
