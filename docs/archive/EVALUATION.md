# Evaluation Modes

The Scout browser automatically evaluates listings when you click them. Three evaluation methods are available, tried in order:

## 1. Anthropic API (Best Quality)

**Pros:** Most accurate, understands context, best scam detection
**Cons:** Requires API key, costs ~$0.001 per listing
**Setup:**

```bash
export ANTHROPIC_API_KEY='sk-ant-...'
./start-scout.sh
```

Get your key: https://console.anthropic.com/settings/keys

## 2. Ollama (Free, Local)

**Pros:** Free, runs locally, private, good quality
**Cons:** Requires installation and model download
**Setup:**

```bash
# Start Ollama server
ollama serve

# In another terminal, download model (one-time, ~2GB)
ollama pull llama3.2

# Now start scout
./start-scout.sh
```

Ollama will be used automatically if the server is running.

## 3. Heuristic (Always Works)

**Pros:** Instant, no setup, no cost
**Cons:** Basic keyword matching, less accurate
**How it works:** Automatically used if Anthropic and Ollama aren't available

Uses keyword detection:
- **Flip boosters:** vintage, rare, estate, bulk, test equipment, free
- **Weirdness:** tube, oscilloscope, darkroom, reel-to-reel, military
- **Scam flags:** iPhone/MacBook under $200, no location, payment app mentions

## Current Status

Run the scout browser and click a listing. Console will show which method is used:

```
📋 Evaluating: Vintage Oscilloscope
   ✅ Anthropic: Flip=8 Weird=9 Scam=2
```

Or:

```
📋 Evaluating: Vintage Oscilloscope
   ✅ Ollama: Flip=8 Weird=9 Scam=2
```

Or:

```
📋 Evaluating: Vintage Oscilloscope
   ✅ Heuristic: Flip=8 Weird=9 Scam=2
```

## Recommendations

**For best results:** Use Anthropic API (set `ANTHROPIC_API_KEY`)
**For free option:** Install and run Ollama
**For quick testing:** Just use heuristic (works out of the box)

## Evaluation Happens Automatically

Every listing you click is evaluated immediately if it hasn't been evaluated before. No need to run a separate evaluator process!

The overlay shows results instantly.
