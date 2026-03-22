import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transfer } from '../models/Transfer.js';
import { detectFraud, addTransactionToHistory } from '../services/fraudService.js';
import { recordTransaction } from '../services/blockchainServiceWithPersistence.js';

// Initiate transfer (user to user)
export async function initiateTransfer(req, res) {
  try {
    const { toAccountNumber, amount, purpose, description, recipientPhone, recipientEmail } = req.body;
    const fromUserId = req.user._id;

    // Validation
    if (!toAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid transfer details' });
    }

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum transfer amount is ₹100' });
    }

    // Validate recipient information
    if (!recipientPhone || !recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient phone and email are required' });
    }

    // Find recipient account by account number
    const recipientAccount = await Account.findOne({ accountNumber: toAccountNumber });
    if (!recipientAccount) {
      return res.status(404).json({ success: false, message: 'Recipient account not found' });
    }

    const recipientUser = await User.findById(recipientAccount.userId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    if (recipientUser._id.toString() === fromUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
    }

    // Check sender's balance
    const senderAccount = await Account.findOne({ userId: fromUserId });
    if (!senderAccount) {
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    }

    if (senderAccount.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Generate reference number
    const referenceNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Perform fraud detection
    const fraudAnalysis = await detectFraud({
      userId: fromUserId,
      amount,
      type: 'transfer',
      location: 'internal_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    });

    // Create transfer with Pending status
    const transfer = await Transfer.create({
      fromUserId,
      toUserId: recipientUser._id,
      fromAccountId: senderAccount._id,
      toAccountId: recipientAccount._id,
      amount,
      purpose: purpose || 'Personal',
      description: description || `Transfer to ${recipientUser.name}`,
      recipientPhone,
      recipientEmail,
      referenceNumber,
      status: 'Pending',
      riskScore: fraudAnalysis.riskScore,
      fraudStatus: fraudAnalysis.status
    });

    // Add to fraud detection history
    addTransactionToHistory({
      userId: fromUserId,
      amount,
      type: 'transfer',
      timestamp: new Date(),
      location: 'internal_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      riskScore: fraudAnalysis.riskScore
    });

    res.status(201).json({
      success: true,
      message: 'Transfer initiated and awaiting admin approval',
      transfer: {
        referenceNumber: transfer.referenceNumber,
        toUser: recipientUser.name,
        amount: transfer.amount,
        status: transfer.status,
        createdAt: transfer.createdAt
      }
    });
  } catch (error) {
    console.error('Transfer initiation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get user's transfers
export async function getUserTransfers(req, res) {
  try {
    const userId = req.user._id;

    const transfers = await Transfer.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    })
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: transfers.length,
      transfers: transfers.map(t => ({
        transferId: t.transferId,
        from: t.fromUserId.name,
        to: t.toUserId.name,
        amount: t.amount,
        status: t.status,
        purpose: t.purpose,
        createdAt: t.createdAt,
        completedAt: t.completedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin: Get pending transfers
export async function getPendingTransfers(req, res) {
  try {
    const { status = 'Pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    
    const transfers = await Transfer.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('fromAccountId', 'accountNumber')
      .populate('toAccountId', 'accountNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transfers.length,
      status: status === 'all' ? 'all statuses' : status,
      transfers: transfers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin: Approve transfer
export async function approveTransfer(req, res) {
  try {
    const { transferId } = req.params;
    const { adminNotes } = req.body;

    const transfer = await Transfer.findById(transferId);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending transfers can be approved' });
    }

    // Get accounts
    const senderAccount = await Account.findById(transfer.fromAccountId);
    const recipientAccount = await Account.findById(transfer.toAccountId);

    if (!senderAccount || !recipientAccount) {
      return res.status(404).json({ success: false, message: 'Accounts not found' });
    }

    // Update balances
    senderAccount.balance -= transfer.amount;
    recipientAccount.balance += transfer.amount;

    // Update transfer
    transfer.status = 'Completed';
    transfer.completedAt = new Date();
    if (adminNotes) transfer.adminNotes = adminNotes;
    transfer.approvedBy = req.user._id;

    await senderAccount.save();
    await recipientAccount.save();
    
    // Record transaction on blockchain
    const blockchainResult = await recordTransaction(
      `ACC-${senderAccount._id.toString().slice(-8)}`,
      `ACC-${recipientAccount._id.toString().slice(-8)}`,
      transfer.amount,
      'transfer',
      {
        transferId: transfer._id.toString(),
        fromUser: transfer.fromUserId.toString(),
        toUser: transfer.toUserId.toString(),
        purpose: transfer.purpose,
        description: transfer.description,
        timestamp: new Date().toISOString()
      }
    );

    // Store blockchain hash in transfer record
    transfer.blockchainHash = blockchainResult.blockchainHash;
    await transfer.save();

    res.status(200).json({
      success: true,
      message: 'Transfer approved successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        completedAt: transfer.completedAt,
        blockchainHash: blockchainResult.blockchainHash,
        blockNumber: blockchainResult.blockNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin: Reject transfer
export async function rejectTransfer(req, res) {
  try {
    const { transferId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const transfer = await Transfer.findById(transferId);

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending transfers can be rejected' });
    }

    // Update transfer
    transfer.status = 'Failed';
    transfer.rejectionReason = rejectionReason;
    transfer.completedAt = new Date();
    transfer.approvedBy = req.user._id;

    await transfer.save();

    res.status(200).json({
      success: true,
      message: 'Transfer rejected successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        rejectionReason: transfer.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Search users for transfer by account number
export async function searchUsers(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    // Search by account number or user name
    const accounts = await Account.find({
      $or: [
        { accountNumber: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    // Also search users and get their accounts
    const users = await User.find({
      $and: [
        { name: { $regex: query, $options: 'i' } },
        { _id: { $ne: req.user._id } } // Exclude current user
      ]
    }).select('_id name email').limit(10);

    // Get accounts for matched users
    const userIds = users.map(u => u._id);
    const userAccounts = await Account.find({ userId: { $in: userIds } }).populate('userId', 'name email');

    // Combine results
    const accountsFromSearch = accounts.map(acc => ({
      accountNumber: acc.accountNumber,
      holderName: acc.holderName || 'N/A',
      _id: acc._id
    }));

    const accountsFromUsers = userAccounts.map(acc => ({
      accountNumber: acc.accountNumber,
      holderName: acc.userId.name,
      _id: acc._id
    }));

    // Remove duplicates and combine
    const allAccounts = [...accountsFromSearch, ...accountsFromUsers];
    const uniqueAccounts = Array.from(new Map(allAccounts.map(item => [item.accountNumber, item])).values());

    res.status(200).json({
      success: true,
      count: uniqueAccounts.length,
      accounts: uniqueAccounts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
