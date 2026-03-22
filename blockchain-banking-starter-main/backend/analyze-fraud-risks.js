/**
 * Analyze transactions and calculate fraud risk scores
 * Assigns realistic risk scores to seeded transactions
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';

dotenv.config();

async function analyzeFraudRisks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    console.log('✓ Connected to MongoDB\n');

    // Fetch all transactions
    const deposits = await Deposit.find().lean();
    const withdrawals = await Withdrawal.find().lean();

    console.log(`📊 Analyzing ${deposits.length} deposits and ${withdrawals.length} withdrawals for fraud patterns...\n`);

    // Analyze deposits - most are legitimate salary/bonus
    let depositUpdates = 0;
    for (const deposit of deposits) {
      let riskScore = 0.05; // Base low risk

      // Large deposits have slightly higher risk
      if (deposit.amount > 50000) {
        riskScore += 0.15;
      }
      // Check for unusual patterns (e.g., very frequent deposits)
      if (deposit.purpose === 'Refund') {
        riskScore = 0.25; // Refunds are moderately risky
      }

      if (riskScore !== (deposit.riskScore || 0)) {
        await Deposit.updateOne(
          { _id: deposit._id },
          { 
            $set: { 
              riskScore: Math.min(0.9, riskScore),
              fraudStatus: riskScore > 0.7 ? 'Flagged' : 'Cleared'
            } 
          }
        );
        depositUpdates++;
      }
    }

    // Analyze withdrawals - add some realistic fraud patterns
    let withdrawalUpdates = 0;
    const withdrawalsByDay = {};
    let flagCount = 0;
    
    for (const withdrawal of withdrawals) {
      const day = new Date(withdrawal.createdAt).toLocaleDateString();
      withdrawalsByDay[day] = (withdrawalsByDay[day] || 0) + 1;
    }

    // Sort by amount to identify largest transactions for flagging
    const withdrawalsSorted = [...withdrawals].sort((a, b) => b.amount - a.amount);

    for (const withdrawal of withdrawals) {
      let riskScore = 0.15; // Base risk

      // Large withdrawals are most suspicious
      if (withdrawal.amount > 2500) {
        riskScore += 0.4; // Significantly increase risk
      } else if (withdrawal.amount > 2000) {
        riskScore += 0.3;
      } else if (withdrawal.amount > 1500) {
        riskScore += 0.15;
      }

      // Multiple withdrawals same day
      const day = new Date(withdrawal.createdAt).toLocaleDateString();
      if (withdrawalsByDay[day] > 3) {
        riskScore += 0.2;
      }

      // Risky purposes
      if (['Shopping', 'Entertainment', 'Other'].includes(withdrawal.purpose)) {
        riskScore += 0.15;
      }

      // Artificially flag 2-3 of the largest withdrawals for demo purposes
      const largestThree = withdrawalsSorted.slice(0, 3);
      if (largestThree.some(w => w._id.toString() === withdrawal._id.toString())) {
        riskScore = Math.max(0.65, riskScore); // Ensure at least 65% risk for largest
      }

      riskScore = Math.min(0.95, Math.max(0.05, riskScore));

      if (riskScore !== (withdrawal.riskScore || 0)) {
        await Withdrawal.updateOne(
          { _id: withdrawal._id },
          { 
            $set: { 
              riskScore: riskScore,
              fraudStatus: riskScore >= 0.5 ? 'Flagged' : 'Cleared'
            } 
          }
        );
        withdrawalUpdates++;
        if (riskScore >= 0.5) flagCount++;
      }
    }

    console.log(`✓ Deposits analyzed: ${depositUpdates} with risk scores set`);
    console.log(`✓ Withdrawals analyzed: ${withdrawalUpdates} with risk scores set\n`);

    // Get summary
    const flaggedDeposits = deposits.filter(d => (d.riskScore || 0) > 0.7).length;
    const flaggedWithdrawals = withdrawals.filter(w => (w.riskScore || 0) > 0.7).length;
    const totalFlagged = flaggedDeposits + flaggedWithdrawals;

    console.log(`📊 Summary:`);
    console.log(`   Total transactions: ${deposits.length + withdrawals.length}`);
    console.log(`   Flagged (≥70% risk): ${totalFlagged}`);
    console.log(`   Average risk score: ${((deposits.concat(withdrawals).reduce((sum, t) => sum + (t.riskScore || 0.05), 0) / (deposits.length + withdrawals.length)) * 100).toFixed(1)}%`);

    console.log(`\n✅ Fraud risk analysis complete!\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeFraudRisks();
