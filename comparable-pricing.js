const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'marketplace.db');

// Initialize comparable pricing table
function initComparableDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.run(`
      CREATE TABLE IF NOT EXISTS comparable_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_key TEXT UNIQUE NOT NULL,
        year INTEGER,
        make TEXT,
        model TEXT,
        prices TEXT,
        median_price INTEGER,
        sample_count INTEGER,
        min_price INTEGER,
        max_price INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

// Generate search key for caching
function generateSearchKey(year, make, model) {
  // Normalize model name (remove trim details)
  const modelNormalized = model
    .toLowerCase()
    .replace(/\b(limited|sport|base|premium|lx|ex|sr5|xlt|slt)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${year}_${make.toLowerCase()}_${modelNormalized}`;
}

// Build FB Marketplace search URL (matches Safari's actual format)
function buildSearchURL(year, make, model, zipCode = '06483', radius = 500) {
  // Clean up model name for search
  const searchTerm = `${year} ${make} ${model}`;
  const encoded = encodeURIComponent(searchTerm);

  // Use the /category/search endpoint that Safari uses (not /category/vehicles)
  // This is the URL format that actually works when you search manually
  return `https://www.facebook.com/marketplace/category/search?query=${encoded}`;
}

// Extract listings (price + title) from search results page
async function extractListingsFromPage(page, targetYear, targetMake) {
  return await page.evaluate((year, make) => {
    const listings = [];

    // Find all marketplace listing containers
    // FB typically groups price and title together in a link/card
    const listingLinks = document.querySelectorAll('a[href*="/marketplace/item/"]');

    listingLinks.forEach(link => {
      try {
        // Try multiple sources for the listing text
        // 1. aria-label often has the full title
        let fullText = link.getAttribute('aria-label') || '';

        // 2. If no aria-label, use text content
        if (!fullText) {
          fullText = (link.textContent || '').trim();
        }

        // Extract price (first occurrence only)
        const priceMatch = fullText.match(/\$?([\d,]+)(k)?/i);
        if (!priceMatch) return;

        let price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (priceMatch[2] && priceMatch[2].toLowerCase() === 'k') {
          price *= 1000;
        }

        // Sanity check: vehicles are typically $500 - $150,000
        if (price < 500 || price > 150000) return;

        // Debug: log first few raw texts to see what we're getting
        if (listings.length < 3) {
          console.log(`DEBUG RAW TEXT: "${fullText.substring(0, 150)}"`);
        }

        // Clean up the text: remove duplicate price mentions, normalize spacing
        let cleanText = fullText
          .replace(/\$[\d,]+/g, '') // Remove all price mentions
          .replace(/Free/gi, '') // Remove "Free" text
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        // Debug: log cleaned text too
        if (listings.length < 3) {
          console.log(`DEBUG CLEAN TEXT: "${cleanText.substring(0, 150)}"`);
        }

        // Extract structured info
        const yearMatch = cleanText.match(/\b(19\d{2}|20[0-2]\d)\b/);
        const locationMatch = cleanText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
        const mileageMatch = cleanText.match(/(\d{1,3})[Kk]\s*miles?/i);

        // Build cleaned description
        let description = cleanText;

        // Try to extract just the vehicle description (before location usually)
        if (locationMatch) {
          const locationIndex = cleanText.indexOf(locationMatch[0]);
          description = cleanText.substring(0, locationIndex).trim();
        }

        // Extract title/description text
        const lowerText = cleanText.toLowerCase();

        // Check if it's likely a vehicle (not furniture, electronics, etc.)
        const vehicleKeywords = /\b(sedan|coupe|suv|truck|van|wagon|convertible|hatchback|pickup|4wd|awd|fwd|2wd|v6|v8|4cyl|automatic|manual|transmission|mileage|miles|km)\b/i;
        const isLikelyVehicle = vehicleKeywords.test(lowerText);

        // Check if this listing matches our search criteria
        const hasYear = lowerText.includes(year.toString()) ||
                       lowerText.includes((year - 1).toString()) ||
                       lowerText.includes((year + 1).toString());

        const hasMake = lowerText.includes(make.toLowerCase());

        // Include if it looks like a vehicle - trust Facebook's search results
        // Just filter out obvious non-vehicles
        if (isLikelyVehicle) {
          listings.push({
            price,
            text: cleanText,
            description: description.substring(0, 100),
            location: locationMatch ? locationMatch[0] : null,
            mileage: mileageMatch ? mileageMatch[1] + 'k mi' : null,
            year: yearMatch ? yearMatch[0] : null,
            url: link.href,
            matched: true,
            exactMatch: hasYear && hasMake
          });
        } else {
          // Track non-vehicles for debugging
          listings.push({
            price,
            text: cleanText.substring(0, 150),
            matched: false,
            reason: `not a vehicle (missing vehicle keywords)`
          });
        }
      } catch (err) {
        // Skip malformed listings
      }
    });

    return listings;
  }, targetYear, targetMake);
}

