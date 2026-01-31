"""
Background evaluator for FB Marketplace Scout
Pulls unevaluated listings and scores them using Claude API (or simple heuristics for now)
"""
import time
import random
import sqlite3
from database import DB_PATH, get_unevaluated_listings, update_evaluation
import os

# Check if Claude API key is available
CLAUDE_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
USE_CLAUDE = CLAUDE_API_KEY is not None

if USE_CLAUDE:
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=CLAUDE_API_KEY)
        print("✅ Claude API key found - using AI evaluation")
    except ImportError:
        USE_CLAUDE = False
        print("⚠️  anthropic package not installed - using heuristic evaluation")
else:
    print("ℹ️  No ANTHROPIC_API_KEY found - using heuristic evaluation")
    print("   To use AI evaluation: export ANTHROPIC_API_KEY='your-key'")


def evaluate_with_claude(listing):
    """Use Claude API to evaluate a listing"""
    try:
        prompt = f"""You are evaluating a Facebook Marketplace listing for flip potential.

Item: {listing['title']}
Price: {listing['price']}
Location: {listing['location']}
Seller: {listing['seller_name']}

User interests: electronics, film/darkroom gear, test equipment, weird items, bulk lots
User location: Seymour, CT (prefers local pickup)

Rate 1-10:
1. Flip potential (resale value vs price, demand)
2. Weirdness score (unique, interesting, unusual)
3. Scam likelihood (price too low, generic description, red flags)

Respond ONLY with JSON:
{{
  "flip_score": X,
  "weirdness_score": X,
  "scam_likelihood": X,
  "notes": "one sentence explanation"
}}"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse response
        import json
        result = json.loads(response.content[0].text)

        return {
            'flip_score': result['flip_score'],
            'weirdness_score': result['weirdness_score'],
            'scam_likelihood': result['scam_likelihood'],
            'evaluation_data': response.content[0].text,
            'notes': result['notes']
        }

    except Exception as e:
        print(f"   ⚠️  Claude API error: {e}")
        return None


def evaluate_with_heuristics(listing):
    """Simple heuristic evaluation (fallback when no API key)"""
    title = (listing['title'] or '').lower()
    price = listing['price'] or ''
    location = listing['location'] or ''

    # Extract price number
    price_num = 0
    try:
        price_num = float(''.join(c for c in price if c.isdigit() or c == '.'))
    except:
        pass

    # Flip potential heuristics
    flip_score = 5  # default
    if any(word in title for word in ['vintage', 'antique', 'rare', 'estate']):
        flip_score += 2
    if any(word in title for word in ['bulk', 'lot of', 'collection']):
        flip_score += 1
    if price_num > 0 and price_num < 50:
        flip_score += 1
    if 'free' in title or price_num == 0:
        flip_score += 2

    # Weirdness score heuristics
    weirdness_score = 3  # default
    if any(word in title for word in ['tube', 'oscilloscope', 'darkroom', 'enlarger', 'film']):
        weirdness_score += 4
    if any(word in title for word in ['weird', 'strange', 'unusual', 'unique']):
        weirdness_score += 3
    if any(word in title for word in ['for parts', "doesn't work", 'broken']):
        weirdness_score += 2

    # Scam likelihood heuristics
    scam_likelihood = 2  # default low
    if price_num > 0 and price_num < 10 and 'free' not in title:
        scam_likelihood += 3  # suspiciously cheap
    if any(word in title for word in ['iphone', 'macbook', 'airpods', 'ps5', 'xbox']) and price_num < 200:
        scam_likelihood += 5  # expensive items too cheap
    if not location or 'unknown' in location.lower():
        scam_likelihood += 1

    # Cap scores at 10
    flip_score = min(10, max(1, flip_score))
    weirdness_score = min(10, max(1, weirdness_score))
    scam_likelihood = min(10, max(1, scam_likelihood))

    # Generate notes
    notes_parts = []
    if flip_score >= 7:
        notes_parts.append("Good flip potential")
    if weirdness_score >= 7:
        notes_parts.append("Interesting/unique item")
    if scam_likelihood >= 7:
        notes_parts.append("⚠️ Possible scam")
    elif scam_likelihood >= 4:
        notes_parts.append("Check carefully")

    notes = ". ".join(notes_parts) if notes_parts else "Standard listing"

    return {
        'flip_score': flip_score,
        'weirdness_score': weirdness_score,
        'scam_likelihood': scam_likelihood,
        'evaluation_data': 'heuristic',
        'notes': notes
    }


def evaluate_listing(listing):
    """Evaluate a listing using Claude or heuristics"""
    if USE_CLAUDE:
        result = evaluate_with_claude(listing)
        if result:
            return result

    # Fallback to heuristics
    return evaluate_with_heuristics(listing)


def run_evaluator():
    """Main evaluation loop"""
    print("🤖 FB Marketplace Scout Evaluator")
    print("=" * 60)
    print(f"Mode: {'AI (Claude)' if USE_CLAUDE else 'Heuristics'}")
    print("=" * 60)
    print()

    evaluated_count = 0

    while True:
        try:
            # Get unevaluated listings
            listings = get_unevaluated_listings(limit=5)

            if not listings:
                print("⏸️  No pending listings. Waiting 30s...")
                time.sleep(30)
                continue

            for listing in listings:
                print(f"\n📋 Evaluating: {listing['title']}")
                print(f"   💰 {listing['price']} | 📍 {listing['location']}")

                # Evaluate
                evaluation = evaluate_listing(listing)

                if evaluation:
                    # Update database
                    update_evaluation(listing['id'], evaluation)
                    evaluated_count += 1

                    print(f"   ✅ Flip: {evaluation['flip_score']}/10 | "
                          f"Weird: {evaluation['weirdness_score']}/10 | "
                          f"Scam: {evaluation['scam_likelihood']}/10")
                    print(f"   📝 {evaluation['notes']}")

                    # Random delay between evaluations (30s - 5min)
                    delay = random.randint(30, 300)
                    print(f"   ⏱️  Next evaluation in {delay}s...")
                    time.sleep(delay)
                else:
                    print("   ⚠️  Evaluation failed, skipping")

        except KeyboardInterrupt:
            print(f"\n\n👋 Stopping evaluator...")
            print(f"📊 Total evaluated: {evaluated_count}")
            break
        except Exception as e:
            print(f"⚠️  Error: {e}")
            time.sleep(10)


if __name__ == '__main__':
    run_evaluator()
