#!/usr/bin/env node
/**
 * Database Migration - Create evaluations table and migrate data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'marketplace.db');

console.log('🔄 Starting database migration...\n');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // Create evaluations table with proper schema
  console.log('📋 Creating evaluations table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_url TEXT UNIQUE NOT NULL,
      title TEXT,
      price TEXT,
      description TEXT,
      location TEXT,
      evaluated BOOLEAN DEFAULT 1,
      flip_score INTEGER,
      weirdness_score INTEGER,
      scam_likelihood INTEGER,
      notes TEXT,
      vehicle_year INTEGER,
      vehicle_make TEXT,
      vehicle_model TEXT,
      vehicle_mileage TEXT,
      evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating evaluations table:', err.message);
      return;
    }
    console.log('✅ Evaluations table created\n');

    // Migrate existing data from listings to evaluations
    console.log('🔄 Migrating data from listings to evaluations...');
    db.run(`
      INSERT OR IGNORE INTO evaluations (
        listing_url, title, price, description, location,
        evaluated, flip_score, weirdness_score, scam_likelihood, notes,
        evaluated_at, discovered_at
      )
      SELECT
        listing_url, title, price, description, location,
        evaluated, flip_score, weirdness_score, scam_likelihood, notes,
        COALESCE(discovered_at, CURRENT_TIMESTAMP),
        COALESCE(discovered_at, CURRENT_TIMESTAMP)
      FROM listings
      WHERE evaluated = 1
    `, function(err) {
      if (err) {
        console.error('❌ Migration error:', err.message);
        return;
      }

      console.log(`✅ Migrated ${this.changes} records from listings to evaluations\n`);

      // Show summary
      db.get('SELECT COUNT(*) as total FROM evaluations', (err, row) => {
        if (!err) {
          console.log(`📊 Total evaluations: ${row.total}`);
        }
      });

      db.get('SELECT COUNT(*) as total FROM evaluations WHERE vehicle_make IS NOT NULL', (err, row) => {
        if (!err) {
          console.log(`🚗 Vehicle evaluations: ${row.total}`);
        }
      });

      db.get('SELECT COUNT(*) as total FROM comparable_pricing', (err, row) => {
        if (!err) {
          console.log(`📋 Comparable pricing records: ${row.total}`);
        }

        console.log('\n✅ Migration complete!');
        db.close();
      });
    });
  });
});
