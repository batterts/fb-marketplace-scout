#!/usr/bin/env node
/**
 * Test vehicle info extraction
 */

// Inline the extraction function for testing
function extractVehicleInfo(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // Check if it's a vehicle listing
  // IMPORTANT: Hyphenated brands MUST come before their short versions
  const carBrands = ['mercedes-benz', 'rolls-royce', 'land rover', 'range rover', 'aston martin',
                     'alfa romeo', 'toyota', 'honda', 'ford', 'chevy', 'chevrolet', 'nissan', 'subaru',
                     'mazda', 'hyundai', 'kia', 'bmw', 'mercedes', 'audi', 'volkswagen', 'vw',
                     'jeep', 'dodge', 'ram', 'gmc', 'buick', 'cadillac', 'lexus', 'acura',
                     'infiniti', 'volvo', 'tesla', 'mini', 'porsche', 'ferrari', 'lamborghini',
                     'maserati', 'bentley', 'jaguar', 'lotus', 'mclaren', 'bugatti'];

  const carTypes = ['sedan', 'suv', 'truck', 'coupe', 'convertible', 'hatchback', 'van',
                    'minivan', 'wagon', 'crossover', 'pickup'];

  const hasCarBrand = carBrands.some(brand => text.includes(brand));
  const hasCarType = carTypes.some(type => text.includes(type));

  if (!hasCarBrand && !hasCarType) {
    return null; // Not a vehicle
  }

  // Extract year (4 digits between 1990-2026)
  const yearMatch = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract make
  let make = null;
  for (const brand of carBrands) {
    if (text.includes(brand)) {
      // Properly capitalize multi-word brands (Mercedes-Benz, Land Rover, etc.)
      const separator = brand.includes('-') ? '-' : ' ';
      make = brand.split(separator)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(separator);
      break;
    }
  }

  // Extract model name from title (word after make, before trim/type)
  let model = null;

  if (make) {
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
        const stopWords = /\b(sedan|coupe|suv|truck|van|convertible|hatchback|wagon|pickup|roadster|4d|2d|lx|ex|se|le|limited|sport|base|premium|xlt|slt|sr5|hybrid|awd|4wd|fwd|rwd|automatic|manual|v6|v8|4cyl|turbo)\b/i;
        const cleanModel = extractedModel.split(/\s+/).filter(word => !stopWords.test(word) && !/^\d{4}$/.test(word)).join(' ');

        if (cleanModel.length > 0) {
          model = cleanModel.charAt(0).toUpperCase() + cleanModel.slice(1).toLowerCase();
        }
      }
    }
  }

  return { year, make, model, isVehicle: true };
}

// Test cases
const tests = [
  { title: '2007 Mercedes-Benz SL 550 Roadster 2D', price: '$3,000', expected: { year: 2007, make: 'Mercedes-Benz', model: 'Sl 550' } },
  { title: '2004 Honda Civic', price: '$5,000', expected: { year: 2004, make: 'Honda', model: 'Civic' } },
  { title: '2017 Hyundai elantra SE Sedan 4D', price: '$12,000', expected: { year: 2017, make: 'Hyundai', model: 'Elantra' } },
  { title: '1965 Ford mustang Fastback C Code', price: '$25,000', expected: { year: 1965, make: 'Ford', model: 'Mustang' } },
  { title: '2020 Land Rover Range Rover Sport', price: '$55,000', expected: { year: 2020, make: 'Land Rover', model: 'Range rover' } },
  { title: '2015 Rolls-Royce Ghost', price: '$120,000', expected: { year: 2015, make: 'Rolls-Royce', model: 'Ghost' } }
];

console.log('🧪 Testing Vehicle Info Extraction\n');

let passed = 0;
let failed = 0;

tests.forEach((test, i) => {
  const result = extractVehicleInfo(test.title, '');
  const yearOk = result.year === test.expected.year;
  const makeOk = result.make === test.expected.make;
  const modelOk = result.model === test.expected.model;

  if (yearOk && makeOk && modelOk) {
    console.log(`✅ Test ${i + 1}: "${test.title}"`);
    console.log(`   Year: ${result.year}, Make: ${result.make}, Model: ${result.model}`);
    passed++;
  } else {
    console.log(`❌ Test ${i + 1}: "${test.title}"`);
    console.log(`   Expected: ${test.expected.year} ${test.expected.make} ${test.expected.model}`);
    console.log(`   Got:      ${result.year} ${result.make} ${result.model}`);
    if (!yearOk) console.log(`   ❌ Year mismatch`);
    if (!makeOk) console.log(`   ❌ Make mismatch`);
    if (!modelOk) console.log(`   ❌ Model mismatch`);
    failed++;
  }
  console.log();
});

console.log(`📊 Results: ${passed} passed, ${failed} failed`);

// Test price parsing
console.log('\n🧪 Testing Price Parsing\n');

const prices = ['$3,000', '$15,999', '$1,234,567', '$50'];
prices.forEach(price => {
  const priceNum = parseInt(price.replace(/[$,]/g, ''));
  const formatted = `$${priceNum.toLocaleString()}`;
  console.log(`✅ "${price}" → ${priceNum} → "${formatted}"`);
});
