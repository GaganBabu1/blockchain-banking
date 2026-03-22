import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Deposit } from './src/models/Deposit.js';
import { Account } from './src/models/Account.js';
import { User } from './src/models/User.js';

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    
    const users = await User.find().limit(3);
    console.log(`\n✓ Users: ${users.length}`);
    if (users.length > 0) {
      console.log(`  First user: ${users[0].name} (${users[0].email})`);
    }
    
    const accounts = await Account.find().limit(3);
    console.log(`\n✓ Accounts: ${accounts.length}`);
    if (accounts.length > 0) {
      console.log(`  First account: ${accounts[0].accountNumber} (Balance: ₹${accounts[0].balance})`);
    }
    
    const deposits = await Deposit.find().limit(3);
    console.log(`\n✓ Deposits: ${deposits.length}`);
    if (deposits.length > 0) {
      deposits.forEach((d, i) => {
        console.log(`  [${i+1}] Amount: ₹${d.amount}, Created: ${d.createdAt}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✓ Data check complete\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
