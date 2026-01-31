const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getComparablePricing } = require('./comparable-pricing.js');

const DB_PATH = path.join(__dirname, 'marketplace.db');

// Vehicle valuation helper
function extractVehicleInfo(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // Check if it's a vehicle listing
  const carBrands = ['toyota', 'honda', 'ford', 'chevy', 'chevrolet', 'nissan', 'subaru',
                     'mazda', 'hyundai', 'kia', 'bmw', 'mercedes', 'audi', 'volkswagen',
                     'jeep', 'dodge', 'ram', 'gmc', 'buick', 'cadillac', 'lexus', 'acura',
                     'infiniti', 'volvo', 'tesla', 'mini'];

  const carTypes = ['sedan', 'suv', 'truck', 'coupe', 'convertible', 'hatchback', 'van',
                    'minivan', 'wagon', 'crossover', 'pickup'];

  // Popular model names (helps catch listings without brand names)
  const popularModels = {
    'dakota': 'Dodge',
    'silverado': 'Chevrolet',
    'f150': 'Ford',
    'f-150': 'Ford',
    'f250': 'Ford',
    'f-250': 'Ford',
    'f350': 'Ford',
    'f-350': 'Ford',
    'ranger': 'Ford',
    'tacoma': 'Toyota',
    'tundra': 'Toyota',
    'camry': 'Toyota',
    'corolla': 'Toyota',
    'accord': 'Honda',
    'civic': 'Honda',
    'pilot': 'Honda',
    'outback': 'Subaru',
    'forester': 'Subaru',
    'crosstrek': 'Subaru',
    'impreza': 'Subaru',
    'wrx': 'Subaru',
    'wrangler': 'Jeep',
    'cherokee': 'Jeep',
    'grand cherokee': 'Jeep',
    'compass': 'Jeep',
    'gladiator': 'Jeep',
    'ram 1500': 'RAM',
    'ram 2500': 'RAM',
    'tahoe': 'Chevrolet',
    'suburban': 'Chevrolet',
    'colorado': 'Chevrolet',
    'malibu': 'Chevrolet',
    'altima': 'Nissan',
    'sentra': 'Nissan',
    'frontier': 'Nissan',
    'titan': 'Nissan',
    'pathfinder': 'Nissan',
    'rogue': 'Nissan',
    'mustang': 'Ford',
    'explorer': 'Ford',
    'escape': 'Ford',
    'expedition': 'Ford',
    'bronco': 'Ford',
    'model 3': 'Tesla',
    'model s': 'Tesla',
    'model x': 'Tesla',
    'model y': 'Tesla'
  };

  const hasCarBrand = carBrands.some(brand => text.includes(brand));
  const hasCarType = carTypes.some(type => text.includes(type));

  // Check for popular model names
  let detectedModel = null;
  let detectedMakeFromModel = null;
  for (const [model, make] of Object.entries(popularModels)) {
    if (text.includes(model)) {
      detectedModel = model;
      detectedMakeFromModel = make;
      break;
    }
  }

  if (!hasCarBrand && !hasCarType && !detectedModel) {
    return null; // Not a vehicle
  }

  // Extract year (4 digits between 1990-2026)
  const yearMatch = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract mileage (look for patterns like "150k", "150000 miles", "150,000")
  let mileage = null;
  const mileagePatterns = [
    /(\d+)k\s*(miles|mi)?/i,           // "150k" or "150k miles"
    /([\d,]+)\s*(miles|mi)/i,          // "150,000 miles"
    /(\d{5,6})\s*(miles|mi)?/i         // "150000"
  ];

  for (const pattern of mileagePatterns) {
    const match = text.match(pattern);
    if (match) {
      let miles = match[1].replace(/,/g, '');
      if (text.includes('k')) {
        mileage = parseInt(miles) * 1000;
      } else {
        mileage = parseInt(miles);
      }
      break;
    }
  }

  // Extract make - prefer detected make from model, then brand name
  let make = detectedMakeFromModel; // Use make from model if detected

  if (!make) {
    // Fall back to searching for brand names
    for (const brand of carBrands) {
      if (text.includes(brand)) {
        make = brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }
  }

  // Extract model name from title (word after make, before trim/type)
  let model = detectedModel ? detectedModel.charAt(0).toUpperCase() + detectedModel.slice(1) : null;

  if (!model && make) {
    // Try to extract model from title
    const titleLower = title.toLowerCase();
    const makePos = titleLower.indexOf(make.toLowerCase());

    if (makePos >= 0) {
      // Get text after make
      const afterMake = title.substring(makePos + make.length).trim();

      // Extract next 1-2 words as model (stop at trim level, year, or body type)
      const modelMatch = afterMake.match(/^([a-z0-9\-]+(?:\s+[a-z0-9\-]+)?)/i);

      if (modelMatch) {
        let extractedModel = modelMatch[1].trim();

        // Clean up - remove trim levels, body types, years
        const stopWords = /\b(sedan|coupe|suv|truck|van|convertible|hatchback|wagon|pickup|4d|2d|lx|ex|se|le|limited|sport|base|premium|xlt|slt|sr5|hybrid|awd|4wd|fwd|rwd|automatic|manual|v6|v8|4cyl|turbo)\b/i;
        const cleanModel = extractedModel.split(/\s+/).filter(word => !stopWords.test(word) && !/^\d{4}$/.test(word)).join(' ');

        if (cleanModel.length > 0) {
          model = cleanModel.charAt(0).toUpperCase() + cleanModel.slice(1).toLowerCase();
        }
      }
    }
  }

  return { year, mileage, make, model, isVehicle: true };
}

// Detect vehicle condition issues
function detectVehicleCondition(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const conditionIssues = {
    transmission: /transmission (damage|bad|needs|issue|problem|slipping|gone|out|failed)/i,
    engine: /engine (damage|bad|needs|blown|seized|knock|problem|rebuild)/i,
    salvage: /salvage|rebuilt title|branded title|flood damage|total loss/i,
    notRunning: /not running|doesn't run|won't start|no start|needs work|for parts/i,
    frameRust: /frame (damage|rust|rot)|serious rust|rusted (frame|through)/i,
    asIs: /as.?is|parts (only|car)/i,
    needsRepair: /needs (major|expensive) (work|repair)/i
  };

  const detected = [];
  for (const [issue, pattern] of Object.entries(conditionIssues)) {
    if (pattern.test(text)) {
      detected.push(issue);
    }
  }

  const hasMajorIssues = detected.length > 0;
  const isSalvage = detected.includes('salvage');
  const isNotRunning = detected.includes('notRunning');
  const hasTransmissionIssues = detected.includes('transmission');
  const hasEngineIssues = detected.includes('engine');

  return {
    issues: detected,
    hasMajorIssues,
    isSalvage,
    isNotRunning,
    hasTransmissionIssues,
    hasEngineIssues,
    severity: detected.length // 0 = clean, 1-2 = minor, 3+ = major
  };
}

// Estimate vehicle value using depreciation curves
function estimateVehicleValue(year, mileage, priceAsked, condition = null) {
  if (!year) return null;

  const currentYear = 2026;
  const age = currentYear - year;

  // Average new car price (rough baseline)
  const avgNewPrice = 35000;

  // Depreciation curve (exponential decay)
  // Year 0: -20%, Year 1: -15%, Year 2: -12%, Year 3+: -10% per year
  let depreciationRate;
  if (age === 0) depreciationRate = 0.80;
  else if (age === 1) depreciationRate = 0.68;  // 0.80 * 0.85
  else if (age === 2) depreciationRate = 0.60;  // 0.68 * 0.88
  else depreciationRate = 0.60 * Math.pow(0.90, age - 2);

  // Mileage adjustment (average is 12k-15k miles/year)
  const expectedMileage = age * 13000;
  let mileageMultiplier = 1.0;

  if (mileage) {
    const mileageDiff = mileage - expectedMileage;
    // Adjust value by roughly $0.10 per excess mile
    const mileageAdjustment = (mileageDiff * 0.10) / avgNewPrice;
    mileageMultiplier = 1.0 - mileageAdjustment;
    mileageMultiplier = Math.max(0.5, Math.min(1.2, mileageMultiplier)); // Cap between 0.5x and 1.2x
  }

  let estimatedValue = avgNewPrice * depreciationRate * mileageMultiplier;

  // Apply condition adjustments
  let conditionMultiplier = 1.0;
  let conditionNotes = [];

  if (condition && condition.hasMajorIssues) {
    if (condition.isSalvage) {
      conditionMultiplier = 0.5; // Salvage title = 50% of value
      conditionNotes.push('salvage title');
    }
    if (condition.isNotRunning) {
      conditionMultiplier *= 0.4; // Not running = 40% of value
      conditionNotes.push('not running');
    }
    if (condition.hasTransmissionIssues) {
      conditionMultiplier *= 0.7; // Transmission issues = 70% of value
      conditionNotes.push('transmission damage');
    }
    if (condition.hasEngineIssues) {
      conditionMultiplier *= 0.6; // Engine issues = 60% of value
      conditionNotes.push('engine damage');
    }

    // Additional issues (frame rust, etc.) reduce value by 15% each
    const otherIssues = condition.issues.filter(i =>
      !['salvage', 'notRunning', 'transmission', 'engine'].includes(i)
    );
    conditionMultiplier *= Math.pow(0.85, otherIssues.length);

    if (otherIssues.length > 0) {
      conditionNotes.push(`${otherIssues.length} other issue(s)`);
    }
  }

  estimatedValue *= conditionMultiplier;

  // Calculate deal quality (adjusted for condition)
  const percentOfValue = priceAsked / estimatedValue;

  return {
    estimatedValue: Math.round(estimatedValue),
    percentOfValue: Math.round(percentOfValue * 100),
    isGoodDeal: percentOfValue < 0.85,  // More than 15% below estimated value
    isGreatDeal: percentOfValue < 0.70, // More than 30% below estimated value
    conditionAdjusted: condition?.hasMajorIssues || false,
    conditionNotes: conditionNotes
  };
}

// Evaluation prompt for AI
const EVAL_PROMPT = `You are an expert marketplace scout specializing in finding profitable flips, unique items, and avoiding scams.

Score this listing on three metrics (1-10) and provide ACTIONABLE recommendations:

**Flip Potential (1-10):**
- High (8-10): Vintage electronics, test equipment, bulk lots, rare collectibles, estate sales, underpriced branded items, fixable damage
- Medium (4-7): Tools, appliances, furniture, common electronics in good condition
- Low (1-3): Common items at market price, damaged goods that cost more to fix, overpriced items

**Weirdness Score (1-10):**
- High (8-10): Unusual/unique items, vintage tech, oddities, film/darkroom equipment, test gear, niche collectibles
- Medium (4-7): Uncommon but not unique, interesting variations
- Low (1-3): Common everyday items

**Scam Likelihood (1-10):**
- High (8-10): iPhones/MacBooks/PS5/GPUs under market, no location, too good to be true, vague descriptions, "email only"
- Medium (4-7): Suspicious pricing, incomplete info, stock photos only
- Low (1-3): Reasonable prices, detailed descriptions, clear photos, specific condition details

**User Preferences:**
- Location: Seymour, CT (STRONGLY prefer nearby: Naugatuck, Derby, Ansonia, Beacon Falls, Oxford, Waterbury < 10mi)
- Availability: Friday pickups only - BOOST score if near Seymour, LOWER score if far
- Interests: Electronics, film/darkroom gear, test equipment, vintage tech, bulk lots, weird stuff, underpriced vehicles

**Notes Field - Provide ACTIONABLE advice:**
- If high flip potential: Suggest resale platforms (eBay, Craigslist, Facebook), estimated profit, who would buy it
- If vehicle WITH VALUATION DATA: Follow this logic carefully:
  * Already a good deal (< 85% of market): Praise the deal, suggest quick action, inspection checklist only
  * Fair price (85-115% of market): Accept asking price or try 5-10% discount max
  * Overpriced (> 115% of market): Calculate fair offer based on market value, suggest negotiating down
  * NEVER suggest lowballing on something already below market - that's illogical!
- If distance issue: Mention travel time, suggest alternative pickup arrangements
- If potential scam: List specific red flags to verify
- If unique item: Suggest research needed (completed sales, market demand)
- If negotiable: Suggest offer price and negotiation tactics
- If Friday pickup: Note logistics (truck needed, help required, time estimate)

**Examples of GOOD vehicle notes:**
- "Already 30% below market ($9,800 asking vs $14k market) - GREAT DEAL! Move fast before someone else grabs it. Check: transmission shifts smoothly, no frame rust, test 4WD. Bring $9,800 cash for immediate purchase"
- "Asking $22k for $20k market value (110%) - slightly high. Offer $19k, settle at $20k. Check: engine oil color, transmission fluid, brake wear. Budget $1-2k for maintenance"
- "Way overpriced at $18k for $12k market (150%). Counter with $11k based on comparable sales. Walk away if seller won't negotiate - plenty of similar trucks available"

**Examples of GOOD non-vehicle notes:**
- "Resell on eBay for $400-500 (sold comps). Test before buying. 5min drive - perfect Friday pickup"
- "Rare Tektronix scope - $800-1200 on eBay if working. Bring BNC probe to test. Waterbury = 15min"
- "Red flags: Stock photo, no VIN, 'email only'. Ask for video chat + specific photos before meeting"
- "Bulk lot = $5-10/item resale on Mercari. Need truck. Derby (8min) - excellent Friday score"

**Output Format (JSON only, no markdown):**
{
  "flip_score": 7,
  "weirdness_score": 9,
  "scam_likelihood": 2,
  "notes": "Specific actionable advice here"
}`;

// Heuristic evaluation (fallback)
async function heuristicEvaluate(title, price, description, location, browser = null) {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const priceNum = parseFloat(price?.replace(/[^0-9.]/g, '') || '0');

  let flip = 3;
  let weird = 3;
  let scam = 3;
  let notes = '';

  // Check if it's a vehicle and do valuation
  const vehicleInfo = extractVehicleInfo(title, description);
  if (vehicleInfo && vehicleInfo.isVehicle && priceNum > 500) {
    console.log(`   🚗 Vehicle detected: ${JSON.stringify(vehicleInfo)}`);

    // Detect condition issues
    const condition = detectVehicleCondition(title, description);
    if (condition.hasMajorIssues) {
      console.log(`   ⚠️  Condition issues: ${condition.issues.join(', ')}`);
    }

    let estimatedValue = null;
    let valuationSource = 'unknown';
    let sampleCount = 0;

    // Try comparable pricing first (if browser available and we have year/make)
    let comparableListings = [];
    if (browser && vehicleInfo.year && vehicleInfo.make) {
      try {
        const comparables = await getComparablePricing(browser, vehicleInfo.year, vehicleInfo.make, title);
        if (comparables && comparables.median) {
          estimatedValue = comparables.median;
          sampleCount = comparables.count;
          valuationSource = `${sampleCount} comparables`;
          comparableListings = comparables.listings || [];
          console.log(`   💰 Comparable pricing: $${estimatedValue.toLocaleString()} median from ${sampleCount} listings`);
        }
      } catch (err) {
        console.log(`   ⚠️  Comparable pricing failed: ${err.message}`);
      }
    }

    // Fall back to generic depreciation model if no comparables
    if (!estimatedValue) {
      const genericValuation = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum, condition);
      if (genericValuation) {
        estimatedValue = genericValuation.estimatedValue;
        valuationSource = 'generic model';
        console.log(`   💰 Generic valuation: $${estimatedValue.toLocaleString()}`);
      }
    }

    if (estimatedValue) {
      // Apply condition adjustments to comparable pricing
      if (condition.hasMajorIssues && valuationSource.includes('comparables')) {
        let conditionMultiplier = 1.0;
        if (condition.isSalvage) conditionMultiplier *= 0.5;
        if (condition.isNotRunning) conditionMultiplier *= 0.4;
        if (condition.hasTransmissionIssues) conditionMultiplier *= 0.7;
        if (condition.hasEngineIssues) conditionMultiplier *= 0.6;

        const otherIssues = condition.issues.filter(i =>
          !['salvage', 'notRunning', 'transmission', 'engine'].includes(i)
        );
        conditionMultiplier *= Math.pow(0.85, otherIssues.length);

        const adjustedValue = Math.round(estimatedValue * conditionMultiplier);
        console.log(`   ⚠️  Condition-adjusted value: $${adjustedValue.toLocaleString()} (${Math.round(conditionMultiplier * 100)}% of clean)`);
        estimatedValue = adjustedValue;
      }

      const percentOfValue = Math.round((priceNum / estimatedValue) * 100);
      const isGoodDeal = percentOfValue < 85;
      const isGreatDeal = percentOfValue < 70;
      const conditionAdjusted = condition.hasMajorIssues;
      const conditionNotes = [];

      if (conditionAdjusted) {
        if (condition.isSalvage) conditionNotes.push('salvage title');
        if (condition.isNotRunning) conditionNotes.push('not running');
        if (condition.hasTransmissionIssues) conditionNotes.push('transmission damage');
        if (condition.hasEngineIssues) conditionNotes.push('engine damage');
      }

      // Adjust flip/scam scores based on condition
      if (conditionAdjusted) {
        // Has damage - reduce flip potential unless it's a really good price
        if (!isGreatDeal) {
          flip -= 1; // Damaged vehicles are harder to flip unless dirt cheap
        }
        // If condition issues but still expensive, increase scam score
        if (percentOfValue > 80 && condition.severity >= 2) {
          scam += 2; // Multiple issues but not priced accordingly
        }
      }

      // Boost flip score based on deal quality
      if (isGreatDeal) {
        flip += 4;
        notes = `Great deal! Asking ${percentOfValue}% of market ($${estimatedValue.toLocaleString()} from ${valuationSource})`;
      } else if (isGoodDeal) {
        flip += 2;
        notes = `Good deal! Asking ${percentOfValue}% of market ($${estimatedValue.toLocaleString()} from ${valuationSource})`;
      } else if (percentOfValue > 120) {
        flip -= 1;
        scam += 1;
        notes = `Overpriced at ${percentOfValue}% of market ($${estimatedValue.toLocaleString()} from ${valuationSource})`;
      } else {
        notes = `Fair price at ${percentOfValue}% of market ($${estimatedValue.toLocaleString()} from ${valuationSource})`;
      }

      // Add condition warnings
      if (conditionAdjusted && conditionNotes.length > 0) {
        notes += ` ⚠️ HAS: ${conditionNotes.join(', ')}`;
      }

      // Add vehicle details to notes
      if (vehicleInfo.year) notes += ` | ${vehicleInfo.year}`;
      if (vehicleInfo.make) notes += ` ${vehicleInfo.make}`;
      if (vehicleInfo.mileage) notes += ` | ${Math.round(vehicleInfo.mileage / 1000)}k mi`;

      // Note: comparable listings now appended at the end by main evaluator
      // This ensures they show up regardless of which AI method is used

      console.log(`   📝 Vehicle notes: "${notes}"`);
    } else {
      console.log(`   ⚠️  Valuation failed (no year/make or comparable search error)`);
    }
  } else {
    console.log(`   ℹ️  Not a vehicle or price too low (${priceNum})`);
  }

  // Non-vehicle heuristic evaluation
  const actionableNotes = [];

  // Flip boosters
  if (text.match(/vintage|antique|rare|estate|bulk|lot of/)) {
    flip += 3;
    actionableNotes.push('Vintage/rare - research eBay sold listings');
  }
  if (text.match(/free|obo/)) {
    flip += 2;
    actionableNotes.push('Negotiable/free - make lowball offer');
  }
  if (text.match(/oscilloscope|test equipment|darkroom|enlarger|film/)) {
    flip += 2;
    actionableNotes.push('Test equipment - $300-1000 resale potential if working');
  }
  if (priceNum < 50 && priceNum > 0) {
    flip += 1;
    actionableNotes.push('Under $50 - low risk flip');
  }

  // Weirdness boosters
  if (text.match(/tube|valve|oscilloscope|darkroom|enlarger|reel-to-reel/)) {
    weird += 4;
    actionableNotes.push('Niche vintage tech - check audiophile/photography forums');
  }
  if (text.match(/vintage|antique|unique|rare|unusual/)) {
    weird += 2;
  }
  if (text.match(/test equipment|military|industrial/)) {
    weird += 2;
    actionableNotes.push('Industrial/military surplus - specialist market');
  }

  // Scam indicators
  if (text.match(/iphone|macbook|ps5|xbox|airpods/) && priceNum < 200) {
    scam += 5;
    actionableNotes.push('⚠️ TOO CHEAP for electronics - likely scam, verify IMEI/serial');
  }
  if (priceNum < 10 && !text.match(/free/)) {
    scam += 3;
    actionableNotes.push('Suspiciously low price');
  }
  if (!location || location.length < 3) {
    scam += 2;
    actionableNotes.push('No location listed - red flag');
  }
  if (text.match(/dm|whatsapp|telegram|cashapp/)) {
    scam += 4;
    actionableNotes.push('⚠️ Off-platform communication requested - major red flag');
  }

  // Location bonus (nearby = better flip potential)
  const nearbyMatch = location?.match(/seymour|naugatuck|derby|ansonia|beacon falls|oxford/i);
  if (nearbyMatch) {
    flip += 1;
    scam -= 1;
    actionableNotes.push(`✓ ${nearbyMatch[0]} - near you (~5-10min drive)`);
  } else if (location && location.match(/waterbury|meriden|new haven|bridgeport/i)) {
    actionableNotes.push(`${location} - 15-25min drive, doable Friday`);
  }

  // Add general flip advice for non-vehicles
  if (!notes && actionableNotes.length === 0) {
    if (flip >= 7) {
      actionableNotes.push('Good flip potential - act fast');
    } else if (scam >= 7) {
      actionableNotes.push('High scam risk - proceed with caution or skip');
    }
  }

  // Combine notes
  if (!notes) {
    notes = actionableNotes.join('. ');
  } else if (actionableNotes.length > 0) {
    notes += '. ' + actionableNotes.join('. ');
  }

  // Cap scores
  flip = Math.max(1, Math.min(10, flip));
  weird = Math.max(1, Math.min(10, weird));
  scam = Math.max(1, Math.min(10, scam));

  // Set default notes if not set by vehicle valuation
  if (!notes) {
    notes = flip >= 7 ? 'Good flip potential' : weird >= 7 ? 'Interesting item' : scam >= 7 ? 'High scam risk' : 'Standard listing';
  }

  return { flip_score: flip, weirdness_score: weird, scam_likelihood: scam, notes };
}

