# 🔍 Debug: Comparable Search Issues

## Enhanced Logging

The comparable pricing search now includes extensive debug logging to help diagnose issues.

## NEW: Active Search Method

Instead of relying on URL parameters, the scout now:
1. Opens Facebook Marketplace vehicles page
2. **Types** the search query into the search box
3. **Presses Enter** to submit
4. Waits for results to load

This mimics human behavior and works much more reliably.

## What to Look For

### 1. Search Query Submission
```
📍 Searching with 5 mile radius...
🔍 Typing search query: "2016 Toyota Tacoma"
✅ Search submitted, waiting for results...
```

Shows the search is being actively typed, not just URL parameters.

### 2. What Facebook Shows
```
📏 Radius: 8 mi
🔍 Search box shows: "2016 Toyota Tacoma"
📄 Page heading: "Marketplace"
🔗 Total item links: 47
```

This tells you:
- **Radius** - What radius Facebook is actually using
- **Search box** - Confirms query was typed correctly
- **Page heading** - What page loaded
- **Total links** - Raw marketplace items found

### 3. Sample Listings (NEW)
```
📝 Sample listings found:
   ✓ 1. $18,500 - "2016 Toyota Tacoma SR5 Double Cab 4x4 - Clean title..."
   ✓ 2. $20,000 - "2016 Toyota Tacoma TRD Sport - Excellent condition..."
   ✗ 3. $15,000 - "2018 Honda Civic EX - One owner, low miles..."
```

Shows first 3 listings with:
- ✓ = Matches search criteria
- ✗ = Doesn't match (filtered out)
- Quick verification that search worked

### 4. Match Summary
```
📋 Found 12 total listings at 5mi radius
✅ 8 match criteria (2016 Toyota)
⚠️  4 don't match (wrong year/make)
```

- **12 listings** - Total with extractable prices
- **8 matched** - Listings that match year/make
- **4 unmatched** - Wrong vehicle (shows why)

### 4. Unmatched Listings
```
⚠️  4 don't match (wrong year/make)
   - $15,000 from: "2018 Toyota Tacoma TRD Sport - Clean title..." (year=false, make=true)
   - $22,000 from: "2016 Honda Civic EX - One owner..." (year=true, make=false)
```

Shows examples of what was filtered out and why.

### 5. Automatic Retry (NEW)
If search returns 0 matches (but has listings), scout auto-retries:
```
⚠️  SEARCH FAILED: 0 matches out of 15 listings
🔄 Facebook may be showing generic results. Trying alternative method...
🔄 Retry found 8 matches out of 12 listings
✅ Using retry results (better match rate)
```

This catches when Facebook ignores the search and shows random vehicles.

### 6. Debug Screenshot
If NO listings found on first search:
```
📸 No listings found - saved screenshot to: /path/to/debug-search.png
```

Open `debug-search.png` to see what Facebook actually loaded.

## Common Issues

### Issue 1: Radius Stuck at 8mi

**Symptom:**
```
📍 Searching with 40 mile radius...
📏 Facebook showing radius: 8 mi
```

**Cause:** Facebook Marketplace ignores URL radius parameters. It uses:
1. Your account's saved location preferences
2. Browser cookies with radius setting
3. Default radius (8mi) if no preference

**Solutions:**

#### Option A: Manually Change Radius (One-time)
1. Open Facebook Marketplace in the scout browser
2. Click on any vehicle search
3. Find "Radius" filter in left sidebar
4. Change to desired radius (e.g., 500mi)
5. Facebook saves this preference in cookies
6. Scout will now use this radius

#### Option B: Set Location in Profile
1. Go to Facebook Settings → Location
2. Set your home location to Seymour, CT
3. This becomes the center point for searches

#### Option C: Clear Cookies & Let Scout Set It
```bash
rm -rf ~/.fb-marketplace-scout-profile
./start-scout.sh
```

Scout will start fresh and try to set radius via URL.

### Issue 2: No Listings Found

**Symptom:**
```
🔍 Debug: Found 0 marketplace item links on page
📋 Found 0 total listings
```

**Possible Causes:**

1. **Not Logged In**
   - Facebook requires login to see marketplace
   - Solution: Login manually in scout browser

2. **Page Structure Changed**
   - Facebook updated their HTML
   - Solution: Check debug-search.png screenshot

3. **Search Query Too Specific**
   - "2016 Toyota Tacoma Limited V6 4x4" finds nothing
   - "2016 Toyota Tacoma" finds listings
   - Solution: Model name normalization working

4. **No Results in Area**
   - Rare vehicle, small radius
   - Solution: Search expands automatically

### Issue 3: Wrong Vehicles Matched

**Symptom:**
```
✅ 12 match criteria (2016 Toyota)
But showing: 2015 Civic, 2018 F-150, etc.
```

**Cause:** Extraction matching wrong text on page.

**Debug:** Check console output:
```
- $15,000 from: "2018 Toyota Tacoma..." (year=false, make=true)
```

This shows the actual text extracted and why it didn't match.

## Testing the Fix

### Run a Test Search
1. Start scout:
```bash
./start-scout.sh vehicles
```

2. Click on a vehicle listing (e.g., 2016 Tacoma)

3. Watch console output carefully:
```
🔍 Searching for comparables: 2016 Toyota Tacoma
📍 Searching with 1 mile radius...
🔗 URL: https://...radius=1...
📏 Facebook showing radius: 8 mi      ← Check this!
🔍 Debug: Found 47 marketplace item links
📋 Found 12 total listings at 1mi radius
✅ 8 match criteria (2016 Toyota)

📋 Matched Comparable Listings (8 total):
1. $18,500 - 2016 Toyota Tacoma SR5...
2. $20,000 - 2016 Toyota Tacoma TRD...
```

### What Success Looks Like
```
📍 Searching with 1 mile radius...
📏 Facebook showing radius: 1 mi      ← Radius changed!
✅ 3 match criteria

📍 Searching with 5 mile radius...
📏 Facebook showing radius: 5 mi      ← Radius changed!
✅ 8 match criteria
✅ Found 8 comparables (stopped)
```

### What Failure Looks Like
```
📍 Searching with 1 mile radius...
📏 Facebook showing radius: 8 mi      ← Stuck at 8mi!
✅ 8 match criteria

📍 Searching with 5 mile radius...
📏 Facebook showing radius: 8 mi      ← Still 8mi!
✅ 8 match criteria (same results)
```

If stuck at 8mi, use **Option A** above to manually change it.

## URL Parameters Tried

The code now tries multiple parameter combinations:
- `radius=X` (kilometers)
- `maxDistance=X` (kilometers)
- `location=06483` (zip code)
- `deliveryMethod=local_pick_up`

Facebook may ignore all of these and use cookies instead.

## Workaround: Cookie-Based Radius

If URL parameters don't work, the scout will:
1. Load the search page
2. Try to find radius dropdown in UI
3. Click it to change radius
4. Wait for page to reload

This mimics manual user behavior and should work.

## Report Issues

If still having problems, please provide:
1. Full console output from search
2. The `debug-search.png` screenshot
3. Whether you're logged into Facebook in the scout browser
4. What radius Facebook shows in sidebar (from console log)

## Temporary Solution

While investigating, you can:
1. Manually set radius to 500mi in Facebook settings
2. Let scout search at that radius each time
3. Results will be filtered by year/make anyway
4. Not optimal but ensures comprehensive search
