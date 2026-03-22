/**
 * Script to seed test transaction data (deposits/withdrawals) for credit scoring
 * This allows the Credit Scoring page to calculate and display real credit scores
 */

import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Deposit } from '../src/models/Deposit.js';
import { Withdrawal } from '../src/models/Withdrawal.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain-banking';

const sampleDeposits = [
  { amount: 15000, method: 'bank_transfer', sourceBank: 'HDFC', purpose: 'Salary' },
  { amount: 25000, method: 'bank_transfer', sourceBank: 'ICICI', purpose: 'Bonus' },
  { amount: 10000, method: 'bank_transfer', sourceBank: 'Axis', purpose: 'Refund' },
  { amount: 20000, method: 'bank_transfer', sourceBank: 'SBI', purpose: 'Investment Return' },
  { amount: 12000, method: 'bank_transfer', sourceBank: 'HDFC', purpose: 'Freelance Income' },
];

const sampleWithdrawals = [
  { amount: 5000, method: 'bank_transfer', destinationBank: 'HDFC', purpose: 'Groceries' },
  { amount: 3000, method: 'bank_transfer', destinationBank: 'ICICI', purpose: 'Utilities' },
  { amount: 2000, method: 'bank_transfer', destinationBank: 'Axis', purpose: 'Entertainment' },
  { amount: 4000, method: 'bank_transfer', destinationBank: 'SBI', purpose: 'Bills' },
];

async function generateUnique(fieldName, existingValues = new Set()) {
  let value;
  do {
    value = `${fieldName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  } while (existingValues.has(value));
  return value;
}

async function seedTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all non-admin users
    const users = await User.find({ isAdmin: false }).lean();
    console.log(`\n📊 Found ${users.length} users to populate with transaction data`);

    let totalDepositsAdded = 0;
    let totalWithdrawalsAdded = 0;
    const existingRefs = new Set();

    // For each user, add sample transactions
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.name} (${user.email})`);

      // Get user's account
      const account = await Account.findOne({ userId: user._id }).lean();
      if (!account) {
        console.log(`   ⚠️  No account found for this user, skipping...`);
        continue;
      }

      // Add deposits with varied dates and amounts
      const now = Date.now();
      const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < sampleDeposits.length; i++) {
        const sample = sampleDeposits[i];
        const daysAgo = Math.floor(Math.random() * 30); // Random day in past month
        const createdAt = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));

        const refNumber = await generateUnique('DEP', existingRefs);
        existingRefs.add(refNumber);

        const deposit = new Deposit({
          accountId: account._id,
          userId: user._id,
          amount: sample.amount,
          method: sample.method,
          sourceBank: sample.sourceBank,
          purpose: sample.purpose,
          referenceNumber: refNumber,
          sourceDetails: `From ${sample.sourceBank} Bank`,
          status: 'completed',
          fraudStatus: 'Cleared',
          createdAt,
          updatedAt: createdAt,
        });

        await deposit.save();
        totalDepositsAdded++;
        console.log(`   ✅ Deposit added: ₹${sample.amount} (${sample.purpose})`);
      }

      // Add withdrawals with varied dates and amounts
      for (let i = 0; i < sampleWithdrawals.length; i++) {
        const sample = sampleWithdrawals[i];
        const daysAgo = Math.floor(Math.random() * 30); // Random day in past month
        const createdAt = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));

        const refNumber = await generateUnique('WD', existingRefs);
        existingRefs.add(refNumber);

        const withdrawal = new Withdrawal({
          accountId: account._id,
          userId: user._id,
          amount: sample.amount,
          method: sample.method,
          destinationBank: sample.destinationBank,
          purpose: sample.purpose,
          referenceNumber: refNumber,
          destinationDetails: `To ${sample.destinationBank} Bank`,
          status: 'processed',
          createdAt,
          updatedAt: createdAt,
        });

        await withdrawal.save();
        totalWithdrawalsAdded++;
        console.log(`   ✅ Withdrawal added: ₹${sample.amount} (${sample.purpose})`);
      }
    }

    console.log(`\n✅ Seeding Complete!`);
    console.log(`   📍 Total deposits added: ${totalDepositsAdded}`);
    console.log(`   📍 Total withdrawals added: ${totalWithdrawalsAdded}`);
    console.log(`\n💡 All users now have transaction history. Credit Scoring will work correctly!`);

  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
seedTransactions();
