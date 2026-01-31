"""
Simplified watcher - just hides sidebar and shows overlay on listings
"""
import asyncio
import os
from playwright.async_api import async_playwright
from database import init_db, add_listing, get_listing_stats, DB_PATH
import sqlite3

USER_DATA_DIR = os.path.expanduser('~/.fb-marketplace-scout-profile')


def get_listing_data(url):
    """Get listing data from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        base_url = url.split('?')[0]
        c.execute('''
            SELECT evaluated, flip_score, weirdness_score, scam_likelihood, notes, title, price
            FROM listings
            WHERE listing_url LIKE ?
        ''', (f'%{base_url.split("/")[-2]}%',))

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
    except:
        pass
    return None


async def main():
    print("🚀 Starting FB Marketplace Scout (Simple Mode)...")
    init_db()

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
        )

        pages = context.pages
        page = pages[0] if pages else await context.new_page()

        print("✅ Browser launched!")

        # Navigate to marketplace
        try:
            await page.goto('https://www.facebook.com/marketplace', timeout=10000)
        except:
            print("⚠️  Navigate to Marketplace manually")

        print("👀 Watching...")

        # Continuous loop
        last_url = ""
        while True:
            try:
                current_url = page.url

                # If URL changed and it's a listing page
                if current_url != last_url and '/marketplace/item/' in current_url:
                    print(f"\n📋 On listing: {current_url}")
                    last_url = current_url

                    # Hide sidebar
                    await page.evaluate('''
                        () => {
                            // Hide left sidebar
                            document.querySelectorAll('div').forEach(el => {
                                const style = window.getComputedStyle(el);
                                if (style.width === '360px' || style.maxWidth === '360px') {
                                    el.style.display = 'none';
                                }
                            });

                            // Hide navigation
                            const nav = document.querySelector('div[role="navigation"]');
                            if (nav) nav.style.display = 'none';
                        }
                    ''')

                    # Get description
                    description = await page.evaluate('''
                        () => {
                            // Get all text from page
                            const allText = document.body.innerText;

                            // Look for the description section
                            // Usually the longest paragraph
                            let longest = '';
                            document.querySelectorAll('div, span, p').forEach(el => {
                                const text = (el.textContent || '').trim();
                                if (text.length > 100 && text.length < 2000 && text.length > longest.length) {
                                    // Skip if it's navigation or buttons
                                    if (!text.includes('Send seller a message') &&
                                        !text.includes('Save to list')) {
                                        longest = text;
                                    }
                                }
                            });

                            return longest;
                        }
                    ''')

                    if description:
                        print(f"   📝 Description: {description[:100]}...")

                    # Get evaluation
                    evaluation = get_listing_data(current_url)

                    if evaluation and evaluation['evaluated']:
                        flip = evaluation['flip_score']
                        weird = evaluation['weirdness_score']
                        scam = evaluation['scam_likelihood']
                        notes = evaluation['notes']

                        print(f"   ✅ Scores: Flip={flip}/10, Weird={weird}/10, Scam={scam}/10")

                        # Build overlay HTML
                        desc_html = ''
                        if description and len(description) > 20:
                            # Escape single quotes
                            desc_safe = description.replace("'", "\\'").replace("`", "\\`").replace("$", "\\$")
                            desc_html = f'''
                                <div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px;">
                                    <div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 8px;">📝 Description</div>
                                    <div style="font-size: 13px; color: #e4e6eb; line-height: 1.5; max-height: 300px; overflow-y: auto; padding: 8px; background: #242526; border-radius: 4px;">{desc_safe[:1000]}</div>
                                </div>
                            '''

                        scam_warning = ''
                        if scam >= 7:
                            scam_warning = '''
                                <div style="background: #f44336; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                                    <div style="font-weight: bold; font-size: 14px;">⚠️ Scam Warning</div>
                                    <div style="font-size: 12px; margin-top: 4px;">High scam likelihood!</div>
                                </div>
                            '''

                        # Inject overlay
                        await page.evaluate(f'''
                            (() => {{
                                // Remove old
                                const old = document.getElementById('scout-overlay');
                                if (old) old.remove();

                                // Create new
                                const div = document.createElement('div');
                                div.id = 'scout-overlay';
                                div.innerHTML = `
                                    <div style="
                                        position: fixed;
                                        top: 20px;
                                        left: 20px;
                                        background: #1c1e21;
                                        border: 2px solid #3a3b3c;
                                        border-radius: 8px;
                                        padding: 16px;
                                        z-index: 999999;
                                        color: #e4e6eb;
                                        font-family: system-ui;
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                                        min-width: 400px;
                                        max-width: 500px;
                                        max-height: 90vh;
                                        overflow-y: auto;
                                    ">
                                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #3a3b3c; padding-bottom: 8px;">
                                            🤖 Marketplace Scout
                                        </div>

                                        <div style="margin-bottom: 10px;">
                                            <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Flip Potential</div>
                                            <div style="display: flex; align-items: center;">
                                                <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                    <div style="width: {flip * 10}%; height: 100%; background: #4caf50;"></div>
                                                </div>
                                                <div style="margin-left: 8px; font-weight: bold;">{flip}/10</div>
                                            </div>
                                        </div>

                                        <div style="margin-bottom: 10px;">
                                            <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Weirdness</div>
                                            <div style="display: flex; align-items: center;">
                                                <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                    <div style="width: {weird * 10}%; height: 100%; background: #9c27b0;"></div>
                                                </div>
                                                <div style="margin-left: 8px; font-weight: bold;">{weird}/10</div>
                                            </div>
                                        </div>

                                        <div style="margin-bottom: 12px;">
                                            <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Scam Risk</div>
                                            <div style="display: flex; align-items: center;">
                                                <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                    <div style="width: {scam * 10}%; height: 100%; background: {('#f44336' if scam >= 7 else '#ff9800' if scam >= 4 else '#4caf50')};"></div>
                                                </div>
                                                <div style="margin-left: 8px; font-weight: bold;">{scam}/10</div>
                                            </div>
                                        </div>

                                        {scam_warning}

                                        {desc_html}

                                        <div style="font-size: 11px; color: #8a8d91; text-align: center; margin-top: 12px;">
                                            Seymour, CT • Friday pickups only
                                        </div>
                                    </div>
                                `;
                                document.body.appendChild(div);
                            }})();
                        ''')

                        print("   ✅ Overlay shown")
                    else:
                        print("   ⏳ Not evaluated yet")

                await asyncio.sleep(1)

            except KeyboardInterrupt:
                print("\n\n👋 Shutting down...")
                break
            except Exception as e:
                print(f"⚠️  Error: {e}")
                await asyncio.sleep(2)


if __name__ == '__main__':
    asyncio.run(main())
