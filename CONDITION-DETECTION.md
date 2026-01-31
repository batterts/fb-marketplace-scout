# 🔧 Vehicle Condition Detection

The Scout now detects damage and condition issues when valuing vehicles!

## Problem

A 2021 Ford F-150 with transmission damage was showing as:
```
Great deal! Asking 49% of est. value ($15,309)
```

But **transmission damage** drops the value significantly - it's not actually a great deal!

## Solution: Condition-Adjusted Valuation

### Detectable Issues

**Major drivetrain:**
- Transmission damage/issues/needs work
- Engine damage/blown/seized/needs rebuild

**Title problems:**
- Salvage title
- Rebuilt title
- Flood damage

**Mechanical:**
- Not running / won't start
- Frame damage / serious rust
- Needs major repair

**Other:**
- As-is / parts only

### Value Adjustments

| Issue | Value Multiplier | Notes |
|-------|-----------------|-------|
| **Salvage title** | 50% | Branded titles hurt resale |
| **Not running** | 40% | Major reduction |
| **Transmission issues** | 70% | $3k-$5k repair typically |
| **Engine issues** | 60% | $4k-$10k+ repair |
| **Each additional issue** | 85% | Stacks multiplicatively |

### Example: 2021 Ford F-150 with Transmission Damage

**Without condition detection:**
```
Estimated value: $15,309
Asking price: $7,500 (49%)
Result: "Great deal!" ⭐⭐⭐
```

**With condition detection:**
```
Condition issues: transmission damage, not running
Adjusted value: $4,287 (70% × 40% of clean value)
Asking price: $7,500 (175%)
Result: "Overpriced even with damage" ⚠️
```

**Notes field:**
```
Fair price at 175% of est. value ($4,287) ⚠️ HAS: not running, transmission damage | 2021 Ford
```

## How It Works

### 1. Pattern Matching

Scans title + description for damage keywords:
```javascript
transmission (damage|bad|needs|issue|slipping)
engine (damage|blown|seized|knock)
salvage|rebuilt title|flood damage
not running|won't start|needs work
```

### 2. Value Adjustment

Multiplies base value by condition factors:
```
Clean value: $15,309
× Transmission (70%): $10,716
× Not running (40%): $4,287
= Adjusted value: $4,287
```

### 3. Smart Scoring

- **Flip score:** Reduced for damaged vehicles (harder to flip)
- **Scam score:** Increased if price doesn't reflect damage
- **Notes:** Shows warnings about detected issues

## Test Results

Run the test:
```bash
node test-transmission-damage.js
```

**Output:**
```
1. 2021 Ford F-150 - Transmission needs work
   Price: $7,500

   ⚠️  Issues detected: transmission, notRunning

   💰 Valuation (condition-adjusted):
      Estimated value: $4,287
      Asking price: 175% of estimated value
      ⚠️  Overpriced even with damage

2. 2021 Ford F-150 - Excellent condition
   Price: $35,000

   ✅ No major issues detected

   💰 Valuation (assuming clean):
      Estimated value: $15,309
      Asking price: 229% of estimated value
```

## In the Overlay

When you click a damaged vehicle listing:

```
┌─────────────────────────────────────┐
│ 🤖 Marketplace Scout            [×] │
├─────────────────────────────────────┤
│ Flip Potential: 2/10                │ ← Reduced (damaged)
│ Weirdness: 3/10                     │
│ Scam Risk: 5/10                     │ ← Increased (price vs condition)
│                                     │
│ 📝 Notes                            │
│ Fair price at 175% of est. value    │
│ ($4,287) ⚠️ HAS: not running,       │
│ transmission damage | 2021 Ford     │
└─────────────────────────────────────┘
```

## Benefits

✅ **Realistic valuations** - Accounts for damage/condition
✅ **Scam prevention** - Flags vehicles overpriced for their condition
✅ **Clear warnings** - Shows detected issues in notes
✅ **Smart scoring** - Adjusts flip/scam scores appropriately
✅ **Prevents bad deals** - Won't call damaged vehicles "great deals" unless price reflects it

## Limitations

⚠️ Can only detect issues **mentioned in title/description**
⚠️ Hidden problems won't be caught
⚠️ Value adjustments are estimates (repair costs vary)
⚠️ Doesn't replace inspection - always check in person!

## Try It Live

```bash
./start-scout.sh
```

Click on a vehicle listing with damage mentioned and watch the condition detection work!

**Example searches:**
- "transmission needs work"
- "salvage title"
- "not running"
- "engine problems"

The overlay will now show realistic valuations with condition warnings! 🚗🔧
