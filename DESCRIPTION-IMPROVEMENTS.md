# Description Extraction Improvements

## Problem

The description extraction was capturing Facebook's message templates instead of the actual listing description:
```
"Hello, is this still available?Hello, is this still available?..."
```

## Solutions Applied

### 1. Filter Out Facebook UI Templates

Added exclusions for common Facebook interface text:
- ❌ `"Hello, is this still available?"`
- ❌ `"Is this available?"`
- ❌ `"Ask for details"`
- ❌ `"Make offer"`
- ❌ `"You can negotiate"`
- ❌ `"Listed X days/hours/minutes ago"`

### 2. Detect Repetitive Text

Added check for text that repeats itself (like the doubled "Hello, is this..." example):

```javascript
// Skip if text is repetitive
const firstHalf = text.substring(0, text.length / 2);
const secondHalf = text.substring(text.length / 2);
const isRepetitive = firstHalf.length > 20 && firstHalf === secondHalf;
```

This catches patterns like: `"Hello, is this...Hello, is this..."`

### 3. Meta Description Fallback

If no description is found on the page (or it's too short), try Facebook's OpenGraph meta tag:

```javascript
// Fallback to <meta property="og:description">
if (!description || description.length < 20) {
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    description = ogDesc.getAttribute('content');
  }
}
```

### 4. Applied to Both Extraction Points

These improvements are applied in:
1. **Initial evaluation** (when extracting data for AI scoring)
2. **Overlay display** (when showing description in the overlay)

## Testing

Run test mode to see the improvements:

```bash
./test-scout.sh
```

**Before:**
```
   Description: Hello, is this still available?Hello, is this still available?...
```

**After:**
```
   Description: Polaroid color i-type film. 96 total photos (8 packs). Exp 05/2024...
```

## Debug Output

If extraction still fails, you'll see debug info showing what candidates were found:

```
   🔍 DEBUG INFO:
   Description candidates: "Actual listing description..." (len=150, children=2, score=130)
```

This helps identify if:
- ✅ Description was found successfully
- ⚠️ Description is too short (< 50 chars)
- ❌ No description found (will try meta tag fallback)

## Summary

The description extractor now:
- ✅ Ignores Facebook UI text and message templates
- ✅ Skips repetitive text patterns
- ✅ Falls back to meta tags if needed
- ✅ Shows debug info when extraction partially fails
- ✅ Applied consistently for evaluation and display

Try it now: `./test-scout.sh`
