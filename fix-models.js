#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'marketplace.db');

// Enhanced model extraction (same logic as evaluator.js)
function extractModelFromTitle(title, make) {
  if (!title || !make) return null;

  const titleLower = title.toLowerCase();
  const makePos = titleLower.indexOf(make.toLowerCase());

  if (makePos >= 0) {
    const afterMake = title.substring(makePos + make.length).trim();
    const modelMatch = afterMake.match(/^([a-z0-9\-]+(?:\s+[a-z0-9\-]+)?)/i);

    if (modelMatch) {
      let extractedModel = modelMatch[1].trim();

      // Remove trim levels, body types, and other non-model words
      const stopWords = /\b(sedan|coupe|suv|truck|van|wagon|convertible|hatchback|lx|ex|se|le|sl|sle|slt|limited|sport|base|premium|xl|xlt|sr5|laramie|touring|hybrid|electric|awd|4wd|fwd|2wd|4dr|2dr|v6|v8|4cyl|6cyl|turbo|diesel|gas|manual|automatic|fastback|hardtop)\b/i;

      const cleanModel = extractedModel
        .split(/\s+/)
        .filter(word => {
          // Keep the word if it's not a stop word and not a 4-digit year
          return !stopWords.test(word) && !/^\d{4}$/.test(word);
        })
        .join(' ');

      if (cleanModel.length > 0) {
        // Capitalize properly
        return cleanModel.charAt(0).toUpperCase() + cleanModel.slice(1).toLowerCase();
      }
    }
  }

  return null;
}

// Fix existing records
const db = new sqlite3.Database(DB_PATH);

db.all(`
  SELECT id, title, vehicle_make, vehicle_model
  FROM evaluations
  WHERE vehicle_make IS NOT NULL AND vehicle_model IS NULL
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  console.log(`🔍 Found ${rows.length} records needing model extraction\n`);

  let fixed = 0;
  let skipped = 0;

  rows.forEach((row, index) => {
    const model = extractModelFromTitle(row.title, row.vehicle_make);

    if (model) {
      console.log(`✅ [${row.id}] ${row.vehicle_make} → ${model}`);
      console.log(`   Title: ${row.title}`);

      db.run(`
        UPDATE evaluations
        SET vehicle_model = ?
        WHERE id = ?
      `, [model, row.id], (err) => {
        if (err) {
          console.error(`❌ Failed to update record ${row.id}:`, err.message);
        }
      });

      fixed++;
    } else {
      console.log(`⚠️  [${row.id}] Could not extract model`);
      console.log(`   Title: ${row.title}`);
      skipped++;
    }

    // Close DB after last record
    if (index === rows.length - 1) {
      setTimeout(() => {
        console.log(`\n📊 Summary:`);
        console.log(`   Fixed: ${fixed}`);
        console.log(`   Skipped: ${skipped}`);
        db.close();
      }, 100);
    }
  });
});
