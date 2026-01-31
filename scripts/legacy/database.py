"""
SQLite database setup for FB Marketplace Scout
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'marketplace.db')


def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Listings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_url TEXT UNIQUE NOT NULL,
            title TEXT,
            price TEXT,
            thumbnail_url TEXT,
            seller_name TEXT,
            location TEXT,
            discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            evaluated BOOLEAN DEFAULT 0,
            evaluation_data TEXT,
            flip_score INTEGER,
            weirdness_score INTEGER,
            scam_likelihood INTEGER,
            thumbnail_phash TEXT,
            is_duplicate BOOLEAN DEFAULT 0,
            is_screenshot BOOLEAN DEFAULT 0,
            notes TEXT
        )
    ''')

    # Index for quick lookups
    c.execute('CREATE INDEX IF NOT EXISTS idx_evaluated ON listings(evaluated)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_discovered ON listings(discovered_at)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_phash ON listings(thumbnail_phash)')

    conn.commit()
    conn.close()
    print(f"✅ Database initialized at: {DB_PATH}")


def add_listing(listing_data):
    """
    Add a new listing to the database

    Args:
        listing_data (dict): {
            'listing_url': str,
            'title': str,
            'price': str,
            'thumbnail_url': str,
            'seller_name': str,
            'location': str
        }

    Returns:
        int: listing_id or None if duplicate
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        c.execute('''
            INSERT INTO listings (listing_url, title, price, thumbnail_url, seller_name, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            listing_data.get('listing_url'),
            listing_data.get('title'),
            listing_data.get('price'),
            listing_data.get('thumbnail_url'),
            listing_data.get('seller_name'),
            listing_data.get('location')
        ))
        conn.commit()
        listing_id = c.lastrowid
        print(f"✅ Added listing: {listing_data.get('title')} - ${listing_data.get('price')}")
        return listing_id
    except sqlite3.IntegrityError:
        # Duplicate listing
        return None
    finally:
        conn.close()


def get_unevaluated_listings(limit=10):
    """Get listings that haven't been evaluated yet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''
        SELECT id, listing_url, title, price, thumbnail_url, seller_name, location
        FROM listings
        WHERE evaluated = 0
        ORDER BY discovered_at DESC
        LIMIT ?
    ''', (limit,))

    results = c.fetchall()
    conn.close()

    return [
        {
            'id': r[0],
            'listing_url': r[1],
            'title': r[2],
            'price': r[3],
            'thumbnail_url': r[4],
            'seller_name': r[5],
            'location': r[6]
        }
        for r in results
    ]


def update_evaluation(listing_id, evaluation_data):
    """
    Update listing with evaluation results

    Args:
        listing_id (int): ID of the listing
        evaluation_data (dict): {
            'flip_score': int (1-10),
            'weirdness_score': int (1-10),
            'scam_likelihood': int (1-10),
            'evaluation_data': str (JSON or text),
            'notes': str
        }
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''
        UPDATE listings
        SET evaluated = 1,
            flip_score = ?,
            weirdness_score = ?,
            scam_likelihood = ?,
            evaluation_data = ?,
            notes = ?
        WHERE id = ?
    ''', (
        evaluation_data.get('flip_score'),
        evaluation_data.get('weirdness_score'),
        evaluation_data.get('scam_likelihood'),
        evaluation_data.get('evaluation_data'),
        evaluation_data.get('notes'),
        listing_id
    ))

    conn.commit()
    conn.close()
    print(f"✅ Updated evaluation for listing {listing_id}")


def get_listing_stats():
    """Get database statistics"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('SELECT COUNT(*) FROM listings')
    total = c.fetchone()[0]

    c.execute('SELECT COUNT(*) FROM listings WHERE evaluated = 1')
    evaluated = c.fetchone()[0]

    c.execute('SELECT COUNT(*) FROM listings WHERE scam_likelihood > 7')
    scams = c.fetchone()[0]

    c.execute('SELECT COUNT(*) FROM listings WHERE flip_score > 7')
    flippable = c.fetchone()[0]

    conn.close()

    return {
        'total': total,
        'evaluated': evaluated,
        'pending': total - evaluated,
        'scams': scams,
        'flippable': flippable
    }


def update_phash(listing_id, phash):
    """Store perceptual hash for an image"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('UPDATE listings SET thumbnail_phash = ? WHERE id = ?', (str(phash), listing_id))
    conn.commit()
    conn.close()


def find_duplicate_images():
    """Find listings with duplicate images (same phash)"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''
        SELECT thumbnail_phash, COUNT(*) as count, GROUP_CONCAT(id) as listing_ids
        FROM listings
        WHERE thumbnail_phash IS NOT NULL
        GROUP BY thumbnail_phash
        HAVING count > 1
    ''')

    results = c.fetchall()
    conn.close()

    return [
        {
            'phash': r[0],
            'count': r[1],
            'listing_ids': [int(x) for x in r[2].split(',')]
        }
        for r in results
    ]


if __name__ == '__main__':
    # Initialize database
    init_db()

    # Print stats
    stats = get_listing_stats()
    print(f"\n📊 Database Stats:")
    print(f"   Total listings: {stats['total']}")
    print(f"   Evaluated: {stats['evaluated']}")
    print(f"   Pending: {stats['pending']}")
    print(f"   Scams detected: {stats['scams']}")
    print(f"   Flippable items: {stats['flippable']}")
