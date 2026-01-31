#!/usr/bin/env node
/**
 * Test saving comparables to evaluations table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { saveComparablesToEvaluations } = require('./save-comparables-to-evaluations.js');

const DB_PATH = path.join(__dirname, 'marketplace.db');

async function test() {
  console.log('🧪 Testing comparable saving to evaluations table\n');

  // Get existing comparable data from database
  const db = new sqlite3.Database(DB_PATH);

  db.get(`
    SELECT * FROM comparable_pricing
    WHERE search_key LIKE '2007_mercedes%'
    LIMIT 1
  `, async (err, row) => {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }

    if (!row) {
      console.log('⚠️  No Mercedes comparables found in database');
      db.close();
      return;
    }

    console.log(`Found: ${row.search_key}`);
    console.log(`Samples: ${row.sample_count}`);
    console.log(`Median: $${row.median_price?.toLocaleString()}\n`);

    const comparableData = {
      prices: JSON.parse(row.prices),
      listings: row.listings ? JSON.parse(row.listings) : [],
      median: row.median_price,
      count: row.sample_count
    };

    console.log(`📋 Found ${comparableData.listings.length} comparable listings\n`);

    if (comparableData.listings.length === 0) {
      console.log('⚠️  No listings data (old format). Need to re-scrape.');
      db.close();
      return;
    }

    // Show first 3 listings
    console.log('Sample listings:');
    comparableData.listings.slice(0, 3).forEach((listing, i) => {
      console.log(`${i + 1}. $${listing.price?.toLocaleString()} - ${listing.description} · ${listing.location} · ${listing.mileage}`);
    });

    console.log('\n📥 Saving to evaluations table...\n');

    try {
      const savedCount = await saveComparablesToEvaluations(
        row.year,
        row.make,
        'SL 550', // Normalized model
        comparableData
      );

      console.log(`\n✅ Saved ${savedCount} comparables to evaluations table`);

      // Check evaluations table
      db.all(`
        SELECT id, title, price, location, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, evaluated
        FROM evaluations
        WHERE vehicle_make LIKE '%Mercedes%'
        ORDER BY id DESC
        LIMIT 5
      `, [], (err, rows) => {
        if (err) {
          console.error('❌ Error:', err);
        } else {
          console.log(`\n📊 Latest Mercedes evaluations in database:`);
          rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.vehicle_year} ${row.vehicle_make} ${row.vehicle_model} - ${row.price} - ${row.location} (Evaluated: ${row.evaluated ? 'Yes' : 'No'})`);
          });
        }

        db.close();
      });
    } catch (err) {
      console.error('❌ Error saving:', err);
      db.close();
    }
  });
}

test();
