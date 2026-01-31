#!/usr/bin/env node
// Test vehicle valuation

const { extractVehicleInfo, estimateVehicleValue } = require('./evaluator.js');

// Test cases
const testCases = [
  {
    title: '2015 Subaru Crosstrek 2.0i Limited Sport Utility 4D',
    description: 'Clean title, well maintained, 120k miles',
    price: '$8,500'
  },
  {
    title: '2018 Honda Civic LX',
    description: 'Excellent condition, 45k miles, one owner',
    price: '$15,000'
  },
  {
    title: '2010 Toyota Camry',
    description: '180k miles, runs great, minor cosmetic issues',
    price: '$4,500'
  },
  {
    title: '2020 Tesla Model 3',
    description: 'Long range, autopilot, 35k miles',
    price: '$32,000'
  }
];

console.log('🚗 Vehicle Valuation Test\n');
console.log('=' .repeat(70));

testCases.forEach((test, i) => {
  console.log(`\n${i + 1}. ${test.title}`);
  console.log(`   Price: ${test.price}`);
  console.log(`   Description: ${test.description}`);

  const vehicleInfo = extractVehicleInfo(test.title, test.description);

  if (vehicleInfo && vehicleInfo.isVehicle) {
    console.log(`   ✅ Detected as vehicle:`);
    console.log(`      - Year: ${vehicleInfo.year || 'unknown'}`);
    console.log(`      - Make: ${vehicleInfo.make || 'unknown'}`);
    console.log(`      - Mileage: ${vehicleInfo.mileage ? `${Math.round(vehicleInfo.mileage / 1000)}k` : 'unknown'}`);

    const priceNum = parseFloat(test.price.replace(/[^0-9.]/g, ''));
    const valuation = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum);

    if (valuation) {
      console.log(`   💰 Valuation:`);
      console.log(`      - Estimated value: $${valuation.estimatedValue.toLocaleString()}`);
      console.log(`      - Asking price: ${valuation.percentOfValue}% of estimated value`);

      if (valuation.isGreatDeal) {
        console.log(`      - ⭐⭐⭐ GREAT DEAL! +4 flip score`);
      } else if (valuation.isGoodDeal) {
        console.log(`      - ⭐⭐ Good deal! +2 flip score`);
      } else if (valuation.percentOfValue > 120) {
        console.log(`      - ⚠️  Overpriced (-1 flip, +1 scam)`);
      } else {
        console.log(`      - ✓ Fair price`);
      }
    }
  } else {
    console.log(`   ❌ Not detected as vehicle`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n📝 Note: Values are rough estimates based on depreciation curves.');
console.log('   Actual value varies by condition, options, market, etc.\n');
