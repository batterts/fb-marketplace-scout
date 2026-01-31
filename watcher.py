"""
FB Marketplace DOM Watcher
Connects to your existing browser session, watches for listings, extracts data
"""
import asyncio
import os
from playwright.async_api import async_playwright
from database import init_db, add_listing, get_listing_stats
import json
import sqlite3
from database import DB_PATH

# User data directory for persistent Chrome profile
USER_DATA_DIR = os.path.expanduser('~/.fb-marketplace-scout-profile')


def get_listing_evaluation(listing_url):
    """
    Get evaluation data for a listing from the database

    Returns:
        dict or None
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Normalize URL (remove query params)
        base_url = listing_url.split('?')[0]

        c.execute('''
            SELECT evaluated, flip_score, weirdness_score, scam_likelihood, notes, title, price
            FROM listings
            WHERE listing_url LIKE ?
        ''', (f'{base_url}%',))

        result = c.fetchone()
        conn.close()

        if result:
            return {
                'evaluated': result[0],
                'flip_score': result[1] or 0,
                'weirdness_score': result[2] or 0,
                'scam_likelihood': result[3] or 0,
                'notes': result[4] or '',
                'title': result[5] or '',
                'price': result[6] or ''
            }
        return None
    except Exception as e:
        print(f"⚠️  Error getting evaluation: {e}")
        return None


async def inject_overlay_if_listing_page(page):
    """
    Check if we're on a listing page and inject evaluation overlay
    """
    try:
        url = page.url
        if '/marketplace/item/' not in url:
            return

        print(f"📋 On listing page: {url}")

        # Get evaluation data
        evaluation = get_listing_evaluation(url)

        if not evaluation:
            print("   ℹ️  Listing not in database yet")
            return

        if not evaluation['evaluated']:
            # Show "pending evaluation" overlay
            await page.evaluate('''
                (function() {
                    // Remove old overlay if exists
                    const old = document.getElementById('marketplace-scout-overlay');
                    if (old) old.remove();

                    // Create overlay
                    const overlay = document.createElement('div');
                    overlay.id = 'marketplace-scout-overlay';
                    overlay.innerHTML = `
                        <div style="
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #1c1e21;
                            border: 2px solid #3a3b3c;
                            border-radius: 8px;
                            padding: 16px;
                            z-index: 999999;
                            color: #e4e6eb;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                            min-width: 300px;
                        ">
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                                🤖 Marketplace Scout
                            </div>
                            <div style="font-size: 14px; color: #b0b3b8;">
                                ⏳ Pending evaluation...
                            </div>
                            <div style="font-size: 12px; color: #8a8d91; margin-top: 8px;">
                                This listing will be scored soon
                            </div>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                })();
            ''')
            return

        # Try to get listing description from the page
        try:
            description = await page.evaluate('''
                () => {
                    // Try to find the description text on the page
                    // Look for the largest text block that's not a button or navigation
                    let longestText = '';

                    // Get all text-containing elements
                    document.querySelectorAll('div, span, p').forEach(el => {
                        const text = el.textContent?.trim() || '';
                        const parent = el.parentElement;

                        // Skip if it's a button, link, or navigation
                        if (el.tagName === 'BUTTON' || el.tagName === 'A' ||
                            parent?.tagName === 'BUTTON' || parent?.tagName === 'A' ||
                            el.getAttribute('role') === 'button') {
                            return;
                        }

                        // Skip if too short or too long
                        if (text.length < 30 || text.length > 3000) {
                            return;
                        }

                        // Skip if it contains mostly metadata (price, location, etc.)
                        if (text.match(/\\$\\d+/) && text.length < 100) {
                            return;
                        }

                        // This might be the description - keep the longest one
                        if (text.length > longestText.length) {
                            longestText = text;
                        }
                    });

                    return longestText || null;
                }
            ''')
        except:
            description = None

        # Show evaluated overlay with scores
        flip_score = evaluation['flip_score']
        weirdness_score = evaluation['weirdness_score']
        scam_likelihood = evaluation['scam_likelihood']
        notes = evaluation['notes']

        # Color coding
        flip_color = '#4caf50' if flip_score >= 7 else '#ff9800' if flip_score >= 4 else '#666'
        weirdness_color = '#9c27b0' if weirdness_score >= 7 else '#666'
        scam_color = '#f44336' if scam_likelihood >= 7 else '#ff9800' if scam_likelihood >= 4 else '#4caf50'

        overlay_html = f'''
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: #1c1e21;
                border: 2px solid #3a3b3c;
                border-radius: 8px;
                padding: 16px;
                z-index: 9999999;
                color: #e4e6eb;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                min-width: 400px;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #3a3b3c; padding-bottom: 8px;">
                    <div style="font-size: 16px; font-weight: bold;">🤖 Marketplace Scout</div>
                    <button onclick="document.getElementById('marketplace-scout-overlay').remove()" style="background: #3a3b3c; border: none; color: #e4e6eb; cursor: pointer; border-radius: 4px; padding: 4px 8px; font-size: 18px; line-height: 1;">×</button>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Flip Potential</div>
                    <div style="display: flex; align-items: center;">
                        <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="width: {flip_score * 10}%; height: 100%; background: {flip_color};"></div>
                        </div>
                        <div style="margin-left: 8px; font-weight: bold; color: {flip_color};">{flip_score}/10</div>
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Weirdness Score</div>
                    <div style="display: flex; align-items: center;">
                        <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="width: {weirdness_score * 10}%; height: 100%; background: {weirdness_color};"></div>
                        </div>
                        <div style="margin-left: 8px; font-weight: bold; color: {weirdness_color};">{weirdness_score}/10</div>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Scam Likelihood</div>
                    <div style="display: flex; align-items: center;">
                        <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="width: {scam_likelihood * 10}%; height: 100%; background: {scam_color};"></div>
                        </div>
                        <div style="margin-left: 8px; font-weight: bold; color: {scam_color};">{scam_likelihood}/10</div>
                    </div>
                </div>

                {f'<div style="background: #f44336; padding: 8px; border-radius: 4px; margin-bottom: 12px;"><div style="font-weight: bold; font-size: 14px;">⚠️ Scam Warning</div><div style="font-size: 12px; margin-top: 4px;">High scam likelihood detected!</div></div>' if scam_likelihood >= 7 else ''}

                {f'<div style="background: #2d2f31; padding: 8px; border-radius: 4px; font-size: 12px; color: #b0b3b8; margin-bottom: 12px;">{notes}</div>' if notes else ''}

                {f'<div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px; margin-bottom: 12px;"><div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 8px;">📝 Description</div><div style="font-size: 13px; color: #e4e6eb; line-height: 1.5; white-space: pre-wrap; max-height: 300px; overflow-y: auto; padding: 8px; background: #242526; border-radius: 4px;">{description[:1500]}</div></div>' if description and len(description) > 20 else ''}

                <div style="font-size: 11px; color: #8a8d91; text-align: center; margin-top: 8px;">
                    Seymour, CT • Friday pickups only
                </div>
            </div>
        '''

        await page.evaluate(f'''
            (function() {{
                // Remove old overlay if exists
                const old = document.getElementById('marketplace-scout-overlay');
                if (old) old.remove();

                // Create overlay
                const overlay = document.createElement('div');
                overlay.id = 'marketplace-scout-overlay';
                overlay.innerHTML = `{overlay_html}`;
                document.body.appendChild(overlay);

                // Prevent overlay from being removed by Facebook's DOM updates
                const observer = new MutationObserver(function(mutations) {{
                    const scoutOverlay = document.getElementById('marketplace-scout-overlay');
                    if (!scoutOverlay && document.body) {{
                        // Overlay was removed, add it back
                        const newOverlay = document.createElement('div');
                        newOverlay.id = 'marketplace-scout-overlay';
                        newOverlay.innerHTML = `{overlay_html}`;
                        document.body.appendChild(newOverlay);
                        console.log('🔄 Scout overlay restored');
                    }}
                }});

                observer.observe(document.body, {{
                    childList: true,
                    subtree: false
                }});

                console.log('✅ Scout overlay injected');
            }})();
        ''')

        print(f"   ✅ Overlay shown: Flip={flip_score}/10, Weird={weirdness_score}/10, Scam={scam_likelihood}/10")

    except Exception as e:
        print(f"⚠️  Error injecting overlay: {e}")


async def extract_listing_data(element):
    """
    Extract data from a single listing card element

    Returns:
        dict or None
    """
    try:
        # Facebook Marketplace listing structure (as of 2024)
        # These selectors may need updating if FB changes their HTML

        # Get the link (contains listing URL)
        link_element = await element.query_selector('a[href*="/marketplace/item/"]')
        if not link_element:
            return None

        listing_url = await link_element.get_attribute('href')
        # Make URL absolute
        if listing_url.startswith('/'):
            listing_url = f'https://www.facebook.com{listing_url}'

        # Extract title
        title_element = await element.query_selector('[class*="marketplace"] span')
        title = await title_element.inner_text() if title_element else None

        # Extract price
        price_element = await element.query_selector('span[class*="x193iq5w"]')
        price = await price_element.inner_text() if price_element else None

        # Extract thumbnail URL
        img_element = await element.query_selector('img')
        thumbnail_url = await img_element.get_attribute('src') if img_element else None

        # Extract seller and location (these are often in nearby text)
        # This is trickier and may require more specific selectors
        seller_name = None
        location = None

        # Try to get all text content and parse
        all_text = await element.inner_text()
        lines = [line.strip() for line in all_text.split('\n') if line.strip()]

        # Usually: [Title, Price, Location] or [Title, Price, Seller, Location]
        if len(lines) >= 3:
            location = lines[-1]  # Location is typically last
            if len(lines) >= 4:
                seller_name = lines[-2]  # Seller might be second to last

        return {
            'listing_url': listing_url,
            'title': title,
            'price': price,
            'thumbnail_url': thumbnail_url,
            'seller_name': seller_name,
            'location': location
        }

    except Exception as e:
        print(f"⚠️  Error extracting listing: {e}")
        return None


async def watch_marketplace(page):
    """
    Main watcher loop - monitors DOM for new listing cards
    """
    print("👀 Watching for new listings...")

    seen_urls = set()
    listing_count = 0

    while True:
        try:
            # Find all listing cards on the page
            # Facebook uses various container classes, this is a general selector
            listing_cards = await page.query_selector_all('a[href*="/marketplace/item/"]')

            for card in listing_cards:
                # Get parent container
                parent = await card.evaluate_handle('el => el.closest("div[role=\'article\']") || el.parentElement')

                listing_data = await extract_listing_data(parent)

                if listing_data and listing_data['listing_url'] not in seen_urls:
                    seen_urls.add(listing_data['listing_url'])

                    # Save to database
                    listing_id = add_listing(listing_data)
                    if listing_id:
                        listing_count += 1
                        print(f"📦 [{listing_count}] {listing_data['title']} - {listing_data['price']}")

            # Wait before next scan
            await asyncio.sleep(2)

        except Exception as e:
            print(f"⚠️  Watcher error: {e}")
            await asyncio.sleep(5)


async def main():
    """Launch browser and start watching"""

    # Initialize database
    print("🗄️  Initializing database...")
    init_db()

    print("\n🚀 Starting FB Marketplace Scout...")
    print(f"📁 Browser profile: {USER_DATA_DIR}")

    async with async_playwright() as p:
        # Launch persistent browser context
        # This saves cookies/session between runs
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
            args=[
                '--start-maximized',
                '--disable-blink-features=AutomationControlled'
            ]
        )

        # Get existing pages or create new one
        pages = context.pages
        if pages:
            page = pages[0]
        else:
            page = await context.new_page()

        print("\n✅ Browser launched!")
        print("📝 If this is your first time, log into Facebook")
        print("🛍️  Navigate to: https://www.facebook.com/marketplace")
        print("📜 Scroll through listings - I'll watch and save them!")
        print("⌨️  Press Ctrl+C to stop\n")

        # Monitor for listing page navigation and inject overlay
        async def on_page_load():
            await inject_overlay_if_listing_page(page)

        page.on('load', lambda: asyncio.create_task(on_page_load()))

        # Inject ad-removal code on every page
        await page.add_init_script("""
            // Hide Facebook sidebar to give more screen space
            function hideSidebar() {
                // Hide left navigation sidebar
                const leftNav = document.querySelector('div[role="navigation"]');
                if (leftNav) {
                    leftNav.style.display = 'none';
                }

                // Hide the entire left column container
                const leftColumn = document.querySelector('#mount_0_0_nC > div > div:nth-child(1) > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div.x9f619.x2lah0s.x1nhvcw1.x1qjc9v5.xozqiw3.x1q0g3np.x78zum5.x1iyjqo2.x1t2pt76.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.xeuugli.x2lah0s.x1t2pt76.x1xzczws.x1cvmir6.x1vjfegm.x1daaz14 > div');
                if (leftColumn) {
                    leftColumn.style.display = 'none';
                }

                // Also try to hide by more generic selectors
                document.querySelectorAll('div[style*="width"]').forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.width === '360px' || style.maxWidth === '360px') {
                        // This is likely a sidebar
                        el.style.display = 'none';
                    }
                });

                // Maximize main content area
                const mainContent = document.querySelector('div[role="main"]');
                if (mainContent) {
                    mainContent.style.maxWidth = '100%';
                    mainContent.style.width = '100%';
                }
            }

            // Run sidebar hiding
            hideSidebar();
            setInterval(hideSidebar, 2000);

            // Make image clicks navigate to listing page instead of showing lightbox
            document.addEventListener('click', function(e) {
                // Find if we clicked on a listing image
                let target = e.target;
                let attempts = 0;
                while (target && attempts < 10) {
                    // Check if this is an image in a marketplace listing
                    if (target.tagName === 'IMG' || target.tagName === 'A') {
                        // Find the listing URL
                        let parent = target;
                        for (let i = 0; i < 15; i++) {
                            if (parent) {
                                let link = parent.querySelector('a[href*="/marketplace/item/"]');
                                if (link) {
                                    // Found listing link - navigate to it instead
                                    let url = link.href;
                                    if (url && url.includes('/marketplace/item/')) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = url;
                                        console.log('🔗 Navigating to listing:', url);
                                        return;
                                    }
                                }
                                parent = parent.parentElement;
                            }
                        }
                    }
                    target = target.parentElement;
                    attempts++;
                }
            }, true);

            // Remove Facebook Marketplace ads (like fb-marketplace-clean)
            function removeAds() {
                // Remove "Sponsored" elements
                document.querySelectorAll('*').forEach(el => {
                    if (el.textContent.includes('Sponsored') &&
                        el.textContent.length < 100 &&
                        el.textContent.length > 0) {
                        let parent = el;
                        for (let i = 0; i < 10; i++) {
                            if (parent.parentElement) {
                                parent = parent.parentElement;
                                const rect = parent.getBoundingClientRect();
                                if (rect.height > 200 && rect.height < 600) {
                                    parent.style.display = 'none';
                                    break;
                                }
                            }
                        }
                    }
                });

                // Remove ad links
                document.querySelectorAll('a[href*="/ads/"]').forEach(el => {
                    let parent = el;
                    for (let i = 0; i < 10; i++) {
                        if (parent.parentElement) {
                            parent = parent.parentElement;
                            const rect = parent.getBoundingClientRect();
                            if (rect.height > 200 && rect.height < 600) {
                                parent.style.display = 'none';
                                break;
                            }
                        }
                    }
                });
            }

            // Run immediately and continuously
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeAds);
            } else {
                removeAds();
            }
            setInterval(removeAds, 2000);

            console.log('🚀 FB Marketplace Scout: Ad removal active');
        """)

        # Navigate to marketplace
        try:
            await page.goto('https://www.facebook.com/marketplace', timeout=10000)
        except:
            print("⚠️  Couldn't auto-navigate, please navigate to Marketplace manually")

        # Start watching
        try:
            await watch_marketplace(page)
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down...")
            stats = get_listing_stats()
            print(f"\n📊 Final Stats:")
            print(f"   Total listings saved: {stats['total']}")
            print(f"   Pending evaluation: {stats['pending']}")


if __name__ == '__main__':
    asyncio.run(main())
