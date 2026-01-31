#!/bin/bash
# Stop Scout services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Scout...${NC}"

# Change to project root (script is in scripts/ subdirectory)
cd "$(dirname "$0")/.."

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

# Cleanup any remaining scout processes
SCOUT_AGENT_PIDS=$(pgrep -f "scout-agent.js" 2>/dev/null || true)
if [ -n "$SCOUT_AGENT_PIDS" ]; then
    echo -e "${BLUE}Stopping remaining Scout Agent processes...${NC}"
    pkill -f "scout-agent.js" || true
    echo -e "${GREEN}✅ Scout Agent cleaned up${NC}"
fi

SCOUT_BROWSER_PIDS=$(pgrep -f "scout-browser.js" 2>/dev/null || true)
if [ -n "$SCOUT_BROWSER_PIDS" ]; then
    echo -e "${BLUE}Stopping Scout Browser processes...${NC}"
    pkill -f "scout-browser.js" || true
    echo -e "${GREEN}✅ Scout Browser cleaned up${NC}"
fi

# Close Chrome browsers using Scout profile
CHROME_SCOUT_PIDS=$(pgrep -f "\.fb-marketplace-scout-profile" 2>/dev/null || true)
if [ -n "$CHROME_SCOUT_PIDS" ]; then
    echo -e "${BLUE}Closing Chrome browsers with Scout profile...${NC}"
    pkill -f "\.fb-marketplace-scout-profile" || true
    # Give Chrome time to cleanup
    sleep 1
    echo -e "${GREEN}✅ Chrome browsers closed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Scout stopped completely${NC}"
echo ""
echo -e "${YELLOW}To start again, run:${NC} ./scout.sh"
