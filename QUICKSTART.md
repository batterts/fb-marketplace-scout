# Quick Start Guide 🚀

## 1. Install

```bash
cd /Users/shaun.batterton/code/fb-marketplace-scout
./setup.sh
```

Wait for it to install dependencies and Playwright browser.

## 2. Run the Watcher

```bash
./run.sh
```

(This activates the virtual environment and runs the watcher)

**What you'll see:**
1. Chrome browser opens
2. If first time: log into Facebook manually
3. Browser navigates to Marketplace
4. You scroll through listings like normal
5. Terminal shows listings being saved:

```
📦 [1] Vintage Oscilloscope - $50
📦 [2] Darkroom Enlarger - $75
📦 [3] Bulk Electronics Lot - $20
```

## 3. Check What's Saved

```bash
source venv/bin/activate
python3 status.py
```

(Or just: `./run.sh` and Ctrl+C, then check database)

Shows:
- How many listings found
- Recent discoveries
- Database stats

## 4. Browse the Database

```bash
sqlite3 marketplace.db
```

```sql
-- See all listings
SELECT title, price, location FROM listings LIMIT 10;

-- See uneval
uated listings
SELECT title, price FROM listings WHERE evaluated = 0;

-- Exit
.quit
```

## 5. Stop Watching

Press `Ctrl+C` in the terminal

## Troubleshooting

### "Module not found" errors
```bash
pip3 install -r requirements.txt
```

### Browser won't open
```bash
python3 -m playwright install chromium
```

### Facebook asking to log in every time
The persistent profile should save your session. Check:
```bash
ls ~/.fb-marketplace-scout-profile
```

If it's empty, there might be an issue with the profile path.

### No listings being saved
Check if the DOM selectors still work. Facebook changes their HTML frequently.

To debug:
1. Look at the terminal output
2. Check for error messages
3. Inspect a listing card's HTML in browser DevTools

### Want to reset everything?
```bash
rm marketplace.db
rm -rf ~/.fb-marketplace-scout-profile
python3 database.py  # Reinitialize
```

## Next Steps

Once this is working:

1. **Test it:** Scroll through 20-30 listings, verify they're saved
2. **Check data quality:** Look at what's in the database
3. **Report back:** Let me know if extraction is working well
4. **Phase 2:** We'll add the Claude API evaluator next

## Tips

- Leave the watcher running while you casually browse Marketplace
- It's passive - won't interfere with your browsing
- Check `status.py` periodically to see what's been collected
- The database builds up over time as you browse

## File Locations

- **Database:** `./marketplace.db`
- **Browser profile:** `~/.fb-marketplace-scout-profile/`
- **Logs:** Terminal output (no file logging yet)

## Performance

- Scans DOM every 2 seconds
- Minimal CPU/memory usage
- Won't slow down your browsing
- Duplicate URLs automatically ignored
