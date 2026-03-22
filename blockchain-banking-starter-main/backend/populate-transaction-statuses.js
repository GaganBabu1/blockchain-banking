import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Deposit } from './src/models/Deposit.js';
import { Withdrawal } from './src/models/Withdrawal.js';
import { Transfer } from './src/models/Transfer.js';
import { Account } from './src/models/Account.js';
import { User } from './src/models/User.js';

dotenv.config();

async function populateTransactionStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    console.log('✓ Connected to MongoDB\n');

    // Get the test user first
    const user = await User.findOne({ name: 'John Doe' });
    if (!user) {
      console.error('User "John Doe" not found');
      process.exit(1);
    }

    // Get the account for this user
    const account = await Account.findOne({ userId: user._id });
    if (!account) {
      console.error('Account not found for user');
      process.exit(1);
    }

    // Fetch current transactions
    const deposits = await Deposit.find({ accountId: account._id });
    const withdrawals = await Withdrawal.find({ accountId: account._id });

    console.log(`📊 Found ${deposits.length} deposits and ${withdrawals.length} withdrawals\n`);

    // Update deposits with different statuses
    let depositUpdates = 0;
    for (let i = 0; i < deposits.length; i++) {
      let status = 'completed'; // Most are completed
      
      // Make first 1-2 pending
      if (i === 0) status = 'pending';
      if (i === 1) status = 'approved';

      if (deposits[i].status !== status) {
        await Deposit.updateOne(
          { _id: deposits[i]._id },
          { $set: { status: status } }
        );
        depositUpdates++;
      }
    }

    // Update withdrawals with different statuses
    let withdrawalUpdates = 0;
    for (let i = 0; i < withdrawals.length; i++) {
      let status = 'completed'; // Most are completed
      
      // Make first pending, second rejected, third approved, rest completed
      if (i === 0) status = 'pending';
      if (i === 1) status = 'rejected';
      if (i === 2) status = 'approved';

      if (withdrawals[i].status !== status) {
        await Withdrawal.updateOne(
          { _id: withdrawals[i]._id },
          { $set: { status: status } }
        );
        withdrawalUpdates++;
      }
    }

    // Transfers will be created separately if needed

    console.log(`✓ Deposits updated: ${depositUpdates}`);
    console.log(`✓ Withdrawals updated: ${withdrawalUpdates}\n`);

    // Show summary
    const finalDeposits = await Deposit.find({ accountId: account._id });
    const finalWithdrawals = await Withdrawal.find({ accountId: account._id });

    const depositsByStatus = {};
    const withdrawalsByStatus = {};

    finalDeposits.forEach(d => {
      depositsByStatus[d.status || 'unknown'] = (depositsByStatus[d.status || 'unknown'] || 0) + 1;
    });

    finalWithdrawals.forEach(w => {
      withdrawalsByStatus[w.status || 'unknown'] = (withdrawalsByStatus[w.status || 'unknown'] || 0) + 1;
    });

    console.log('📊 Transaction Summary by Status:\n');
    console.log('Deposits:');
    Object.entries(depositsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nWithdrawals:');
    Object.entries(withdrawalsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n✅ Transaction status population complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateTransactionStatuses();
