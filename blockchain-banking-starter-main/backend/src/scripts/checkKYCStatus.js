/*
 * checkKYCStatus.js
 * Verification script to check KYC status in database
 */

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { KYC } from '../models/KYC.js';
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

const checkStatus = async () => {
  try {
    console.log('====== KYC STATUS CHECK ======\n');

    // Count all non-admin users
    const totalUsers = await User.countDocuments({ isAdmin: false });
    console.log(`Total Non-Admin Users: ${totalUsers}\n`);

    // Count by kycStatus
    const notSubmitted = await User.countDocuments({ isAdmin: false, kycStatus: 'not_submitted' });
    const pending = await User.countDocuments({ isAdmin: false, kycStatus: 'pending' });
    const approved = await User.countDocuments({ isAdmin: false, kycStatus: 'approved' });
    const rejected = await User.countDocuments({ isAdmin: false, kycStatus: 'rejected' });

    console.log('Users by KYC Status:');
    console.log(`  not_submitted: ${notSubmitted}`);
    console.log(`  pending: ${pending}`);
    console.log(`  approved: ${approved}`);
    console.log(`  rejected: ${rejected}`);
    console.log(`  Total: ${notSubmitted + pending + approved + rejected}\n`);

    // What admin dashboard should show as "Pending KYC"
    const adminPendingCount = notSubmitted + pending;
    console.log(`📊 Admin Dashboard should show "Pending KYC": ${adminPendingCount}\n`);

    // List all users with their status
    console.log('All Users:');
    const users = await User.find({ isAdmin: false }).select('name email kycStatus');
    users.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.name} (${user.email}) - ${user.kycStatus}`);
    });

  } catch (error) {
    console.error('Check Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
  }
};

// Run check
connectDB().then(() => {
  checkStatus();
});
