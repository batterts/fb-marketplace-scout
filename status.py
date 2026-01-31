#!/usr/bin/env python3
"""
Show current status of FB Marketplace Scout database
"""
import sqlite3
import os
from database import DB_PATH, get_listing_stats

def show_recent_listings(limit=10):
    """Show most recently discovered listings"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''
        SELECT title, price, location, discovered_at, listing_url
        FROM listings
        ORDER BY discovered_at DESC
        LIMIT ?
    ''', (limit,))

    results = c.fetchall()
    conn.close()

    return results


def main():
    if not os.path.exists(DB_PATH):
        print("❌ Database not found. Run `python3 database.py` to initialize.")
        return

    print("📊 FB Marketplace Scout Status\n")
    print("=" * 70)

    # Get stats
    stats = get_listing_stats()
    print(f"\n📦 Listings:")
    print(f"   Total discovered: {stats['total']}")
    print(f"   Evaluated: {stats['evaluated']}")
    print(f"   Pending evaluation: {stats['pending']}")
    print(f"   Scams detected: {stats['scams']}")
    print(f"   Flippable items: {stats['flippable']}")

    # Show recent listings
    print(f"\n🕐 Recent Discoveries:\n")
    recent = show_recent_listings(10)

    if not recent:
        print("   No listings yet. Start the watcher!")
    else:
        for i, listing in enumerate(recent, 1):
            title, price, location, discovered_at, url = listing
            print(f"   {i}. {title}")
            print(f"      💰 {price} | 📍 {location or 'Unknown'}")
            print(f"      🕐 {discovered_at}")
            print(f"      🔗 {url}")
            print()

    print("=" * 70)
    print("\n💡 Commands:")
    print("   python3 watcher.py      - Start watching marketplace")
    print("   python3 status.py       - Show this status")
    print("   python3 database.py     - Reinitialize database")
    print()


if __name__ == '__main__':
    main()
