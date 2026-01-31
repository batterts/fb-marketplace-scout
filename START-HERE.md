# 🚀 START HERE - FB Marketplace Scout (Puppeteer Version)

## What You Just Got

A complete Facebook Marketplace monitoring system using **working Puppeteer** (Node.js) like your fb-marketplace-clean app!

✅ **Ad removal** - Sponsored posts automatically hidden (WORKING!)
✅ **Sidebar hidden** - More screen space for listings
✅ **Auto evaluation** - Scores items in background
✅ **Smart overlay** - Shows scores + description when viewing listings
✅ **Scam detection** - Warns about suspicious items
✅ **Cookie persistence** - Login once, stay logged in

## Quick Start (2 Steps)

### Step 1: Start the Scout Browser

Open **Terminal 1**:
```bash
cd /Users/shaun.batterton/code/fb-marketplace-scout
./start-scout.sh
```

Or just:
```bash
node scout-browser.js
```

**What happens:**
- Browser opens (Puppeteer, like your working fb-marketplace-clean app!)
- Facebook Marketplace loads
- **Ads are auto-removed** every 2 seconds ✨
- **Sidebar is hidden** (360px divs removed)
- You browse normally
- When you click a listing, overlay appears with scores + description

### Step 2: Evaluation Mode (Optional Setup)

**Listings are evaluated automatically when you click them!** No separate evaluator needed.

**Three evaluation methods (tried in order):**

1. **Anthropic API** (best quality, ~$0.001 per listing)
   ```bash
   export ANTHROPIC_API_KEY='sk-ant-...'
   ./start-scout.sh
   ```

2. **Ollama** (free, local, good quality)
   ```bash
   ollama serve  # In a separate terminal
   ollama pull llama3.2  # One-time download
   ./start-scout.sh
   ```

3. **Heuristic** (instant, always works)
   - No setup needed
   - Uses keyword matching
   - Works out of the box

**Default:** Uses heuristic mode (instant, no setup). See [EVALUATION.md](EVALUATION.md) for details.

### Step 3: See It In Action

1. Scout browser opens Facebook Marketplace (Terminal 1)
2. **Ads disappear** within 2 seconds
3. **Sidebar hidden** - more screen space!
4. **Click on any listing**
5. Watch the console - listing is evaluated automatically!
6. See the overlay appear in top-left corner! 🎉

**Console output:**
```
🔍 New listing detected: 25608535845470704
   Title: Vintage Oscilloscope
   Price: $125
   Location: Naugatuck, CT
📋 Evaluating: Vintage Oscilloscope
   ✅ Heuristic: Flip=8 Weird=9 Scam=2
```

**The overlay shows:**
- Flip potential score (1-10)
- Weirdness score (1-10)
- Scam risk (1-10)
- **Full description text** (even when Facebook hides it!)
- Scam warning if risk ≥ 7

**Every listing you click is evaluated instantly!** No waiting, no separate evaluator process.

```
┌────────────────────────────┐
│ 🤖 Marketplace Scout       │
├────────────────────────────┤
│ Flip Potential             │
│ ████████░░ 8/10            │
│                            │
│ Weirdness Score            │
│ █████████░ 9/10            │
│                            │
│ Scam Likelihood            │
│ ██░░░░░░░░ 2/10            │
│                            │
│ ⚠️ SCAM WARNING            │ ← If scam score ≥ 7
│ High scam likelihood!      │
│                            │
│ 📝 Good flip potential.    │
│    Interesting/unique item │
│                            │
│ Seymour, CT • Friday only  │
└────────────────────────────┘
```

## Test It Works

We added some test listings. Check them:

```bash
./check-status.sh
```

You should see:
- Total listings: 178+
- Evaluated: 10
- **Scams detected: 1** (the fake iPhone)
- **Flippable items: 1+** (oscilloscope, etc.)

## Why This Version Works

**This is the Puppeteer (Node.js) version**, based on your working fb-marketplace-clean app!

The Python/Playwright version had injection issues. This version uses the **exact same pattern** as your working fb-marketplace-clean:
- ✅ `puppeteer.launch()`
- ✅ `page.evaluateOnNewDocument()` for ad removal
- ✅ `userDataDir` for cookie persistence
- ✅ Same ad removal heuristics that actually work

