import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { KYC } from '../models/KYC.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Dispute } from '../models/Dispute.js';
import { UserSuspension } from '../models/UserSuspension.js';
import { sendDepositNotification, sendWithdrawalNotification, sendAccountSuspensionNotice, sendDisputeResolutionNotice } from '../services/emailService.js';
import { recordTransaction } from '../services/blockchainServiceWithPersistence.js';

// Get admin dashboard stats
export async function getDashboardStats(req, res) {
  try {
    // Count only regular users (exclude admins)
    const totalUsers = await User.countDocuments({ isAdmin: false });
    
    // Get total deposits from Deposit model (sum of all approved/completed deposits)
    const totalDepositsData = await Deposit.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get total withdrawals from Withdrawal model (sum of all approved/completed withdrawals)
    const totalWithdrawalsData = await Withdrawal.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Count pending KYC - includes users with 'not_submitted' or 'pending' status
    const pendingKYC = await User.countDocuments({ 
      isAdmin: false,
      kycStatus: { $in: ['not_submitted', 'pending'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDeposits: totalDepositsData[0]?.total || 0,
        totalWithdrawals: totalWithdrawalsData[0]?.total || 0,
        pendingKYC
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get daily transaction summary (last 7 days)
export async function getDailyTransactionSummary(req, res) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get daily deposits using %Y-%m-%d format (MongoDB compatible)
    // Include all statuses (pending, approved, completed) for deposits
    const dailyDeposits = await Deposit.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['pending', 'approved', 'completed', 'Pending', 'Approved', 'Completed'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get daily withdrawals
    // Include pending, approved, processed statuses for withdrawals
    const dailyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['pending', 'approved', 'processed', 'Pending', 'Approved', 'Processed'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Combine into single dataset
    const data = dailyDeposits.map(d => {
      const withdrawal = dailyWithdrawals.find(w => w._id === d._id);
      return {
        day: d._id,
        deposits: d.total,
        withdrawals: withdrawal?.total || 0
      };
    });

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting daily summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get KYC status breakdown
export async function getKycBreakdown(req, res) {
  try {
    const breakdown = await User.aggregate([
      {
        $match: { isAdmin: false }
      },
      {
        $group: {
          _id: '$kycStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Map to expected format
    const data = breakdown.map(item => ({
      name: item._id === 'not_submitted' ? 'Not Submitted' : 
             item._id === 'pending' ? 'Pending' :
             item._id === 'approved' ? 'Approved' : 'Rejected',
      value: item.count,
      color: item._id === 'approved' ? '#10b981' :
             item._id === 'pending' ? '#f59e0b' :
             item._id === 'rejected' ? '#ef4444' : '#6b7280'
    }));

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting KYC breakdown:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all users
export async function getAllUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password')
      .limit(100);

    const usersWithData = await Promise.all(
      users.map(async (user) => {
        const account = await Account.findOne({ userId: user._id });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          balance: account?.balance || 0,
          kycStatus: user.kycStatus || 'not_submitted',
          createdAt: user.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithData.length,
      users: usersWithData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Export users as CSV with live database data
export async function exportUsers(req, res) {
  try {
    const users = await User.find().select('-password').limit(10000);

    // Build CSV with all user details including KYC status
    let csv = 'ID,Name,Email,Phone,KYC Status,Verified,Admin,Created\n';
    users.forEach(user => {
      csv += `"${user._id}","${user.name}","${user.email}","${user.phone}","${user.kycStatus || 'not_submitted'}","${user.isVerified}","${user.isAdmin}","${user.createdAt}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename=users-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Generate system report with live database data
export async function generateReport(req, res) {
  try {
    // User statistics
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const verifiedUsers = await User.countDocuments({ isAdmin: false, isVerified: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    
    // Transaction statistics from actual Deposit and Withdrawal models
    const depositsData = await Deposit.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    const withdrawalsData = await Withdrawal.aggregate([
      { $match: { status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    // KYC statistics based on User.kycStatus field
    const pendingKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'approved' });
    const notSubmittedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'not_submitted' });
    const rejectedKYC = await User.countDocuments({ isAdmin: false, kycStatus: 'rejected' });

    const report = {
      generatedAt: new Date(),
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        admins: adminUsers
      },
      transactions: {
        total: (depositsData[0]?.count || 0) + (withdrawalsData[0]?.count || 0),
        deposits: depositsData[0]?.total || 0,
        withdrawals: withdrawalsData[0]?.total || 0,
        depositCount: depositsData[0]?.count || 0,
        withdrawalCount: withdrawalsData[0]?.count || 0
      },
      kyc: {
        pending: pendingKYC,
        approved: approvedKYC,
        notSubmitted: notSubmittedKYC,
        rejected: rejectedKYC
      }
    };

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all transactions
export async function getAllTransactions(req, res) {
  try {
    const transactions = await Transaction.find()
      .populate('fromAccountId', 'accountNumber')
      .populate('toAccountId', 'accountNumber')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get pending transactions (for admin approval)
export async function getPendingTransactions(req, res) {
  try {
    const pendingTransactions = await Transaction.find({ status: 'Pending' })
      .populate('fromAccountId', 'userId accountNumber')
      .populate('toAccountId', 'userId accountNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Approve transaction (admin)
export async function approveTransaction(req, res) {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending transactions can be approved' });
    }

    // Get the account involved
    let account;
    if (transaction.type === 'Deposit') {
      account = await Account.findById(transaction.toAccountId);
      // Add amount for deposit
      account.balance += transaction.amount;
    } else if (transaction.type === 'Withdrawal') {
      account = await Account.findById(transaction.fromAccountId);
      // Deduct amount for withdrawal
      account.balance -= transaction.amount;
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Update transaction
    transaction.status = 'Completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Save account with updated balance
    await account.save();

    res.status(200).json({
      success: true,
      message: `${transaction.type} transaction approved successfully`,
      transaction: {
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        completedAt: transaction.completedAt
      },
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Reject transaction (admin)
export async function rejectTransaction(req, res) {
  try {
    const { transactionId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending transactions can be rejected' });
    }

    // Update transaction
    transaction.status = 'Failed';
    transaction.rejectionReason = rejectionReason;
    transaction.completedAt = new Date();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction rejected successfully',
      transaction: {
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        rejectionReason: transaction.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============ DEPOSIT APPROVAL FUNCTIONS ============

// Get all deposits (optionally filtered by status)
export async function getPendingDeposits(req, res) {
  try {
    const { status = 'pending' } = req.query; // Default to pending, but allow filtering
    
    // Build query - can filter by status or get all
    const query = status === 'all' ? {} : { status };
    
    const deposits = await Deposit.find(query)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber balance')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      deposits,
      count: deposits.length,
      status: status === 'all' ? 'all statuses' : status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Approve deposit
export async function approveDeposit(req, res) {
  try {
    const { depositId } = req.params;
    const { notes } = req.body;
    const adminId = req.user._id;

    const deposit = await Deposit.findById(depositId).populate('accountId').populate('userId');

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending deposits can be approved' });
    }

    // Update account balance
    const account = await Account.findById(deposit.accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    account.balance += deposit.amount;
    await account.save();

    // Update deposit status
    deposit.status = 'approved';
    deposit.approvedBy = adminId;
    deposit.approvalDate = new Date();
    deposit.notes = notes || null;
    await deposit.save();

    // Record transaction on blockchain
    const blockchainResult = await recordTransaction(
      'BANK',
      `ACC-${account._id.toString().slice(-8)}`,
      deposit.amount,
      'deposit',
      {
        depositId: deposit._id.toString(),
        referenceNumber: deposit.referenceNumber,
        method: deposit.method,
        sourceBank: deposit.sourceBank,
        purpose: deposit.purpose,
        userId: deposit.userId._id.toString(),
        timestamp: new Date().toISOString()
      }
    );

    // Store blockchain hash in deposit record
    deposit.blockchainHash = blockchainResult.blockchainHash;
    await deposit.save();

    // Send email notification
    await sendDepositNotification(deposit.userId.email, deposit.userId.name, deposit.amount, deposit.referenceNumber, 'approved');

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully',
      deposit: {
        referenceNumber: deposit.referenceNumber,
        amount: deposit.amount,
        status: deposit.status,
        approvalDate: deposit.approvalDate,
        blockchainHash: blockchainResult.blockchainHash,
        blockNumber: blockchainResult.blockNumber
      },
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Reject deposit
export async function rejectDeposit(req, res) {
  try {
    const { depositId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending deposits can be rejected' });
    }

    // Update deposit status
    deposit.status = 'rejected';
    deposit.approvedBy = adminId;
    deposit.approvalDate = new Date();
    deposit.rejectionReason = rejectionReason;
    await deposit.save();

    res.status(200).json({
      success: true,
      message: 'Deposit rejected successfully',
      deposit: {
        referenceNumber: deposit.referenceNumber,
        amount: deposit.amount,
        status: deposit.status,
        rejectionReason: deposit.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============ WITHDRAWAL APPROVAL FUNCTIONS ============

// Get all pending withdrawals
export async function getPendingWithdrawals(req, res) {
  try {
    const { status = 'pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    
    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email')
      .populate('accountId', 'accountNumber balance')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      status: status === 'all' ? 'all statuses' : status,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Approve withdrawal
export async function approveWithdrawal(req, res) {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;
    const adminId = req.user._id;

    const withdrawal = await Withdrawal.findById(withdrawalId).populate('accountId').populate('userId');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending withdrawals can be approved' });
    }

    // Get account and verify balance
    const account = await Account.findById(withdrawal.accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.balance < withdrawal.amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in account' });
    }

    // Deduct from account balance
    account.balance -= withdrawal.amount;
    await account.save();

    // Update withdrawal status
    withdrawal.status = 'approved';
    withdrawal.approvedBy = adminId;
    withdrawal.approvalDate = new Date();
    withdrawal.notes = notes || null;
    await withdrawal.save();

    // Record transaction on blockchain
    const blockchainResult = await recordTransaction(
      `ACC-${account._id.toString().slice(-8)}`,
      'BANK',
      withdrawal.amount,
      'withdrawal',
      {
        withdrawalId: withdrawal._id.toString(),
        referenceNumber: withdrawal.referenceNumber,
        bankName: withdrawal.bankName,
        accountNumber: withdrawal.accountNumber,
        userId: withdrawal.userId._id.toString(),
        timestamp: new Date().toISOString()
      }
    );

    // Store blockchain hash in withdrawal record
    withdrawal.blockchainHash = blockchainResult.blockchainHash;
    await withdrawal.save();

    // Send email notification
    await sendWithdrawalNotification(withdrawal.userId.email, withdrawal.userId.name, withdrawal.amount, withdrawal.referenceNumber, 'approved');

    res.status(200).json({
      success: true,
      message: 'Withdrawal approved successfully',
      withdrawal: {
        referenceNumber: withdrawal.referenceNumber,
        amount: withdrawal.amount,
        status: withdrawal.status,
        approvalDate: withdrawal.approvalDate,
        blockchainHash: blockchainResult.blockchainHash,
        blockNumber: blockchainResult.blockNumber
      },
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Reject withdrawal
export async function rejectWithdrawal(req, res) {
  try {
    const { withdrawalId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending withdrawals can be rejected' });
    }

    // Update withdrawal status
    withdrawal.status = 'rejected';
    withdrawal.approvedBy = adminId;
    withdrawal.approvalDate = new Date();
    withdrawal.rejectionReason = rejectionReason;
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal rejected successfully',
      withdrawal: {
        referenceNumber: withdrawal.referenceNumber,
        amount: withdrawal.amount,
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============ DISPUTE RESOLUTION FUNCTIONS ============

// Get all disputes
export async function getAllDisputes(req, res) {
  try {
    const disputes = await Dispute.find()
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get open disputes
export async function getOpenDisputes(req, res) {
  try {
    const disputes = await Dispute.find({ status: { $in: ['open', 'investigating'] } })
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({ success: true, disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Resolve dispute
export async function resolveDispute(req, res) {
  try {
    const { disputeId } = req.params;
    const { resolution, refundAmount, notes } = req.body;
    const adminId = req.user._id;

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    // If refund amount is specified, add it to user's account
    if (refundAmount > 0) {
      const account = await Account.findOne({ userId: dispute.userId });
      if (account) {
        account.balance += refundAmount;
        await account.save();
      }
    }

    // Update dispute
    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.refundAmount = refundAmount || 0;
    dispute.notes = notes;
    dispute.resolvedAt = new Date();
    dispute.assignedTo = adminId;
    await dispute.save();

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute: {
        id: dispute._id,
        status: dispute.status,
        resolution: dispute.resolution,
        refundAmount: dispute.refundAmount,
      }
    });

    // Send email notification
    const user = await User.findById(dispute.userId);
    if (user) {
      await sendDisputeResolutionNotice(user.email, user.name, dispute._id, resolution, refundAmount || 0);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Assign dispute to admin
export async function assignDispute(req, res) {
  try {
    const { disputeId } = req.params;
    const { assignedToId } = req.body;

    const dispute = await Dispute.findByIdAndUpdate(
      disputeId,
      { assignedTo: assignedToId },
      { new: true }
    ).populate('assignedTo', 'name email');

    res.status(200).json({ success: true, dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============ USER SUSPENSION FUNCTIONS ============

// Suspend user
export async function suspendUser(req, res) {
  try {
    const { userId } = req.params;
    const { reason, severity, suspendUntil, notes } = req.body;
    const adminId = req.user._id;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Suspension reason is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already suspended
    const existingSuspension = await UserSuspension.findOne({ userId });
    if (existingSuspension && existingSuspension.isSuspended) {
      return res.status(400).json({ success: false, message: 'User is already suspended' });
    }

    // Create or update suspension
    let suspension;
    if (existingSuspension) {
      suspension = existingSuspension;
      suspension.isSuspended = true;
    } else {
      suspension = new UserSuspension({ userId });
    }

    suspension.reason = reason;
    suspension.severity = severity || 'temporary';
    suspension.suspendedAt = new Date();
    suspension.suspendedUntil = suspendUntil || null;
    suspension.suspendedBy = adminId;
    suspension.notes = notes;
    await suspension.save();

    // Update user account status
    user.isVerified = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} suspended successfully`,
      suspension: {
        userId: suspension.userId,
        reason: suspension.reason,
        severity: suspension.severity,
        suspendedAt: suspension.suspendedAt,
        suspendedUntil: suspension.suspendedUntil
      }
    });

    // Send email notification
    const suspendedUntil = suspension.suspendedUntil ? suspension.suspendedUntil.toDateString() : 'Indefinitely';
    await sendAccountSuspensionNotice(user.email, user.name, reason, suspendedUntil);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Unsuspend user
export async function unsuspendUser(req, res) {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    const adminId = req.user._id;

    const suspension = await UserSuspension.findOne({ userId });
    if (!suspension || !suspension.isSuspended) {
      return res.status(404).json({ success: false, message: 'User is not suspended' });
    }

    // Update suspension
    suspension.isSuspended = false;
    suspension.unsuspendedAt = new Date();
    suspension.unsuspendedBy = adminId;
    suspension.notes = notes;
    await suspension.save();

    // Re-enable user
    const user = await User.findById(userId);
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'User unsuspended successfully',
      suspension: {
        userId: suspension.userId,
        isSuspended: suspension.isSuspended,
        unsuspendedAt: suspension.unsuspendedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all suspended users
export async function getSuspendedUsers(req, res) {
  try {
    const suspensions = await UserSuspension.find({ isSuspended: true })
      .populate('userId', 'name email')
      .populate('suspendedBy', 'name email')
      .sort({ suspendedAt: -1 });

    res.status(200).json({ success: true, suspensions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
