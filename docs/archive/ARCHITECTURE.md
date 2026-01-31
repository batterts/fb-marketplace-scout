# FB Marketplace Scout - Architecture

## Overview

Multi-phase system for passive marketplace monitoring, evaluation, and interaction assistance.

## Phase 1: DOM Watcher + SQLite (COMPLETE ✅)

### Components

**watcher.py**
- Uses Playwright (async)
- Persistent Chrome profile (`~/.fb-marketplace-scout-profile/`)
- Non-headless (visible browser, user controls it)
- Scans DOM every 2 seconds for listing cards
- Extracts data from Facebook's HTML structure
- Saves to SQLite via database.py

**database.py**
- SQLite schema definition
- Helper functions (add_listing, get_unevaluated_listings, etc.)
- Duplicate URL prevention (UNIQUE constraint)
- Indexes for performance

**status.py**
- View database stats
- Show recent discoveries
- Quick health check

### Data Flow

```
User scrolls FB Marketplace
         ↓
Playwright watches DOM
         ↓
Finds <a href="/marketplace/item/...">
         ↓
Extracts: title, price, thumbnail, seller, location, URL
         ↓
Checks if URL already in DB
         ↓
If new: INSERT into listings table
         ↓
Marks as evaluated=0 (pending)
```

### Facebook DOM Structure (as of Jan 2024)

Listing cards typically have:
- Link: `a[href*="/marketplace/item/"]`
- Title: `span` with marketplace class
- Price: `span[class*="x193iq5w"]`
- Image: `img` tag
- Text content includes: Title, Price, Seller, Location (in that order)

**Note:** These selectors may break when Facebook updates their HTML.

## Phase 2: Background Evaluator (NEXT)

### Planned Components

**evaluator.py**
- Separate process (runs independently from watcher)
- Pulls listings WHERE evaluated=0
- Random delay between evaluations (30s - 5min)
- Calls Claude API for each listing
- Stores scores back to DB

### Evaluation Prompt Structure

```python
EVALUATION_PROMPT = f"""
You are evaluating a Facebook Marketplace listing for resale/flip potential.

Item: {title}
Price: {price}
Location: {location}
Seller: {seller_name}

User interests: electronics, film/darkroom, test equipment, weird items, bulk lots

Rate 1-10:
1. Flip potential (resale value vs price)
2. Weirdness score (unique/interesting)
3. Scam likelihood (check price, seller, item type)

Return JSON:
{{
  "flip_score": X,
  "weirdness_score": X,
  "scam_likelihood": X,
  "notes": "brief explanation"
}}
"""
```

### Scam Detection Heuristics

- Price too low for item type
- Generic/stolen photos (later: pHash duplicates)
- Seller name patterns (later)
- Screenshot instead of real photo (later: image analysis)

## Phase 3: Image Analysis (FUTURE)

### Planned Components

**image_analyzer.py**
- Downloads thumbnails
- Computes pHash (perceptual hash)
- Stores hash in DB
- Finds duplicates: `SELECT ... GROUP BY thumbnail_phash HAVING count > 1`
- Detects screenshot dimensions (9:16, 9:19.5, etc.)

### pHash Implementation

```python
import imagehash
from PIL import Image

def compute_phash(image_url):
    img = Image.open(requests.get(image_url, stream=True).raw)
    return str(imagehash.phash(img))
```

### Duplicate Detection Logic

1. For each new listing, compute pHash
2. Check if pHash exists in DB
3. If exists + different seller → mark as potential scam
4. Store both listing IDs for review

## Phase 4: Message Drafter (FUTURE)

### Planned Components

**drafter.py**
- Playwright page overlay/injection
- Triggered when user clicks a listing
- Shows evaluation scores + warnings
- Generates contextual message via Claude

### Message Generation Prompt

```python
MESSAGE_PROMPT = f"""
Draft a casual Facebook Marketplace message for this listing.

Item: {title}
Price: {price}
Listing text: {full_description}

Constraints:
- I'm in Seymour, CT
- Can only pick up Fridays
- Interested because: {reason_from_evaluation}
- DO NOT say "is this still available"
- Reference something specific from the listing
- Keep it brief and friendly

Draft message:
"""
```

### UI Design (Concept)

