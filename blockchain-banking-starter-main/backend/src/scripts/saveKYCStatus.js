/*
 * saveKYCStatus.js
 * Actually saves kycStatus to MongoDB (not just in schema)
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

const saveKYCStatus = async () => {
  try {
    console.log('Saving kycStatus to all users...\n');

    // Get all non-admin users
    const users = await User.find({ isAdmin: false });
    console.log(`Found ${users.length} users\n`);

    let updated = 0;

    for (const user of users) {
      // Set default status if not already set
      if (!user.kycStatus) {
        user.kycStatus = 'not_submitted';
      }
      
      // **Force save** to MongoDB
      await user.save();
      console.log(`✅ Saved ${user.name} - kycStatus: ${user.kycStatus}`);
      updated++;
    }

    console.log(`\n====== Complete ======`);
    console.log(`Total Updated: ${updated}`);
    console.log(`================================\n`);

  } catch (error) {
    console.error('Save Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

connectDB().then(() => {
  saveKYCStatus();
});
