#!/bin/bash
# Stop Scout services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Scout...${NC}"

cd "$(dirname "$0")"

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Stop services
$COMPOSE_CMD down

echo -e "${GREEN}✅ Scout stopped${NC}"
echo ""
echo -e "${YELLOW}To start again, run:${NC} ./scout.sh"
