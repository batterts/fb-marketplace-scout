# 🚗 Integrated Comparable Pricing - LIVE!

Comparable pricing is now **fully integrated** into the Scout! It automatically searches Facebook Marketplace for similar vehicles and uses real market data for valuation.

## How It Works

### 1. You Click a Vehicle Listing

```
2016 Toyota Tacoma Double Cab Limited - $20,000
```

### 2. Scout Detects It's a Vehicle

```
🚗 Vehicle detected: {"year":2016,"make":"Toyota"}
```

### 3. Checks Cache First

```
📋 Checking cache for: 2016_toyota_tacoma
```

**If found in cache:**
```
✅ Using cached data (8 samples, updated: 2026-01-28)
💰 Median: $21,000 from 8 comparables
```

**If NOT in cache:**
```
🔍 Searching for comparables: 2016 Toyota Tacoma
```

### 4. Opens New Tab to Search (if needed)

```
📍 Searching with 40 mile radius...
💰 Found 8 prices at 40mi radius
✅ Found 8 comparables
📊 Range: $18,500 - $24,000
📊 Median: $21,000 | Avg: $20,875
💾 Saved comparable data for 2016_toyota_tacoma
🗑️  Closed comparables search tab
```

**Key:** Opens in **new tab**, then closes it - doesn't disrupt your browsing!

### 5. Calculates Value

```
💰 Comparable pricing: $21,000 median from 8 listings
Fair price at 95% of market ($21k from 8 comparables) | 2016 Toyota
```

### 6. Shows in Overlay

```
┌─────────────────────────────────────┐
│ 🤖 Marketplace Scout            [×] │
├─────────────────────────────────────┤
│ Flip Potential: 5/10                │
│ Weirdness: 3/10                     │
│ Scam Risk: 2/10                     │
│                                     │
│ 📝 Notes                            │
│ Fair price at 95% of market         │
│ ($21k from 8 comparables)           │
│ | 2016 Toyota Tacoma                │
└─────────────────────────────────────┘
```

## Cache Strategy: Forever!

**Cache never expires** - builds pricing knowledge over time!

```sql
-- First 2016 Tacoma you see
INSERT comparable_pricing (2016_toyota_tacoma, median=21000, count=8)

-- Second 2016 Tacoma (days/weeks/months later)
SELECT FROM comparable_pricing WHERE search_key='2016_toyota_tacoma'
-- Returns: $21k from 8 comparables (instant, no search!)

-- Different vehicle
INSERT comparable_pricing (2018_honda_civic, median=16000, count=12)
```

**Over time:** Your database becomes a comprehensive pricing book!

## Search Strategy

### Model Normalization

Removes trim details to find more matches:
```
"Tacoma Limited 4x4" → searches "Tacoma"
"F-150 XLT SuperCrew" → searches "F-150"
"Civic EX-L" → searches "Civic"
```

### Expanding Radius

Starts hyperlocal, expands gradually, then searches regionally/nationally:
```
1mi → 2mi → 5mi → 8mi → 10mi → 20mi → 40mi → 60mi → 80mi → 100mi → 250mi → 500mi
(stops when 5+ comparables found)
```

**Strategy:**
- **Hyperlocal (1-10mi)**: Best comparables, same market conditions
- **Local (20-100mi)**: Regional pricing, common vehicles stop here
- **Regional/National (250-500mi)**: Rare vehicles, exotic models

### Price Extraction

Finds prices like:
- `$21,000`
- `$21000`
- `$21k`

Filters:
- Must be $500 - $150,000 (vehicles)
- Removes duplicates
- Calculates median (most reliable stat)

## Fallback: Generic Model

If comparable pricing fails (no browser, rare vehicle, error):
```
⚠️  Comparable pricing failed: timeout
💰 Generic valuation: $9,040
Fair price at 95% of market ($9k from generic model)
```

Still shows valuation, just less accurate.

## Condition Adjustments

Works with condition detection!

**Clean vehicle:**
```
💰 Comparable pricing: $21,000 from 8 comparables
Fair price at 95% of market
```

**Transmission damage:**
```
💰 Comparable pricing: $21,000 from 8 comparables
⚠️  Condition-adjusted value: $14,700 (70% of clean)
Overpriced at 136% of market ⚠️ HAS: transmission damage
```

Applies damage multipliers to comparable data!

## Database Growth

**Week 1:**
```
2016 Tacoma    → 8 comparables, $21k
2018 Civic     → 12 comparables, $16k
2010 Camry     → 6 comparables, $8k
```

