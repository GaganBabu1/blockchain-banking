import mongoose from 'mongoose';
import { User } from '../models/User.js';
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

const testKycBreakdown = async () => {
  console.log('Testing KYC Breakdown Query...\n');

  try {
    const breakdown = await User.aggregate([
      {
        $match: { isAdmin: false }
      },
      {
        $group: {
          _id: '$kycStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Raw Aggregation Results:');
    console.log(JSON.stringify(breakdown, null, 2));

    // Map to expected format
    const data = breakdown.map(item => ({
      name: item._id === 'not_submitted' ? 'Not Submitted' : 
             item._id === 'pending' ? 'Pending' :
             item._id === 'approved' ? 'Approved' : 'Rejected',
      value: item.count,
      color: item._id === 'approved' ? '#10b981' :
             item._id === 'pending' ? '#f59e0b' :
             item._id === 'rejected' ? '#ef4444' : '#6b7280'
    }));

    console.log('\nFormatted Data (for pie chart):');
    console.log(JSON.stringify(data, null, 2));

    console.log('\nTotal Users:', breakdown.reduce((sum, item) => sum + item.count, 0));

  } catch (error) {
    console.error('Error:', error);
  }

  await mongoose.connection.close();
};

await connectDB();
await testKycBreakdown();
