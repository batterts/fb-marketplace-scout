// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;

    // Update active tab button
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${targetTab}-tab`).classList.add('active');

    // Load data for specific tabs
    if (targetTab === 'inventory') {
      loadMakes();
    }
  });
});

// Launch browser form
document.getElementById('launch-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const category = document.getElementById('category').value;
  const search = document.getElementById('search').value;
  const statusEl = document.getElementById('launch-status');

  // Build query
  let query = category;
  if (search) {
    query = search;
  }

  try {
    const response = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: query })
    });

    const data = await response.json();

    if (data.success) {
      statusEl.textContent = `✅ Browser launched${query ? ` with "${query}"` : ''}`;
      statusEl.className = 'status-message success show';
    } else {
      throw new Error('Launch failed');
    }
  } catch (err) {
    statusEl.textContent = `❌ Error: ${err.message}`;
    statusEl.className = 'status-message error show';
  }

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 5000);
});

// Inventory: Load makes
async function loadMakes() {
  try {
    const response = await fetch('/api/inventory/makes');
    const makes = await response.json();

    const makeSelect = document.getElementById('make-select');
    makeSelect.innerHTML = '<option value="">Select Make...</option>';

    makes.forEach(make => {
      const option = document.createElement('option');
      option.value = make.make;
      option.textContent = `${make.make} (${make.count})`;
      makeSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading makes:', err);
  }
}

// Inventory: Make selected
document.getElementById('make-select').addEventListener('change', async (e) => {
  const make = e.target.value;
  const yearSelect = document.getElementById('year-select');
  const modelSelect = document.getElementById('model-select');

  // Reset downstream selects
  modelSelect.innerHTML = '<option value="">Select Model...</option>';
  modelSelect.disabled = true;
  document.getElementById('inventory-results').innerHTML = '';

  if (!make) {
    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    yearSelect.disabled = true;
    return;
  }

  try {
    const response = await fetch(`/api/inventory/makes/${encodeURIComponent(make)}/years`);
    const years = await response.json();

    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year.year;
      option.textContent = `${year.year} (${year.count})`;
      yearSelect.appendChild(option);
    });
    yearSelect.disabled = false;
  } catch (err) {
    console.error('Error loading years:', err);
  }
});

// Inventory: Year selected
document.getElementById('year-select').addEventListener('change', async (e) => {
  const year = e.target.value;
  const make = document.getElementById('make-select').value;
  const modelSelect = document.getElementById('model-select');

  document.getElementById('inventory-results').innerHTML = '';

  if (!year) {
    modelSelect.innerHTML = '<option value="">Select Model...</option>';
    modelSelect.disabled = true;
    return;
  }

  try {
    const response = await fetch(`/api/inventory/makes/${encodeURIComponent(make)}/years/${year}/models`);
    const models = await response.json();

    modelSelect.innerHTML = '<option value="">Select Model...</option>';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.model;
      option.textContent = `${model.model} (${model.count})`;
      modelSelect.appendChild(option);
    });
    modelSelect.disabled = false;
  } catch (err) {
    console.error('Error loading models:', err);
  }
});

// Inventory: Model selected - show evaluations
document.getElementById('model-select').addEventListener('change', async (e) => {
  const model = e.target.value;
  const year = document.getElementById('year-select').value;
  const make = document.getElementById('make-select').value;
  const resultsDiv = document.getElementById('inventory-results');

  if (!model) {
    resultsDiv.innerHTML = '';
    return;
  }

  resultsDiv.innerHTML = '<div class="spinner"></div>';

  try {
    const response = await fetch(`/api/inventory/${year}/${encodeURIComponent(make)}/${encodeURIComponent(model)}/evaluations`);
    const evaluations = await response.json();

    if (evaluations.length === 0) {
      resultsDiv.innerHTML = '<p class="muted text-center">No evaluations found</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';

    evaluations.forEach(eval => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const date = new Date(eval.evaluated_at).toLocaleDateString();
      const price = eval.price ? `$${parseInt(eval.price).toLocaleString()}` : 'N/A';

      card.innerHTML = `
        <h4>${eval.title || 'Untitled'}</h4>
        <div class="price">${price}</div>
        <div class="details">
          <p>📍 ${eval.location || 'Unknown location'}</p>
          <p>🔍 Flip: ${eval.flip_score}/10 | Weird: ${eval.weirdness_score}/10 | Scam: ${eval.scam_likelihood}/10</p>
          <p>📅 ${date}</p>
          ${eval.notes ? `<p style="margin-top: 10px; font-size: 0.85em;">${eval.notes.substring(0, 100)}...</p>` : ''}
        </div>
      `;

      grid.appendChild(card);
    });

    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(grid);

    // Also load comparables for analytics
    loadComparables(year, make, model);
  } catch (err) {
    console.error('Error loading evaluations:', err);
    resultsDiv.innerHTML = '<p class="error">Error loading evaluations</p>';
  }
});

// Load comparables and show chart
async function loadComparables(year, make, model) {
  try {
    const response = await fetch(`/api/comparables/${year}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`);

    if (!response.ok) {
      console.log('No comparables data available');
      return;
    }

    const data = await response.json();

    // Switch to analytics tab and show data
    const analyticsControls = document.getElementById('analytics-controls');
    analyticsControls.innerHTML = `
      <h3>${year} ${make} ${model}</h3>
      <p>Median: $${data.median.toLocaleString()} | Range: $${data.min.toLocaleString()} - $${data.max.toLocaleString()}</p>
      <p>${data.count} comparables found | Last updated: ${new Date(data.lastUpdated).toLocaleDateString()}</p>
    `;

    // Create price distribution chart
    const ctx = document.getElementById('price-chart').getContext('2d');

    // Destroy existing chart if any
    if (window.priceChart) {
      window.priceChart.destroy();
    }

    // Create histogram bins
    const binSize = Math.ceil((data.max - data.min) / 10);
    const bins = [];
    const labels = [];

    for (let i = data.min; i <= data.max; i += binSize) {
      labels.push(`$${i.toLocaleString()}`);
      const count = data.prices.filter(p => p >= i && p < i + binSize).length;
      bins.push(count);
    }

    window.priceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Listings',
          data: bins,
          backgroundColor: 'rgba(74, 158, 255, 0.6)',
          borderColor: 'rgba(74, 158, 255, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `${year} ${make} ${model} - Price Distribution`,
            font: { size: 16 }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    // Show individual prices
    const comparablesList = document.getElementById('comparables-list');
    comparablesList.innerHTML = '<h3>Individual Comparables</h3>';

    data.prices.forEach((price, i) => {
      const item = document.createElement('div');
      item.className = 'comparable-item';
      item.innerHTML = `
        <span class="price">$${price.toLocaleString()}</span>
        <span class="details">Listing ${i + 1}</span>
      `;
      comparablesList.appendChild(item);
    });

  } catch (err) {
    console.error('Error loading comparables:', err);
  }
}

// Load recent activity on page load
async function loadRecentActivity() {
  try {
    const response = await fetch('/api/inventory/summary');
    const summary = await response.json();

    const recentDiv = document.getElementById('recent-activity');

    if (summary.length === 0) {
      return;
    }

    const recent = summary.slice(0, 5);
    recentDiv.innerHTML = '<h4>Recent Evaluations</h4>';

    recent.forEach(item => {
      const el = document.createElement('div');
      el.className = 'comparable-item';
      el.innerHTML = `
        <span>${item.year} ${item.make} ${item.model}</span>
        <span class="muted">${item.count} evaluation${item.count > 1 ? 's' : ''}</span>
      `;
      recentDiv.appendChild(el);
    });
  } catch (err) {
    console.error('Error loading recent activity:', err);
  }
}

// Initialize
loadRecentActivity();
