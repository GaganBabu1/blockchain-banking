import mongoose from 'mongoose';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain-banking');
    console.log('MongoDB Connected\n');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const checkPendingTransactions = async () => {
  console.log('=== CHECKING PENDING TRANSACTIONS ===\n');

  // Check all deposits by status
  console.log('All Deposits by Status:');
  const depositStatuses = await Deposit.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  depositStatuses.forEach(s => {
    console.log(`  ${s._id}: ${s.count}`);
  });

  console.log('\nAll Withdrawals by Status:');
  const withdrawalStatuses = await Withdrawal.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  withdrawalStatuses.forEach(s => {
    console.log(`  ${s._id}: ${s.count}`);
  });

  // Look for transactions that might be "pending" approval
  console.log('\nDeposits with "pending" status:');
  const pendingDeposits = await Deposit.find({ status: 'pending' }).limit(5);
  pendingDeposits.forEach(d => {
    console.log(`  - ${'₹' + d.amount} (${d.status}) - ${d.createdAt}`);
  });

  console.log('\nWithdrawals with "pending" status:');
  const pendingWithdrawals = await Withdrawal.find({ status: 'pending' }).limit(5);
  pendingWithdrawals.forEach(w => {
    console.log(`  - ₹${w.amount} (${w.status}) - ${w.createdAt}`);
  });

  await mongoose.connection.close();
};

await connectDB();
await checkPendingTransactions();
