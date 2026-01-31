# 🎯 Enhanced Recommendations - Actionable Scout Advice

## What Changed

### Before
```
Notes: "Fair price at 95% of market ($21k from 8 comparables) | 2016 Toyota"
```

### After
```
Notes: "Below market by $2k. Check transmission fluid level, test drive,
offer $18k cash. Tow it if needed. Waterbury = 15min drive - good Friday pickup"
```

## Three Evaluation Methods

### 1. Anthropic API (Best - requires API key)
- Most intelligent recommendations
- Considers your specific preferences
- Actionable advice for every listing

### 2. Ollama (Good - free, local)
- ✅ **NOW WORKING** - Fixed model detection
- Runs locally on your machine
- Uses Mistral or other available models
- Provides detailed recommendations

### 3. Heuristic (Fallback - always works)
- ✅ **Enhanced with actionable notes**
- No AI required
- Still provides useful recommendations

## New Ollama Features

### Auto-Detection
```javascript
// Automatically finds available models:
// 1. mistral (preferred)
// 2. llama3, llama2
// 3. First available model
```

### Better Error Handling
```
🦙 Using Ollama model: mistral:latest
✅ Ollama: Flip=8 Weird=7 Scam=2
```

Or if not available:
```
⚠️  No Ollama models available
✅ Heuristic: Flip=7 Weird=5 Scam=3
```

## Enhanced Prompt

### Old Prompt (Generic)
```
Score: 1-10
- Flip potential
- Weirdness
- Scam risk
```

### New Prompt (Actionable)
```
Score 1-10 AND provide:
- Resale platforms + estimated profit
- Specific red flags to verify
- Negotiation tactics + offer price
- Travel time + pickup logistics
- Research needed (comps, demand)
- What to test/check before buying
```

## Example Recommendations

### Vehicles
**Before:**
```
Fair price at 95% of market | 2016 Toyota
```

**After:**
```
Below market by $2k. Check transmission fluid level, test drive
in all gears, offer $18k cash for quick sale. 10min from Seymour
- perfect Friday pickup. Bring jack/tools to inspect undercarriage
```

### Electronics
**Before:**
```
High flip potential (8/10)
```

**After:**
```
Resell on eBay for $400-500 (check sold comps). Test all functions
before buying - bring HDMI cable. Derby (8min) - excellent Friday
score. List same day for quick flip
```

### Test Equipment
**Before:**
```
Vintage test equipment - weird (9/10)
```

**After:**
```
Rare Tektronix 465B - $800-1200 on eBay if working. Bring BNC
probe to test. Check calibration sticker date. Waterbury = 15min.
Audiophile/ham radio market - post on r/electronics
```

### Scam Listings
**Before:**
```
Scam risk (9/10)
```

**After:**
```
⚠️ Red flags: Stock photo, no VIN, 'email only' contact, price
50% below market. Ask for: video chat + specific photos + VIN
lookup before meeting. Meet at police station if proceeding
```

### Bulk Lots
**Before:**
```
Flip potential (7/10)
```

**After:**
```
Bulk lot = $5-10/item resale on Mercari/eBay. Need truck + help
loading. Derby (8min) - excellent Friday score. Sort immediately,
list high-value items first. Potential $200-400 profit if 20+ items
```

### Free Items
**Before:**
```
Free - flip potential (8/10)
```

**After:**
```
FREE! Resell for $150-200 on Craigslist/FB after cleaning. Need
truck. Ansonia (6min). Pick up Friday AM, list same day. Zero
investment, pure profit
```

## Location Intelligence

### Nearby (Boosted)
```
✓ Naugatuck - near you (~5min drive). Perfect Friday pickup!
```

### Medium Distance
```
Waterbury (15min) - doable Friday. Plan 30min total (pickup + return)
```

### Far
```
New Haven (40min) - only worth it for high-value flip ($500+ profit)
```

## Setup Ollama (Free Local AI)

### Install
```bash
# macOS
brew install ollama

# Start service
ollama serve
```

### Install Model
```bash
# Recommended: Mistral (7B, fast, smart)
ollama pull mistral

# Or Llama 3.2 (newer)
ollama pull llama3.2

# Or Llama 2 (reliable)
ollama pull llama2
```

### Verify
```bash
curl http://localhost:11434/api/tags
```

Should see your installed models.

## Console Output Examples

### With Ollama Working
```
📋 Evaluating: 2016 Toyota Tacoma Limited
🦙 Using Ollama model: mistral:latest
   🚗 Vehicle detected: {"year":2016,"make":"Toyota"}
   🔍 Searching for comparables: 2016 Toyota Tacoma
   📍 Searching with 1 mile radius...
   📍 Searching with 5 mile radius...
   ✅ 8 match criteria
   💰 Comparable pricing: $21,000 from 8 comparables
✅ Ollama: Flip=8 Weird=3 Scam=1
   Notes: "Below market by $1k. Clean title truck - check frame
   rust, test 4WD. Offer $19k. Waterbury = 12min Friday pickup"
```

### Ollama Not Available (Heuristic)
```
📋 Evaluating: Vintage Oscilloscope
⚠️  No Ollama models available
✅ Heuristic: Flip=8 Weird=9 Scam=2
   Notes: "Test equipment - $300-1000 resale potential if working.
   Niche vintage tech - check audiophile/photography forums.
   ✓ Seymour - near you (~5min drive)"
```

## Benefits

### Before
- Generic scores
- No actionable advice
- Miss opportunities
- Waste time on scams
- No negotiation guidance

### After
- Specific action items
- Research platforms suggested
- Profit estimates
- Red flags listed
- Negotiation tactics
- Pickup logistics
- Time estimates
- Testing procedures

## User Preferences (Customizable)

Edit `evaluator.js` EVAL_PROMPT to customize:

```javascript
**User Preferences:**
- Location: Seymour, CT (prefer nearby)
- Availability: Friday pickups only
- Interests: Electronics, test equipment, vintage tech, bulk lots
```

Change to your preferences!

## Testing

Try clicking on:
1. **Vehicle** - See comparable pricing + condition checks
2. **Electronics** - See resale platforms + profit estimates
3. **Cheap iPhone** - See scam warnings + verification steps
4. **Free item** - See profit potential + logistics
5. **Bulk lot** - See per-item pricing + total profit

All now have **actionable recommendations**!

## Troubleshooting

### Ollama 404 Error
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running:
ollama serve

# If no models:
ollama pull mistral
```

### API Key for Anthropic
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Heuristic Only
If both API and Ollama fail, heuristic still provides enhanced recommendations!
