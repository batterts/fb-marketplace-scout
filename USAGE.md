# FB Marketplace Scout - Complete Usage Guide

## Overview

Scout has two main components that work together:

1. **Watcher** - Monitors your browsing, removes ads, shows overlays
2. **Evaluator** - Scores listings in the background

## Quick Start (2 Terminals)

### Terminal 1: Start the Watcher

```bash
cd /path/to/fb-marketplace-scout
./run.sh
```

**What it does:**
- Opens Chrome browser
- Removes sponsored ads automatically ✅
- Watches listings as you scroll
- Saves them to database
- Shows overlay when you click a listing ✅

### Terminal 2: Start the Evaluator

```bash
cd /path/to/fb-marketplace-scout
./run-evaluator.sh
```

**What it does:**
- Pulls listings from database
- Scores each one (flip potential, weirdness, scam risk)
- Waits random delays (30s-5min) between evaluations
- Runs until you Ctrl+C

## The Workflow

```
1. You browse → Watcher saves listings → Database
                            ↓
2. Evaluator pulls listings → Scores them → Updates database
                            ↓
3. You click listing → Watcher shows overlay with scores!
```

## What You'll See

### When Browsing (Watcher)
```
📦 [1] Vintage Oscilloscope - $50
📦 [2] Darkroom Enlarger - $75
📦 [3] Electronics Lot - $20
```

### When Evaluating (Evaluator)
```
📋 Evaluating: Vintage Oscilloscope
   💰 $50 | 📍 Hartford, CT
   ✅ Flip: 8/10 | Weird: 9/10 | Scam: 2/10
   📝 Good flip potential. Interesting/unique item
   ⏱️  Next evaluation in 127s...
```

### When Clicking a Listing (Overlay in Browser)
```
┌─────────────────────────────────┐
│ 🤖 Marketplace Scout            │
├─────────────────────────────────┤
│ Flip Potential                  │
│ ████████░░ 8/10                 │
│                                 │
│ Weirdness Score                 │
│ █████████░ 9/10                 │
│                                 │
│ Scam Likelihood                 │
│ ██░░░░░░░░ 2/10                 │
│                                 │
│ 📝 Good flip potential.         │
│    Interesting/unique item      │
│                                 │
│ Seymour, CT • Friday pickups    │
└─────────────────────────────────┘
```

## Evaluation Modes

### Heuristic Mode (Default)
- No API key needed
- Instant evaluation
- Based on keywords and price patterns
- Good for testing

**Keywords that boost scores:**
- Flip: vintage, antique, rare, bulk, estate
- Weirdness: tube, oscilloscope, darkroom, film, weird
- Scam: suspiciously cheap electronics

### AI Mode (Optional)
Uses Claude API for smarter evaluation.

**Setup:**
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
./run-evaluator.sh
```

**Benefits:**
- Understands context better
- More nuanced scoring
- Better scam detection

**Cost:**
- ~$0.001 per listing
- ~$1 for 1000 listings

## Features Explained

### Ad Removal ✅
- Removes "Sponsored" posts
- Removes ad links
- Runs continuously as you scroll
- Same as "FB Marketplace NO FUCKING ADS" app

### Listing Detection ✅
- Watches DOM for listing cards
- Extracts: title, price, thumbnail, seller, location, URL
- Saves to SQLite
- Ignores duplicates

### Evaluation ✅
- Background process (separate from watcher)
- Random delays to be respectful
- Stores scores in database
- Can run 24/7 if you want

### Overlay ✅
- Appears when you view a listing
- Shows scores if evaluated
- Shows "pending" if not yet evaluated
- Shows scam warning if score ≥ 7

## Commands Cheat Sheet

```bash
# Start watcher
./run.sh

# Start evaluator
./run-evaluator.sh

# Check status
./check-status.sh

