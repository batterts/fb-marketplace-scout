#!/usr/bin/env node
// Initialize comparable pricing database

const { initComparableDB } = require('./comparable-pricing.js');

console.log('🔧 Initializing comparable pricing database...\n');

initComparableDB()
  .then(() => {
    console.log('✅ Database initialized successfully!\n');
    console.log('Table created: comparable_pricing');
    console.log('  - Stores market pricing data from FB Marketplace');
    console.log('  - Caches results for 24 hours');
    console.log('  - Builds up pricing knowledge over time\n');
  })
  .catch((err) => {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  });
