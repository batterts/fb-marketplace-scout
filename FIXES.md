# Recent Fixes - 2026-01-31

## Issue #1: Inventory Model Always Null ✅ FIXED

**Problem:** The `vehicle_model` column was always NULL in the database.

**Root Cause:** The `extractVehicleInfo()` function in `evaluator.js` only extracted year, make, and mileage - not model names.

**Solution:**
1. Enhanced model extraction logic in `evaluator.js`
2. Parses text after make name to extract model
3. Filters out trim levels (SE, LE, LX, etc.)
4. Filters out body types (Sedan, Coupe, SUV, etc.)
5. Handles multi-word models (Grand Cherokee, etc.)

**Example Extractions:**
- "2004 Honda Civic" → `Civic`
- "2017 Hyundai elantra SE Sedan 4D" → `Elantra`
- "1965 Ford mustang Fastback C Code" → `Mustang`

**Fixed Existing Records:** Created `fix-models.js` script and fixed 3 existing vehicle records.

**Files Changed:**
- `evaluator.js` - Enhanced model extraction
- `fix-models.js` - Script to fix existing records

---

## Issue #2: Comparables Not Added to List ✅ FIXED

**Problem:** Analytics page only showed prices like "Listing 1, Listing 2..." instead of actual listing details.

**Root Cause:** The comparable pricing scraper collected full listing data (title, location, mileage, URL) but only saved the prices array to the database.

**Solution:**
1. Added `listings` column to `comparable_pricing` table
2. Modified `saveComparableData()` to save full listing details
3. Modified `getCachedComparableData()` to return listings
4. Modified API endpoint to include listings in response
5. Updated frontend to display actual listing cards with:
   - Price
   - Location
   - Mileage
   - Description
   - "View →" button with link to actual listing

**Database Migration:**
```sql
ALTER TABLE comparable_pricing ADD COLUMN listings TEXT;
```

**Files Changed:**
- `comparable-pricing.js` - Save full listing data
- `web-server.js` - Return listings from API
- `public/app.js` - Display listing cards instead of generic labels

**Note:** Existing comparable data will show price-only until re-scraped. New comparables will have full listing details.

---

## Testing

### Test Model Extraction

1. Start browser: `./scout.sh` (or Docker: `docker compose up`)
2. Click "Launch Browser" → Select "Vehicles"
3. Click any vehicle listing on Facebook Marketplace
4. Check database:
   ```bash
   sqlite3 marketplace.db "SELECT title, vehicle_year, vehicle_make, vehicle_model FROM evaluations ORDER BY id DESC LIMIT 5;"
   ```
5. Should see model name populated

### Test Comparable Listings Display

1. Open Scout web UI: http://localhost:3000
2. Click "Inventory" tab
3. Select: Honda → 2004 → Civic (or any vehicle with comparables)
4. Should see listing cards with location, mileage, and "View →" links
5. Old data will show "Listing 1, Listing 2..." (fallback)
6. New data will show full details

### Re-scrape Comparables (Optional)

To get full listing details for existing comparables:

```bash
# Delete old comparable data for a specific vehicle
sqlite3 marketplace.db "DELETE FROM comparable_pricing WHERE search_key = '2004_honda_civic';"

# Then click the vehicle in the browser - comparables will be re-scraped with full data
```

---

## Current Database Stats

```bash
sqlite3 marketplace.db "SELECT COUNT(*) as total, COUNT(vehicle_make) as makes, COUNT(vehicle_model) as models FROM evaluations;"
```

**Result:** 189 total | 3 with make | 3 with model (was 0) ✅

**Vehicle Records:**
- 2004 Honda Civic - has 10 comparables
- 2017 Hyundai Elantra - has 10 comparables
- 1965 Ford Mustang - has 7 comparables

---

## Summary

Both issues are **fully resolved**:

✅ Model extraction working for new evaluations
✅ Existing 3 records fixed
✅ Comparable listings now saved to database
✅ Analytics page displays full listing cards
✅ View links to original Facebook listings

All changes committed and pushed to GitHub.
