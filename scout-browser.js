const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const { evaluateListing, saveEvaluation } = require('./evaluator.js');

// Database path
const DB_PATH = path.join(__dirname, 'marketplace.db');

// Test mode - automatically navigate to a listing
const TEST_MODE = process.argv.includes('--test');

// Search query from command line
const SEARCH_QUERY = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

// Get a random unevaluated listing URL
function getTestListingUrl() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.get(`
      SELECT listing_url
      FROM listings
      WHERE evaluated = 0
      ORDER BY RANDOM()
      LIMIT 1
    `, (err, row) => {
      db.close();
      if (err || !row) {
        resolve(null);
      } else {
        resolve(row.listing_url);
      }
    });
  });
}

// Get evaluation from database
function getEvaluation(itemId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    console.log(`   🔍 [DB] Querying for itemId: ${itemId}`);
    db.get(`
      SELECT evaluated, flip_score, weirdness_score, scam_likelihood, notes
      FROM listings
      WHERE listing_url LIKE ?
    `, [`%${itemId}%`], (err, row) => {
      db.close();
      if (err) {
        console.log(`   ❌ [DB] Query error: ${err.message}`);
        resolve(null);
      } else {
        console.log(`   📊 [DB] Query result:`, row ? JSON.stringify(row) : 'null');
        resolve(row);
      }
    });
  });
}

