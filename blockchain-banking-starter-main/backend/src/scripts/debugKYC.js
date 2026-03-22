/*
 * debugKYC.js
 * Debug script to check the actual data structure
 */

import mongoose from 'mongoose';
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

const debug = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Get raw users collection
    const users = await db.collection('users').find({ isAdmin: false }).toArray();
    
    console.log('====== RAW MONGODB DATA ======\n');
    console.log(`Total users in collection: ${users.length}\n`);
    
    // Show first 3 users in detail
    console.log('First 3 users (raw data):');
    users.slice(0, 3).forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.name}`);
      console.log(`   email: ${user.email}`);
      console.log(`   kycStatus field exists: ${user.hasOwnProperty('kycStatus')}`);
      console.log(`   kycStatus value: ${user.kycStatus}`);
      console.log(`   kycStatus type: ${typeof user.kycStatus}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
    });

    // Count with correct query
    console.log('\n\n====== DIRECT MONGODB QUERY ======\n');
    const count1 = await db.collection('users').countDocuments({ isAdmin: false });
    console.log(`isAdmin: false - ${count1}`);
    
    const count2 = await db.collection('users').countDocuments({ isAdmin: false, kycStatus: 'not_submitted' });
    console.log(`isAdmin: false, kycStatus: 'not_submitted' - ${count2}`);
    
    const count3 = await db.collection('users').countDocuments({ isAdmin: false, kycStatus: { $in: ['not_submitted', 'pending'] } });
    console.log(`isAdmin: false, kycStatus in ['not_submitted', 'pending'] - ${count3}`);

  } catch (error) {
    console.error('Debug Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
  }
};

connectDB().then(() => {
  debug();
});
