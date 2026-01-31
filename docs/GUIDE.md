# Scout - Complete Guide

FB Marketplace Intelligence Platform

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Usage](#usage)
5. [Database](#database)
6. [Docker Integration](#docker-integration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start Scout
./scripts/scout.sh

# Stop Scout
docker compose down
```

Scout will:
- Start Ollama (local AI)
- Start web server at http://localhost:3000
- Start Scout Agent for browser launching
- Open your browser automatically

### Option 2: Native (Without Docker)

```bash
# Initialize database
npm run init

# Start web server
npm start

# In another terminal: Launch browser
npm run browser
```

---

## Features

### 🔍 **Intelligent Evaluation**

When you click any Facebook Marketplace listing:
- **Flip Potential** (1-10) - Resale value assessment
- **Weirdness Score** (1-10) - Uniqueness/collectibility
- **Scam Likelihood** (1-10) - Risk detection

### 🚗 **Vehicle Intelligence**

For vehicle listings:
- Automatic year/make/model extraction
- Comparable pricing from 500mi radius
- Condition detection (salvage, damage, issues)
- Fair value estimation
- Price distribution charts

### 📊 **Inventory Management**

- Browse by Make → Year → Model
- All scraped listings saved automatically
- Click any listing once → 12+ comparables saved
- Track evaluation history

### 🤖 **AI Modes**

1. **Anthropic API** (Best quality)
   - Set `ANTHROPIC_API_KEY` environment variable
   - ~$0.001 per listing

2. **Ollama** (Free, local)
   - Runs automatically in Docker
   - Download models: `ollama pull llama3.2`

3. **Heuristic** (Instant fallback)
   - Keyword-based scoring
   - Always works, no setup

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│  Docker Container          │  Host Mac          │
├────────────────────────────┼────────────────────┤
│  Web Server (port 3000)    │  Scout Agent       │
│  Ollama (port 11434)       │  (port 3001)       │
│                            │         ↓          │
│   HTTP request ────────────┼──> Chrome Browser  │
└────────────────────────────┴────────────────────┘
```

### File Structure

```
fb-marketplace-scout/
├── lib/                       # Core source code
│   ├── scout-browser.js       # Puppeteer automation
│   ├── scout-agent.js         # Docker-to-host bridge
│   ├── evaluator.js           # AI evaluation engine
│   ├── comparable-pricing.js  # Vehicle pricing scraper
│   ├── web-server.js          # Express API server
│   └── ...
├── scripts/                   # Utilities
│   ├── scout.sh               # Main launcher
│   ├── init-database.js       # DB initialization
│   └── legacy/                # Old Python scripts
├── tests/                     # Test scripts
├── public/                    # Web UI (HTML/CSS/JS)
├── docs/                      # Documentation
│   ├── GUIDE.md              # This file
│   └── archive/              # Old docs
├── marketplace.db             # SQLite database
├── docker-compose.yml
└── package.json
```

---

## Usage

### Web Interface

1. **Open** http://localhost:3000
2. **Click** "Launch Browser"
3. **Select** category (Vehicles, Electronics, etc.)
4. **Browse** Facebook Marketplace normally
5. **Click** any listing → See instant evaluation overlay

### Inventory Tab

- **Browse** by Make → Year → Model
- **View** all scraped listings
- **Click** to see details and scores

### Analytics Tab

- **Select** vehicle from Inventory
- **View** price distribution chart
- **See** individual comparable listings with links
- **Compare** your find to market prices

---

## Database

### Schema

**evaluations** table:
- Basic: title, price, description, location, URL
- Scores: flip_score, weirdness_score, scam_likelihood
- Vehicle: year, make, model, mileage
- Meta: evaluated_at, discovered_at

**comparable_pricing** table:
- Search key (normalized year/make/model)
- Price array (all found prices)
- Listings array (full details with URLs)
- Stats: median, min, max, count
- Last updated timestamp

### Commands

```bash
# Initialize fresh database
npm run init

# Check database directly
sqlite3 marketplace.db
.tables
.schema evaluations
SELECT * FROM evaluations LIMIT 5;
.quit

# Start fresh (delete everything)
docker compose down
rm marketplace.db
npm run init
docker compose up -d
```

---

## Docker Integration

### How It Works

1. **Scout Web** (Docker container)
   - Can't show GUI applications
   - Makes HTTP request to Scout Agent

2. **Scout Agent** (Native Mac process)
   - Receives launch request
   - Opens Chrome natively on your Mac
   - Streams output back to Docker

3. **Special hostname:** `host.docker.internal`
   - Docker uses this to reach your Mac
   - Configured in docker-compose.yml

### Troubleshooting Docker

**"Could not connect to Scout Agent"**
- Scout Agent not running
- Check: `ps aux | grep scout-agent`
- Restart: `./scripts/scout.sh`

**"Permission denied: marketplace.db/"**
- Docker created a directory instead of file
- Fix:
  ```bash
  docker compose down
  rm -rf marketplace.db/
  npm run init
  docker compose up -d
  ```

**"Browser launched but nothing happens"**
- This is normal! Overlay only appears when you CLICK a listing
- Just browse to a listing and click it

---

## Troubleshooting

### Price Shows $NaN

**Fixed in latest version**. If you see this:
- Pull latest code: `git pull`
- Restart: `docker compose down && docker compose up -d`

### Model Extraction Broken

**Example:** "Mercedes-Benz SL 550" extracts as "Mercedes" + "-benz sl"

**Fixed in latest version**. Pull latest code and test:
```bash
node tests/test-extraction.js
```

### Comparables Not Showing

**Check if listings are saved:**
```sql
sqlite3 marketplace.db "SELECT COUNT(*) FROM evaluations;"
```

**Should show 12+ listings after clicking one vehicle.**

If not, pull latest code. The feature was added recently.

### Overlay Not Appearing

**Checklist:**
1. Did you CLICK on a listing? (Not just browse)
2. Is database initialized? `ls -lh marketplace.db`
3. Is evaluation actually happening? Check console output
4. Try a different listing

### Still Having Issues?

```bash
# Check status
docker compose logs scout-web -f

# Restart everything
docker compose down
./scripts/scout.sh

# Nuclear option: Fresh start
docker compose down
rm marketplace.db
npm run init
docker compose up -d
```

---

## Advanced

### Custom Zip Code

Edit `lib/comparable-pricing.js`:
```javascript
const zipCode = '06483'; // Change this
```

### Evaluation Threshold

Edit `lib/evaluator.js` to adjust scoring logic:
```javascript
if (price < 1000 && year < 2000) {
  flip_score += 3; // Adjust this
}
```

### Add New Makes

Edit `lib/evaluator.js`:
```javascript
const carBrands = [
  'mercedes-benz', // Hyphenated brands FIRST
  'your-brand',    // Add here
  'toyota',        // Then regular brands
  // ...
];
```

---

## API Reference

### Web Server Endpoints

**GET /api/inventory/makes**
- Returns all vehicle makes in database

**GET /api/inventory/makes/:make/years**
- Returns years for a make

**GET /api/inventory/makes/:make/years/:year/models**
- Returns models for make/year

**GET /api/inventory/:year/:make/:model/evaluations**
- Returns all evaluations for vehicle

**GET /api/comparables/:year/:make/:model**
- Returns cached comparable pricing data

**POST /api/launch**
- Body: `{ "category": "vehicles" }`
- Launches browser for category

---

## Contributing

### Running Tests

```bash
# Test extraction logic
node tests/test-extraction.js

# Test comparable saving
node tests/test-save-comparables.js

# Test summary generation
node tests/test-summary.js
```

### Code Style

- Use descriptive variable names
- Comment complex logic
- Test extraction/parsing code
- Update CHANGELOG.md for fixes

---

## See Also

- **CHANGELOG.md** - Recent fixes and changes
- **README.md** - Project overview
- **docs/archive/** - Historical documentation

---

**Happy Scouting! 🚀**
