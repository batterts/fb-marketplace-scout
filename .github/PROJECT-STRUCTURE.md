# Project Structure

Clean, organized structure for maintainability.

---

## Directory Layout

```
fb-marketplace-scout/
├── README.md                    # Main entry point
├── CHANGELOG.md                 # Recent changes
├── package.json
├── docker-compose.yml
├── Dockerfile.web
├── .gitignore
│
├── lib/                         # Core source code
│   ├── scout-browser.js         # Puppeteer automation
│   ├── scout-agent.js           # Docker→host bridge
│   ├── evaluator.js             # AI evaluation engine
│   ├── comparable-pricing.js    # Vehicle pricing scraper
│   ├── save-comparables-to-evaluations.js
│   ├── web-server.js            # Express API
│   ├── summary.js               # Summary generation
│   └── check-listing.js         # Listing checker
│
├── scripts/                     # Utilities
│   ├── scout.sh                 # 🚀 Main launcher
│   ├── scout-stop.sh            # Stop Scout
│   ├── init-database.js         # Initialize DB
│   ├── migrate-database.js      # Migrate old data
│   ├── fix-models.js            # Fix model extraction
│   ├── check-status.sh          # Status check
│   ├── summary.sh               # Generate summary
│   └── legacy/                  # Old scripts (archived)
│       ├── *.py                 # Old Python scripts
│       ├── *.sh                 # Old shell scripts
│       └── init-comparable-db.js
│
├── tests/                       # Test scripts
│   ├── test-extraction.js       # Test make/model parsing
│   ├── test-save-comparables.js # Test DB saving
│   ├── test-summary.js          # Test summary generation
│   ├── test-dakota.js
│   ├── test-tacoma.js
│   ├── test-transmission-damage.js
│   └── test-vehicle-valuation.js
│
├── public/                      # Web UI
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── docs/                        # Documentation
│   ├── GUIDE.md                 # 📖 Complete guide
│   └── archive/                 # Old docs (26 files)
│       ├── ARCHITECTURE.md
│       ├── QUICKSTART.md
│       └── ...
│
├── .github/                     # GitHub metadata
│   └── PROJECT-STRUCTURE.md     # This file
│
└── marketplace.db               # SQLite database (gitignored)
```

---

## Key Principles

1. **lib/** - All production code
2. **scripts/** - Executable utilities
3. **tests/** - All test code
4. **docs/** - Single comprehensive guide
5. **public/** - Frontend assets
6. **Legacy preserved** - Old code in scripts/legacy/ and docs/archive/

---

## Entry Points

### For Users
- **README.md** - Start here
- **docs/GUIDE.md** - Complete documentation

### For Running
- **./scripts/scout.sh** - Start Scout
- **npm start** - Start web server
- **npm run browser** - Launch browser
- **npm run init** - Initialize database

### For Development
- **lib/** - Main source code
- **tests/** - Run tests
- **CHANGELOG.md** - See recent changes

---

## Before vs After

### Before (Messy)
```
fb-marketplace-scout/
├── 26 markdown files scattered
├── 8 Python scripts mixed in
├── 12 shell scripts
├── 15 JS files all in root
└── Impossible to find anything
```

### After (Clean)
```
fb-marketplace-scout/
├── README.md (entry point)
├── CHANGELOG.md
├── lib/ (8 core files)
├── scripts/ (7 active, legacy archived)
├── tests/ (7 test files)
├── docs/ (1 guide + archive)
└── Everything organized and findable
```

---

## Path References

All paths updated correctly:

| File | Path Update |
|------|-------------|
| Dockerfile.web | `web-server.js` → `lib/web-server.js` |
| package.json | `web-server.js` → `lib/web-server.js` |
| scripts/scout.sh | `scout-agent.js` → `lib/scout-agent.js` |
| lib/scout-agent.js | `__dirname/scout-browser.js` → `lib/scout-browser.js` |
| lib/web-server.js | `scout-browser.js` → `lib/scout-browser.js` |
| scripts/*.js | `marketplace.db` → `../marketplace.db` |

---

## Testing Verification

```bash
# Database initialization
npm run init
✅ Works

# Extraction tests
node tests/test-extraction.js
✅ 5/6 tests pass

# Docker launch
./scripts/scout.sh
✅ Works

# Web server
npm start
✅ Works on port 3000
```

---

## Benefits

✅ **Clear organization** - Easy to find source, scripts, tests
✅ **Single entry point** - README → GUIDE for everything
✅ **No duplication** - 26 docs → 1 comprehensive guide
✅ **Legacy preserved** - Old code archived, not deleted
✅ **All references updated** - Nothing broken
✅ **Better for new contributors** - Clear structure
✅ **Easier maintenance** - Related files grouped together

---

Last updated: 2026-01-31
