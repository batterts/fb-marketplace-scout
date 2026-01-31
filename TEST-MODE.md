# Test Mode - Auto-navigate to Listings

The scout browser now has a test mode that automatically navigates to an unevaluated listing for debugging.

## Fixed Issues

### 1. `page.waitForTimeout` is not a function

**Error:**
```
❌ Error during extraction/evaluation: page.waitForTimeout is not a function
```

**Fix:** Replaced deprecated `page.waitForTimeout(3000)` with:
```javascript
await new Promise(resolve => setTimeout(resolve, 3000));
```

This works in all Puppeteer versions.

## How to Use Test Mode

### Option 1: Run test script
```bash
./test-scout.sh
```

### Option 2: Run with --test flag
```bash
node scout-browser.js --test
```

### What happens in test mode:

1. Browser launches
2. Automatically picks a random unevaluated listing from database
3. Navigates directly to that listing
4. Evaluation runs automatically
5. You see the full console output

**Example output:**
```
🚀 Launching FB Marketplace Scout...

✅ Browser launched with Scout enabled
💾 Session saved to: ~/.fb-marketplace-scout-profile
🧪 TEST MODE - Auto-navigating to a listing

   Navigating to: https://www.facebook.com/marketplace/item/1224354239639774/

🔍 New listing detected: 1224354239639774
   ⏳ Waiting for page to load...
   📄 Extracting data from page...
   ✅ Data extracted successfully
   Title: Polaroid color i-type film 96 photos
   Price: $100
   Location: Brookfield, CT
   Description: Polaroid color i-type film. 96 total...
   🤖 Evaluating listing...
📋 Evaluating: Polaroid color i-type film 96 photos
   ✅ Heuristic: Flip=5 Weird=3 Scam=2
   💾 Saving to database...
   ✅ Evaluation complete!
```

## Normal Mode (Default)

```bash
./start-scout.sh
# or
node scout-browser.js
```

Just browse normally and click listings yourself.

## Debugging

If extraction is failing, run in test mode to see exactly what's happening:

```bash
./test-scout.sh
```

Then check the console for:
- ✅ Data extracted successfully (good!)
- 🔍 DEBUG INFO (extraction partially failed)
- ❌ Error during extraction/evaluation (something went wrong)

## Summary of Changes

1. ✅ Fixed `waitForTimeout` deprecation
2. ✅ Added detailed step-by-step logging
3. ✅ Added test mode with `--test` flag
4. ✅ Auto-picks random listing from database
5. ✅ Shows full extraction/evaluation flow

Try it now:
```bash
./test-scout.sh
```
