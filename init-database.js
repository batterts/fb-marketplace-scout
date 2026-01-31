#!/usr/bin/env node
/**
 * Initialize Database - Create all tables from scratch
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'marketplace.db');

console.log('🔄 Initializing database...\n');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // Create evaluations table
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
      process.exit(1);
    }
    console.log('✅ Evaluations table created');
  });

  // Create comparable_pricing table
  console.log('📋 Creating comparable_pricing table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS comparable_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_key TEXT UNIQUE NOT NULL,
      year INTEGER,
      make TEXT,
      model TEXT,
      prices TEXT,
      listings TEXT,
      median_price INTEGER,
      sample_count INTEGER,
      min_price INTEGER,
      max_price INTEGER,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating comparable_pricing table:', err.message);
      process.exit(1);
    }
    console.log('✅ Comparable_pricing table created');

    console.log('\n✅ Database initialized successfully!');
    console.log(`📁 Location: ${DB_PATH}\n`);

    db.close();
  });
});
