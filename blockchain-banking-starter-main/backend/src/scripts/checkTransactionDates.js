import mongoose from 'mongoose';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
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

const checkTransactionDates = async () => {
  console.log('=== CHECKING DEPOSIT DATES & STATUSES ===\n');

  const deposits = await Deposit.find().sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${deposits.length} deposits (showing last 10):`);
  deposits.forEach((d, i) => {
    console.log(`${i + 1}. Amount: ₹${d.amount} | Status: ${d.status} | Date: ${d.createdAt} | Days ago: ${Math.floor((Date.now() - d.createdAt) / (1000 * 60 * 60 * 24))}`);
  });

  console.log('\n=== CHECKING WITHDRAWAL DATES & STATUSES ===\n');

  const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${withdrawals.length} withdrawals (showing last 10):`);
  withdrawals.forEach((w, i) => {
    console.log(`${i + 1}. Amount: ₹${w.amount} | Status: ${w.status} | Date: ${w.createdAt} | Days ago: ${Math.floor((Date.now() - w.createdAt) / (1000 * 60 * 60 * 24))}`);
  });

  await mongoose.connection.close();
};

await connectDB();
await checkTransactionDates();