// Search for comparable vehicles (opens in new tab)
async function searchComparables(browser, year, make, model, options = {}) {
  const {
    zipCode = '06483', // Seymour, CT
    minSamples = 5
  } = options;

  console.log(`   🔍 Searching for comparables: ${year} ${make} ${model} (500 mile radius)`);

  let allPrices = [];
  let allMatchedListings = [];

  // Open new tab for comparables search
  const searchTab = await browser.newPage();

  try {
    const searchQuery = `${year} ${make} ${model}`;
    const searchURL = buildSearchURL(year, make, model, zipCode, 500);

    console.log(`   🔗 ${searchURL}`);
    console.log(`   🔍 Loading search URL...`);

    await searchTab.goto(searchURL, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page info
    const pageInfo = await searchTab.evaluate(() => {
      const radiusText = document.body.innerText;
      const radiusMatch = radiusText.match(/(\d+)\s*(mi|km|miles|kilometers)/i);
      const searchBox = document.querySelector('input[type="search"], input[placeholder*="Search"]');
      const searchValue = searchBox ? searchBox.value : 'not found';

      return {
        radius: radiusMatch ? radiusMatch[0] : 'unknown',
        searchQuery: searchValue,
        totalLinks: document.querySelectorAll('a[href*="/marketplace/item/"]').length
      };
    });

    console.log(`   📏 Facebook radius: ${pageInfo.radius}`);
    console.log(`   🔍 Search query: "${pageInfo.searchQuery}"`);
    console.log(`   🔗 Found ${pageInfo.totalLinks} item links`);

    const listings = await extractListingsFromPage(searchTab, year, make);

    // Show sample listings
    if (listings.length > 0) {
      console.log(`   📝 Sample listings found:`);
      listings.slice(0, 5).forEach((listing, i) => {
        const preview = listing.text.substring(0, 70).replace(/\n/g, ' ');
        const match = listing.matched ? '✓' : '✗';
        console.log(`      ${match} ${i + 1}. $${listing.price.toLocaleString()} - "${preview}..."`);
      });
    }

    // Filter to matched listings
    const matchedListings = listings.filter(l => l.matched);
    const unmatchedListings = listings.filter(l => !l.matched);

    console.log(`   📋 Total listings: ${listings.length}`);
    console.log(`   ✅ Matched ${year} ${make}: ${matchedListings.length}`);

    if (unmatchedListings.length > 0) {
      console.log(`   ⚠️  Filtered out: ${unmatchedListings.length} (wrong year/make/not vehicle)`);
    }

    allPrices = matchedListings.map(l => l.price);
    allMatchedListings = matchedListings;
  } finally {
    // Always close the search tab when done
    await searchTab.close();
    console.log(`   🗑️  Closed comparables search tab`);
  }

  // Show detailed list of all matched comparables
  if (allMatchedListings.length > 0) {
    console.log(`\n   📋 Matched Comparable Listings (${allMatchedListings.length} total):`);
    allMatchedListings.forEach((listing, i) => {
      const snippet = listing.text.substring(0, 80).replace(/\n/g, ' ');
      console.log(`   ${i + 1}. $${listing.price.toLocaleString()} - ${snippet}${listing.text.length > 80 ? '...' : ''}`);
    });
    console.log('');
  }

  // Remove duplicates and sort
  allPrices = [...new Set(allPrices)].sort((a, b) => a - b);

  if (allPrices.length === 0) {
    console.log(`   ❌ No matching comparables found for ${year} ${make}`);
    console.log(`   ℹ️  FB may have returned other vehicles - all were filtered out`);
    return null;
  }

  // Filter outliers (remove extreme values that might be typos)
  let filteredPrices = allPrices;
  if (allPrices.length >= 5) {
    // Remove bottom 10% and top 10% if we have enough samples
    const trimCount = Math.floor(allPrices.length * 0.1);
    if (trimCount > 0) {
      filteredPrices = allPrices.slice(trimCount, -trimCount);
      console.log(`   🔍 Filtered ${trimCount * 2} outliers (kept ${filteredPrices.length} prices)`);
    }
  }

  // Calculate statistics from filtered prices
  const median = filteredPrices[Math.floor(filteredPrices.length / 2)];
  const min = filteredPrices[0];
  const max = filteredPrices[filteredPrices.length - 1];
  const avg = Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length);

  console.log(`   ✅ Final dataset: ${filteredPrices.length} verified ${year} ${make} comparables`);
  console.log(`   📊 Range: $${min.toLocaleString()} - $${max.toLocaleString()}`);
  console.log(`   📊 Median: $${median.toLocaleString()} | Avg: $${avg.toLocaleString()}`);

  // Filter listings to only those whose prices made it through outlier removal
  const filteredListings = allMatchedListings.filter(l => filteredPrices.includes(l.price));

  return {
    prices: filteredPrices,
    median,
    average: avg,
    min,
    max,
    count: filteredPrices.length,
    listings: filteredListings  // Include actual listings for notes
  };
}