// Evaluate using Anthropic API
async function evaluateWithAnthropic(title, price, description, location, vehicleContext = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    // Build prompt with vehicle valuation context
    let contextInfo = '';
    if (vehicleContext) {
      contextInfo = `\n\n**VEHICLE VALUATION DATA:**
- Asking Price: ${vehicleContext.askingPrice}
- Market Value: ${vehicleContext.marketValue} (from ${vehicleContext.source})
- Deal Quality: ${vehicleContext.dealQuality}
- Percent of Market: ${vehicleContext.percentOfMarket}%
- Condition: ${vehicleContext.condition}${vehicleContext.comparables || ''}

**IMPORTANT:** Use this data for your recommendation. If asking price is already below market (< 85%), it's a GOOD DEAL - don't suggest lowballing. If asking price is above market (> 115%), suggest negotiating down to fair value.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `${EVAL_PROMPT}${contextInfo}\n\n**Listing:**\nTitle: ${title}\nPrice: ${price}\nLocation: ${location}\nDescription: ${description}`
        }]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        flip_score: result.flip_score,
        weirdness_score: result.weirdness_score,
        scam_likelihood: result.scam_likelihood,
        notes: result.notes || ''
      };
    }
  } catch (err) {
    console.error('Anthropic API error:', err.message);
  }

  return null;
}

// Get available Ollama models
async function getAvailableOllamaModel() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return null;

    const data = await response.json();
    if (data.models && data.models.length > 0) {
      // Prefer mistral, llama3, or first available
      const preferred = ['mistral', 'llama3', 'llama2'];
      for (const pref of preferred) {
        const found = data.models.find(m => m.name.toLowerCase().includes(pref));
        if (found) return found.name;
      }
      return data.models[0].name;
    }
  } catch (err) {
    return null;
  }
  return null;
}

// Evaluate using Ollama (free, local)
async function evaluateWithOllama(title, price, description, location, vehicleContext = null) {
  try {
    // Get available model
    const model = await getAvailableOllamaModel();
    if (!model) {
      console.log('   ⚠️  No Ollama models available');
      return null;
    }

    console.log(`   🦙 Using Ollama model: ${model}`);

    // Build prompt with vehicle valuation context
    let contextInfo = '';
    if (vehicleContext) {
      contextInfo = `\n\n**VEHICLE VALUATION DATA:**
- Asking Price: ${vehicleContext.askingPrice}
- Market Value: ${vehicleContext.marketValue} (from ${vehicleContext.source})
- Deal Quality: ${vehicleContext.dealQuality}
- Percent of Market: ${vehicleContext.percentOfMarket}%
- Condition: ${vehicleContext.condition}${vehicleContext.comparables || ''}

**IMPORTANT:** Use this data for your recommendation. If asking price is already below market (< 85%), it's a GOOD DEAL - don't suggest lowballing. If asking price is above market (> 115%), suggest negotiating down to fair value.`;
    }

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `${EVAL_PROMPT}${contextInfo}\n\n**Listing:**\nTitle: ${title}\nPrice: ${price}\nLocation: ${location}\nDescription: ${description || 'No description'}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });

    if (!response.ok) {
      console.log(`   ⚠️  Ollama API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Try to extract JSON from response
    let jsonMatch = data.response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return {
          flip_score: Math.min(10, Math.max(1, result.flip_score || 5)),
          weirdness_score: Math.min(10, Math.max(1, result.weirdness_score || 5)),
          scam_likelihood: Math.min(10, Math.max(1, result.scam_likelihood || 5)),
          notes: result.notes || ''
        };
      } catch (parseErr) {
        console.log('   ⚠️  Failed to parse Ollama JSON response');
        return null;
      }
    }

    console.log('   ⚠️  No JSON found in Ollama response');
  } catch (err) {
    console.log(`   ⚠️  Ollama error: ${err.message}`);
    return null;
  }

  return null;
}

// Main evaluation function
async function evaluateListing(title, price, description, location, browser = null) {
  console.log(`📋 Evaluating: ${title}`);

  // Check if it's a vehicle and get valuation data first (for AI context)
  let vehicleContext = null;
  const priceNum = parseFloat(price?.replace(/[^0-9.]/g, '') || '0');
  const vehicleInfo = extractVehicleInfo(title, description);

  if (vehicleInfo && vehicleInfo.isVehicle && priceNum > 500 && browser) {
    console.log(`   🚗 Vehicle detected: ${JSON.stringify(vehicleInfo)}`);

    const condition = detectVehicleCondition(title, description);
    if (condition.hasMajorIssues) {
      console.log(`   ⚠️  Condition issues: ${condition.issues.join(', ')}`);
    }

    // Get comparable pricing
    if (vehicleInfo.year && vehicleInfo.make) {
      try {
        const comparables = await getComparablePricing(browser, vehicleInfo.year, vehicleInfo.make, title);
        if (comparables && comparables.median) {
          let marketValue = comparables.median;

          // Apply condition adjustments
          let conditionMultiplier = 1.0;
          if (condition.isSalvage) conditionMultiplier *= 0.5;
          if (condition.isNotRunning) conditionMultiplier *= 0.4;
          if (condition.hasTransmissionIssues) conditionMultiplier *= 0.7;
          if (condition.hasEngineIssues) conditionMultiplier *= 0.6;

          const adjustedValue = Math.round(marketValue * conditionMultiplier);
          const percentOfMarket = Math.round((priceNum / adjustedValue) * 100);

          let dealQuality = 'Fair price';
          if (percentOfMarket < 70) dealQuality = 'Great deal';
          else if (percentOfMarket < 85) dealQuality = 'Good deal';
          else if (percentOfMarket > 120) dealQuality = 'Overpriced';

          // Format comparable listings for context (with HTML links)
          let comparablesText = '';
          if (comparables.listings && comparables.listings.length > 0) {
            comparablesText = '\n\nComparables found:';
            comparables.listings.slice(0, 12).forEach((listing, i) => {
              // Use structured data from extraction
              const desc = listing.description || listing.text.substring(0, 60);
              const parts = [];

              if (desc) parts.push(desc);
              if (listing.location) parts.push(listing.location);
              if (listing.mileage) parts.push(listing.mileage);

              const details = parts.join(' · ');

              // Format with clickable link
              if (listing.url) {
                comparablesText += `\n${i + 1}. <a href="${listing.url}" target="_blank" style="color: #4a9eff; text-decoration: none;">$${listing.price.toLocaleString()}</a> - ${details}`;
              } else {
                comparablesText += `\n${i + 1}. $${listing.price.toLocaleString()} - ${details}`;
              }
            });
            if (comparables.listings.length > 12) {
              comparablesText += `\n...and ${comparables.listings.length - 12} more`;
            }
          }

          vehicleContext = {
            askingPrice: `$${priceNum.toLocaleString()}`,
            marketValue: `$${adjustedValue.toLocaleString()}`,
            source: `${comparables.count} FB comparables`,
            percentOfMarket: percentOfMarket,
            dealQuality: dealQuality,
            condition: condition.hasMajorIssues ? condition.issues.join(', ') : 'No major issues detected',
            year: vehicleInfo.year,
            make: vehicleInfo.make,
            mileage: vehicleInfo.mileage,
            comparables: comparablesText
          };

          console.log(`   💰 Market: ${vehicleContext.marketValue} | Asking: ${vehicleContext.askingPrice} (${percentOfMarket}%)`);
        }
      } catch (err) {
        console.log(`   ⚠️  Comparable pricing failed: ${err.message}`);
      }
    }
  }

  // Try Anthropic first (with vehicle context)
  let scores = await evaluateWithAnthropic(title, price, description, location, vehicleContext);
  let method = 'anthropic';

  if (!scores) {
    // Try Ollama second (with vehicle context)
    scores = await evaluateWithOllama(title, price, description, location, vehicleContext);
    method = 'ollama';
  }

  if (!scores) {
    // Fall back to heuristic (with comparable pricing for vehicles)
    scores = await heuristicEvaluate(title, price, description, location, browser);
    method = 'heuristic';
  }

  console.log(`   ✅ ${method.charAt(0).toUpperCase() + method.slice(1)}: Flip=${scores.flip_score} Weird=${scores.weirdness_score} Scam=${scores.scam_likelihood}`);

  // Append comparable listings to notes if we have vehicle context
  if (vehicleContext && vehicleContext.comparables) {
    scores.notes = (scores.notes || '') + vehicleContext.comparables;
  }

  return { ...scores, method };
}

// Save evaluation to database
function saveEvaluation(itemId, scores, title = null, description = null, price = null, location = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    console.log(`   💾 [DB] Saving evaluation for itemId: ${itemId}`);

    const listingUrl = `https://www.facebook.com/marketplace/item/${itemId}/`;

    // Extract vehicle info if it's a vehicle
    const vehicleInfo = extractVehicleInfo(title);
    let vehicleYear = null;
    let vehicleMake = null;
    let vehicleModel = null;
    let vehicleMileage = null;

    if (vehicleInfo.isVehicle && vehicleInfo.year && vehicleInfo.make) {
      vehicleYear = vehicleInfo.year;
      vehicleMake = vehicleInfo.make;
      vehicleModel = vehicleInfo.model || null;

      // Extract mileage from description
      if (description) {
        const mileageMatch = description.match(/(\d{1,3})[,\s]?(\d{3})\s*(miles|mi|k|km)/i) ||
                            description.match(/(\d{1,3})k\s*(miles|mi)/i);
        if (mileageMatch) {
          if (mileageMatch[0].toLowerCase().includes('k')) {
            vehicleMileage = `${mileageMatch[1]}K miles`;
          } else {
            vehicleMileage = `${mileageMatch[1]}${mileageMatch[2] || ''} miles`;
          }
        }
      }

      console.log(`   🚗 [DB] Vehicle detected: ${vehicleYear} ${vehicleMake} ${vehicleModel || ''}`);
    }

    // Insert or replace into evaluations table
    db.run(`
      INSERT OR REPLACE INTO evaluations (
        listing_url, title, price, description, location,
        evaluated, flip_score, weirdness_score, scam_likelihood, notes,
        vehicle_year, vehicle_make, vehicle_model, vehicle_mileage,
        evaluated_at
      )
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      listingUrl,
      title,
      price,
      description,
      location,
      scores.flip_score,
      scores.weirdness_score,
      scores.scam_likelihood,
      scores.notes,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleMileage
    ], function(err) {
      db.close();
      if (err) {
        console.log(`   ❌ [DB] Save error: ${err.message}`);
        reject(err);
      } else {
        console.log(`   ✅ [DB] Saved evaluation (ID: ${this.lastID})`);
        resolve();
      }
    });
  });
}

module.exports = {
  evaluateListing,
  saveEvaluation,
  extractVehicleInfo,
  estimateVehicleValue,
  detectVehicleCondition
};
