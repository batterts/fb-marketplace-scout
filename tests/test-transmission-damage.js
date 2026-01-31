#!/usr/bin/env node
// Test condition detection with transmission damage

const { extractVehicleInfo, detectVehicleCondition, estimateVehicleValue } = require('./evaluator.js');

const tests = [
  {
    title: '2021 Ford F-150',
    description: 'Transmission needs work. Everything else works great. Clean title.',
    price: '$7,500'
  },
  {
    title: '2021 Ford F-150',
    description: 'Excellent condition, one owner, well maintained.',
    price: '$35,000'
  }
];

console.log('🚗 Condition Detection Test\n');
console.log('='.repeat(70));

tests.forEach((test, i) => {
  console.log(`\n${i + 1}. ${test.title}`);
  console.log(`   Price: ${test.price}`);
  console.log(`   Description: ${test.description}`);

  const vehicleInfo = extractVehicleInfo(test.title, test.description);
  const condition = detectVehicleCondition(test.title, test.description);

  console.log(`\n   📋 Condition Check:`);
  if (condition.hasMajorIssues) {
    console.log(`   ⚠️  Issues detected: ${condition.issues.join(', ')}`);
    console.log(`   Severity: ${condition.severity}/5`);
  } else {
    console.log(`   ✅ No major issues detected`);
  }

  if (vehicleInfo && vehicleInfo.isVehicle) {
    const priceNum = parseFloat(test.price.replace(/[^0-9.]/g, ''));

    // Without condition adjustment
    const valuationClean = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum, null);
    console.log(`\n   💰 Valuation (assuming clean):`);
    console.log(`      Estimated value: $${valuationClean.estimatedValue.toLocaleString()}`);
    console.log(`      Asking price: ${valuationClean.percentOfValue}% of estimated value`);

    // With condition adjustment
    const valuationAdjusted = estimateVehicleValue(vehicleInfo.year, vehicleInfo.mileage, priceNum, condition);
    if (condition.hasMajorIssues) {
      console.log(`\n   💰 Valuation (condition-adjusted):`);
      console.log(`      Estimated value: $${valuationAdjusted.estimatedValue.toLocaleString()}`);
      console.log(`      Asking price: ${valuationAdjusted.percentOfValue}% of estimated value`);
      console.log(`      Condition notes: ${valuationAdjusted.conditionNotes.join(', ')}`);

      if (valuationAdjusted.isGreatDeal) {
        console.log(`      ⭐⭐⭐ GREAT DEAL (considering damage)`);
      } else if (valuationAdjusted.isGoodDeal) {
        console.log(`      ⭐⭐ Good deal (considering damage)`);
      } else if (valuationAdjusted.percentOfValue > 120) {
        console.log(`      ⚠️  Overpriced even with damage`);
      } else {
        console.log(`      ✓ Fair price for damaged vehicle`);
      }
    }
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n📝 Detectable issues:');
console.log('   - Transmission damage/issues');
console.log('   - Engine damage/problems');
console.log('   - Salvage/rebuilt title');
console.log('   - Not running/won\'t start');
console.log('   - Frame damage/rust');
console.log('   - As-is/parts only\n');
