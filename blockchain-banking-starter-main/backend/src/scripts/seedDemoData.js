import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Transfer } from '../models/Transfer.js';
import { KYC } from '../models/KYC.js';
import { config } from '../config/config.js';

/**
 * DEMO DATA SEEDING SCRIPT
 * 
 * Adds realistic transaction history and data to demonstrate features.
 * Safe to run multiple times (checks for existing data first).
 */

async function seedDemoData() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected\n');

    // Get demo user
    const demoUser = await User.findOne({ email: 'user@example.com' });
    if (!demoUser) {
      console.log('❌ Demo user not found. Run: npm run seed:user');
      process.exit(1);
    }

    const demoUserAccount = await Account.findOne({ userId: demoUser._id });
    if (!demoUserAccount) {
      console.log('❌ Demo user account not found.');
      process.exit(1);
    }

    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    let adminAccount = null;
    if (adminUser) {
      adminAccount = await Account.findOne({ userId: adminUser._id });
    }

    console.log('📊 SEEDING DEMO DATA...\n');

    // ============================================
    // 1. ADD DEPOSIT TRANSACTIONS
    // ============================================
    console.log('💰 Adding deposit transactions...');
    
    const deposits = [
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 50000,
        method: 'direct_deposit',
        referenceNumber: 'DEP-2026-01-001',
        sourceDetails: 'HDFC Bank Direct Deposit - Salary',
        status: 'completed',
        approvalDate: new Date('2026-01-15T10:30:00'),
        createdAt: new Date('2026-01-15T10:30:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 10000,
        method: 'bank_transfer',
        referenceNumber: 'DEP-2026-01-002',
        sourceDetails: 'ICICI Bank Transfer - Freelance Income',
        status: 'completed',
        approvalDate: new Date('2026-01-20T15:45:00'),
        createdAt: new Date('2026-01-20T15:45:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 5000,
        method: 'bank_transfer',
        referenceNumber: 'DEP-2026-02-001',
        sourceDetails: 'Amazon Refund - Online Purchase',
        status: 'completed',
        approvalDate: new Date('2026-02-05T09:15:00'),
        createdAt: new Date('2026-02-05T09:15:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 50000,
        method: 'direct_deposit',
        referenceNumber: 'DEP-2026-02-003',
        sourceDetails: 'HDFC Bank Direct Deposit - Salary',
        status: 'completed',
        approvalDate: new Date('2026-02-15T10:30:00'),
        createdAt: new Date('2026-02-15T10:30:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 15000,
        method: 'bank_transfer',
        referenceNumber: 'DEP-2026-02-002',
        sourceDetails: 'Investment Returns - Mutual Fund',
        status: 'completed',
        approvalDate: new Date('2026-02-20T14:20:00'),
        createdAt: new Date('2026-02-20T14:20:00')
      }
    ];

    for (const deposit of deposits) {
      const exists = await Deposit.findOne({
        referenceNumber: deposit.referenceNumber
      });
      
      if (!exists) {
        await Deposit.create(deposit);
        console.log(`  ✓ Added deposit: ₹${deposit.amount} - ${deposit.sourceDetails}`);
      }
    }

    // ============================================
    // 2. ADD WITHDRAWAL TRANSACTIONS
    // ============================================
    console.log('\n💸 Adding withdrawal transactions...');
    
    const withdrawals = [
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 5000,
        method: 'atm',
        referenceNumber: 'WTH-2026-01-001',
        destinationDetails: 'ATM - HDFC Bank',
        status: 'processed',
        processedDate: new Date('2026-01-18T12:00:00'),
        createdAt: new Date('2026-01-18T12:00:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 2000,
        method: 'bank_transfer',
        referenceNumber: 'WTH-2026-01-002',
        destinationDetails: 'Grocery Store - Big Basket',
        status: 'processed',
        processedDate: new Date('2026-01-25T16:30:00'),
        createdAt: new Date('2026-01-25T16:30:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 10000,
        method: 'check',
        referenceNumber: 'WTH-2026-02-001',
        destinationDetails: 'Check #5001 - Utility Bills',
        status: 'processed',
        processedDate: new Date('2026-02-10T11:00:00'),
        createdAt: new Date('2026-02-10T11:00:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 3500,
        method: 'bank_transfer',
        referenceNumber: 'WTH-2026-02-002',
        destinationDetails: 'Restaurant - Taj Hotel',
        status: 'processed',
        processedDate: new Date('2026-02-14T20:00:00'),
        createdAt: new Date('2026-02-14T20:00:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 7500,
        method: 'bank_transfer',
        referenceNumber: 'WTH-2026-02-003',
        destinationDetails: 'Shopping - Flipkart',
        status: 'processed',
        processedDate: new Date('2026-02-22T15:30:00'),
        createdAt: new Date('2026-02-22T15:30:00')
      },
      {
        userId: demoUser._id,
        accountId: demoUserAccount._id,
        amount: 1200,
        method: 'atm',
        referenceNumber: 'WTH-2026-02-004',
        destinationDetails: 'ATM - ICICI Bank',
        status: 'processed',
        processedDate: new Date('2026-02-23T17:45:00'),
        createdAt: new Date('2026-02-23T17:45:00')
      }
    ];

    for (const withdrawal of withdrawals) {
      const exists = await Withdrawal.findOne({
        referenceNumber: withdrawal.referenceNumber
      });
      
      if (!exists) {
        await Withdrawal.create(withdrawal);
        console.log(`  ✓ Added withdrawal: ₹${withdrawal.amount} - ${withdrawal.destinationDetails}`);
      }
    }

    // ============================================
    // 3. ADD TRANSFER TRANSACTIONS (if admin exists)
    // ============================================
    if (adminUser && adminAccount) {
      console.log('\n🔄 Adding transfer transactions...');
      
      const transfers = [
        {
          fromUserId: demoUser._id,
          toUserId: adminUser._id,
          fromAccountId: demoUserAccount._id,
          toAccountId: adminAccount._id,
          amount: 5000,
          status: 'Completed',
          description: 'Payment for services',
          purpose: 'Business',
          completedAt: new Date('2026-01-30T14:15:00'),
          createdAt: new Date('2026-01-30T14:15:00')
        },
        {
          fromUserId: demoUser._id,
          toUserId: adminUser._id,
          fromAccountId: demoUserAccount._id,
          toAccountId: adminAccount._id,
          amount: 2500,
          status: 'Completed',
          description: 'Loan installment',
          purpose: 'Loan',
          completedAt: new Date('2026-02-18T10:00:00'),
          createdAt: new Date('2026-02-18T10:00:00')
        }
      ];

      for (const transfer of transfers) {
        const exists = await Transfer.findOne({
          fromUserId: transfer.fromUserId,
          toUserId: transfer.toUserId,
          amount: transfer.amount,
          createdAt: transfer.createdAt
        });
        
        if (!exists) {
          await Transfer.create(transfer);
          console.log(`  ✓ Added transfer: ₹${transfer.amount} - ${transfer.description}`);
        }
      }
    } else {
      console.log('\n⚠️  Skipping transfers (admin account not found)');
    }

    // ============================================
    // 4. UPDATE USER KYC STATUS
    // ============================================
    console.log('\n📄 Updating KYC status...');
    
    const kyc = await KYC.findOne({ userId: demoUser._id });
    if (kyc && kyc.status !== 'approved') {
      kyc.status = 'approved';
      kyc.approvedAt = new Date('2026-01-10T11:00:00');
      await kyc.save();
      console.log('  ✓ Demo user KYC: approved');
    } else if (kyc) {
      console.log('  ✓ Demo user KYC: already approved');
    }

    // ============================================
    // 5. UPDATE ACCOUNT BALANCE
    // ============================================
    console.log('\n💳 Updating account balance...');
    
    // Calculate total balance from transactions
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalTransfers = (adminUser && adminAccount)
      ? [
          { amount: 5000 },
          { amount: 2500 }
        ].reduce((sum, t) => sum + t.amount, 0)
      : 0;
    
    const newBalance = 5000 + totalDeposits - totalWithdrawals - totalTransfers;
    
    demoUserAccount.balance = newBalance;
    await demoUserAccount.save();
    console.log(`  ✓ Updated balance: ₹${newBalance}`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ DEMO DATA SEEDED SUCCESSFULLY\n');
    console.log('📊 SUMMARY:');
    console.log(`   Deposits Added: ${deposits.length}`);
    console.log(`   Withdrawals Added: ${withdrawals.length}`);
    if (adminUser && adminAccount) {
      console.log(`   Transfers Added: 2`);
    }
    console.log(`   Final Balance: ₹${newBalance}`);
    console.log('\n📱 Demo Account:');
    console.log(`   Email: user@example.com`);
    console.log(`   PIN: 123456`);
    console.log(`   Balance: ₹${newBalance}`);
    console.log(`   Status: Ready for demo\n`);
    console.log('💡 Features to test:');
    console.log('   - Dashboard with spending trends');
    console.log('   - Transaction history (deposits, withdrawals)');
    console.log('   - Fraud detection analysis');
    console.log('   - Credit scoring calculation');
    console.log('   - Spending by category');
    console.log('   - Balance trends over time');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo data:', error.message);
    process.exit(1);
  }
}

seedDemoData();