**Week 2:**
```
2020 F-150     → 15 comparables, $28k
2019 Accord    → 10 comparables, $18k
(Tacoma/Civic already cached)
```

**Month 1:**
```
50+ vehicle types cached
All future lookups instant!
```

## Example: Real Tacoma Valuation

**Before (Generic Model):**
```
2016 Tacoma: $9,040 estimated
KBB actual: $22,000
Error: 59% off ❌
```

**After (Comparable Pricing):**
```
2016 Tacoma: $21,000 from 8 FB comparables
KBB actual: $22,000
Error: 5% off ✅
```

**Much more accurate!**

## Natural Browsing Behavior

This is exactly what you'd do manually:
1. See a vehicle listing
2. Search for similar vehicles
3. Check price range
4. Decide if it's a good deal

Scout just automates it!

## Performance

**First time seeing vehicle type:**
- Opens new tab
- Searches FB (3-5 seconds)
- Closes tab
- Caches result
- Uses for valuation

**Subsequent times (cache hit):**
- Instant lookup from database
- No search needed
- 0 seconds overhead

## Privacy & Rate Limiting

✅ **Natural behavior** - mimics manual research
✅ **New tabs** - doesn't disrupt browsing
✅ **Cached forever** - minimal searches
✅ **Gradual radius expansion** - not aggressive
✅ **2-second waits** - respectful rate limiting
✅ **Closes tabs** - cleans up after itself

## Console Output Example

```
🔍 New listing detected: 805216412239049
   ⏳ Waiting for page to load...
   📄 Extracting data from page...
   ✅ Data extracted successfully
   Title: 2016 Toyota Tacoma Double Cab Limited
   Price: $20,000
   Location: Waterbury, CT
   🤖 Evaluating listing...
📋 Evaluating: 2016 Toyota Tacoma Double Cab Limited
   🚗 Vehicle detected: {"year":2016,"make":"Toyota"}

   🔍 Searching for comparables: 2016 Toyota Tacoma
   📍 Searching with 40 mile radius...
   💰 Found 8 prices at 40mi radius
   ✅ Found 8 comparables
   📊 Range: $18,500 - $24,000
   📊 Median: $21,000 | Avg: $20,875
   💾 Saved comparable data for 2016_toyota_tacoma
   🗑️  Closed comparables search tab

   💰 Comparable pricing: $21,000 median from 8 listings
   📝 Vehicle notes: "Fair price at 95% of market ($21k from 8 comparables) | 2016 Toyota"
   ✅ Heuristic: Flip=5 Weird=3 Scam=2
   💾 Saving to database...
   ✅ Evaluation complete!
```

## Try It Now!

```bash
./start-scout.sh
```

**Then:**
1. Click on any vehicle listing
2. Watch console for comparable search
3. See accurate market pricing in overlay
4. Click another vehicle of same type
5. Notice instant cache hit!

## Future Improvements

- [ ] Weight by mileage similarity
- [ ] Filter obvious scams/typos from comparables
- [ ] Multi-region search for rare vehicles
- [ ] Track sold prices (if FB shows them)
- [ ] Age out very old cached data (> 6 months)
- [ ] Export pricing database for backup

## Database Schema

```sql
CREATE TABLE comparable_pricing (
  id INTEGER PRIMARY KEY,
  search_key TEXT UNIQUE,        -- "2016_toyota_tacoma"
  year INTEGER,                   -- 2016
  make TEXT,                      -- "Toyota"
  model TEXT,                     -- "Tacoma"
  prices TEXT,                    -- "[18500,19000,20000,...]"
  median_price INTEGER,           -- 21000
  sample_count INTEGER,           -- 8
  min_price INTEGER,              -- 18500
  max_price INTEGER,              -- 24000
  last_updated TIMESTAMP          -- "2026-01-28 14:23:45"
);
```

## Query Pricing Database

```bash
sqlite3 marketplace.db

-- See all cached vehicle types
SELECT year, make, model, median_price, sample_count
FROM comparable_pricing
ORDER BY last_updated DESC;

-- Find specific vehicle
SELECT * FROM comparable_pricing
WHERE search_key='2016_toyota_tacoma';

-- See pricing trends
SELECT make, AVG(median_price) as avg_price
FROM comparable_pricing
GROUP BY make
ORDER BY avg_price DESC;
```

**Your pricing database grows with every unique vehicle you see!** 🚗💰📊
