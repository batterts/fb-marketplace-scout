# 🚀 Scout - FB Marketplace Intelligence Platform

AI-powered Facebook Marketplace analytics with price intelligence, comparable listings, and instant evaluation overlay.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🔍 Smart Browser with AI Overlay
- Launch Chrome with integrated evaluation overlay
- Get instant AI scores on any listing:
  - **Flip Potential** (1-10): Resale value opportunity
  - **Weirdness** (1-10): Unique/interesting factor
  - **Scam Risk** (1-10): Warning signs detected
- Click any listing for immediate analysis

### 💰 Comparable Pricing (Vehicles)
- Automatic market research for vehicles
- Scrapes FB Marketplace for similar listings
- Calculates median, min, max prices
- Shows up to 12 clickable comparables in overlay
- Persistent cache builds pricing database over time

### 📊 Web Dashboard
- **Inventory Browser**: Filter by Make → Year → Model
- **Price Analytics**: Interactive distribution charts
- **Evaluation History**: Track all analyzed listings
- **Recent Activity**: See latest evaluations

### 🤖 Multiple AI Engines
1. **Anthropic Claude Haiku** - Cloud AI (requires API key)
2. **Ollama** - Local privacy-focused AI
3. **Heuristic Fallback** - Rule-based when AI unavailable

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Node.js 18+ (for development)

### Installation

```bash
# Clone repository
git clone https://github.com/batterts/fb-marketplace-scout.git
cd fb-marketplace-scout

# Install dependencies
npm install

# Launch Scout
./scout.sh
```

That's it! Scout will:
1. ✅ Start Docker services (Ollama + Web Server)
2. ✅ Open browser to http://localhost:3000
3. ✅ Be ready to evaluate listings!

## 📖 Usage

### Launch Browser
1. Open http://localhost:3000
2. Select category (Vehicles, Electronics, etc.)
3. Click **Launch Browser**
4. Browse FB Marketplace normally
5. Click any listing to see AI evaluation overlay

### Browse Inventory
1. Go to **Inventory** tab
2. Select Make (Honda, Toyota, etc.)
3. Select Year
4. Select Model
5. View all past evaluations

### View Analytics
1. Select vehicle from Inventory
2. Switch to **Analytics** tab
3. See price distribution chart
4. View individual comparables
5. Analyze market trends

## 🏗️ Architecture

```
┌─────────────────────┐
│   Web Interface     │  http://localhost:3000
│  (Express + SQLite) │
└──────────┬──────────┘
           │
           ├── Launch Browser ──► Puppeteer + Overlay
           ├── API Endpoints ───► /api/inventory/*
           └── Database ────────► marketplace.db
                                   ├── evaluations
                                   └── comparable_pricing

┌─────────────────────┐
│  Ollama (Local AI)  │  http://localhost:11434
│   Mistral/Llama     │
└─────────────────────┘
```

## 📁 Project Structure

```
fb-marketplace-scout/
├── public/                 # Web UI
│   ├── index.html         # Main dashboard
│   ├── style.css          # Styling
│   └── app.js             # Frontend logic
├── scout-browser.js       # Puppeteer automation + overlay
├── evaluator.js          # AI evaluation engine
├── comparable-pricing.js  # FB scraper for comparables
├── web-server.js         # Express API server
├── docker-compose.yml    # Production deployment
├── scout.sh              # Launcher script
└── marketplace.db        # SQLite database
```

## 🔧 Configuration

### Anthropic API Key (Optional)
Create `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Without API key, Scout uses Ollama (local AI) automatically.

### Change Search Radius
Edit `comparable-pricing.js`:
```javascript
const searchURL = buildSearchURL(year, make, model, zipCode, 500);
// Change 500 to your preferred miles
```

## 🐳 Docker Services

### Ollama (Port 11434)
- Local AI model server
- Privacy-focused (no data sent to cloud)
- Auto-downloads models on first use
- CPU/GPU support

### Scout Web (Port 3000)
- Express.js API server
- Web dashboard UI
- SQLite database access

## 📊 Database Schema

### `evaluations` Table
- Listing details (title, price, location)
- AI scores (flip, weirdness, scam)
- Vehicle info (year, make, model, mileage)
- Evaluation notes and timestamp

### `comparable_pricing` Table
- Search key (year_make_model)
- Price statistics (median, min, max)
- Individual listing data with URLs
- Last updated timestamp

## 🛑 Stop Scout

```bash
./scout-stop.sh
```

Or:
```bash
docker-compose down
```

## 📸 Screenshots

### Browser Overlay
![Overlay showing flip score 8/10, weirdness 3/10, scam risk 2/10, with comparable listings]

### Web Dashboard
![Dashboard showing inventory browser with Honda → 2014 → Accord selections]

### Price Analytics
![Chart showing price distribution of 2014 Honda Accord comparables]

## 🔒 Privacy

- **All data stored locally** in SQLite (`marketplace.db`)
- **Ollama runs offline** - no cloud AI required
- **No telemetry** - Scout doesn't phone home
- **Your database** - export/backup anytime

## 🛠️ Development

### Run without Docker
```bash
# Start Ollama
ollama serve

# Start web server
node web-server.js

# Open browser
open http://localhost:3000
```

### Live Reload (Docker)
```bash
docker-compose -f docker-compose.dev.yml up
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Built with [Puppeteer](https://pptr.dev/) for browser automation
- [Ollama](https://ollama.ai/) for local AI
- [Anthropic Claude](https://anthropic.com/) for cloud AI
- [Chart.js](https://www.chartjs.org/) for analytics visualization

## 📚 Documentation

- [SCOUT-README.md](SCOUT-README.md) - Detailed user guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [VEHICLE-VALUATION.md](VEHICLE-VALUATION.md) - Pricing algorithm

## 🐛 Issues

Found a bug? Have a feature request?
[Open an issue](https://github.com/batterts/fb-marketplace-scout/issues)

---

**Built with ❤️ for smart marketplace shopping**
