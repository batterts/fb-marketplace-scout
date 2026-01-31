# 🚀 Scout - FB Marketplace Intelligence Platform

AI-powered evaluation tool for Facebook Marketplace listings. Instantly scores flip potential, weirdness, and scam risk. Includes vehicle pricing intelligence with automatic comparable searches.

<img width="1507" height="945" alt="image" src="https://github.com/user-attachments/assets/1b967e93-835b-49f6-8131-02064b012332" />

<img width="1282" height="912" alt="image" src="https://github.com/user-attachments/assets/05b40ad7-d9c0-4bdb-970a-78011f2a3882" />

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/batterts/fb-marketplace-scout.git
cd fb-marketplace-scout
npm install

# Start Scout (Docker)
./scripts/scout.sh
```

**That's it!** Scout opens at http://localhost:3000

---

## Features

- **🤖 Instant AI Evaluation** - Click any listing → Get scores immediately
- **🚗 Vehicle Intelligence** - Auto-extract year/make/model + find comparables
- **📊 Price Analytics** - Market analysis with distribution charts
- **💾 Inventory Management** - Browse all scraped listings
- **🐳 Docker Ready** - One command to start everything

---

## How It Works

1. **Click "Launch Browser"** in web UI
2. **Browse** Facebook Marketplace normally
3. **Click any listing** → Instant evaluation overlay appears
4. **View scores:** Flip Potential • Weirdness • Scam Risk
5. **For vehicles:** Get comparable pricing automatically

### Example Output

```
╔═════════════════════════════════╗
║ 🤖 Marketplace Scout            ║
├─────────────────────────────────┤
║ Flip Potential:  ████████░░ 8/10║
║ Weirdness:       ██████░░░░ 6/10║
║ Scam Risk:       ██░░░░░░░░ 2/10║
║                                 ║
║ 2007 Mercedes-Benz SL 550       ║
║ Asking: $3,000                  ║
║ Market Median: $10,000          ║
║ 17 comparables found            ║
╚═════════════════════════════════╝
```

---

## AI Modes

Scout tries evaluation methods in this order:

1. **Anthropic API** (Best) - Set `ANTHROPIC_API_KEY` env variable
2. **Ollama** (Free, Local) - Runs automatically in Docker
3. **Heuristic** (Instant) - Keyword-based, always works

No configuration needed - it just works!

---

## Documentation

- **[Complete Guide](docs/GUIDE.md)** - Full documentation
- **[Changelog](CHANGELOG.md)** - Recent fixes and features
- **[Architecture](docs/archive/ARCHITECTURE.md)** - Technical details

---

## Project Structure

```
fb-marketplace-scout/
├── lib/                  # Core source code
│   ├── scout-browser.js  # Browser automation
│   ├── evaluator.js      # AI evaluation
│   ├── web-server.js     # API server
│   └── ...
├── scripts/              # Utilities
│   ├── scout.sh          # Main launcher
│   └── init-database.js  # DB setup
├── tests/                # Test scripts
├── public/               # Web UI
├── docs/                 # Documentation
└── marketplace.db        # SQLite database
```

---

## Requirements

- **macOS** (for native browser launching)
- **Docker Desktop** (or Node.js 18+ for native mode)
- **Chrome/Chromium** (installed automatically by Puppeteer)

### Docker Mode (Recommended)
```bash
./scripts/scout.sh
```

### Native Mode (Without Docker)
```bash
npm run init    # Initialize database
npm start       # Start web server (port 3000)
npm run browser # Launch browser
```

---

## Commands

```bash
# Start Scout
./scripts/scout.sh

# Stop Scout
docker compose down

# Initialize database
npm run init

# Run tests
node tests/test-extraction.js
node tests/test-save-comparables.js

# Check database
sqlite3 marketplace.db "SELECT COUNT(*) FROM evaluations;"
```

---

## Recent Updates

### v2.0 (2026-01-31)

✅ **Fixed:** Price display ($NaN → $3,000)  
✅ **Fixed:** Make/model extraction (Mercedes-Benz SL 550)  
✅ **New:** Comparable listings saved to inventory  
✅ **New:** Docker-native browser integration  
✅ **Improved:** Project structure and documentation  

See [CHANGELOG.md](CHANGELOG.md) for details.

---

## Troubleshooting

**Browser doesn't open**
- Make sure Scout Agent is running: `ps aux | grep scout-agent`
- Restart: `./scripts/scout.sh`

**Overlay doesn't appear**
- You must CLICK on a listing (not just browse)
- Wait 3-5 seconds after clicking

**Database errors**
```bash
docker compose down
rm marketplace.db
npm run init
docker compose up -d
```

**Still stuck?** See [Complete Guide](docs/GUIDE.md#troubleshooting)

---

## How Comparable Pricing Works

When you click a vehicle listing:

1. Scout extracts: year, make, model, mileage
2. Searches Facebook Marketplace (500mi radius)
3. Finds 10-20 comparable listings
4. Saves ALL of them to inventory
5. Calculates median price
6. Shows results in overlay + analytics tab

**One click = 12+ vehicles added to your inventory!**

---

## Tech Stack

- **Node.js 18** - Runtime
- **Puppeteer** - Browser automation
- **Express.js** - Web server
- **SQLite3** - Database
- **Ollama** - Local AI (optional)
- **Anthropic Claude** - Cloud AI (optional)
- **Docker** - Containerization

---

## License

MIT License - See LICENSE file for details

---

## Contributing

Contributions welcome! Please:
1. Run tests before submitting
2. Update documentation for new features
3. Add entries to CHANGELOG.md

---

## Support

**Questions or issues?**
- Check the [Complete Guide](docs/GUIDE.md)
- Review [CHANGELOG.md](CHANGELOG.md) for recent fixes
- Open an issue on GitHub

---

**Built with ❤️ for smarter marketplace shopping**

Happy Scouting! 🚀
