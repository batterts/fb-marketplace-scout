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

# Stop Docker services
$COMPOSE_CMD down

# Stop Scout Agent if running
if [ -f .scout-agent.pid ]; then
    AGENT_PID=$(cat .scout-agent.pid)
    if ps -p $AGENT_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping Scout Agent (PID: $AGENT_PID)...${NC}"
        kill $AGENT_PID
        rm .scout-agent.pid
        echo -e "${GREEN}✅ Scout Agent stopped${NC}"
    else
        rm .scout-agent.pid
    fi
fi

echo -e "${GREEN}✅ Scout stopped${NC}"
echo ""
echo -e "${YELLOW}To start again, run:${NC} ./scout.sh"