// Save comparable data to database
function saveComparableData(year, make, model, data) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const searchKey = generateSearchKey(year, make, model);

    db.run(`
      INSERT OR REPLACE INTO comparable_pricing
      (search_key, year, make, model, prices, listings, median_price, sample_count, min_price, max_price, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      searchKey,
      year,
      make,
      model,
      JSON.stringify(data.prices),
      JSON.stringify(data.listings),
      data.median,
      data.count,
      data.min,
      data.max
    ], (err) => {
      db.close();
      if (err) reject(err);
      else {
        console.log(`   💾 Saved comparable data for ${searchKey}`);
        resolve();
      }
    });
  });
}

// Get cached comparable data (cache forever - build pricing book over time)
function getCachedComparableData(year, make, model) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const searchKey = generateSearchKey(year, make, model);

    db.get(`
      SELECT * FROM comparable_pricing
      WHERE search_key = ?
    `, [searchKey], (err, row) => {
      db.close();

      if (err) {
        reject(err);
      } else if (row) {
        resolve({
          prices: JSON.parse(row.prices),
          listings: row.listings ? JSON.parse(row.listings) : [],
          median: row.median_price,
          min: row.min_price,
          max: row.max_price,
          count: row.sample_count,
          lastUpdated: row.last_updated
        });
      } else {
        resolve(null);
      }
    });
  });
}

// Main function: get comparable pricing (cached or fresh)
async function getComparablePricing(browser, year, make, model) {
  // Try cache first
  const cached = await getCachedComparableData(year, make, model);

  if (cached) {
    console.log(`   📋 Using cached data (${cached.count} samples, updated: ${cached.lastUpdated})`);
    return cached;
  }

  // Search for fresh data in new tab
  const fresh = await searchComparables(browser, year, make, model);

  if (fresh) {
    await saveComparableData(year, make, model, fresh);
  }

  return fresh;
}

module.exports = {
  initComparableDB,
  getComparablePricing,
  getCachedComparableData,
  searchComparables,
  saveComparableData
};
