#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'marketplace.db');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 FB Marketplace Scout - Listing Summary

Usage: node summary.js [search_term] [options]

Examples:
  node summary.js "2019 Subaru"           Search for 2019 Subaru listings
  node summary.js "Tacoma"                Search for Tacoma listings
  node summary.js "furniture"             Search for furniture listings
  node summary.js --all                   Show all listings
  node summary.js --deals                 Show only good deals (flip score >= 7)
  node summary.js --scams                 Show potential scams (scam score >= 7)

Options:
  --all         Show all listings
  --deals       Show only good deals (flip score >= 7)
  --scams       Show potential scams (scam score >= 7)
  --evaluated   Show only evaluated listings
  --limit N     Limit results to N listings (default: 50)
  --sort        Sort by: price, flip, scam, date (default: date)
  --csv         Export as CSV format
  `);
  process.exit(0);
}

// Parse options
let searchTerm = null;
let showAll = args.includes('--all');
let showDeals = args.includes('--deals');
let showScams = args.includes('--scams');
let onlyEvaluated = args.includes('--evaluated');
let csvExport = args.includes('--csv');
let limit = 50;
let sortBy = 'date';

// Get limit
const limitIndex = args.indexOf('--limit');
if (limitIndex !== -1 && args[limitIndex + 1]) {
  limit = parseInt(args[limitIndex + 1]);
}

// Get sort
const sortIndex = args.indexOf('--sort');
if (sortIndex !== -1 && args[sortIndex + 1]) {
  sortBy = args[sortIndex + 1];
}

// Get search term (first non-flag argument)
if (!showAll && !showDeals && !showScams) {
  searchTerm = args.find(arg => !arg.startsWith('--'));
}

// Build SQL query
let sql = `
  SELECT
    title,
    price,
    location,
    listing_url,
    evaluated,
    flip_score,
    weirdness_score,
    scam_likelihood,
    notes,
    description,
    discovered_at as created_at
  FROM listings
  WHERE 1=1
`;

const params = [];

if (searchTerm) {
  sql += ` AND (title LIKE ? OR description LIKE ?)`;
  params.push(`%${searchTerm}%`, `%${searchTerm}%`);
}

if (showDeals) {
  sql += ` AND flip_score >= 7`;
  onlyEvaluated = true;
}

if (showScams) {
  sql += ` AND scam_likelihood >= 7`;
  onlyEvaluated = true;
}

if (onlyEvaluated) {
  sql += ` AND evaluated = 1`;
}

// Sort
switch (sortBy) {
  case 'price':
    sql += ` ORDER BY CAST(price AS INTEGER) ASC`;
    break;
  case 'flip':
    sql += ` ORDER BY flip_score DESC`;
    break;
  case 'scam':
    sql += ` ORDER BY scam_likelihood DESC`;
    break;
  default:
    sql += ` ORDER BY discovered_at DESC`;
}

sql += ` LIMIT ?`;
params.push(limit);

// Execute query
const db = new sqlite3.Database(DB_PATH);

db.all(sql, params, (err, rows) => {
  db.close();

  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('\n❌ No listings found\n');
    process.exit(0);
  }

  // CSV export
  if (csvExport) {
    console.log('Title,Price,Location,Flip Score,Weirdness,Scam Risk,Notes,URL');
    rows.forEach(row => {
      const title = escapeCsv(row.title || '');
      const price = row.price || '';
      const location = escapeCsv(row.location || '');
      const flip = row.flip_score || '';
      const weird = row.weirdness_score || '';
      const scam = row.scam_likelihood || '';
      const notes = escapeCsv(row.notes || '');
      const url = row.listing_url || '';
      console.log(`"${title}","${price}","${location}",${flip},${weird},${scam},"${notes}","${url}"`);
    });
    process.exit(0);
  }

  // Print header
  console.log('\n' + '='.repeat(120));
  if (searchTerm) {
    console.log(`🔍 Found ${rows.length} listings matching "${searchTerm}"`);
  } else if (showDeals) {
    console.log(`💎 Found ${rows.length} good deals (flip score >= 7)`);
  } else if (showScams) {
    console.log(`⚠️  Found ${rows.length} potential scams (scam score >= 7)`);
  } else {
    console.log(`📋 Showing ${rows.length} listings`);
  }
  console.log('='.repeat(120) + '\n');

  // Print each listing
  rows.forEach((row, i) => {
    const num = `${i + 1}.`.padEnd(4);
    const title = truncate(row.title || 'Untitled', 60);
    const price = row.price ? `$${parseInt(row.price).toLocaleString()}`.padEnd(12) : 'No price'.padEnd(12);
    const location = truncate(row.location || 'Unknown', 25);

    console.log(`${num}${title}`);
    console.log(`    💰 ${price} 📍 ${location}`);

    // Show scores if evaluated
    if (row.evaluated) {
      const flip = `Flip: ${row.flip_score || 0}/10`.padEnd(12);
      const weird = `Weird: ${row.weirdness_score || 0}/10`.padEnd(14);
      const scam = `Scam: ${row.scam_likelihood || 0}/10`.padEnd(13);

      let scoreColor = '';
      if (row.flip_score >= 7) scoreColor += '💎 ';
      if (row.scam_likelihood >= 7) scoreColor += '⚠️ ';

      console.log(`    ${scoreColor}${flip} ${weird} ${scam}`);

      if (row.notes) {
        const notes = truncate(row.notes, 100);
        console.log(`    📝 ${notes}`);
      }
    } else {
      console.log(`    ⏳ Not evaluated yet`);
    }

    // Show description preview
    if (row.description) {
      const desc = truncate(row.description.replace(/\n/g, ' '), 100);
      console.log(`    📄 ${desc}`);
    }

    // Show URL
    console.log(`    🔗 ${row.listing_url}`);
    console.log('');
  });

  console.log('='.repeat(120));
  console.log(`\n✅ Total: ${rows.length} listings\n`);
});

// Helper to truncate text
function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

// Helper to escape CSV values
function escapeCsv(text) {
  if (!text) return '';
  return text.replace(/"/g, '""').replace(/\n/g, ' ');
}
