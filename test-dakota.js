#!/usr/bin/env node
// Test Dakota detection

const { extractVehicleInfo, estimateVehicleValue } = require('./evaluator.js');

const test = {
  title: '2002 Dakota Sport. 4X4 Club Cab',
  description: 'Great truck, runs well, 4x4 works perfect',
  price: '$3,500'
};

console.log('🚗 Testing Dakota Detection\n');
console.log(`Title: ${test.title}`);
console.log(`Description: ${test.description}`);
console.log(`Price: ${test.price}\n`);

const vehicleInfo = extractVehicleInfo(test.title, test.description);

if (vehicleInfo && vehicleInfo.isVehicle) {
  console.log('✅ Detected as vehicle:');
  console.log(`   Year: ${vehicleInfo.year || 'unknown'}`);
  console.log(`   Make: ${vehicleInfo.make || 'unknown'}`);
  console.log(`   Mileage: ${vehicleInfo.mileage ? `${Math.round(vehicleInfo.mileage / 1000)}k` : 'unknown'}`);

  const priceNum = parseFloat(test.price.replace(/[^0-9.]/g, ''));
  const valuation = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum);

  if (valuation) {
    console.log(`\n💰 Valuation:`);
    console.log(`   Estimated value: $${valuation.estimatedValue.toLocaleString()}`);
    console.log(`   Asking price: ${valuation.percentOfValue}% of estimated value`);

    if (valuation.isGreatDeal) {
      console.log(`   ⭐⭐⭐ GREAT DEAL! +4 flip score`);
    } else if (valuation.isGoodDeal) {
      console.log(`   ⭐⭐ Good deal! +2 flip score`);
    } else if (valuation.percentOfValue > 120) {
      console.log(`   ⚠️  Overpriced`);
    } else {
      console.log(`   ✓ Fair price`);
    }
  }
} else {
  console.log('❌ Not detected as vehicle');
}
