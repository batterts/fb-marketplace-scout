"""
Direct manipulation version - runs checks every second
"""
import asyncio
import os
from playwright.async_api import async_playwright
from database import init_db, DB_PATH
import sqlite3

USER_DATA_DIR = os.path.expanduser('~/.fb-marketplace-scout-profile')


def get_evaluation(url):
    """Get evaluation from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Extract item ID from URL
        if '/marketplace/item/' in url:
            item_id = url.split('/marketplace/item/')[1].split('/')[0].split('?')[0]

            c.execute('''
                SELECT evaluated, flip_score, weirdness_score, scam_likelihood, notes, title, price
                FROM listings
                WHERE listing_url LIKE ?
            ''', (f'%{item_id}%',))

            result = c.fetchone()
            conn.close()

            if result:
                return {
                    'evaluated': result[0],
                    'flip': result[1] or 0,
                    'weird': result[2] or 0,
                    'scam': result[3] or 0,
                    'notes': result[4] or '',
                }
    except Exception as e:
        print(f"DB error: {e}")
    return None


async def main():
    print("🚀 Starting Direct Watcher...")
    init_db()

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
        )

        pages = context.pages
        page = pages[0] if pages else await context.new_page()

        print("✅ Browser ready - navigate to Marketplace")
        print("👀 Starting watch loop...\n")

        last_url = ""

        while True:
            try:
                url = page.url

                # Main loop - runs every second

                # 1. Remove ads
                try:
                    await page.evaluate('''
                        () => {
                            // Remove sponsored posts
                            document.querySelectorAll('*').forEach(el => {
                                if (el.textContent?.includes('Sponsored') && el.textContent.length < 100) {
                                    let parent = el;
                                    for (let i = 0; i < 8; i++) {
                                        if (parent?.parentElement) {
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
                        }
                    ''')
                except:
                    pass

                # 2. Hide sidebar
                try:
                    await page.evaluate('''
                        () => {
                            // Hide 360px wide divs (sidebar)
                            document.querySelectorAll('div').forEach(el => {
                                const w = getComputedStyle(el).width;
                                if (w === '360px') {
                                    el.style.display = 'none';
                                }
                            });
                        }
                    ''')
                except:
                    pass

                # 3. If on listing page, show overlay
                if '/marketplace/item/' in url:
                    if url != last_url:
                        print(f"\n📋 Listing: {url.split('/marketplace/item/')[1].split('/')[0]}")
                        last_url = url

                        # Get evaluation
                        ev = get_evaluation(url)

                        if ev and ev['evaluated']:
                            print(f"   Flip: {ev['flip']}/10, Weird: {ev['weird']}/10, Scam: {ev['scam']}/10")

                            # Get description
                            try:
                                desc = await page.evaluate('''
                                    () => {
                                        let longest = '';
                                        document.querySelectorAll('div, span').forEach(el => {
                                            const txt = (el.textContent || '').trim();
                                            if (txt.length > 100 && txt.length < 2000 && txt.length > longest.length) {
                                                if (!txt.includes('Send seller') && !txt.includes('Save to')) {
                                                    longest = txt;
                                                }
                                            }
                                        });
                                        return longest;
                                    }
                                ''')
                            except:
                                desc = ""

                            if desc:
                                print(f"   📝 {desc[:80]}...")

                            # Show overlay
                            scam_color = '#f44336' if ev['scam'] >= 7 else '#ff9800' if ev['scam'] >= 4 else '#4caf50'
                            scam_warn = '''
                                <div style="background: #f44336; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                                    <b>⚠️ SCAM WARNING</b><br>High scam risk!
                                </div>
                            ''' if ev['scam'] >= 7 else ''

                            desc_html = ''
                            if desc and len(desc) > 30:
                                desc_safe = desc.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')[:1000]
                                desc_html = f'''
                                    <div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px;">
                                        <div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 6px;">📝 Description</div>
                                        <div style="font-size: 13px; color: #e4e6eb; max-height: 250px; overflow-y: auto; padding: 8px; background: #242526; border-radius: 4px; line-height: 1.4;">{desc_safe}</div>
                                    </div>
                                '''

                            overlay_html = f'''
                                <div style="position: fixed; top: 20px; left: 20px; background: #1c1e21; border: 2px solid #3a3b3c; border-radius: 8px; padding: 16px; z-index: 999999; color: #e4e6eb; font-family: system-ui; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 420px; max-height: 85vh; overflow-y: auto;">
                                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #3a3b3c; padding-bottom: 8px;">
                                        🤖 Marketplace Scout
                                    </div>

                                    <div style="margin-bottom: 10px;">
                                        <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Flip Potential</div>
                                        <div style="display: flex; align-items: center;">
                                            <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div style="width: {ev['flip'] * 10}%; height: 100%; background: #4caf50;"></div>
                                            </div>
                                            <div style="margin-left: 8px; font-weight: bold; width: 40px;">{ev['flip']}/10</div>
                                        </div>
                                    </div>

                                    <div style="margin-bottom: 10px;">
                                        <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Weirdness</div>
                                        <div style="display: flex; align-items: center;">
                                            <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div style="width: {ev['weird'] * 10}%; height: 100%; background: #9c27b0;"></div>
                                            </div>
                                            <div style="margin-left: 8px; font-weight: bold; width: 40px;">{ev['weird']}/10</div>
                                        </div>
                                    </div>

                                    <div style="margin-bottom: 12px;">
                                        <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Scam Risk</div>
                                        <div style="display: flex; align-items: center;">
                                            <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div style="width: {ev['scam'] * 10}%; height: 100%; background: {scam_color};"></div>
                                            </div>
                                            <div style="margin-left: 8px; font-weight: bold; width: 40px;">{ev['scam']}/10</div>
                                        </div>
                                    </div>

                                    {scam_warn}
                                    {desc_html}

                                    <div style="font-size: 11px; color: #8a8d91; text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #3a3b3c;">
                                        Seymour, CT • Friday pickups only
                                    </div>
                                </div>
                            '''

                            try:
                                await page.evaluate(f'''
                                    (() => {{
                                        const old = document.getElementById('scout-overlay');
                                        if (old) old.remove();

                                        const div = document.createElement('div');
                                        div.id = 'scout-overlay';
                                        div.innerHTML = `{overlay_html}`;
                                        document.body.appendChild(div);
                                    }})();
                                ''')
                                print("   ✅ Overlay shown")
                            except Exception as e:
                                print(f"   ❌ Overlay error: {e}")
                        else:
                            print("   ⏳ Not evaluated yet")
                else:
                    # Not on listing page
                    if last_url:
                        # Clear overlay
                        try:
                            await page.evaluate('''
                                (() => {
                                    const old = document.getElementById('scout-overlay');
                                    if (old) old.remove();
                                })();
                            ''')
                        except:
                            pass
                        last_url = ""

                await asyncio.sleep(1)

            except KeyboardInterrupt:
                print("\n👋 Stopping...")
                break
            except Exception as e:
                print(f"⚠️  Error: {e}")
                await asyncio.sleep(2)


if __name__ == '__main__':
    asyncio.run(main())
