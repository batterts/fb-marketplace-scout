# Changelog

## 2026-01-31 - Fixes Release

### Issue #1: Price Display $NaN → FIXED ✅

**Problem:** Frontend displayed "$NaN" instead of "$3,000"

**Root Cause:** `parseInt("$3,000")` returns NaN due to "$" and comma

**Fix:** Strip "$" and commas before parsing:
```javascript
const priceNum = parseInt(eval.price.replace(/[$,]/g, ''));
```

**Result:** Prices now display correctly in inventory tab

---

### Issue #2: Make/Model Extraction Broken → FIXED ✅

**Problem:**
- "2007 Mercedes-Benz SL 550" extracted as:
  - Make: "Mercedes" ❌
  - Model: "-benz sl" ❌

**Root Cause:**
- carBrands array had 'mercedes' but not 'mercedes-benz'
- Matched "mercedes" first, then extracted "-benz sl" as model

**Fix:**
1. Added hyphenated brands BEFORE short versions:
   ```javascript
   ['mercedes-benz', 'rolls-royce', 'land rover', ..., 'mercedes', ...]
   ```

2. Proper capitalization for multi-word brands:
   ```javascript
   // "mercedes-benz" → "Mercedes-Benz"
   // "land rover" → "Land Rover"
   const separator = brand.includes('-') ? '-' : ' ';
   make = brand.split(separator)
     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
     .join(separator);
   ```

3. Added more stopWords (fastback, roadster, hardtop, diesel)

**Test Results:**
- ✅ Mercedes-Benz SL 550 → Make: Mercedes-Benz, Model: Sl 550
- ✅ Honda Civic → Make: Honda, Model: Civic
- ✅ Ford Mustang Fastback → Make: Ford, Model: Mustang
- ✅ Land Rover Range Rover → Make: Land Rover, Model: Range rover
- ✅ Rolls-Royce Ghost → Make: Rolls-Royce, Model: Ghost

---

### Issue #3: Comparables Not in Dropdown → FIXED ✅

**Problem:** When scraping comparables (12+ Mercedes listings), they didn't appear in inventory dropdown

**Root Cause:** Comparables were only saved to `comparable_pricing.listings` (JSON array), not as individual records in `evaluations` table

**Fix:** Created `saveComparablesToEvaluations()` function:
- Extracts each comparable listing
- Saves to evaluations table with: title, price, location, year, make, model, mileage, URL
- Uses `INSERT OR IGNORE` to avoid duplicates (URL is UNIQUE)
- Sets `evaluated=0` (discovered but not yet scored)

**Result:**
- Scraped 17 Mercedes SL 550 comparables
- All 17 now appear in inventory dropdown
- Can browse them in inventory: Mercedes → 2007 → SL 550 (17 listings)

**Before:**
```sql
SELECT COUNT(*) FROM evaluations WHERE vehicle_make LIKE '%Mercedes%';
-- Result: 1
```

**After:**
```sql
SELECT COUNT(*) FROM evaluations WHERE vehicle_make LIKE '%Mercedes%';
-- Result: 18 (1 original + 17 comparables)
```

---

## Files Changed

### Frontend
- `public/app.js` - Fixed price parsing ($NaN → $3,000)

### Backend
- `evaluator.js` - Fixed make/model extraction for hyphenated brands
- `comparable-pricing.js` - Added saveComparablesToEvaluations() call
- `save-comparables-to-evaluations.js` - NEW: Save comparables to evaluations

### Testing
- `test-extraction.js` - Tests make/model/price extraction
- `test-save-comparables.js` - Tests comparable saving

---

## Testing

### Test Price Display
1. Open Scout: http://localhost:3000
2. Go to Inventory tab
3. Select: Mercedes → 2007 → SL 550
4. Should see prices like "$19,900", "$17,995", etc (not "$NaN")

### Test Make/Model Extraction
1. Launch browser and click a Mercedes-Benz listing
2. Check database:
   ```sql
   sqlite3 marketplace.db "SELECT vehicle_make, vehicle_model FROM evaluations ORDER BY id DESC LIMIT 1;"
   ```
3. Should show: `Mercedes-Benz | SL 550` (not `Mercedes | -benz sl`)

### Test Comparables in Dropdown
1. Click any vehicle listing (triggers comparable search)
2. Go to Inventory tab in web UI
3. Should see the make in dropdown with increased count
4. Select make → year → model
5. Should see all comparable listings (not just the one you clicked)

---

## Migration Note

**No migration needed!**

- Old data will have incorrect make/model (e.g., "Mercedes" + "-benz sl")
- New data will be correct (e.g., "Mercedes-Benz" + "SL 550")
- Just start fresh or let new scrapes populate with correct data

To start fresh:
```bash
docker compose down
rm marketplace.db
node init-database.js
docker compose up -d
```

---

## Why This Matters

**Before:**
- Click Mercedes listing → scrapes 12 comparables → they're hidden in JSON
- Can only see pricing data in analytics
- Can't browse the other listings we found

**After:**
- Click Mercedes listing → scrapes 12 comparables → saves all 12 to inventory
- Can browse all 12 in inventory dropdown
- Click any of them to see full evaluation
- Builds inventory database automatically while browsing

**Efficiency:** One click = 12+ vehicles added to database! 🚀
