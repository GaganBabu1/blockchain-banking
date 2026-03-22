/*
 * testQuery.js
 * Test the exact query used in getDashboardStats
 */

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const test = async () => {
  try {
    console.log('Testing exact query from getDashboardStats...\n');

    // Exact query from the code
    const pendingKYC = await User.countDocuments({ 
      isAdmin: false,
      kycStatus: { $in: ['not_submitted', 'pending'] }
    });

    console.log(`Result: pendingKYC = ${pendingKYC}`);

    if (pendingKYC === 0) {
      console.log('\n❌ Returns 0 - This is the problem!\n');
      
      // Additional debug
      console.log('Checking User model schema...');
      const schema = User.collection.schema;
      console.log('Path exists:', User.schema.path('kycStatus') ? 'YES' : 'NO');
      
      // Try alternative query
      console.log('\nTrying alternative queries:');
      const alt1 = await User.countDocuments({ isAdmin: false });
      console.log(`  All non-admin users: ${alt1}`);
      
      const alt2 = await User.find({ isAdmin: false }).select('kycStatus');
      console.log(`  Sample user kycStatus values:`);
      alt2.slice(0, 3).forEach(u => console.log(`    - ${u.kycStatus}`));
      
    } else {
      console.log(`\n✅ Correctly returns ${pendingKYC}`);
    }

  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
  }
};

connectDB().then(() => {
  test();
});
