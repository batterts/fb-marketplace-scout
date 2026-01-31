const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, 'marketplace.db');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database helper
function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// API Routes

// Get inventory summary (all unique make/model/year combinations)
app.get('/api/inventory/summary', async (req, res) => {
  try {
    const summary = await queryDb(`
      SELECT
        DISTINCT vehicle_year as year,
        vehicle_make as make,
        vehicle_model as model,
        COUNT(*) as count
      FROM evaluations
      WHERE vehicle_year IS NOT NULL
      GROUP BY vehicle_year, vehicle_make, vehicle_model
      ORDER BY vehicle_make, vehicle_year DESC
    `);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all makes
app.get('/api/inventory/makes', async (req, res) => {
  try {
    const makes = await queryDb(`
      SELECT
        vehicle_make as make,
        COUNT(*) as count,
        MIN(vehicle_year) as min_year,
        MAX(vehicle_year) as max_year
      FROM evaluations
      WHERE vehicle_make IS NOT NULL
      GROUP BY vehicle_make
      ORDER BY vehicle_make
    `);
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get years for a specific make
app.get('/api/inventory/makes/:make/years', async (req, res) => {
  try {
    const { make } = req.params;
    const years = await queryDb(`
      SELECT
        DISTINCT vehicle_year as year,
        COUNT(*) as count
      FROM evaluations
      WHERE vehicle_make = ? AND vehicle_year IS NOT NULL
      GROUP BY vehicle_year
      ORDER BY vehicle_year DESC
    `, [make]);
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get models for a specific make and year
app.get('/api/inventory/makes/:make/years/:year/models', async (req, res) => {
  try {
    const { make, year } = req.params;
    const models = await queryDb(`
      SELECT
        DISTINCT vehicle_model as model,
        COUNT(*) as count
      FROM evaluations
      WHERE vehicle_make = ? AND vehicle_year = ?
      GROUP BY vehicle_model
      ORDER BY vehicle_model
    `, [make, year]);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comparables for a specific make/model/year
app.get('/api/comparables/:year/:make/:model', async (req, res) => {
  try {
    const { year, make, model } = req.params;

    // Generate search key (same as comparable-pricing.js)
    const modelNormalized = model
      .toLowerCase()
      .replace(/\b(limited|sport|base|premium|lx|ex|sr5|xlt|slt)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const searchKey = `${year}_${make.toLowerCase()}_${modelNormalized}`;

    const comparable = await queryDb(`
      SELECT * FROM comparable_pricing
      WHERE search_key = ?
    `, [searchKey]);

    if (comparable.length > 0) {
      const data = comparable[0];
      res.json({
        year,
        make,
        model,
        prices: JSON.parse(data.prices),
        median: data.median_price,
        min: data.min_price,
        max: data.max_price,
        count: data.sample_count,
        lastUpdated: data.last_updated
      });
    } else {
      res.status(404).json({ error: 'No comparables found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all evaluations for a specific vehicle
app.get('/api/inventory/:year/:make/:model/evaluations', async (req, res) => {
  try {
    const { year, make, model } = req.params;
    const evaluations = await queryDb(`
      SELECT * FROM evaluations
      WHERE vehicle_year = ? AND vehicle_make = ? AND vehicle_model LIKE ?
      ORDER BY evaluated_at DESC
    `, [year, make, `%${model}%`]);
    res.json(evaluations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch browser with category
app.post('/api/launch', async (req, res) => {
  try {
    const { category } = req.body;

    // Launch the scout browser with category
    exec(`node scout-browser.js "${category || ''}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Launch error: ${error}`);
      }
      console.log(stdout);
    });

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ollama: process.env.OLLAMA_HOST || 'http://localhost:11434'
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Scout Web Server running at http://localhost:${PORT}`);
  console.log(`📊 Database: ${DB_PATH}`);
  console.log(`🤖 Ollama: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
});
