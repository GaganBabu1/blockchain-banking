import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from './src/models/Account.js';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';

dotenv.config();

async function testBalanceTrend() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    console.log('✓ Connected to MongoDB\n');

    // Get ACC001 account
    const account = await Account.findOne({ accountNumber: 'ACC001' });
    if (!account) {
      console.log('❌ Account ACC001 not found');
      process.exit(1);
    }

    console.log(`📊 Testing balance trend for: ${account.accountNumber}`);
    console.log(`   Current balance: ₹${account.balance}\n`);

    // Simulate the balance trend calculation
    const days = 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deposits = await Deposit.find({
      accountId: account._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();

    const withdrawals = await Withdrawal.find({
      accountId: account._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();

    console.log(`📥 Deposits found: ${deposits.length}`);
    deposits.forEach((d, i) => {
      console.log(`   [${i+1}] ₹${d.amount} - ${d.purpose} (${new Date(d.createdAt).toLocaleDateString()})`);
    });

    console.log(`\n📤 Withdrawals found: ${withdrawals.length}`);
    withdrawals.forEach((w, i) => {
      console.log(`   [${i+1}] ₹${w.amount} - ${w.purpose} (${new Date(w.createdAt).toLocaleDateString()})`);
    });

    // Combine and sort
    const allTransactions = [
      ...deposits.map(d => ({ ...d, txType: 'deposit', amount: d.amount })),
      ...withdrawals.map(w => ({ ...w, txType: 'withdrawal', amount: w.amount }))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    console.log(`\n📊 Total transactions: ${allTransactions.length}`);

    // Calculate balance trend
    const balanceByDay = {};
    let cumulativeBalance = account.balance;

    // Calculate balance at earliest transaction date by reversing all transactions
    allTransactions.forEach(tx => {
      let impact = 0;
      if (tx.txType === 'deposit') {
        impact = tx.amount;
      } else if (tx.txType === 'withdrawal') {
        impact = -tx.amount;
      }
      cumulativeBalance -= impact;
    });

    console.log(`\n💰 Starting balance (earliest date): ₹${cumulativeBalance}`);

    // Now go forward through transactions
    allTransactions.forEach(tx => {
      const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];

      let impact = 0;
      if (tx.txType === 'deposit') {
        impact = tx.amount;
      } else if (tx.txType === 'withdrawal') {
        impact = -tx.amount;
      }

      cumulativeBalance += impact;
      balanceByDay[dateStr] = cumulativeBalance;
      console.log(`   ${dateStr}: ${tx.txType.toUpperCase()} ₹${Math.abs(impact).toLocaleString('en-IN')} → Balance: ₹${cumulativeBalance.toLocaleString('en-IN')}`);
    });

    // Build final trend array
    const trend = [];
    const today = new Date();
    let lastBalance = account.balance;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const balance = balanceByDay[dateStr] !== undefined ? balanceByDay[dateStr] : lastBalance;
      trend.push({
        day: `Day ${days - i}`,
        date: dateStr,
        balance: Math.max(0, balance)
      });
      if (balanceByDay[dateStr] !== undefined) {
        lastBalance = balance;
      }
    }

    console.log(`\n📈 Trend array (first 5 & last 5):`);
    console.log('FIRST:');
    trend.slice(0, 5).forEach(t => {
      console.log(`   ${t.day}: ₹${t.balance.toLocaleString('en-IN')}`);
    });
    console.log('...');
    console.log('LAST:');
    trend.slice(-5).forEach(t => {
      console.log(`   ${t.day}: ₹${t.balance.toLocaleString('en-IN')}`);
    });

    console.log(`\n✅ Final balance: ₹${trend[trend.length - 1].balance.toLocaleString('en-IN')}`);
    console.log(`✅ Total trend points: ${trend.length}\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBalanceTrend();
