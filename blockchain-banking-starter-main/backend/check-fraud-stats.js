import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';
import { Account } from './src/models/Account.js';
import { User } from './src/models/User.js';

dotenv.config();

async function checkFraudStats() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    console.log('✓ Connected to MongoDB\n');

    // Get the test user and account
    const user = await User.findOne({ name: 'John Doe' });
    const account = await Account.findOne({ userId: user._id });

    // Get all transactions
    const deposits = await Deposit.find({ accountId: account._id });
    const withdrawals = await Withdrawal.find({ accountId: account._id });

    // Count by risk score
    const flaggedDeposits = deposits.filter(d => d.riskScore >= 0.7).length;
    const flaggedWithdrawals = withdrawals.filter(w => w.riskScore >= 0.7).length;
    const totalFlagged = flaggedDeposits + flaggedWithdrawals;

    const reviewDeposits = deposits.filter(d => d.riskScore >= 0.5 && d.riskScore < 0.7).length;
    const reviewWithdrawals = withdrawals.filter(w => w.riskScore >= 0.5 && w.riskScore < 0.7).length;
    const totalReview = reviewDeposits + reviewWithdrawals;

    console.log('📊 Fraud Statistics:\n');
    console.log(`Total Deposits: ${deposits.length}`);
    console.log(`Total Withdrawals: ${withdrawals.length}`);
    console.log(`Total Transactions: ${deposits.length + withdrawals.length}\n`);

    console.log('🚨 Flagged (≥70% risk):');
    console.log(`  Deposits: ${flaggedDeposits}`);
    console.log(`  Withdrawals: ${flaggedWithdrawals}`);
    console.log(`  Total: ${totalFlagged}\n`);

    console.log('⚠️ Under Review (50-70% risk):');
    console.log(`  Deposits: ${reviewDeposits}`);
    console.log(`  Withdrawals: ${reviewWithdrawals}`);
    console.log(`  Total: ${totalReview}\n`);

    console.log('✅ Cleared (<50% risk):');
    const clearedDeposits = deposits.length - flaggedDeposits - reviewDeposits;
    const clearedWithdrawals = withdrawals.length - flaggedWithdrawals - reviewWithdrawals;
    console.log(`  Deposits: ${clearedDeposits}`);
    console.log(`  Withdrawals: ${clearedWithdrawals}`);
    console.log(`  Total: ${clearedDeposits + clearedWithdrawals}\n`);

    // Show flagged transactions
    if (totalFlagged > 0) {
      console.log('📋 Flagged Transactions:');
      [...deposits, ...withdrawals]
        .filter(t => t.riskScore >= 0.7)
        .slice(0, 5)
        .forEach((t, i) => {
          console.log(`${i+1}. Amount: ₹${t.amount}, Risk: ${(t.riskScore*100).toFixed(0)}%, Type: ${t._doc ? (deposits.some(d => d._id.equals(t._id)) ? 'Deposit' : 'Withdrawal') : 'Unknown'}`);
        });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFraudStats();
