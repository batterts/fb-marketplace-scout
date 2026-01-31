#!/usr/bin/env python3
"""
Debug version of watcher to test specific URL
"""
import asyncio
from playwright.async_api import async_playwright
import os

USER_DATA_DIR = os.path.expanduser('~/.fb-marketplace-scout-profile')

async def test_url():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
        )

        pages = context.pages
        page = pages[0] if pages else await context.new_page()

        print("🔍 Testing URL...")
        url = 'https://www.facebook.com/marketplace/item/25608535845470704/'

        await page.goto(url, wait_until='networkidle')
        print("✅ Page loaded")

        # Wait a bit for content
        await asyncio.sleep(3)

        # Test 1: Check if we're on a listing page
        print(f"\n📍 Current URL: {page.url}")
        if '/marketplace/item/' in page.url:
            print("✅ On listing page")
        else:
            print("❌ Not on listing page")

        # Test 2: Try to extract description
        print("\n📝 Extracting description...")
        try:
            description = await page.evaluate('''
                () => {
                    // Find all text on page
                    let allText = document.body.innerText;
                    console.log('Full page text length:', allText.length);

                    // Try to find description
                    let longestText = '';
                    document.querySelectorAll('div, span, p').forEach(el => {
                        const text = el.textContent?.trim() || '';
                        if (text.length > 50 && text.length < 3000) {
                            if (text.length > longestText.length) {
                                longestText = text;
                            }
                        }
                    });

                    console.log('Longest text found:', longestText.substring(0, 200));
                    return longestText;
                }
            ''')

            if description:
                print(f"✅ Found description ({len(description)} chars):")
                print(description[:500])
            else:
                print("❌ No description found")
        except Exception as e:
            print(f"❌ Error: {e}")

        # Test 3: Try to hide sidebar
        print("\n🚫 Hiding sidebar...")
        try:
            await page.evaluate('''
                () => {
                    // Hide left nav
                    const leftNav = document.querySelector('div[role="navigation"]');
                    if (leftNav) {
                        leftNav.style.display = 'none';
                        console.log('✅ Hid navigation');
                    } else {
                        console.log('❌ No navigation found');
                    }

                    // Hide 360px wide columns
                    let hidden = 0;
                    document.querySelectorAll('div').forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.width === '360px') {
                            el.style.display = 'none';
                            hidden++;
                        }
                    });
                    console.log('Hid', hidden, 'sidebar elements');
                }
            ''')
            print("✅ Sidebar hiding attempted")
        except Exception as e:
            print(f"❌ Error: {e}")

        # Test 4: Inject overlay
        print("\n🎨 Injecting overlay...")
        try:
            await page.evaluate('''
                () => {
                    const overlay = document.createElement('div');
                    overlay.id = 'test-overlay';
                    overlay.innerHTML = `
                        <div style="
                            position: fixed;
                            top: 20px;
                            left: 20px;
                            background: red;
                            color: white;
                            padding: 20px;
                            z-index: 999999;
                            border: 3px solid yellow;
                            font-size: 20px;
                        ">
                            TEST OVERLAY - Can you see this?
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    console.log('✅ Test overlay injected');
                }
            ''')
            print("✅ Test overlay injected - look for red box in browser!")
        except Exception as e:
            print(f"❌ Error: {e}")

        print("\n⏸️  Press Ctrl+C to exit...")
        await asyncio.sleep(3600)

if __name__ == '__main__':
    asyncio.run(test_url())
