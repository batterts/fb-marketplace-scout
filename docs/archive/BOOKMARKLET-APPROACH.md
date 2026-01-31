# Bookmarklet Approach (Works with fb-marketplace-clean!)

Since Playwright injection isn't working, let's use a simpler approach that works with your existing **FB Marketplace NO FUCKING ADS** app.

## How It Works

1. **Use fb-marketplace-clean** for browsing (already works!)
2. **Run a local server** to provide evaluation data
3. **Click a bookmarklet** when viewing a listing to show overlay

No more Playwright injection issues!

---

## Setup (One Time)

### Step 1: Start the Scout Server

**Terminal 1:**
```bash
cd /path/to/fb-marketplace-scout
source venv/bin/activate
python3 server.py
```

Leave this running. It provides evaluation data on `http://localhost:8765`.

### Step 2: Start the Evaluator

**Terminal 2:**
```bash
cd /path/to/fb-marketplace-scout
./run-evaluator.sh
```

Scores listings in the background.

### Step 3: Create the Bookmarklet

1. **Copy this entire code:**

```javascript
javascript:(function(){const url=window.location.href;if(!url.includes('/marketplace/item/')){alert('Not on a marketplace listing page');return;}const itemId=url.split('/marketplace/item/')[1].split('/')[0].split('?')[0];let description='';let longest='';document.querySelectorAll('div, span').forEach(el=>{const text=(el.textContent||'').trim();if(text.length>100&&text.length<2000&&text.length>longest.length){if(!text.includes('Send seller')&&!text.includes('Save to')){longest=text;}}});description=longest;fetch(`http://localhost:8765/check/${itemId}`).then(r=>r.json()).then(data=>{const old=document.getElementById('scout-overlay');if(old)old.remove();if(!data.evaluated){const div=document.createElement('div');div.id='scout-overlay';div.innerHTML=`<div style="position: fixed; top: 20px; left: 20px; background: #1c1e21; border: 2px solid #3a3b3c; border-radius: 8px; padding: 16px; z-index: 999999; color: #e4e6eb; font-family: system-ui; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 320px;"><div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">🤖 Marketplace Scout</div><div style="font-size: 14px; color: #b0b3b8;">⏳ Not evaluated yet</div><div style="font-size: 12px; color: #8a8d91; margin-top: 8px;">Run the evaluator to score this listing</div></div>`;document.body.appendChild(div);return;}const{flip,weird,scam,notes}=data;const scamColor=scam>=7?'#f44336':scam>=4?'#ff9800':'#4caf50';const scamWarn=scam>=7?'<div style="background: #f44336; padding: 8px; border-radius: 4px; margin-bottom: 12px;"><b>⚠️ SCAM WARNING</b><br>High risk detected!</div>':'';let descHtml='';if(description&&description.length>30){const descSafe=description.replace(/</g,'&lt;').replace(/>/g,'&gt;').substring(0,1000);descHtml=`<div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px;"><div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 6px;">📝 Description</div><div style="font-size: 13px; color: #e4e6eb; max-height: 250px; overflow-y: auto; padding: 8px; background: #242526; border-radius: 4px; line-height: 1.4;">${descSafe}</div></div>`;}const div=document.createElement('div');div.id='scout-overlay';div.innerHTML=`<div style="position: fixed; top: 20px; left: 20px; background: #1c1e21; border: 2px solid #3a3b3c; border-radius: 8px; padding: 16px; z-index: 999999; color: #e4e6eb; font-family: system-ui; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 420px; max-height: 85vh; overflow-y: auto;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #3a3b3c; padding-bottom: 8px;"><div style="font-size: 16px; font-weight: bold;">🤖 Marketplace Scout</div><button onclick="document.getElementById('scout-overlay').remove()" style="background: #3a3b3c; border: none; color: #e4e6eb; cursor: pointer; border-radius: 4px; padding: 4px 8px; font-size: 18px;">×</button></div><div style="margin-bottom: 10px;"><div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Flip Potential</div><div style="display: flex; align-items: center;"><div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;"><div style="width: ${flip*10}%; height: 100%; background: #4caf50;"></div></div><div style="margin-left: 8px; font-weight: bold; width: 40px;">${flip}/10</div></div></div><div style="margin-bottom: 10px;"><div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Weirdness</div><div style="display: flex; align-items: center;"><div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;"><div style="width: ${weird*10}%; height: 100%; background: #9c27b0;"></div></div><div style="margin-left: 8px; font-weight: bold; width: 40px;">${weird}/10</div></div></div><div style="margin-bottom: 12px;"><div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Scam Risk</div><div style="display: flex; align-items: center;"><div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;"><div style="width: ${scam*10}%; height: 100%; background: ${scamColor};"></div></div><div style="margin-left: 8px; font-weight: bold; width: 40px;">${scam}/10</div></div></div>${scamWarn}${descHtml}<div style="font-size: 11px; color: #8a8d91; text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #3a3b3c;">Seymour, CT • Friday pickups only</div></div>`;document.body.appendChild(div);}).catch(err=>{alert('Could not connect to Scout server. Is it running?\n\nRun: python3 server.py');});})();
```

2. **Create a bookmark:**
   - Right-click your bookmarks bar
   - Click "Add bookmark" or "Add page"
   - Name: `Scout Listing`
   - URL: *Paste the javascript code above*

3. **Done!**

---

## Usage

### Workflow

1. **Browse with fb-marketplace-clean:**
   ```bash
   open "/Applications/FB Marketplace NO FUCKING ADS.app"
   ```
   - Ads auto-removed ✅
   - Cookie persistence ✅

2. **When you find an interesting listing:**
   - Click into the listing
   - **Click the "Scout Listing" bookmarklet**
   - Overlay appears with scores!

3. **Background services:**
   - Server (Terminal 1) - provides data
   - Evaluator (Terminal 2) - scores new listings

---

## What You'll See

**If evaluated:**
```
┌────────────────────────────────┐
│ 🤖 Marketplace Scout      [×]  │
├────────────────────────────────┤
│ Flip Potential                 │
│ ████████░░ 8/10                │
│                                │
│ Weirdness                      │
│ █████████░ 9/10                │
│                                │
│ Scam Risk                      │
│ ██░░░░░░░░ 2/10                │
│                                │
│ ──────────────────────────────│
│ 📝 Description                 │
│ Tandy DMP-130A dot matrix...   │
│ 9-pin impact printer...        │
│ ──────────────────────────────│
│ Seymour, CT • Friday pickups   │
└────────────────────────────────┘
```

**If not evaluated yet:**
```
┌────────────────────────────────┐
│ 🤖 Marketplace Scout           │
├────────────────────────────────┤
│ ⏳ Not evaluated yet           │
│                                │
│ Run the evaluator to score     │
│ this listing                   │
└────────────────────────────────┘
```

---

## Advantages

✅ **Uses your working app** (fb-marketplace-clean)
✅ **No Playwright injection issues**
✅ **Simple bookmarklet click** to show overlay
✅ **Description extraction** from page
✅ **Works with Facebook's CSP** (Content Security Policy)
✅ **Easy to debug** - just JavaScript in browser

---

## Troubleshooting

### "Could not connect to Scout server"

Server not running. Start it:
```bash
cd /path/to/fb-marketplace-scout
source venv/bin/activate
python3 server.py
```

### "Not evaluated yet"

Evaluator hasn't scored it. Either:
- Wait for evaluator to process it
- Or run evaluator now

### Bookmarklet doesn't work

1. Make sure you copied the ENTIRE javascript code (starts with `javascript:`)
2. Try pasting it in browser console instead (F12 → Console)
3. Make sure server is running

### No description showing

Facebook changed their HTML. The bookmarklet tries to find the longest text block.

---

## Commands Reference

```bash
# Start server (Terminal 1)
cd /path/to/fb-marketplace-scout
source venv/bin/activate
python3 server.py

# Start evaluator (Terminal 2)
cd /path/to/fb-marketplace-scout
./run-evaluator.sh

# Browse Marketplace
open "/Applications/FB Marketplace NO FUCKING ADS.app"

# On a listing: Click "Scout Listing" bookmarklet
```

---

## Next Steps

Once this works, we can:
1. Add keyboard shortcut (e.g., press `S` to show scout)
2. Auto-show overlay (no click needed)
3. Add message drafter
4. Save favorite listings

But let's get this bookmarklet working first! 🎯
