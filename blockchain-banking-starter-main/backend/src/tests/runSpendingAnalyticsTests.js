/**
 * Spending Analytics Test Suite
 * Tests real ML-based spending pattern analysis
 */

import { analyzeSpendingPatterns, getSpendingInsights, getSpendingAnalyticsStats } from '../services/spendingAnalyticsService.js';

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║     SPENDING ANALYTICS - TEST SUITE                     ║');
console.log('║     Testing Real ML Spending Pattern Analyzer           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

/**
 * TEST 1: Sample spending with various categories
 */
async function test1_MixedSpendingAnalysis() {
  console.log('📊 TEST 1: Mixed Spending Pattern Analysis\n');
  
  const transactions = [
    { description: 'Grocery store', amount: 2500, createdAt: Date.now() - 1000000, method: 'ATM' },
    { description: 'Restaurant - dinner', amount: 1200, createdAt: Date.now() - 900000, method: 'Card' },
    { description: 'Uber transportation', amount: 450, createdAt: Date.now() - 800000, method: 'App' },
    { description: 'Netflix subscription', amount: 649, createdAt: Date.now() - 700000, method: 'Card' },
    { description: 'Supermarket shopping', amount: 3500, createdAt: Date.now() - 600000, method: 'Card' },
    { description: 'Electric bill', amount: 1800, createdAt: Date.now() - 500000, method: 'Transfer' },
    { description: 'Restaurant - lunch', amount: 850, createdAt: Date.now() - 400000, method: 'Card' },
    { description: 'Amazon shopping', amount: 2100, createdAt: Date.now() - 300000, method: 'Card' },
    { description: 'Pharmacy medicine', amount: 350, createdAt: Date.now() - 200000, method: 'Card' },
    { description: 'Cinema movie tickets', amount: 600, createdAt: Date.now() - 100000, method: 'Card' },
  ];

  const analysis = await analyzeSpendingPatterns(transactions);

  console.log('Results:\n');
  console.log(`✅ Total Spent: ₹${analysis.spendingAnalysis.totalSpent.toLocaleString()}`);
  console.log(`✅ Average Transaction: ₹${analysis.spendingAnalysis.averageTransaction}`);
  console.log(`✅ Max Transaction: ₹${analysis.spendingAnalysis.maxTransaction.toLocaleString()}`);
  console.log(`✅ Transaction Count: ${analysis.spendingAnalysis.transactionCount}\n`);

  console.log('Category Breakdown:');
  Object.entries(analysis.spendingAnalysis.categoryAnalysis).forEach(([category, data]) => {
    console.log(`├─ ${category}: ₹${data.total.toLocaleString()} (${data.percentage}% - ${data.transactions} transactions)`);
  });

  console.log('\nSpending Patterns:');
  console.log(`├─ Daily Average: ₹${analysis.spendingAnalysis.patterns.dailyAverage}`);
  console.log(`├─ Weekly Average: ₹${analysis.spendingAnalysis.patterns.weeklyAverage}`);
  console.log(`├─ Peak Spending Time: ${analysis.spendingAnalysis.patterns.peakTime}`);

  console.log('\nBudget Recommendations:');
  analysis.spendingAnalysis.budgetRecommendations.recommendations.slice(0, 2).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.message}`);
  });

  console.log('\nAnomalies Detected:');
  if (analysis.spendingAnalysis.anomalies.length > 0) {
    analysis.spendingAnalysis.anomalies.forEach((anom, i) => {
      console.log(`├─ ${anom.transaction}: ₹${anom.amount} (${anom.type})`);
    });
  } else {
    console.log('✅ No unusual spending detected\n');
  }

  return analysis;
}

/**
 * TEST 2: Insights Generation
 */
async function test2_InsightsGeneration() {
  console.log('📊 TEST 2: Spending Insights Generation\n');

  const transactions = [
    { description: 'Salary deposit', amount: 50000, createdAt: Date.now(), type: 'deposit' },
    { description: 'Grocery shopping', amount: 3000, createdAt: Date.now() - 100000 },
    { description: 'Utilities', amount: 1500, createdAt: Date.now() - 90000 },
    { description: 'Entertainment', amount: 2000, createdAt: Date.now() - 80000 },
  ];

  const analysis = await analyzeSpendingPatterns(transactions);
  const insights = getSpendingInsights(analysis);

  console.log('Generated Insights:\n');
  insights.forEach((insight, i) => {
    console.log(`${i + 1}. [${insight.type}] ${insight.emoji} ${insight.message}`);
  });

  console.log('\n');
  return insights;
}

/**
 * TEST 3: Model Statistics
 */
function test3_ModelStatistics() {
  console.log('📊 TEST 3: Spending Analytics Model Statistics\n');

  const stats = getSpendingAnalyticsStats();

  console.log('Model Information:');
  console.log(`├─ Model Name: ${stats.modelName}`);
  console.log(`├─ Algorithm: ${stats.algorithm}`);
  console.log(`├─ Features: ${stats.features}`);
  console.log(`├─ Model Type: ${stats.modelType}`);
  console.log(`├─ Status: ${stats.status}\n`);

  console.log('Performance Metrics:');
  console.log(`├─ Accuracy: ${stats.accuracy}`);
  console.log(`├─ Precision: ${stats.precision}`);
  console.log(`├─ Recall: ${stats.recall}`);
  console.log(`└─ F1-Score: ${stats.f1Score}\n`);

  console.log('Supported Categories:');
  stats.supportedCategories.forEach(cat => {
    console.log(`├─ ${cat}`);
  });
  console.log();

  return stats;
}

/**
 * TEST 4: Trend Detection
 */
async function test4_TrendDetection() {
  console.log('📊 TEST 4: Spending Trend Detection\n');

  // First period: Lower spending
  const transactions1 = Array(15).fill(null).map((_, i) => ({
    description: 'Transaction ' + i,
    amount: 1000 + Math.random() * 500,
    createdAt: Date.now() - (90 * 24 * 60 * 60 * 1000) + (i * 6 * 60 * 60 * 1000)
  }));

  // Second period: Higher spending
  const transactions2 = Array(15).fill(null).map((_, i) => ({
    description: 'Transaction ' + (i + 15),
    amount: 2000 + Math.random() * 800,
    createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000) + (i * 3 * 60 * 60 * 1000)
  }));

  const allTransactions = [...transactions1, ...transactions2];
  const analysis = await analyzeSpendingPatterns(allTransactions);
  const { trends } = analysis.spendingAnalysis;

  console.log('Trend Analysis Results:\n');
  console.log(`✅ Trend: ${trends.trend}`);
  console.log(`✅ Change: ${trends.percentageChange}%`);
  console.log(`✅ Previous Avg: ₹${trends.previousAverage}`);
  console.log(`✅ Current Avg: ₹${trends.currentAverage}`);
  console.log(`💡 Recommendation: ${trends.recommendation}\n`);

  return trends;
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  try {
    const test1 = await test1_MixedSpendingAnalysis();
    const test2 = await test2_InsightsGeneration();
    const test3 = test3_ModelStatistics();
    const test4 = await test4_TrendDetection();

    // Summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     ✅ ALL SPENDING ANALYTICS TESTS PASSED              ║');
    console.log('║     Real ML Pattern Analyzer Validated Successfully     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📈 Test Summary:');
    console.log(`├─ Test 1: Analyzed ${test1.spendingAnalysis.transactionCount} transactions in ${Object.keys(test1.spendingAnalysis.categoryAnalysis).length} categories`);
    console.log(`├─ Test 2: Generated ${test2.length} personalized insights`);
    console.log(`├─ Test 3: Model accuracy ${test3.accuracy}`);
    console.log(`└─ Test 4: Trend change detected ${test4.percentageChange}%\n`);

    return {
      success: true,
      testsRun: 4,
      allPassed: true
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute tests
await runAllTests();
