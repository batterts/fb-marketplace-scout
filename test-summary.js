#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { execSync } = require('child_process');

const TEST_DB_PATH = path.join(__dirname, 'marketplace-test.db');

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    log(`❌ FAIL: ${message}`, 'red');
    throw new Error(message);
  } else {
    log(`✅ PASS: ${message}`, 'green');
  }
}

// Setup test database with sample data
function setupTestDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(TEST_DB_PATH);

    db.serialize(() => {
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          listing_url TEXT UNIQUE NOT NULL,
          title TEXT,
          price TEXT,
          description TEXT,
          thumbnail_url TEXT,
          seller_name TEXT,
          location TEXT,
          discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          evaluated BOOLEAN DEFAULT 0,
          evaluation_data TEXT,
          flip_score INTEGER,
          weirdness_score INTEGER,
          scam_likelihood INTEGER,
          notes TEXT,
          thumbnail_phash TEXT,
          is_duplicate BOOLEAN DEFAULT 0,
          is_screenshot BOOLEAN DEFAULT 0
        )
      `);

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
      `);

      // Insert test data
      const testListings = [
        {
          url: 'https://www.facebook.com/marketplace/item/1/',
          title: '2016 Toyota Tacoma Double Cab Limited',
          price: '20000',
          description: 'Clean title, well maintained, new tires',
          location: 'Waterbury, CT',
          evaluated: 1,
          flip: 8,
          weird: 2,
          scam: 1,
          notes: 'Fair price at 95% of market ($21k from 8 comparables) | 2016 Toyota'
        },
        {
          url: 'https://www.facebook.com/marketplace/item/2/',
          title: '2019 Subaru Crosstrek Premium',
          price: '18500',
          description: 'One owner, excellent condition, AWD',
          location: 'Hartford, CT',
          evaluated: 1,
          flip: 7,
          weird: 3,
          scam: 2,
          notes: 'Good deal at 88% of market'
        },
        {
          url: 'https://www.facebook.com/marketplace/item/3/',
          title: 'iPhone 15 Pro Max - BRAND NEW',
          price: '500',
          description: 'Brand new sealed in box, warranty included',
          location: 'New Haven, CT',
          evaluated: 1,
          flip: 3,
          weird: 5,
          scam: 9,
          notes: 'Suspiciously cheap - likely scam'
        },
        {
          url: 'https://www.facebook.com/marketplace/item/4/',
          title: '2021 Ford F-150 XLT - Transmission Issues',
          price: '15000',
          description: 'Needs transmission work, otherwise good',
          location: 'Bridgeport, CT',
          evaluated: 1,
          flip: 9,
          weird: 4,
          scam: 2,
          notes: 'Great deal at 60% of market ⚠️ HAS: transmission damage'
        },
        {
          url: 'https://www.facebook.com/marketplace/item/5/',
          title: 'Vintage Oscilloscope Tektronix 465B',
          price: '200',
          description: 'Working condition, calibrated recently',
          location: 'Waterbury, CT',
          evaluated: 1,
          flip: 8,
          weird: 9,
          scam: 1,
          notes: 'Rare vintage test equipment - high flip potential'
        },
        {
          url: 'https://www.facebook.com/marketplace/item/6/',
          title: 'Couch - Free',
          price: '0',
          description: 'Comfortable sectional, must pick up',
          location: 'Seymour, CT',
          evaluated: 0,
          flip: null,
          weird: null,
          scam: null,
          notes: null
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO listings (listing_url, title, price, description, location, evaluated, flip_score, weirdness_score, scam_likelihood, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      testListings.forEach(listing => {
        stmt.run(
          listing.url,
          listing.title,
          listing.price,
          listing.description,
          listing.location,
          listing.evaluated,
          listing.flip,
          listing.weird,
          listing.scam,
          listing.notes
        );
      });

      stmt.finalize((err) => {
        db.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Cleanup test database
function cleanupTestDB() {
  const fs = require('fs');
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

// Run summary command and capture output
function runSummary(args) {
  try {
    const output = execSync(
      `DB_PATH="${TEST_DB_PATH}" node summary.js ${args}`,
      { encoding: 'utf8', cwd: __dirname }
    );
    return output;
  } catch (err) {
    return err.stdout || err.stderr;
  }
}

// Test functions
async function testBasicSearch() {
  log('\n📋 Test: Basic Search', 'blue');

  const output = runSummary('"Tacoma"');
  assert(output.includes('2016 Toyota Tacoma'), 'Should find Tacoma listing');
  assert(output.includes('$20,000'), 'Should show price');
  assert(output.includes('Waterbury, CT'), 'Should show location');
  assert(output.includes('Flip: 8/10'), 'Should show flip score');
  assert(output.includes('Fair price at 95%'), 'Should show notes');
}

async function testShowAll() {
  log('\n📋 Test: Show All Listings', 'blue');

  const output = runSummary('--all');
  assert(output.includes('Showing'), 'Should show header');
  assert(output.includes('Tacoma'), 'Should include Tacoma');
  assert(output.includes('Subaru'), 'Should include Subaru');
  assert(output.includes('iPhone'), 'Should include iPhone');
  assert(output.includes('F-150'), 'Should include F-150');
  assert(output.includes('Oscilloscope'), 'Should include Oscilloscope');
  assert(output.includes('Couch'), 'Should include unevaluated listing');
}

async function testDealsFilter() {
  log('\n📋 Test: Deals Filter (flip >= 7)', 'blue');

  const output = runSummary('--deals');
  assert(output.includes('good deals'), 'Should show deals header');
  assert(output.includes('Tacoma'), 'Should include Tacoma (flip=8)');
  assert(output.includes('Subaru'), 'Should include Subaru (flip=7)');
  assert(output.includes('F-150'), 'Should include F-150 (flip=9)');
  assert(output.includes('Oscilloscope'), 'Should include Oscilloscope (flip=8)');
  assert(!output.includes('iPhone'), 'Should NOT include iPhone (flip=3)');
}

async function testScamsFilter() {
  log('\n📋 Test: Scams Filter (scam >= 7)', 'blue');

  const output = runSummary('--scams');
  assert(output.includes('potential scams'), 'Should show scams header');
  assert(output.includes('iPhone'), 'Should include iPhone (scam=9)');
  assert(output.includes('Suspiciously cheap'), 'Should show scam notes');
  assert(!output.includes('Tacoma'), 'Should NOT include Tacoma (scam=1)');
}

async function testEvaluatedFilter() {
  log('\n📋 Test: Evaluated Only Filter', 'blue');

  const output = runSummary('--all --evaluated');
  assert(output.includes('Tacoma'), 'Should include evaluated Tacoma');
  assert(!output.includes('Couch') || output.includes('Not evaluated'), 'Should not include unevaluated or show status');
}

async function testSortByPrice() {
  log('\n📋 Test: Sort by Price', 'blue');

  const output = runSummary('--all --evaluated --sort price');
  const lines = output.split('\n');

  // Find price lines
  const prices = [];
  lines.forEach(line => {
    const match = line.match(/💰\s*\$?([\d,]+)/);
    if (match) {
      prices.push(parseInt(match[1].replace(/,/g, '')));
    }
  });

  // Check if prices are sorted
  let isSorted = true;
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i] > prices[i + 1]) {
      isSorted = false;
      break;
    }
  }

  assert(isSorted, 'Prices should be sorted low to high');
  assert(prices.length >= 5, 'Should have multiple prices');
}

async function testSortByFlip() {
  log('\n📋 Test: Sort by Flip Score', 'blue');

  const output = runSummary('--all --evaluated --sort flip');
  const lines = output.split('\n');

  // Find flip scores
  const scores = [];
  lines.forEach(line => {
    const match = line.match(/Flip:\s*(\d+)\/10/);
    if (match) {
      scores.push(parseInt(match[1]));
    }
  });

  // Check if scores are sorted descending
  let isSorted = true;
  for (let i = 0; i < scores.length - 1; i++) {
    if (scores[i] < scores[i + 1]) {
      isSorted = false;
      break;
    }
  }

  assert(isSorted, 'Flip scores should be sorted high to low');
  assert(scores.length >= 5, 'Should have multiple scores');
}

async function testLimit() {
  log('\n📋 Test: Limit Results', 'blue');

  const output = runSummary('--all --limit 3');
  const lines = output.split('\n').filter(line => line.match(/^\s*\d+\./));

  assert(lines.length <= 3, 'Should limit to 3 results');
}

async function testCSVExport() {
  log('\n📋 Test: CSV Export', 'blue');

  const output = runSummary('--all --csv');

  // Check CSV header
  assert(output.includes('Title,Price,Location,Flip Score'), 'Should have CSV header');

  // Check data rows
  const lines = output.split('\n').filter(l => l.trim());
  assert(lines.length >= 6, 'Should have header + data rows');

  // Check CSV format (quoted fields)
  assert(output.includes('"2016 Toyota Tacoma'), 'Should have quoted title');
  assert(output.includes('"Waterbury, CT"'), 'Should have quoted location');
}

async function testSearchInDescription() {
  log('\n📋 Test: Search in Description', 'blue');

  const output = runSummary('"transmission"');
  assert(output.includes('F-150'), 'Should find F-150 by description keyword');
  assert(output.includes('Needs transmission work'), 'Should show description');
}

async function testMultipleKeywords() {
  log('\n📋 Test: Multiple Keywords', 'blue');

  const output = runSummary('"2016 Toyota"');
  assert(output.includes('Tacoma'), 'Should find Tacoma');
  assert(!output.includes('Subaru'), 'Should not find Subaru');
  assert(!output.includes('F-150'), 'Should not find F-150');
}

async function testNoResults() {
  log('\n📋 Test: No Results Found', 'blue');

  const output = runSummary('"ZZZ_NONEXISTENT_XYZ"');
  assert(output.includes('No listings found'), 'Should show no results message');
}

async function testHelp() {
  log('\n📋 Test: Help Flag', 'blue');

  const output = runSummary('--help');
  assert(output.includes('Usage:'), 'Should show usage');
  assert(output.includes('Examples:'), 'Should show examples');
  assert(output.includes('Options:'), 'Should show options');
}

// Main test runner
async function runTests() {
  log('\n🧪 Starting Summary Script Unit Tests\n', 'yellow');

  try {
    // Setup
    log('📦 Setting up test database...', 'blue');
    await setupTestDB();
    log('✅ Test database created', 'green');

    // Run tests
    await testHelp();
    await testBasicSearch();
    await testShowAll();
    await testDealsFilter();
    await testScamsFilter();
    await testEvaluatedFilter();
    await testSortByPrice();
    await testSortByFlip();
    await testLimit();
    await testCSVExport();
    await testSearchInDescription();
    await testMultipleKeywords();
    await testNoResults();

    // Cleanup
    log('\n🧹 Cleaning up...', 'blue');
    cleanupTestDB();
    log('✅ Cleanup complete', 'green');

    log('\n✨ ALL TESTS PASSED! ✨\n', 'green');
    process.exit(0);

  } catch (err) {
    log(`\n💥 TEST FAILED: ${err.message}\n`, 'red');
    console.error(err);
    cleanupTestDB();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
