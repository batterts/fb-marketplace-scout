#!/bin/bash
# Scout - FB Marketplace Intelligence Platform Launcher

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║     🚀 Scout - Starting Up...        ║"
echo "║  FB Marketplace Intelligence Platform ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Change to project root (script is in scripts/ subdirectory)
cd "$(dirname "$0")/.."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not running${NC}"
    echo "Starting Docker Desktop..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker
    else
        echo "Please start Docker manually"
        exit 1
    fi

    echo "Waiting for Docker to start..."
    for i in {1..30}; do
        if docker info &> /dev/null; then
            echo -e "${GREEN}✅ Docker started${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done

    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker failed to start${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not available${NC}"
    exit 1
fi

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo -e "${BLUE}🐳 Starting Docker services...${NC}"

# Stop any existing containers
$COMPOSE_CMD down 2>/dev/null || true

# Build and start services
$COMPOSE_CMD up -d --build

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Wait for Ollama
echo -n "Checking Ollama... "
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    sleep 2
done

# Wait for Web Server
echo -n "Checking Web Server... "
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Scout is Ready!               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Start Scout Agent on host (for browser launching)
echo -e "${BLUE}🤖 Starting Scout Agent (for browser launching)...${NC}"
node lib/scout-agent.js > scout-agent.log 2>&1 &
AGENT_PID=$!
echo $AGENT_PID > .scout-agent.pid
echo -e "${GREEN}✅ Scout Agent running (PID: $AGENT_PID)${NC}"

echo ""
echo -e "${BLUE}🌐 Web Interface:${NC} http://localhost:3000"
echo -e "${BLUE}🤖 Ollama API:${NC}    http://localhost:11434"
echo -e "${BLUE}🚀 Scout Agent:${NC}   http://localhost:3001"
echo ""
echo -e "${YELLOW}Opening browser...${NC}"

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start http://localhost:3000
fi

echo ""
echo -e "${BLUE}📊 View logs:${NC} $COMPOSE_CMD logs -f"
echo -e "${BLUE}🛑 Stop Scout:${NC} $COMPOSE_CMD down"
echo ""
echo -e "${GREEN}Happy scouting! 🚀${NC}"
