/*
 * migrateKYCStatus.js
 * Migration script to add kycStatus to all existing users
 * based on their KYC collection data
 */

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { KYC } from '../models/KYC.js';
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

const migrateKYCStatus = async () => {
  try {
    console.log('Starting KYC status migration...\n');

    // Get all users
    const users = await User.find({ isAdmin: false });
    console.log(`Found ${users.length} non-admin users\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Find KYC record for this user
      const kycRecord = await KYC.findOne({ userId: user._id });

      let kycStatus = 'not_submitted';

      if (kycRecord) {
        // Use the status from KYC collection
        kycStatus = kycRecord.status || 'not_submitted';
      }

      // Update user with kycStatus if not already set
      if (!user.kycStatus) {
        await User.findByIdAndUpdate(user._id, { kycStatus });
        console.log(`✅ Updated ${user.name} (${user.email}) - KYC Status: ${kycStatus}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped ${user.name} (${user.email}) - Already has kycStatus: ${user.kycStatus}`);
        skipped++;
      }
    }

    console.log(`\n====== Migration Complete ======`);
    console.log(`Total Users: ${users.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`================================\n`);

  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

// Run migration
connectDB().then(() => {
  migrateKYCStatus();
});
