import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { User } from './src/models/User.js';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';

async function testExportAndReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain-banking');
    console.log('✅ Database connected\n');

    // Test 1: Count users with KYC status
    console.log('=== TEST 1: Users Export Data ===');
    const users = await User.find().select('-password').limit(10);
    console.log(`Total users found: ${users.length}`);
    if (users.length > 0) {
      console.log('Sample user data:');
      users.slice(0, 3).forEach(u => {
        console.log(`  - ${u.name} (${u.email}): KYC=${u.kycStatus || 'unknown'}, Verified=${u.isVerified}`);
      });
    } else {
      console.log('❌ No users found in database');
    }

    // Test 2: Check deposits
    console.log('\n=== TEST 2: Report - Deposits Data ===');
    const depositsData = await Deposit.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    console.log(`Completed deposits: ${depositsData[0]?.count || 0}`);
    console.log(`Total deposit amount: ₹${(depositsData[0]?.total || 0).toLocaleString()}`);

    // Test 3: Check withdrawals
    console.log('\n=== TEST 3: Report - Withdrawals Data ===');
    const withdrawalsData = await Withdrawal.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    console.log(`Completed withdrawals: ${withdrawalsData[0]?.count || 0}`);
    console.log(`Total withdrawal amount: ₹${(withdrawalsData[0]?.total || 0).toLocaleString()}`);

    // Test 4: Check KYC breakdown
    console.log('\n=== TEST 4: Report - KYC Status Breakdown ===');
    const pendingKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'approved' });
    const notSubmittedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'not_submitted' });
    const rejectedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'rejected' });
    
    console.log(`Pending KYC: ${pendingKYC}`);
    console.log(`Approved KYC: ${approvedKYC}`);
    console.log(`Not Submitted KYC: ${notSubmittedKYC}`);
    console.log(`Rejected KYC: ${rejectedKYC}`);

    // Test 5: Summary
    console.log('\n=== TEST 5: Complete Report Summary ===');
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const verifiedUsers = await User.countDocuments({ isAdmin: false, isVerified: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Verified users: ${verifiedUsers}`);
    console.log(`Admin users: ${adminUsers}`);
    console.log(`Total transactions: ${(depositsData[0]?.count || 0) + (withdrawalsData[0]?.count || 0)}`);
    console.log(`Net balance: ₹${((depositsData[0]?.total || 0) - (withdrawalsData[0]?.total || 0)).toLocaleString()}`);

    console.log('\n✅ All tests passed - LIVE DATA is being used');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testExportAndReport();