# View database directly
sqlite3 marketplace.db
```

## Tips & Tricks

### 1. Run Evaluator in Background

```bash
./run-evaluator.sh > evaluator.log 2>&1 &
```

Check it later:
```bash
tail -f evaluator.log
```

### 2. Only Evaluate High-Value Listings

Edit `evaluator.py` and change:
```python
listings = get_unevaluated_listings(limit=5)
```

Add a filter in `database.py`:
```python
WHERE evaluated = 0 AND (price LIKE '$%' OR title LIKE '%vintage%')
```

### 3. Faster Evaluation (No Delays)

In `evaluator.py`, change:
```python
delay = random.randint(30, 300)
```

To:
```python
delay = 5  # Just 5 seconds
```

### 4. Export Interesting Listings

```bash
sqlite3 marketplace.db
```

```sql
.mode csv
.output interesting_listings.csv
SELECT title, price, location, flip_score, weirdness_score, listing_url
FROM listings
WHERE flip_score >= 7 OR weirdness_score >= 8
ORDER BY flip_score DESC;
.quit
```

### 5. Check Scam Warnings

```bash
sqlite3 marketplace.db
```

```sql
SELECT title, price, scam_likelihood, notes
FROM listings
WHERE scam_likelihood >= 7;
```

## Troubleshooting

### Overlay Not Showing

**Check if listing is in database:**
```bash
sqlite3 marketplace.db
SELECT title FROM listings WHERE listing_url LIKE '%ITEM_ID%';
```

**Check if evaluated:**
```bash
SELECT evaluated, flip_score FROM listings WHERE listing_url LIKE '%ITEM_ID%';
```

**Force evaluation:**
Run the evaluator, it will pick it up automatically.

### No Listings Being Saved

**Check watcher output:**
Should see "📦 [1] Item name - $price"

**Check console in browser:**
Press F12, look for "🚀 FB Marketplace Scout: Ad removal active"

**DOM changed?**
Facebook updates their HTML frequently. Check `watcher.py` selectors.

### Evaluator Not Running

**Check if listings are pending:**
```bash
./check-status.sh
```

Should show "Pending evaluation: X"

**Check virtual environment:**
```bash
source venv/bin/activate
which python3
```

Should be in the venv path.

### Ads Still Showing

The ad removal code runs every 2 seconds. Some ads might slip through initially.

If they persist:
1. Open browser console (F12)
2. Look for errors
3. Check if Facebook changed their ad HTML

## What's Next (Future Features)

- ⏳ Message drafter (auto-generate messages)
- ⏳ Image pHash (duplicate detection)
- ⏳ Curiosity mode (random keyword searches)
- ⏳ Browser extension version
- ⏳ Desktop notifications for high-value items

## Performance

**CPU Usage:**
- Watcher: ~5% (mostly browser)
- Evaluator: <1% (mostly waiting)

**Memory:**
- Browser: ~300MB
- Python: ~50MB each process

**Database Size:**
- ~1KB per listing
- 10,000 listings = ~10MB

## Privacy & Security

- All data stored locally
- No external services except Claude API (optional)
- Browser profile saved to `~/.fb-marketplace-scout-profile/`
- Database: `marketplace.db` (SQLite)

**To reset everything:**
```bash
rm marketplace.db
rm -rf ~/.fb-marketplace-scout-profile/
python3 database.py  # Reinitialize
```

## Customization

### Change Your Location

Edit `evaluator.py` and watcher overlay:

```python
# evaluator.py
User location: Your City, ST

# watcher.py
Seymour, CT • Friday pickups only
```

### Add More Keywords

Edit `evaluator.py`:

```python
if any(word in title for word in ['your', 'keywords', 'here']):
    flip_score += 2
```

### Adjust Scoring

Edit the heuristics in `evaluator.py`:

```python
if price_num < 50:
    flip_score += 1  # Change to += 2 for more aggressive
```

## Support

**Questions? Issues?**

1. Check this guide
2. Check `QUICKSTART.md`
3. Check `ARCHITECTURE.md` for technical details
4. Run `./check-status.sh` for diagnostics

**Want to contribute?**

See `ARCHITECTURE.md` for Phase 3+ roadmap!
