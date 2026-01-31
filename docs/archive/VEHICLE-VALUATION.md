# 🚗 Vehicle Valuation Feature

The Scout now automatically detects vehicle listings and compares asking price vs estimated value!

## How It Works

### 1. Vehicle Detection

Detects cars/trucks based on:
- **Brand names:** Toyota, Honda, Ford, Subaru, etc. (25+ brands)
- **Vehicle types:** sedan, SUV, truck, crossover, etc.

### 2. Information Extraction

Automatically extracts:
- **Year:** 1990-2026 (4-digit pattern)
- **Make:** Brand name (Subaru, Honda, etc.)
- **Mileage:** Recognizes formats like "120k", "120,000 miles", "120000"

### 3. Value Estimation

Uses depreciation curves:
- **Year 0:** -20% (new car depreciation)
- **Year 1:** -15% additional
- **Year 2:** -12% additional
- **Year 3+:** -10% per year

**Mileage adjustment:**
- Expected: 13k miles/year
- Excess mileage: -$0.10/mile in value
- Low mileage: +$0.10/mile in value

### 4. Deal Classification

- **Great Deal (<70% of value):** +4 flip score
- **Good Deal (<85% of value):** +2 flip score
- **Fair Price (85-120%):** No adjustment
- **Overpriced (>120%):** -1 flip, +1 scam

## Example Output

When you click on a car listing:

```
🔍 New listing detected: 1234567890
   Title: 2015 Subaru Crosstrek 2.0i Limited Sport Utility 4D
   Price: $8,500
   Location: Naugatuck, CT
   Description: Clean title, well maintained, 120k miles...
📋 Evaluating: 2015 Subaru Crosstrek 2.0i Limited Sport Utility 4D
   ✅ Heuristic: Flip=5 Weird=3 Scam=2
   Notes: Fair price at 98% of est. value ($8,670) | 2015 Subaru | 120k mi
```

**Overlay will show:**
```
┌─────────────────────────────────┐
│ 🤖 Marketplace Scout            │
├─────────────────────────────────┤
│ Flip Potential: 5/10            │
│ Weirdness: 3/10                 │
│ Scam Risk: 2/10                 │
│                                 │
│ 📝 Notes:                       │
│ Fair price at 98% of est. value │
│ ($8,670) | 2015 Subaru | 120k mi│
└─────────────────────────────────┘
```

## Test It

Run the test script to see valuation examples:

```bash
node test-vehicle-valuation.js
```

**Test cases:**
- 2015 Subaru Crosstrek 120k mi @ $8,500 → Fair price (98%)
- 2018 Honda Civic 45k mi @ $15,000 → Fair price (115%)
- 2010 Toyota Camry 180k mi @ $4,500 → Fair price (87%)
- 2020 Tesla Model 3 35k mi @ $32,000 → Overpriced (207%)

## Limitations

⚠️ **Important:** These are rough estimates based on:
- Average new car price baseline ($35k)
- Standard depreciation curves
- Mileage-based adjustments

**Not considered:**
- Vehicle condition (clean vs salvage title)
- Options/trim levels
- Market demand
- Regional pricing
- Luxury/performance vehicles (Tesla, BMW, etc. may be undervalued)
- Collision history
- Maintenance records

**Best used as a rough filter for deals that are significantly underpriced!**

## When It Triggers

Only for listings that:
- ✅ Contain car brand names or vehicle types
- ✅ Have a year (1990-2026)
- ✅ Price > $500 (filters out parts/accessories)

## Supported Brands

Toyota, Honda, Ford, Chevy, Nissan, Subaru, Mazda, Hyundai, Kia, BMW, Mercedes, Audi, Volkswagen, Jeep, Dodge, RAM, GMC, Buick, Cadillac, Lexus, Acura, Infiniti, Volvo, Tesla, Mini

## Try It Live

```bash
./test-scout.sh
```

Navigate to a car listing and watch it automatically detect and value the vehicle!

## Example: Great Deal Detection

If you find:
**"2018 Honda Accord 60k miles - $10,000"**

And estimated value is ~$15,000:

```
   ✅ Heuristic: Flip=7 Weird=3 Scam=2
   Notes: Great deal! Asking 67% of est. value ($15,200) | 2018 Honda | 60k mi
```

**Flip score boosted to 7** - worth checking out!
