import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';

// Get account details
export async function getAccount(req, res) {
  try {
    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({
      success: true,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance,
      currency: account.currency,
      isActive: account.isActive,
      walletAddress: account.walletAddress,
      blockchainBalance: account.blockchainBalance,
      createdAt: account.createdAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Deposit money
export async function deposit(req, res) {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Create transaction with Pending status (waiting for admin approval)
    const transaction = await Transaction.create({
      fromAccountId: null,
      toAccountId: account._id,
      amount,
      type: 'Deposit',
      status: 'Pending',
      description: description || 'Money Deposit'
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted and awaiting admin approval',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Withdraw money
export async function withdraw(req, res) {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create transaction with Pending status (waiting for admin approval)
    const transaction = await Transaction.create({
      fromAccountId: account._id,
      toAccountId: null,
      amount,
      type: 'Withdrawal',
      status: 'Pending',
      description: description || 'Money Withdrawal'
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted and awaiting admin approval',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: account.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get transaction history
export async function getTransactions(req, res) {
  try {
    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Query both Transaction model and Deposit/Withdrawal collections for complete history
    const { Deposit } = await import('../models/Deposit.js');
    const { Withdrawal } = await import('../models/Withdrawal.js');
    const { Transfer } = await import('../models/Transfer.js');
    
    // Get ALL deposits (not just completed) - user wants to see pending ones too
    const deposits = await Deposit.find({ accountId: account._id }).sort({ createdAt: -1 });
    const withdrawals = await Withdrawal.find({ accountId: account._id }).sort({ createdAt: -1 });
    const transfers = await Transfer.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id }
      ]
    }).sort({ createdAt: -1 });
    
    // Also get from Transaction model for compatibility
    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    
    // Combine all transactions
    const allTransactions = [
      ...deposits.map(d => ({
        _id: d._id.toString(),
        transactionId: d._id.toString(),
        amount: d.amount,
        type: 'deposit',
        status: d.status,
        referenceNumber: d.referenceNumber,
        riskScore: d.riskScore,
        fraudStatus: d.fraudStatus,
        purpose: d.purpose,
        description: d.sourceDetails || 'Deposit',
        createdAt: d.createdAt
      })),
      ...withdrawals.map(w => ({
        _id: w._id.toString(),
        transactionId: w._id.toString(),
        amount: w.amount,
        type: 'withdraw',
        status: w.status,
        referenceNumber: w.referenceNumber,
        riskScore: w.riskScore,
        fraudStatus: w.fraudStatus,
        purpose: w.purpose,
        description: w.destinationDetails || 'Withdrawal',
        createdAt: w.createdAt
      })),
      ...transfers.map(t => ({
        _id: t._id.toString(),
        transactionId: t._id.toString(),
        amount: t.amount,
        type: 'transfer',
        status: t.status,
        referenceNumber: t.referenceNumber,
        riskScore: t.riskScore,
        fraudStatus: t.fraudStatus,
        recipientName: t.recipientName,
        recipientPhone: t.recipientPhone,
        recipientEmail: t.recipientEmail,
        toAccountNumber: t.toAccountNumber,
        purpose: t.purpose,
        description: t.description || 'Transfer',
        createdAt: t.createdAt
      })),
      ...transactions.map(t => ({
        _id: t._id?.toString(),
        transactionId: t.transactionId,
        amount: t.amount,
        type: t.type,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: allTransactions.length,
      transactions: allTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get balance
export async function getBalance(req, res) {
  try {
    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({
      success: true,
      balance: account.balance,
      currency: account.currency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get account balance trend
export async function getBalanceTrend(req, res) {
  try {
    const { days = 30 } = req.body;
    const account = await Account.findOne({ userId: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Get transactions for the specified period
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Import models for deposits/withdrawals/transfers
    const { Deposit } = await import('../models/Deposit.js');
    const { Withdrawal } = await import('../models/Withdrawal.js');
    const { Transfer } = await import('../models/Transfer.js');

    const deposits = await Deposit.find({
      accountId: account._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();

    const withdrawals = await Withdrawal.find({
      accountId: account._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();

    const transfers = await Transfer.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id }
      ],
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();

    // Combine all transactions with type info (ALREADY SORTED by createdAt ascending)
    const allTransactions = [
      ...deposits.map(d => ({ ...d, txType: 'deposit', amount: d.amount })),
      ...withdrawals.map(w => ({ ...w, txType: 'withdrawal', amount: w.amount })),
      ...transfers.map(t => ({
        ...t,
        txType: 'transfer',
        amount: t.amount,
        isOutgoing: t.fromAccountId?.toString() === account._id.toString()
      }))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Build balance trend by going FORWARD in time from oldest transaction
    const balanceByDay = {};
    let cumulativeBalance = account.balance;
    
    // Calculate balance at earliest transaction date by reversing all transactions
    allTransactions.forEach(tx => {
      let impact = 0;
      if (tx.txType === 'deposit') {
        impact = tx.amount;
      } else if (tx.txType === 'withdrawal') {
        impact = -tx.amount;
      } else if (tx.txType === 'transfer') {
        impact = tx.isOutgoing ? -tx.amount : tx.amount;
      }
      cumulativeBalance -= impact; // Go backwards
    });
    
    // Now go forward through transactions
    allTransactions.forEach(tx => {
      const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];
      
      let impact = 0;
      if (tx.txType === 'deposit') {
        impact = tx.amount;
      } else if (tx.txType === 'withdrawal') {
        impact = -tx.amount;
      } else if (tx.txType === 'transfer') {
        impact = tx.isOutgoing ? -tx.amount : tx.amount;
      }
      
      cumulativeBalance += impact;
      balanceByDay[dateStr] = cumulativeBalance;
    });

    // Build final trend array for all days
    const trend = [];
    const today = new Date();
    let lastBalance = Math.max(0, cumulativeBalance); // Use last known balance
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = `Day ${days - i}`;
      
      // Use balance for that day if available, otherwise use last known balance
      const balance = balanceByDay[dateStr] !== undefined ? balanceByDay[dateStr] : lastBalance;
      trend.push({
        day: dayLabel,
        date: dateStr,
        balance: Math.max(0, balance)
      });
      if (balanceByDay[dateStr] !== undefined) {
        lastBalance = balance;
      }
    }

    res.status(200).json({
      success: true,
      trend,
      currentBalance: account.balance,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Error getting balance trend:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all accounts for logged in user
export async function getUserAccounts(req, res) {
  try {
    const accounts = await Account.find({ userId: req.user._id });

    res.status(200).json({
      success: true,
      accounts: accounts.map(acc => ({
        _id: acc._id,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        isActive: acc.isActive,
        createdAt: acc.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