```
┌─────────────────────────────────────────┐
│  FB Marketplace Listing                 │
│  (normal FB content)                    │
├─────────────────────────────────────────┤
│  🤖 SCOUT OVERLAY                       │
│  ────────────────────────────────────── │
│  Flip Score: ████████░░ 8/10            │
│  Weirdness: ██████░░░░ 6/10             │
│  ⚠️  Scam Risk: ██░░░░░░░░ 2/10         │
│  ────────────────────────────────────── │
│  📝 Draft Message:                      │
│  ┌───────────────────────────────────┐ │
│  │ Hey! I saw your listing for the   │ │
│  │ oscilloscope. I'm in Seymour and  │ │
│  │ would love to check it out. I'm   │ │
│  │ free Friday afternoon if you're   │ │
│  │ around. Does it come with probes? │ │
│  └───────────────────────────────────┘ │
│  [Copy Message]  [Regenerate]          │
└─────────────────────────────────────────┘
```

## Phase 5: Curiosity Mode (FUTURE)

### Planned Components

**curiosity.py**
- Runs in background (very low frequency)
- Picks random keyword from list
- Performs search on FB Marketplace
- Flags high-scoring results
- Doesn't interfere with normal browsing

### Keyword Strategy

```python
KEYWORDS = [
    "rare", "unique", "estate", "vintage",
    "for parts", "doesn't work", "grandpa's",
    "lot of", "bulk", "tube", "oscilloscope",
    "film", "darkroom"
]

# Random search every 15-30 minutes
# Scrolls first page only
# Saves interesting items (weirdness > 7 OR flip > 8)
```

## Technology Stack

### Current (Phase 1)
- **Python 3.10+**
- **Playwright** - Browser automation
- **SQLite3** - Local database
- **asyncio** - Async event loop

### Future Additions
- **Anthropic Claude API** - Evaluation + message generation
- **imagehash** - Perceptual hashing
- **Pillow (PIL)** - Image processing
- **requests** - HTTP client

## File Structure

```
fb-marketplace-scout/
├── watcher.py              # Phase 1 ✅
├── database.py             # Phase 1 ✅
├── status.py               # Phase 1 ✅
├── setup.sh                # Phase 1 ✅
├── requirements.txt        # Phase 1 ✅
├── marketplace.db          # Generated ✅
│
├── evaluator.py            # Phase 2 ⏳
├── image_analyzer.py       # Phase 3 ⏳
├── drafter.py              # Phase 4 ⏳
├── curiosity.py            # Phase 5 ⏳
│
├── config.json             # Future: API keys, prefs
├── README.md
├── QUICKSTART.md
├── ARCHITECTURE.md         # This file
└── .gitignore
```

## Security & Privacy

- All data stored locally (SQLite)
- Browser profile saved locally
- No data sent anywhere except Claude API (in Phase 2+)
- Claude API calls will include listing data for evaluation
- No automated actions on Facebook (read-only monitoring)

## Performance Considerations

### Phase 1 (Current)
- DOM scan every 2 seconds: negligible CPU
- SQLite writes: very fast (local SSD)
- Memory: ~100-200MB (browser + Python)

### Phase 2 (Future)
- Claude API calls: rate limited, random delays
- Cost: ~$0.001 per evaluation (Sonnet)
- Budget: ~$1 for 1000 listings

### Phase 3 (Future)
- Image downloads: cached locally
- pHash computation: ~50ms per image
- Duplicate detection: indexed query, very fast

## Limitations & Challenges

1. **Facebook HTML changes**: Selectors break when FB updates
2. **Rate limiting**: Too many API calls → throttled
3. **Scam detection**: Heuristics not perfect
4. **Image analysis**: Requires downloading all images
5. **Message overlay**: Injecting UI into FB page is tricky

## Next Steps

1. ✅ Get Phase 1 working and tested
2. ⏳ Add Claude API integration (Phase 2)
3. ⏳ Implement image pHash + duplicates (Phase 3)
4. ⏳ Build message drafter overlay (Phase 4)
5. ⏳ Add curiosity mode (Phase 5)

## Testing Phase 1

1. Run watcher
2. Scroll through 20-30 listings
3. Check `python3 status.py`
4. Verify data quality in SQLite
5. Report any extraction issues
