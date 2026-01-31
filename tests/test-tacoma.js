#!/usr/bin/env node
// Test Tacoma valuation vs KBB

const { extractVehicleInfo, estimateVehicleValue } = require('./evaluator.js');

const test = {
  title: '2016 Toyota Tacoma Double Cab Limited Pickup 4D 5 ft',
  description: 'Well maintained, clean title, runs great',
  price: '$22,000',
  kbbValue: 22000
};

console.log('🚗 Tacoma Valuation Test vs KBB\n');
console.log(`Title: ${test.title}`);
console.log(`Price: ${test.price}`);
console.log(`KBB Value: $${test.kbbValue.toLocaleString()}\n`);

const vehicleInfo = extractVehicleInfo(test.title, test.description);

if (vehicleInfo && vehicleInfo.isVehicle) {
  console.log('Vehicle Info:');
  console.log(`   Year: ${vehicleInfo.year || 'unknown'}`);
  console.log(`   Make: ${vehicleInfo.make || 'unknown'}`);
  console.log(`   Mileage: ${vehicleInfo.mileage ? `${Math.round(vehicleInfo.mileage / 1000)}k` : 'unknown'}`);

  const priceNum = parseFloat(test.price.replace(/[^0-9.]/g, ''));
  const valuation = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum);

  if (valuation) {
    console.log(`\nMy Estimation:`);
    console.log(`   Estimated value: $${valuation.estimatedValue.toLocaleString()}`);
    console.log(`   Percent of KBB: ${Math.round((valuation.estimatedValue / test.kbbValue) * 100)}%`);
    console.log(`   Error: $${Math.abs(valuation.estimatedValue - test.kbbValue).toLocaleString()} (${Math.abs(Math.round((valuation.estimatedValue / test.kbbValue) * 100) - 100)}% off)`);

    console.log(`\nProblem:`);
    console.log(`   My system assumes $35k average new car price`);
    console.log(`   But it doesn't account for:`);
    console.log(`   ❌ Tacomas cost more new ($35k-$45k for Limited)`);
    console.log(`   ❌ Trucks hold value better than sedans`);
    console.log(`   ❌ Toyota reliability = better resale value`);
    console.log(`   ❌ Tacomas specifically hold value VERY well`);
  }
}

console.log(`\nConclusion:`);
console.log(`   My simple depreciation model is too generic.`);
console.log(`   It works okay for average cars, but fails for:`);
console.log(`   - High-value vehicles (trucks, luxury, SUVs)`);
console.log(`   - Brands that hold value (Toyota, Honda, Subaru)`);
console.log(`   - Popular/desirable models (Tacoma, Wrangler, etc.)`);
