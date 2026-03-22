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

const testDailySummary = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  console.log('Testing Daily Transaction Summary...\n');
  console.log(`Querying transactions from: ${sevenDaysAgo}\n`);

  try {
    // Get daily deposits
    const dailyDeposits = await Deposit.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['pending', 'approved', 'completed', 'Pending', 'Approved', 'Completed'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Daily Deposits:');
    console.log(JSON.stringify(dailyDeposits, null, 2));
    console.log(`Total deposits records: ${dailyDeposits.length}\n`);

    // Get daily withdrawals
    const dailyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['pending', 'approved', 'processed', 'Pending', 'Approved', 'Processed'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Daily Withdrawals:');
    console.log(JSON.stringify(dailyWithdrawals, null, 2));
    console.log(`Total withdrawals records: ${dailyWithdrawals.length}\n`);

    // Combine data
    const data = dailyDeposits.map(d => {
      const withdrawal = dailyWithdrawals.find(w => w._id === d._id);
      return {
        day: d._id,
        deposits: d.total,
        withdrawals: withdrawal?.total || 0
      };
    });

    console.log('Final Combined Data (for chart):');
    console.log(JSON.stringify(data, null, 2));

    // Also check all deposits and withdrawals in DB
    console.log('\n=== Database Totals ===');
    const totalDeposits = await Deposit.countDocuments();
    const completedDeposits = await Deposit.countDocuments({ status: { $in: ['Completed', 'completed'] } });
    const totalWithdrawals = await Withdrawal.countDocuments();
    const completedWithdrawals = await Withdrawal.countDocuments({ status: { $in: ['Completed', 'completed'] } });

    console.log(`Total Deposits in DB: ${totalDeposits}`);
    console.log(`Completed Deposits: ${completedDeposits}`);
    console.log(`Total Withdrawals in DB: ${totalWithdrawals}`);
    console.log(`Completed Withdrawals: ${completedWithdrawals}`);

  } catch (error) {
    console.error('Error:', error);
  }

  await mongoose.connection.close();
};

await connectDB();
await testDailySummary();
