# FB Marketplace Scout 🔍

A Playwright-based browser tool that passively monitors Facebook Marketplace while you browse, evaluates listings, and helps draft messages.

## Current Status: Phase 1 + 2 Complete! ✅

**Working:**
- ✅ Playwright browser with persistent session (no repeated logins!)
- ✅ **Ad removal** - Sponsored posts automatically hidden
- ✅ DOM watcher that monitors listing cards as you scroll
- ✅ SQLite database storage
- ✅ Automatic extraction of: title, price, thumbnail URL, listing URL, seller name, location
- ✅ **Background evaluator** - Scores listings automatically
- ✅ **Overlay system** - Shows scores when viewing listings
- ✅ Scam warnings for suspicious listings

**Coming Soon:**
- ⏳ Message drafter (auto-generate contextual messages)
- ⏳ Image analysis (pHash, duplicate detection)
- ⏳ Curiosity mode (random keyword searches)

## Installation

```bash
cd /Users/shaun.batterton/code/fb-marketplace-scout
./setup.sh
```

This will:
1. Install Python dependencies
2. Install Playwright + Chromium browser
3. Initialize SQLite database

## Usage

### Two-Process Setup

You'll run **two terminal windows**:

**Terminal 1: Watcher (Browse & Collect)**
```bash
./run.sh
```

- Opens Chrome browser
- Removes sponsored ads ✨
- Saves listings as you scroll
- Shows overlay with scores when you click listings

**Terminal 2: Evaluator (Score Listings)**
```bash
./run-evaluator.sh
```

- Runs in background
- Pulls saved listings
- Scores each one
- Random delays (30s-5min) between evaluations

### The Workflow

1. **You browse** → Watcher saves listings
2. **Evaluator scores** them in background
3. **You click listing** → Overlay shows scores!

See [USAGE.md](USAGE.md) for complete guide.

### Check Database Stats

```bash
python3 database.py
```

Shows:
- Total listings saved
- How many evaluated
- How many pending
- Scam count
- Flippable items count

## Database Schema

**Table: `listings`**

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| listing_url | TEXT | Full URL (unique) |
| title | TEXT | Item title |
| price | TEXT | Listed price |
| thumbnail_url | TEXT | Image URL |
| seller_name | TEXT | Seller's name |
| location | TEXT | Listed location |
| discovered_at | TIMESTAMP | When we first saw it |
| evaluated | BOOLEAN | Has Claude evaluated it? |
| evaluation_data | TEXT | Raw evaluation JSON |
| flip_score | INTEGER | Resale potential (1-10) |
| weirdness_score | INTEGER | How weird/unique (1-10) |
| scam_likelihood | INTEGER | Scam probability (1-10) |
| thumbnail_phash | TEXT | Perceptual hash of image |
| is_duplicate | BOOLEAN | Duplicate image detected? |
| is_screenshot | BOOLEAN | Thumbnail is a screenshot? |
| notes | TEXT | Additional notes |

## Your Constraints

Hardcoded preferences for message drafting (Phase 3):

- **Location:** Seymour, CT
- **Availability:** Friday pickups only
- **Interests:**
  - Electronics
  - Film/darkroom gear
  - Test equipment
  - Weird stuff
  - Bulk lots for resale

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Browsing                       │
│  (You scroll FB Marketplace manually in browser)     │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              DOM Watcher (watcher.py)                │
│  - Playwright connected to persistent Chrome        │
│  - Watches for listing cards in DOM                 │
│  - Extracts data as you scroll                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│            SQLite Database (database.py)             │
│  - Stores all listing data                          │
│  - Marks evaluated=0 initially                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         [Phase 2: Background Evaluator]
         [Phase 3: Image Analysis]
         [Phase 4: Message Drafter]
         [Phase 5: Curiosity Mode]
```

## Roadmap

### Phase 1: DOM Watcher + SQLite ✅
- [x] Playwright browser automation
- [x] Persistent Chrome profile (cookies saved)
- [x] DOM watching loop
- [x] Data extraction (title, price, etc.)
- [x] SQLite storage
- [x] Duplicate URL detection

### Phase 2: Background Evaluator (Next!)
- [ ] Separate process pulls unevaluated listings
- [ ] Random delays (30s - 5min) between evaluations
- [ ] Claude API integration
- [ ] Scoring: flip potential, weirdness, scam likelihood
- [ ] Store scores back to DB

### Phase 3: Image Analysis
- [ ] pHash each thumbnail
- [ ] Detect duplicate images (scam indicator)
- [ ] Detect screenshot dimensions
- [ ] Optional: Yandex reverse image search

### Phase 4: Message Drafter
- [ ] Browser overlay on listing pages
- [ ] Show scores + scam warnings
- [ ] Claude-generated contextual messages
- [ ] References listing specifics
- [ ] Mentions Seymour area + Friday pickup
- [ ] Does NOT say "is this still available"
- [ ] One-click copy

### Phase 5: Curiosity Mode
- [ ] Random keyword searches from list
- [ ] Very infrequent, mixed with real browsing
- [ ] Flag interesting finds

## Keyword List (for Curiosity Mode)

```python
KEYWORDS = [
    "rare", "unique", "estate", "vintage", "for parts",
    "doesn't work", "grandpa's", "lot of", "bulk",
    "tube", "oscilloscope", "film", "darkroom"
]
```

## Files

```
fb-marketplace-scout/
├── watcher.py          # Main DOM watcher (Playwright)
├── database.py         # SQLite schema + helpers
├── setup.sh            # Installation script
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── marketplace.db      # SQLite database (created on first run)
```

## Notes

- **Persistent session:** Browser profile saved to `~/.fb-marketplace-scout-profile`
- **No headless mode:** You see the browser, you control navigation
- **Passive monitoring:** Just scroll normally, watcher does the rest
- **No automation of actions:** This just watches, doesn't click or interact

## Next Steps

Once you confirm the watcher is working:

1. Add the background evaluator with Claude API
2. Implement image pHash + duplicate detection
3. Build the message drafter overlay

Let's get Phase 1 solid first! 🚀
