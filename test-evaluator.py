#!/usr/bin/env python3
"""
Test the evaluator with sample data
"""
from database import add_listing, get_unevaluated_listings, get_listing_stats
from evaluator import evaluate_listing

# Sample test listings
test_listings = [
    {
        'listing_url': 'https://www.facebook.com/marketplace/item/test1',
        'title': 'Vintage Oscilloscope for parts',
        'price': '$35',
        'thumbnail_url': 'http://example.com/img1.jpg',
        'seller_name': 'John Doe',
        'location': 'Hartford, CT'
    },
    {
        'listing_url': 'https://www.facebook.com/marketplace/item/test2',
        'title': 'Darkroom Enlarger Complete Set',
        'price': '$150',
        'thumbnail_url': 'http://example.com/img2.jpg',
        'seller_name': 'Jane Smith',
        'location': 'New Haven, CT'
    },
    {
        'listing_url': 'https://www.facebook.com/marketplace/item/test3',
        'title': 'iPhone 15 Pro Max Brand New',
        'price': '$50',
        'thumbnail_url': 'http://example.com/img3.jpg',
        'seller_name': 'Unknown',
        'location': 'Unknown'
    },
    {
        'listing_url': 'https://www.facebook.com/marketplace/item/test4',
        'title': 'Bulk Electronics Lot - Tubes, Transistors, Parts',
        'price': '$25',
        'thumbnail_url': 'http://example.com/img4.jpg',
        'seller_name': 'Estate Sale',
        'location': 'Seymour, CT'
    }
]

print("🧪 Testing FB Marketplace Scout Evaluator\n")
print("=" * 60)

# Add test listings
print("\n1. Adding test listings to database...")
for listing in test_listings:
    listing_id = add_listing(listing)
    if listing_id:
        print(f"   ✅ Added: {listing['title']}")
    else:
        print(f"   ⚠️  Duplicate: {listing['title']}")

# Check stats
print("\n2. Database stats:")
stats = get_listing_stats()
print(f"   Total: {stats['total']}")
print(f"   Pending: {stats['pending']}")

# Get unevaluated listings
print("\n3. Getting unevaluated listings...")
unevaluated = get_unevaluated_listings(limit=10)
print(f"   Found {len(unevaluated)} listings to evaluate")

# Evaluate each one
print("\n4. Running evaluations...")
from database import update_evaluation

for listing in unevaluated:
    print(f"\n   📋 {listing['title']}")
    print(f"      💰 {listing['price']} | 📍 {listing['location']}")

    evaluation = evaluate_listing(listing)

    if evaluation:
        update_evaluation(listing['id'], evaluation)
        print(f"      ✅ Flip: {evaluation['flip_score']}/10 | "
              f"Weird: {evaluation['weirdness_score']}/10 | "
              f"Scam: {evaluation['scam_likelihood']}/10")
        print(f"      📝 {evaluation['notes']}")
    else:
        print("      ⚠️  Evaluation failed")

# Final stats
print("\n5. Final stats:")
stats = get_listing_stats()
print(f"   Total: {stats['total']}")
print(f"   Evaluated: {stats['evaluated']}")
print(f"   Pending: {stats['pending']}")
print(f"   Scams detected: {stats['scams']}")
print(f"   Flippable items: {stats['flippable']}")

print("\n" + "=" * 60)
print("✅ Test complete!")
print("\nNow try:")
print("  ./run.sh              # Start the watcher")
print("  ./run-evaluator.sh    # Start the evaluator")
print()
