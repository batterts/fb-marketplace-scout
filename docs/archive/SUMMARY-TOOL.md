# 📊 Summary Tool - Database Query & Export

Quick way to search and review all listings saved in your database.

## Basic Usage

**Search for specific items:**
```bash
./summary.sh "2019 Subaru"
./summary.sh "Tacoma"
./summary.sh "furniture"
```

**Show all listings:**
```bash
./summary.sh --all
```

**Show only evaluated listings:**
```bash
./summary.sh "Toyota" --evaluated
```

## Filters

**Show good deals (flip score >= 7):**
```bash
./summary.sh --deals
```

**Show potential scams (scam risk >= 7):**
```bash
./summary.sh --scams
```

**Limit results:**
```bash
./summary.sh "Subaru" --limit 10
```

## Sorting

**Sort by price (low to high):**
```bash
./summary.sh "vehicles" --sort price
```

**Sort by flip potential:**
```bash
./summary.sh --all --sort flip
```

**Sort by scam risk:**
```bash
./summary.sh --all --sort scam
```

**Sort by date (newest first - default):**
```bash
./summary.sh --all --sort date
```

## CSV Export

**Export to CSV (pipe to file):**
```bash
./summary.sh "Tacoma" --csv > tacoma-listings.csv
```

**Export all deals:**
```bash
./summary.sh --deals --csv > deals.csv
```

**Export all evaluated listings:**
```bash
./summary.sh --all --evaluated --csv > all-evaluated.csv
```

Then open in Excel/Google Sheets!

## Output Format

### Console Output

```
==================================================
🔍 Found 12 listings matching "2016 Tacoma"
==================================================

1.  2016 Toyota Tacoma Double Cab Limited - Clean Title
    💰 $20,000      📍 Waterbury, CT
    💎 Flip: 8/10    Weird: 2/10     Scam: 1/10
    📝 Fair price at 95% of market ($21k from 8 comparables)
    📄 Well maintained truck with new tires and recent service...
    🔗 https://www.facebook.com/marketplace/item/123456789

2.  2016 Toyota Tacoma TRD Sport
    💰 $22,500      📍 Hartford, CT
    Flip: 5/10      Weird: 3/10     Scam: 2/10
    📝 Slightly overpriced at 107% of market
    📄 Original owner, garage kept, all service records...
    🔗 https://www.facebook.com/marketplace/item/987654321

...
```

### CSV Output

```csv
Title,Price,Location,Flip Score,Weirdness,Scam Risk,Notes,URL
"2016 Toyota Tacoma Double Cab","20000","Waterbury, CT",8,2,1,"Fair price at 95% of market","https://..."
"2016 Toyota Tacoma TRD Sport","22500","Hartford, CT",5,3,2,"Slightly overpriced","https://..."
```

## Examples

**Find all 2019 Subarus:**
```bash
./summary.sh "2019 Subaru"
```

**Find all Tacomas sorted by price:**
```bash
./summary.sh "Tacoma" --sort price
```

**Find top 10 deals:**
```bash
./summary.sh --deals --limit 10
```

**Export all vehicles to spreadsheet:**
```bash
./summary.sh "vehicle" --evaluated --csv > vehicles.csv
```

**Find potential scams in furniture category:**
```bash
./summary.sh "furniture" --scams
```

## Search Tips

- **Year, make, model**: Search by any combination
  - `"2016 Tacoma"` - finds all 2016 Tacomas
  - `"Toyota"` - finds all Toyota listings
  - `"2019"` - finds all 2019 vehicles

- **Keywords**: Search title and description
  - `"transmission damage"` - finds damaged vehicles
  - `"clean title"` - finds listings mentioning clean title
  - `"low miles"` - finds low mileage claims

- **Categories**: Search by item type
  - `"furniture"`
  - `"electronics"`
  - `"bike"`

## Symbols Guide

- 💎 = Great deal (flip score >= 7)
- ⚠️ = Potential scam (scam risk >= 7)
- 💰 = Price
- 📍 = Location
- 📝 = Scout notes
- 📄 = Description preview
- 🔗 = URL
- ⏳ = Not evaluated yet

## Use Cases

**1. Research comparable prices:**
```bash
./summary.sh "2016 Tacoma" --evaluated
```
Review all Tacomas you've scouted with pricing data.

**2. Track good deals:**
```bash
./summary.sh --deals --csv > deals-$(date +%Y%m%d).csv
```
Daily export of deals to spreadsheet.

**3. Review scam patterns:**
```bash
./summary.sh --scams
```
See what triggered scam warnings.

**4. Build pricing database:**
```bash
./summary.sh "Civic" --evaluated --sort price
```
See price range for specific models.

**5. Export for analysis:**
```bash
./summary.sh --all --evaluated --csv > full-database.csv
```
Export everything for Excel analysis.

## Database Growth

As you browse marketplace and click listings:
- All listings get saved automatically
- Scout evaluates each one
- Comparable pricing caches vehicle data
- Database becomes comprehensive pricing book

**Query anytime to leverage your research!**

```bash
# After browsing for a week
./summary.sh --all --evaluated
# Shows: 150+ evaluated listings

# After a month
./summary.sh "Tacoma" --evaluated
# Shows: All Tacomas you've seen with accurate pricing data

# Export for tax/business records
./summary.sh --all --deals --csv > flips-2026.csv
```

## Tips

- Use `--evaluated` to only see listings you've clicked on
- Use `--sort price` to find cheapest options
- Use `--deals` to quickly spot underpriced items
- Use `--csv` to export for spreadsheet analysis
- Search by damage keywords to find fixers: `"needs transmission"`
- Track market trends over time with exports

Your database grows smarter with every listing you view! 🚀
