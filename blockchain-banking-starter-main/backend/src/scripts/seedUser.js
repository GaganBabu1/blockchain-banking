import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { KYC } from '../models/KYC.js';
import { config } from '../config/config.js';

// Connect to MongoDB and create demo user
async function seedUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'user@example.com' });
    if (existingUser) {
      console.log('✅ Demo user already exists');
      
      // Check if account exists
      const existingAccount = await Account.findOne({ userId: existingUser._id });
      if (!existingAccount) {
        // Create account if missing
        await Account.create({
          userId: existingUser._id,
          accountNumber: 'ACC001',
          accountType: 'Savings',
          balance: 5000 // Demo balance
        });
        console.log('✅ Account created for existing user');
      }
      process.exit(0);
    }

    // Create demo user - let User model's pre-save hook hash the PIN
    const user = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: '123456',  // 6-digit PIN - pre-save hook will hash it
      isAdmin: false,
      isVerified: true
    });

    // Create account for user
    await Account.create({
      userId: user._id,
      accountNumber: 'ACC001',
      accountType: 'Savings',
      balance: 5000  // Demo starting balance
    });

    // Create KYC for user
    await KYC.create({
      userId: user._id,
      status: 'not_submitted'
    });

    console.log('✅ Demo user created successfully!');
    console.log(`   Account Number: ACC001`);
    console.log(`   Email: user@example.com`);
    console.log(`   PIN: 123456`);
    console.log(`   Starting Balance: ₹5000`);
    console.log(`   ID: ${user._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

seedUser();
