import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { KYC } from '../models/KYC.js';
import { config } from '../config/config.js';

// Connect to MongoDB and create admin user
async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Create admin user - let User model's pre-save hook hash the password
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@123',  // Strong password for bank staff
      isAdmin: true,
      isVerified: true
    });

    // Create account for admin
    const adminAccount = await Account.create({
      userId: admin._id,
      accountNumber: 'ADMIN001',
      accountType: 'Savings',
      balance: 0
    });

    // Create KYC for admin
    await KYC.create({
      userId: admin._id,
      status: 'approved'
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Account Number: ADMIN001`);
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: Admin@123`);
    console.log(`   ID: ${admin._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