(async () => {
  console.log('🚀 Launching FB Marketplace Scout...\n');

  const userDataDir = path.join(os.homedir(), '.fb-marketplace-scout-profile');

  // Try to launch browser with fallback to system Chrome
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: userDataDir,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-session-crashed-bubble',
        '--disable-infobars',
        '--hide-crash-restore-bubble'
      ]
    });
  } catch (err) {
    console.log('⚠️  Bundled Chrome failed, trying system Chrome...\n');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: userDataDir,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-session-crashed-bubble',
        '--disable-infobars',
        '--hide-crash-restore-bubble'
      ]
    });
  }

  // Use the default page that opens with browser (avoids about:blank tab)
  const pages = await browser.pages();
  const page = pages[0];

  // Inject scout script on every page load
  await page.evaluateOnNewDocument(() => {
    // Remove ads (same as fb-marketplace-clean)
    function removeAds() {
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

    // Hide sidebar (only on browse pages, not listing pages)
    function hideSidebar() {
      // Don't hide sidebar on listing pages - it interferes with content
      if (window.location.href.includes('/marketplace/item/')) {
        return;
      }

      document.querySelectorAll('div').forEach(el => {
        const w = getComputedStyle(el).width;
        const rect = el.getBoundingClientRect();

        // Only hide if it's 360px wide AND on the left side of the screen
        if (w === '360px' && rect.left < 100) {
          el.style.display = 'none';
        }
      });
    }

    // Run ad removal and sidebar hiding
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        removeAds();
        hideSidebar();
      });
    } else {
      removeAds();
      hideSidebar();
    }

    setInterval(() => {
      removeAds();
      hideSidebar();
    }, 2000);

    console.log('🤖 Scout scripts loaded');
  });

  console.log('✅ Browser launched with Scout enabled');
  console.log('💾 Session saved to: ' + userDataDir);

  // Build initial URL based on search query
  let initialUrl = 'https://www.facebook.com/marketplace';

  if (SEARCH_QUERY) {
    const query = SEARCH_QUERY.toLowerCase();

    // Map category keywords to FB Marketplace category URLs
    const categories = {
      'vehicles': { url: 'vehicles', emoji: '🚗', name: 'Vehicles' },
      'vehicle': { url: 'vehicles', emoji: '🚗', name: 'Vehicles' },
      'cars': { url: 'vehicles', emoji: '🚗', name: 'Vehicles' },
      'car': { url: 'vehicles', emoji: '🚗', name: 'Vehicles' },
      'property': { url: 'propertyrentals', emoji: '🏠', name: 'Property Rentals' },
      'rentals': { url: 'propertyrentals', emoji: '🏠', name: 'Property Rentals' },
      'apartments': { url: 'propertyrentals', emoji: '🏠', name: 'Property Rentals' },
      'housing': { url: 'propertyrentals', emoji: '🏠', name: 'Property Rentals' },
      'electronics': { url: 'electronics', emoji: '💻', name: 'Electronics' },
      'apparel': { url: 'apparel', emoji: '👕', name: 'Apparel' },
      'clothing': { url: 'apparel', emoji: '👕', name: 'Apparel' },
      'clothes': { url: 'apparel', emoji: '👕', name: 'Apparel' },
      'furniture': { url: 'furniture', emoji: '🛋️', name: 'Home Goods' },
      'home': { url: 'furniture', emoji: '🛋️', name: 'Home Goods' },
      'hobbies': { url: 'hobbies', emoji: '🎨', name: 'Hobbies' },
      'garden': { url: 'garden', emoji: '🌱', name: 'Garden & Outdoor' },
      'outdoor': { url: 'garden', emoji: '🌱', name: 'Garden & Outdoor' },
      'sports': { url: 'sports', emoji: '⚽', name: 'Sporting Goods' },
      'sporting': { url: 'sports', emoji: '⚽', name: 'Sporting Goods' },
      'toys': { url: 'toys', emoji: '🧸', name: 'Toys & Games' },
      'games': { url: 'toys', emoji: '🧸', name: 'Toys & Games' },
      'pets': { url: 'pets', emoji: '🐾', name: 'Pet Supplies' },
      'pet': { url: 'pets', emoji: '🐾', name: 'Pet Supplies' },
      'free': { url: 'free', emoji: '🆓', name: 'Free Stuff' },
      'entertainment': { url: 'entertainment', emoji: '🎬', name: 'Entertainment' },
      'family': { url: 'family', emoji: '👶', name: 'Family' },
      'baby': { url: 'family', emoji: '👶', name: 'Family' }
    };

    // Check if it's a category keyword
    if (categories[query]) {
      const cat = categories[query];
      initialUrl = `https://www.facebook.com/marketplace/category/${cat.url}`;
      console.log(`${cat.emoji} Navigating to ${cat.name} category\n`);
    } else {
      // It's a search query - encode and build search URL
      const encoded = encodeURIComponent(SEARCH_QUERY);
      initialUrl = `https://www.facebook.com/marketplace/search?query=${encoded}`;
      console.log(`🔍 Searching for: "${SEARCH_QUERY}"\n`);
    }
  } else if (TEST_MODE) {
    console.log('🧪 TEST MODE - Auto-navigating to a listing\n');
    const testUrl = await getTestListingUrl();
    if (testUrl) {
      console.log(`   Navigating to: ${testUrl}`);
      initialUrl = testUrl;
    } else {
      console.log('   ⚠️  No unevaluated listings found, going to marketplace');
    }
  } else {
    console.log('🛍️  Navigating to Marketplace\n');
  }

  console.log('⌨️  Press Ctrl+C to close\n');

  // Navigate to initial URL
  await page.goto(initialUrl, { waitUntil: 'networkidle2' });

  // Track last evaluated item to avoid re-evaluating
  let lastEvaluatedItem = null;
  let currentlyEvaluating = null;
  let lastOverlayItem = null; // Track which item overlay is showing for

  // Monitor URL changes and show overlay on listing pages
  setInterval(async () => {
    try {
      const url = await page.url();

      if (url.includes('/marketplace/item/')) {
        const itemId = url.split('/marketplace/item/')[1].split('/')[0].split('?')[0];

        // Reset overlay tracking if we navigated to a different item
        if (lastOverlayItem && lastOverlayItem !== itemId) {
          console.log(`   🔄 Navigated to new item, clearing overlay tracking`);
          lastOverlayItem = null;
        }

        // Get evaluation from database
        let evaluation = await getEvaluation(itemId);

        // If not evaluated and not the last item we evaluated, evaluate it now
        // Also check if we're not currently evaluating this item
        if ((!evaluation || !evaluation.evaluated) && itemId !== lastEvaluatedItem && itemId !== currentlyEvaluating) {
          console.log(`🔍 New listing detected: ${itemId}`);

          // Mark as currently evaluating AND set lastEvaluatedItem to prevent duplicates
          currentlyEvaluating = itemId;
          lastEvaluatedItem = itemId;

          try {
            // Wait longer for page to load (Facebook dynamically loads content)
            console.log(`   ⏳ Waiting for page to load...`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Click "See more" to expand full description
            console.log(`   🔍 Looking for "See more" link...`);
            try {
              const seeMoreClicked = await page.evaluate(() => {
                // Look for "See more" text in various elements
                const elements = Array.from(document.querySelectorAll('div, span, a'));
                for (const el of elements) {
                  const text = (el.textContent || '').trim();
                  if (text === 'See more' || text === 'See More') {
                    // Check if it's clickable
                    const style = window.getComputedStyle(el);
                    if (style.cursor === 'pointer' || el.tagName === 'A' || el.onclick) {
                      el.click();
                      return true;
                    }
                  }
                }
                return false;
              });

              if (seeMoreClicked) {
                console.log(`   ✅ Clicked "See more", waiting for expansion...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                console.log(`   ℹ️  No "See more" link found (description may be short)`);
              }
            } catch (seeMoreError) {
              console.log(`   ⚠️  Error clicking "See more": ${seeMoreError.message}`);
            }

            // Extract listing data from page
            console.log(`   📄 Extracting data from page...`);
            const listingData = await page.evaluate(() => {
            let description = '';
            let title = '';
            let price = '';
            let location = '';

            const debug = { titleCandidates: [], priceCandidates: [], locationCandidates: [], descCandidates: [] };

            // Try to find title - look for large text near top, avoid navigation
            const allText = [];
            document.querySelectorAll('span, div, h1, h2').forEach(el => {
              const text = (el.textContent || '').trim();
              const rect = el.getBoundingClientRect();

              // Must be visible and reasonably positioned
              if (text && rect.top > 0 && rect.top < 600) {
                const fontSize = parseFloat(window.getComputedStyle(el).fontSize);

                // Title is usually larger text (14px+, lowered threshold)
                if (fontSize >= 14 && text.length > 5 && text.length < 200) {
                  // Skip navigation/header text
                  if (!text.includes('Marketplace') &&
                      !text.includes('Notifications') &&
                      !text.includes('Messages') &&
                      !text.includes('Menu') &&
                      !text.includes('Home') &&
                      !text.includes('Search')) {
                    allText.push({ text, fontSize, top: rect.top, length: text.length });
                  }
                }
              }
            });

            // Title is likely the largest text near the top
            allText.sort((a, b) => {
              // Prioritize: larger font, higher position, longer text
              const scoreA = (a.fontSize * 2) - (a.top / 10) + (a.length / 10);
              const scoreB = (b.fontSize * 2) - (b.top / 10) + (b.length / 10);
              return scoreB - scoreA;
            });

            if (allText.length > 0) {
              title = allText[0].text;
              debug.titleCandidates = allText.slice(0, 5).map(t => `"${t.text.substring(0, 50)}" (${t.fontSize}px)`);
            }

            // Find price - look for $ followed by numbers
            const priceElements = [];
            document.querySelectorAll('span, div').forEach(el => {
              const text = (el.textContent || '').trim();
              if (text.match(/^\$[\d,]+(\.\d{2})?$/) && text.length < 20) {
                const rect = el.getBoundingClientRect();
                if (rect.top > 0 && rect.top < 800) {
                  priceElements.push({ text, top: rect.top });
                }
              }
            });

            // Price is usually near the top
            priceElements.sort((a, b) => a.top - b.top);
            if (priceElements.length > 0) {
              price = priceElements[0].text;
              debug.priceCandidates = priceElements.slice(0, 3).map(p => `"${p.text}"`);
            }

            // Find location - city, state format
            const locationElements = [];
            document.querySelectorAll('span, div').forEach(el => {
              const text = (el.textContent || '').trim();
              if (text.match(/^[A-Z][a-z]+,\s*[A-Z]{2}$/) && text.length < 50) {
                locationElements.push(text);
              }
            });

            if (locationElements.length > 0) {
              location = locationElements[0];
              debug.locationCandidates = locationElements.slice(0, 3);
            }

            // Find description - look for text blocks in main content area
            const descriptionCandidates = [];
            document.querySelectorAll('div, span').forEach(el => {
              const text = (el.textContent || '').trim();
              const rect = el.getBoundingClientRect();

              if (text.length > 50 && text.length < 2000 && rect.top > 100) {
                // Exclude UI text and Facebook templates
                if (!text.includes('Send seller') &&
                    !text.includes('Save to') &&
                    !text.includes('Share') &&
                    !text.includes('Marketplace') &&
                    !text.includes('Message seller') &&
                    !text.includes('Hello, is this still available?') &&
                    !text.includes('Is this available?') &&
                    !text.includes('Ask for details') &&
                    !text.includes('Make offer') &&
                    !text.includes('You can negotiate') &&
                    !text.match(/^\d+ (people|views|saves)/) &&
                    !text.match(/^Listed \d+ (day|hour|minute|week)s? ago/)) {

                  // Skip if text is repetitive (like "Hello, is this...Hello, is this...")
                  const firstHalf = text.substring(0, text.length / 2);
                  const secondHalf = text.substring(text.length / 2);
                  const isRepetitive = firstHalf.length > 20 && firstHalf === secondHalf;

                  if (!isRepetitive) {
                    // Count how many children this element has
                    const childCount = el.querySelectorAll('*').length;

                    // Prefer elements with fewer children (more likely to be description)
                    descriptionCandidates.push({
                      text,
                      length: text.length,
                      childCount,
                      score: text.length - (childCount * 10)
                    });
                  }
                }
              }
            });

            // Sort by score (longer text, fewer children)
            descriptionCandidates.sort((a, b) => b.score - a.score);

            if (descriptionCandidates.length > 0) {
              description = descriptionCandidates[0].text;
              debug.descCandidates = descriptionCandidates.slice(0, 3).map(d =>
                `"${d.text.substring(0, 50)}..." (len=${d.length}, children=${d.childCount}, score=${d.score})`
              );
            }

            // Fallback: if no description found, try meta description
            if (!description || description.length < 20) {
              const ogDesc = document.querySelector('meta[property="og:description"]');
              if (ogDesc) {
                const metaDesc = ogDesc.getAttribute('content');
                if (metaDesc && metaDesc.length > 20 && !metaDesc.includes('Hello, is this still available?')) {
                  description = metaDesc;
                  if (!debug.descCandidates) debug.descCandidates = [];
                  debug.descCandidates.unshift(`"${metaDesc.substring(0, 50)}..." (meta tag)`);
                }
              }
            }

            // Fallback: if title looks wrong, try to extract from meta tags
            if (!title || title.includes('Notifications') || title.includes('Marketplace')) {
              const ogTitle = document.querySelector('meta[property="og:title"]');
              if (ogTitle) {
                const metaTitle = ogTitle.getAttribute('content');
                if (metaTitle && metaTitle.length > 5 && metaTitle.length < 200) {
                  title = metaTitle.split(' | ')[0]; // Remove "| Facebook Marketplace" suffix
                  if (!debug.titleCandidates.includes('(meta tag)')) {
                    debug.titleCandidates.unshift(`"${title}" (meta tag)`);
                  }
                }
              }
            }

            return { description, title, price, location, debug };
          });

            console.log(`   ✅ Data extracted successfully`);
            console.log(`   Title: ${listingData.title || '(not found)'}`);
            console.log(`   Price: ${listingData.price || '(not found)'}`);
            console.log(`   Location: ${listingData.location || '(not found)'}`);
            if (listingData.description && listingData.description.length > 50) {
              console.log(`   Description: ${listingData.description.substring(0, 100)}...`);
            } else {
              console.log(`   Description: (not found or too short)`);
            }

            // Show debug info if extraction failed
            if (!listingData.title || !listingData.price) {
              console.log(`\n   🔍 DEBUG INFO:`);
              if (listingData.debug.titleCandidates.length > 0) {
                console.log(`   Title candidates: ${listingData.debug.titleCandidates.join(', ')}`);
              } else {
                console.log(`   Title candidates: NONE FOUND`);
              }
              if (listingData.debug.priceCandidates.length > 0) {
                console.log(`   Price candidates: ${listingData.debug.priceCandidates.join(', ')}`);
              } else {
                console.log(`   Price candidates: NONE FOUND`);
              }
              if (listingData.debug.locationCandidates.length > 0) {
                console.log(`   Location candidates: ${listingData.debug.locationCandidates.join(', ')}`);
              }
              console.log('');
            }

            // Evaluate the listing
            console.log(`   🤖 Evaluating listing...`);
            const scores = await evaluateListing(
              listingData.title,
              listingData.price,
              listingData.description,
              listingData.location,
              browser  // Pass browser for comparable pricing
            );

            // Save to database
            console.log(`   💾 Saving to database...`);
            await saveEvaluation(itemId, scores, listingData.title, listingData.description);

            // Refresh evaluation from database
            evaluation = await getEvaluation(itemId);
            console.log(`   ✅ Evaluation complete!`);
            console.log(`   📊 Evaluation data:`, evaluation);

          } catch (err) {
            console.error(`❌ Error during extraction/evaluation: ${err.message}`);
            console.error(`   Stack: ${err.stack}`);
          } finally {
            // Clear the currently evaluating flag
            currentlyEvaluating = null;
          }
        }

        // Show overlay if evaluated (but only once per item)
        console.log(`   🔍 Checking overlay: evaluation=${!!evaluation}, evaluated=${evaluation?.evaluated}, lastOverlay=${lastOverlayItem}, current=${itemId}`);
        if (evaluation && evaluation.evaluated && lastOverlayItem !== itemId) {
          console.log(`   🎨 Showing overlay for first time...`);
          lastOverlayItem = itemId; // Mark that we've shown overlay for this item
          // Click "See more" to expand full description (if not already expanded)
          try {
            await page.evaluate(() => {
              const elements = Array.from(document.querySelectorAll('div, span, a'));
              for (const el of elements) {
                const text = (el.textContent || '').trim();
                if (text === 'See more' || text === 'See More') {
                  const style = window.getComputedStyle(el);
                  if (style.cursor === 'pointer' || el.tagName === 'A' || el.onclick) {
                    el.click();
                    break;
                  }
                }
              }
            });
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            // Ignore if "See more" not found or already clicked
          }

          // Get description from page (for display) - use same improved extraction
          const description = await page.evaluate(() => {
            const descriptionCandidates = [];
            document.querySelectorAll('div, span').forEach(el => {
              const text = (el.textContent || '').trim();
              const rect = el.getBoundingClientRect();

              if (text.length > 50 && text.length < 2000 && rect.top > 100) {
                // Exclude UI text and Facebook templates
                if (!text.includes('Send seller') &&
                    !text.includes('Save to') &&
                    !text.includes('Share') &&
                    !text.includes('Marketplace') &&
                    !text.includes('Message seller') &&
                    !text.includes('Hello, is this still available?') &&
                    !text.includes('Is this available?') &&
                    !text.includes('Ask for details') &&
                    !text.includes('Make offer') &&
                    !text.includes('You can negotiate') &&
                    !text.match(/^\d+ (people|views|saves)/) &&
                    !text.match(/^Listed \d+ (day|hour|minute|week)s? ago/)) {

                  // Skip if text is repetitive
                  const firstHalf = text.substring(0, text.length / 2);
                  const secondHalf = text.substring(text.length / 2);
                  const isRepetitive = firstHalf.length > 20 && firstHalf === secondHalf;

                  if (!isRepetitive) {
                    const childCount = el.querySelectorAll('*').length;
                    descriptionCandidates.push({
                      text,
                      length: text.length,
                      childCount,
                      score: text.length - (childCount * 10)
                    });
                  }
                }
              }
            });

            descriptionCandidates.sort((a, b) => b.score - a.score);
            return descriptionCandidates.length > 0 ? descriptionCandidates[0].text : '';
          });

          const flip = evaluation.flip_score || 0;
          const weird = evaluation.weirdness_score || 0;
          const scam = evaluation.scam_likelihood || 0;
          const notes = evaluation.notes || '';

          const scamColor = scam >= 7 ? '#f44336' : scam >= 4 ? '#ff9800' : '#4caf50';
          const scamWarn = scam >= 7 ? `
            <div style="background: #f44336; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
              <b>⚠️ SCAM WARNING</b><br>High risk detected!
            </div>
          ` : '';

          let descHtml = '';
          if (description && description.length > 30) {
            const descSafe = description.replace(/'/g, "\\'").replace(/`/g, '\\`').substring(0, 1000);
            descHtml = `
              <div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px;">
                <div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 6px;">📝 Description</div>
                <div style="font-size: 13px; color: #e4e6eb; max-height: 250px; overflow-y: auto; padding: 8px; background: #242526; border-radius: 4px; line-height: 1.4;">${descSafe}</div>
              </div>
            `;
          }

          // Inject overlay
          await page.evaluate((flip, weird, scam, scamColor, scamWarn, descHtml, notes) => {
            const old = document.getElementById('scout-overlay');
            if (old) old.remove();

            const div = document.createElement('div');
            div.id = 'scout-overlay';
            div.innerHTML = `
              <div style="position: fixed; top: 20px; left: 20px; background: #1c1e21; border: 2px solid #3a3b3c; border-radius: 8px; padding: 16px; z-index: 999999; color: #e4e6eb; font-family: system-ui; box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 620px; max-height: 95vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #3a3b3c; padding-bottom: 8px;">
                  <div style="font-size: 16px; font-weight: bold;">🤖 Marketplace Scout</div>
                  <button onclick="this.closest('#scout-overlay').remove()" style="background: #3a3b3c; border: none; color: #e4e6eb; cursor: pointer; border-radius: 4px; padding: 4px 8px; font-size: 18px;">×</button>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Flip Potential</div>
                  <div style="display: flex; align-items: center;">
                    <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${flip * 10}%; height: 100%; background: #4caf50;"></div>
                    </div>
                    <div style="margin-left: 8px; font-weight: bold; width: 40px;">${flip}/10</div>
                  </div>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Weirdness</div>
                  <div style="display: flex; align-items: center;">
                    <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${weird * 10}%; height: 100%; background: #9c27b0;"></div>
                    </div>
                    <div style="margin-left: 8px; font-weight: bold; width: 40px;">${weird}/10</div>
                  </div>
                </div>

                <div style="margin-bottom: 12px;">
                  <div style="font-size: 13px; color: #b0b3b8; margin-bottom: 4px;">Scam Risk</div>
                  <div style="display: flex; align-items: center;">
                    <div style="flex: 1; background: #3a3b3c; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${scam * 10}%; height: 100%; background: ${scamColor};"></div>
                    </div>
                    <div style="margin-left: 8px; font-weight: bold; width: 40px;">${scam}/10</div>
                  </div>
                </div>

                ${scamWarn}

                <div style="border-top: 1px solid #3a3b3c; padding-top: 12px; margin-top: 12px; margin-bottom: 12px;">
                  <div style="font-size: 12px; font-weight: bold; color: #b0b3b8; margin-bottom: 6px;">📝 Notes</div>
                  <div style="font-size: 12px; color: #e4e6eb; padding: 10px; background: #242526; border-radius: 4px; line-height: 1.6; max-height: 600px; overflow-y: auto; white-space: pre-line; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;">${notes || 'No notes'}</div>
                </div>

                ${descHtml}

                <div style="font-size: 11px; color: #8a8d91; text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #3a3b3c;">
                  Seymour, CT • Friday pickups only
                </div>
              </div>
            `;
            document.body.appendChild(div);
          }, flip, weird, scam, scamColor, scamWarn, descHtml, notes);

          console.log(`✅ Overlay shown: Flip=${flip}, Weird=${weird}, Scam=${scam}`);
        }
      } else {
        // Not on a listing page - clear overlay and tracking
        if (lastOverlayItem) {
          console.log(`   🧹 Left listing page, clearing overlay`);
          lastOverlayItem = null;
          await page.evaluate(() => {
            const overlay = document.getElementById('scout-overlay');
            if (overlay) overlay.remove();
          });
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }, 2000);

  // Keep running
  await new Promise(() => {});
})();
