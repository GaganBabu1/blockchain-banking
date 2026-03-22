/*
 * fixKYCStatusTypo.js
 * Fixes the typo in kycStatus field (not_submmitted -> not_submitted)
 */

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const fixTypo = async () => {
  try {
    console.log('Fixing kycStatus typo...\n');

    // Find all users with the typo
    const usersWithTypo = await User.find({ kycStatus: 'not_submmitted' });
    console.log(`Found ${usersWithTypo.length} users with typo\n`);

    if (usersWithTypo.length === 0) {
      console.log('No typos found!');
      await mongoose.disconnect();
      return;
    }

    // Update all records with the typo
    const result = await User.updateMany(
      { kycStatus: 'not_submmitted' },
      { $set: { kycStatus: 'not_submitted' } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} records\n`);

    // Show updated users
    const fixedUsers = await User.find({ kycStatus: 'not_submitted' });
    console.log(`Total users with correct status: ${fixedUsers.length}`);
    fixedUsers.forEach(user => {
      console.log(`  ✓ ${user.name} (${user.email})`);
    });

  } catch (error) {
    console.error('Fix Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
  }
};

// Run fix
connectDB().then(() => {
  fixTypo();
});
