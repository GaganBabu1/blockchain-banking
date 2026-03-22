import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Account } from './src/models/Account.js';
import { Deposit } from './src/models/Deposit.js';
import { recordTransaction, initBlockchain } from './src/services/blockchainServiceWithPersistence.js';

const mongoUrl = 'mongodb://localhost:27017/blockchain-banking';

async function seedApprovedDeposits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    // Initialize blockchain with persistence ENABLED
    await initBlockchain(true);
    console.log('✅ Blockchain Service Initialized (Persistence Mode)\n');

    // Find existing users
    const users = await User.find({ isAdmin: false }).limit(3);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users. Creating approved deposits...\n`);

    let blockCount = 0;

    // Create approved deposits for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const account = await Account.findOne({ userId: user._id });

      if (!account) {
        console.log(`⚠️  No account found for user ${user.email}`);
        continue;
      }

      // Create 2-3 approved deposits per user
      const depositCount = Math.floor(Math.random() * 2) + 2;
      
      for (let j = 0; j < depositCount; j++) {
        const amount = (Math.random() * 40000 + 5000).toFixed(2); // ₹5K to ₹45K
        const methods = ['bank_transfer', 'check'];
        const method = methods[Math.floor(Math.random() * methods.length)];

        // Create deposit record as APPROVED
        const deposit = new Deposit({
          accountId: account._id, // Add accountId
          userId: user._id,
          amount: parseFloat(amount),
          method: method,
          sourceBank: ['HDFC', 'ICICI', 'SBI', 'Axis'][Math.floor(Math.random() * 4)],
          accountNumber: Math.random().toString().slice(2, 16),
          purpose: ['Salary', 'Savings', 'Investment', 'Business', 'Refund'][Math.floor(Math.random() * 5)],
          status: 'approved', // APPROVED - This is key!
          rejectionReason: null,
          referenceNumber: `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random past date (last 7 days)
          approvalDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });

        await deposit.save();

        // Record on blockchain
        try {
          const blockchainResult = await recordTransaction(
            'BANK',
            `ACC-${account._id.toString().slice(-8)}`,
            parseFloat(amount),
            'deposit',
            {
              depositId: deposit._id.toString(),
              referenceNumber: deposit.referenceNumber,
              method: method,
              sourceBank: deposit.sourceBank,
              purpose: deposit.purpose,
              userId: user._id.toString(),
              timestamp: deposit.createdAt
            }
          );

          deposit.blockchainHash = blockchainResult.blockchainHash;
          await deposit.save();

          // Update account balance
          account.balance += parseFloat(amount);
          await account.save();

          blockCount++;
          console.log(`✅ Deposit ${blockCount}: ₹${amount} from ${user.name} (${deposit.referenceNumber})`);
          console.log(`   → Blockchain Hash: ${blockchainResult.blockchainHash.substring(0, 16)}...`);
          console.log(`   → Block #${blockchainResult.blockNumber}\n`);
        } catch (blockchainError) {
          console.log(`⚠️  Deposit created but blockchain recording failed: ${blockchainError.message}`);
        }
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ SEEDING COMPLETE!`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📊 Statistics:`);
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Total Deposits Created: ${blockCount}`);
    console.log(`   • Blockchain Blocks Created: ${blockCount}`);
    console.log(`\n📁 Check MongoDB:`);
    console.log(`   • Collection: deposits (status='approved')`);
    console.log(`   • Collection: blockchain_blocks (all new blocks)`);
    console.log(`   • Collection: accounts (updated balances)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

seedApprovedDeposits();
