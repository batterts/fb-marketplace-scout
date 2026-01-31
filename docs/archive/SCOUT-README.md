# 🚀 Scout - FB Marketplace Intelligence Platform

Scout is a powerful web application that helps you evaluate Facebook Marketplace listings using AI-powered analysis and comparable pricing data.

## Features

### 🔍 Smart Browser Launcher
- Launch Chrome browser with AI-powered overlay evaluation
- Browse by category (vehicles, property, electronics, etc.)
- Search for specific items
- Get instant flip potential, weirdness, and scam risk scores

### 📊 Inventory Database
- Browse all evaluated vehicles by make, model, and year
- View detailed evaluation history
- Filter and search through your collection
- Track pricing trends over time

### 📈 Price Analytics
- View comparable pricing data
- Interactive price distribution charts
- Median, min, max price analysis
- See individual comparable listings

### 🤖 AI Evaluation Engines
- **Anthropic Claude Haiku** - Cloud-based AI (requires API key)
- **Ollama (Local)** - Privacy-focused local AI
- **Heuristic Fallback** - Rule-based evaluation when AI unavailable

## Quick Start

### Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
   - macOS: Docker Desktop for Mac
   - Windows: Docker Desktop for Windows
   - Linux: Docker Engine + Docker Compose

2. **Git** (to clone this repository)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd fb-marketplace-scout
   ```

2. **Install Node dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   Create a `.env` file for Anthropic API key:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Launch Scout

Simply run the launcher script:

```bash
./scout.sh
```

The launcher will:
1. ✅ Check if Docker is installed and running
2. 🐳 Start Docker services (Ollama + Web Server)
3. ⏳ Wait for services to be ready
4. 🌐 Open your browser to http://localhost:3000

## Usage Guide

### Launch Browser Tab

1. Navigate to the **🔍 Launch Browser** tab
2. Select a category from the dropdown:
   - 🚗 Vehicles
   - 🏠 Property Rentals
   - 💻 Electronics
   - And more...
3. Optionally enter a search query (e.g., "2019 Honda Accord")
4. Click **🚀 Launch Browser**

The browser will open with the Scout overlay enabled. Click on any listing to get instant AI-powered evaluation!

### Browse Inventory

1. Navigate to the **📊 Inventory** tab
2. Select a **Make** (e.g., Honda, Toyota)
3. Select a **Year** (e.g., 2014, 2015)
4. Select a **Model** (e.g., Accord, Camry)
5. View all evaluated listings for that vehicle

### View Analytics

1. After selecting a vehicle in the Inventory tab
2. Switch to the **📈 Analytics** tab
3. View:
   - Price distribution histogram
   - Median, min, max prices
   - Individual comparable listings
   - Data freshness (last updated)

## Architecture

```
Scout/
├── docker-compose.yml      # Docker services configuration
├── Dockerfile.web          # Web app container
├── scout.sh               # Launcher script
│
├── web-server.js          # Express.js API server
├── public/                # Web UI
│   ├── index.html        # Main page
│   ├── style.css         # Styling
│   └── app.js            # Frontend logic
│
├── scout-browser.js       # Puppeteer browser automation
├── evaluator.js          # AI evaluation engine
├── comparable-pricing.js  # FB Marketplace scraper
│
└── marketplace.db        # SQLite database
    ├── evaluations       # Evaluated listings
    └── comparable_pricing # Price data
```

## Docker Services

### Ollama (Local AI)
- **Port**: 11434
- **Image**: ollama/ollama:latest
- **Purpose**: Local AI model for privacy-focused evaluation
- **Models**: Mistral, Llama (auto-downloaded on first use)

### Scout Web
- **Port**: 3000
- **Purpose**: Web interface and API server
- **Tech**: Node.js + Express + SQLite

## API Endpoints

### Launch Browser
```
POST /api/launch
Body: { "category": "vehicles" }
```

### Get Inventory Summary
```
GET /api/inventory/summary
GET /api/inventory/makes
GET /api/inventory/makes/:make/years
GET /api/inventory/makes/:make/years/:year/models
```

### Get Comparables
```
GET /api/comparables/:year/:make/:model
```

### Get Evaluations
```
GET /api/inventory/:year/:make/:model/evaluations
```

## Customization

### Change AI Model (Ollama)

Edit `evaluator.js` to use different models:
```javascript
model: 'mistral'  // or 'llama3', 'codellama', etc.
```

### Adjust Evaluation Criteria

Edit heuristic scoring in `evaluator.js`:
- Flip potential calculation
- Scam detection patterns
- Vehicle condition rules

### Modify Search Radius

Edit `comparable-pricing.js`:
```javascript
const searchURL = buildSearchURL(year, make, model, zipCode, 500);
// Change 500 to your preferred radius in miles
```

## Troubleshooting

### Docker not starting
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# macOS: Applications > Docker > Restart
```

### Ollama not responding
```bash
# Check Ollama logs
docker-compose logs ollama

# Restart Ollama service
docker-compose restart ollama
```

### Web server issues
```bash
# Check web server logs
docker-compose logs scout-web

# Rebuild and restart
docker-compose up -d --build scout-web
```

### Database locked errors
```bash
# Stop all services
docker-compose down

# Start fresh
docker-compose up -d
```

## Development

### Run without Docker (for development)

1. **Start Ollama locally**:
   ```bash
   ollama serve
   ```

2. **Start web server**:
   ```bash
   node web-server.js
   ```

3. **Open browser**:
   ```
   http://localhost:3000
   ```

### Run browser automation only
```bash
./start-scout.sh vehicles
```

## Data Privacy

- **Database**: All data stored locally in `marketplace.db`
- **Ollama**: AI runs completely offline (no data sent to cloud)
- **Anthropic**: Optional cloud AI (requires API key, data sent to Anthropic)
- **No telemetry**: Scout doesn't send any usage data

## Stopping Scout

```bash
docker-compose down
```

Or use `Ctrl+C` if running in foreground.

## Backup Your Data

Your evaluation history is stored in `marketplace.db`:

```bash
# Backup database
cp marketplace.db marketplace-backup-$(date +%Y%m%d).db

# Restore database
cp marketplace-backup-20260130.db marketplace.db
```

## Future Enhancements

- [ ] Export data to CSV/Excel
- [ ] Price alerts for specific vehicles
- [ ] Mobile app version
- [ ] Multi-user support
- [ ] Advanced filtering and search
- [ ] Integration with other marketplaces (Craigslist, OfferUp)

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: This README

---

**Built with ❤️ for smart marketplace shopping**
