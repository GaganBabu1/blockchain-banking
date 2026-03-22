/**
 * Seed realistic transaction data for the last 30 days
 * Creates deposits, withdrawals, and transfers with various purposes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import { Account } from './src/models/Account.js';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';

dotenv.config();

async function seedTransactionData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    console.log('✓ Connected to MongoDB\n');

    // Get account by account number
    const account = await Account.findOne({ accountNumber: 'ACC001' });
    if (!account) {
      console.log('❌ Account ACC001 not found.');
      process.exit(1);
    }

    const user = await User.findById(account.userId);
    if (!user) {
      console.log('❌ User not found for this account.');
      process.exit(1);
    }

    console.log(`📊 Adding transactions for: ${user.name} (${account.accountNumber})\n`);

    // Clear existing transactions
    await Deposit.deleteMany({ accountId: account._id });
    await Withdrawal.deleteMany({ accountId: account._id });

    // Create transactions spread across last 30 days
    const today = new Date();
    const transactions = [];

    // Helper to create date within last N days
    const dateNDaysAgo = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      return d;
    };

    // INCOME TRANSACTIONS
    const incomeTransactions = [
      { days: 28, amount: 50000, purpose: 'Salary', type: 'deposit' },
      { days: 22, amount: 5000, purpose: 'Bonus', type: 'deposit' },
      { days: 15, amount: 2000, purpose: 'Refund', type: 'deposit' },
      { days: 10, amount: 1500, purpose: 'Investment Returns', type: 'deposit' },
      { days: 5, amount: 3000, purpose: 'Savings Interest', type: 'deposit' },
    ];

    // EXPENSE TRANSACTIONS
    const expenseTransactions = [
      { days: 26, amount: 1200, purpose: 'Utilities' },
      { days: 24, amount: 2500, purpose: 'Groceries' },
      { days: 20, amount: 3000, purpose: 'Shopping' },
      { days: 18, amount: 800, purpose: 'Dining' },
      { days: 16, amount: 500, purpose: 'Transportation' },
      { days: 14, amount: 1000, purpose: 'Entertainment' },
      { days: 12, amount: 600, purpose: 'Healthcare' },
      { days: 8, amount: 2000, purpose: 'Insurance' },
      { days: 6, amount: 1500, purpose: 'Shopping' },
      { days: 3, amount: 750, purpose: 'Dining' },
    ];

    // Add deposits
    for (const tx of incomeTransactions) {
      const refNum = `DEP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const deposit = new Deposit({
        accountId: account._id,
        userId: user._id,
        amount: tx.amount,
        method: 'bank_transfer',
        purpose: tx.purpose,
        status: 'approved',
        referenceNumber: refNum,
        sourceBank: 'HDFC Bank',
        createdAt: dateNDaysAgo(tx.days),
      });
      await deposit.save();
      console.log(`✓ Deposit: ₹${tx.amount} - ${tx.purpose}`);
    }

    // Add withdrawals
    for (const tx of expenseTransactions) {
      const refNum = `WTH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const withdrawal = new Withdrawal({
        accountId: account._id,
        userId: user._id,
        amount: tx.amount,
        method: 'bank_transfer',
        purpose: tx.purpose,
        status: 'approved',
        referenceNumber: refNum,
        destinationBank: 'HDFC Bank',
        createdAt: dateNDaysAgo(tx.days),
      });
      await withdrawal.save();
      console.log(`✓ Withdrawal: ₹${tx.amount} - ${tx.purpose}`);
    }

    // Update account balance
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const newBalance = account.balance + totalIncome - totalExpense;
    
    account.balance = Math.max(0, newBalance);
    await account.save();

    console.log(`\n📈 Summary:`);
    console.log(`   Income: ₹${totalIncome.toLocaleString('en-IN')}`);
    console.log(`   Expense: ₹${totalExpense.toLocaleString('en-IN')}`);
    console.log(`   New Balance: ₹${account.balance.toLocaleString('en-IN')}`);
    console.log(`\n✅ Transaction data seeded successfully!`);
    console.log(`   Total: ${incomeTransactions.length + expenseTransactions.length} transactions added\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTransactionData();