## What's Different from fb-marketplace-clean?

| Feature | Clean | Scout |
|---------|-------|-------|
| Ad removal | ✅ | ✅ |
| Cookie persistence | ✅ | ✅ |
| **Sidebar hidden** | ❌ | ✅ |
| **Scores items** | ❌ | ✅ |
| **Scam detection** | ❌ | ✅ |
| **Overlay with scores + description** | ❌ | ✅ |
| **Database** | ❌ | ✅ (5.3MB already!)

## Files & Scripts

**Puppeteer (Node.js) - WORKING VERSION:**
```
./start-scout.sh       Start the scout browser (Puppeteer)
node scout-browser.js  Start scout browser (direct)
scout-browser.js       Main scout browser code (Node.js)
package.json           Node.js dependencies
```

**Python scripts (evaluator and utilities):**
```
./run-evaluator.sh     Start the evaluator
./check-status.sh      See database stats
./test-evaluator.py    Test with sample data
database.py            Database helper functions
evaluator.py           Background scoring
```

## Evaluation Modes

### Heuristic Mode (Current, Free)

Uses smart keyword detection:

**Flip boosters:**
- vintage, antique, rare, estate, bulk, free

**Weirdness boosters:**
- tube, oscilloscope, darkroom, film, unique

**Scam indicators:**
- iPhone/MacBook/PS5 under $200
- Items under $10 (except free)
- No location info

### AI Mode (Optional, Better)

For smarter evaluation, add Claude API key:

```bash
export ANTHROPIC_API_KEY='your-key-here'
./run-evaluator.sh
```

Cost: ~$0.001 per listing (~$1 for 1000 listings)

## Your Preferences (Built In)

The system knows you:
- 📍 **Location:** Seymour, CT
- 📅 **Availability:** Friday pickups only
- 🔧 **Interests:** Electronics, film/darkroom, test equipment, weird stuff, bulk lots

These show in the overlay and will be used for message drafting (Phase 3).

## Commands Reference

```bash
# Start scout browser (Puppeteer version - WORKS!)
./start-scout.sh
# or
node scout-browser.js

# Start evaluator (Python, scores listings in background)
./run-evaluator.sh

# Check stats
./check-status.sh

# Test evaluator
source venv/bin/activate
python3 test-evaluator.py

# View database
sqlite3 marketplace.db
SELECT title, price, flip_score FROM listings WHERE flip_score >= 7;
.quit

# Install Node.js dependencies (already done!)
npm install
```

## Troubleshooting

### No overlay showing?

1. Did you click into a listing (not just hover)?
2. Check Terminal 2 - is evaluator running?
3. Wait a minute for evaluation to complete
4. Refresh the listing page

### Ads still showing?

- The removal runs every 2 seconds
- Some ads might appear briefly
- If persistent, Facebook changed their HTML

### Evaluator not scoring?

Check Terminal 2 output. Should see:
```
📋 Evaluating: Item Name
   ✅ Flip: X/10 | Weird: X/10 | Scam: X/10
```

If not:
```bash
./check-status.sh
```

Check "Pending evaluation" number.

## Next Steps

1. ✅ Browse some listings (Terminal 1)
2. ✅ Watch evaluator score them (Terminal 2)
3. ✅ Click a listing and see the overlay!
4. 📖 Read [USAGE.md](USAGE.md) for advanced features
5. 🔧 Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

## Coming Soon (Phase 3)

- 📝 **Message drafter** - Auto-generate contextual messages
- 🖼️ **Image analysis** - Detect duplicate images (scam indicator)
- 🔍 **Curiosity mode** - Random keyword searches
- 🔔 **Notifications** - Alert on high-value items

## Support

**Read these in order:**
1. This file (START-HERE.md)
2. [QUICKSTART.md](QUICKSTART.md)
3. [USAGE.md](USAGE.md)
4. [ARCHITECTURE.md](ARCHITECTURE.md)

**Still stuck?**
Check Terminal output for error messages.

---

## 🎯 Your Goal

Find great deals, avoid scams, flip for profit. Let Scout do the heavy lifting while you browse! 🚀
