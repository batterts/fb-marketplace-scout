# Fresh Start Guide

If you want to start with a clean database or are setting up Scout for the first time:

## Quick Start

```bash
# 1. Stop Docker (if running)
docker compose down

# 2. Remove old database
rm marketplace.db

# 3. Initialize fresh database
node init-database.js

# 4. Start Scout
docker compose up -d

# Or without Docker:
./scout.sh
```

## What Gets Created

The `init-database.js` script creates two tables:

### 1. evaluations
Stores evaluated listings with:
- Basic info: title, price, description, location, URL
- Scores: flip_score, weirdness_score, scam_likelihood
- Vehicle data: year, make, model, mileage
- Timestamps: evaluated_at, discovered_at

### 2. comparable_pricing
Stores cached pricing data for vehicles:
- Search key (normalized year/make/model)
- Price array (all comparable prices found)
- Listings array (full listing details with URLs)
- Stats: median, min, max, sample count
- Last updated timestamp

## Why Start Fresh?

Starting fresh is useful when:
- Testing new scraping/evaluation logic
- Database schema changed significantly
- You want to clear out old/incorrect data
- Setting up a new installation

## Database Location

The database file is created at:
```
/path/to/fb-marketplace-scout/marketplace.db
```

It's a standard SQLite3 database, so you can inspect it directly:
```bash
sqlite3 marketplace.db
.tables
.schema evaluations
SELECT * FROM evaluations LIMIT 5;
.quit
```

## After Fresh Start

1. **Launch browser** - Click "Launch Browser" in the web UI
2. **Browse listings** - Navigate Facebook Marketplace
3. **Click a listing** - Scout evaluates it instantly
4. **Check inventory** - View results in Inventory tab
5. **View analytics** - See pricing data for vehicles

The database will populate as you browse and click listings!

## Troubleshooting

**"Permission denied" when removing marketplace.db:**
- Docker is still running - run `docker compose down` first
- Or: `pkill -f node` to stop all node processes

**Database directory created instead of file:**
- This was a bug - fixed in latest version
- Make sure you have the latest `init-database.js`

**Tables not found:**
- Run `node init-database.js` before starting Scout
- Check that marketplace.db exists: `ls -lh marketplace.db`

## No Migration Needed

Going forward, we're **not** migrating old data. The scraping logic has been fixed at the source:

✅ Model extraction works for new evaluations
✅ Comparable listings saved with full details
✅ Fresh data will be clean and complete

Just start fresh and rebuild data as you browse!
