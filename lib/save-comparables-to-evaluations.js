const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'marketplace.db');

// Save comparable listings as evaluation records (so they appear in inventory dropdown)
function saveComparablesToEvaluations(year, make, model, comparableData) {
  return new Promise((resolve, reject) => {
    if (!comparableData || !comparableData.listings || comparableData.listings.length === 0) {
      resolve(0);
      return;
    }

    const db = new sqlite3.Database(DB_PATH);
    let savedCount = 0;

    // Use serialize to handle multiple inserts sequentially
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO evaluations
        (listing_url, title, price, location, vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, evaluated, evaluated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
      `);

      comparableData.listings.forEach(listing => {
        // Only save if we have a URL (to avoid duplicates via UNIQUE constraint)
        if (listing.url) {
          const title = listing.description || listing.text?.substring(0, 100) || `${year} ${make} ${model}`;
          const price = listing.price ? `$${listing.price.toLocaleString()}` : null;
          const location = listing.location || null;
          const mileage = listing.mileage || null;

          stmt.run([
            listing.url,
            title,
            price,
            location,
            year,
            make,
            model,
            mileage
          ], function(err) {
            if (!err && this.changes > 0) {
              savedCount++;
            }
          });
        }
      });

      stmt.finalize(() => {
        db.close();
        console.log(`   💾 Saved ${savedCount} comparable listings to evaluations table`);
        resolve(savedCount);
      });
    });
  });
}

module.exports = { saveComparablesToEvaluations };
