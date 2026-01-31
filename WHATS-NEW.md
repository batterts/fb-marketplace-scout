# What's New - Instant Evaluation

## Major Update: Automatic Evaluation on Click

**Before:** You had to run a separate evaluator process that scored listings in the background.

**Now:** Every listing is evaluated **instantly** when you click it!

## How It Works

1. You click a listing
2. Scout extracts: title, price, description, location
3. Scout evaluates it using:
   - **Anthropic API** (if you set `ANTHROPIC_API_KEY`)
   - **Ollama** (if server is running)
   - **Heuristic** (keyword-based, always works)
4. Scores saved to database
5. Overlay appears immediately

## Console Output

You'll see this when clicking a new listing:

```
🔍 New listing detected: 904527858896077
   Title: Tandy DMP-130A Dot Matrix Printer
   Price: $40
   Location: Naugatuck, CT
📋 Evaluating: Tandy DMP-130A Dot Matrix Printer
   ✅ Heuristic: Flip=6 Weird=7 Scam=2
```

## Evaluation Priority

Tries methods in order until one works:

1. **Anthropic API** - Best quality, requires key
2. **Ollama** - Free, local, requires setup
3. **Heuristic** - Instant, always works

## Setup (Optional)

**For Anthropic API (best quality):**
```bash
export ANTHROPIC_API_KEY='sk-ant-...'
./start-scout.sh
```

**For Ollama (free, local):**
```bash
# Terminal 2
ollama serve

# Terminal 3 (one-time)
ollama pull llama3.2

# Terminal 1
./start-scout.sh
```

**For Heuristic (default):**
```bash
./start-scout.sh
# Just works! No setup needed.
```

## Benefits

✅ **Instant results** - No waiting for background evaluator
✅ **No separate process** - One command to start
✅ **Three quality levels** - Choose your trade-off
✅ **Always works** - Heuristic fallback guaranteed
✅ **Smart caching** - Already evaluated listings load instantly

## Files Changed

- `scout-browser.js` - Now calls evaluator on each listing
- `evaluator.js` - New Node.js evaluator module with 3 methods
- `START-HERE.md` - Updated instructions
- `EVALUATION.md` - New guide explaining evaluation modes

## Old Evaluator Still Works

The Python evaluator (`./run-evaluator.sh`) still works if you want to batch-score the 1,800+ listings already in the database.

But for normal browsing, you don't need it anymore!

## Try It Now

```bash
cd /Users/shaun.batterton/code/fb-marketplace-scout
./start-scout.sh
```

Click any listing and watch it get evaluated instantly! 🚀
