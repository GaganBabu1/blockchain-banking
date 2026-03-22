import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Account } from '../models/Account.js';
import { User } from '../models/User.js';
import { detectFraud, addTransactionToHistory } from '../services/fraudDetectionService.js';

// ============ DEPOSIT FUNCTIONS ============

export async function createDepositRequest(req, res) {
  try {
    const { 
      accountId, 
      amount, 
      method, 
      sourceBank,
      accountNumber,
      transactionReference,
      checkNumber,
      checkIssuerName,
      bankName,
      purpose
    } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹100' });
    }

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found or does not belong to you' });
    }

    // Generate reference number
    const referenceNumber = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Perform fraud detection
    const fraudAnalysis = await detectFraud({
      userId,
      amount,
      type: 'deposit',
      location: 'bank_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    });

    // Create deposit request
    const deposit = new Deposit({
      accountId,
      userId,
      amount,
      method,
      sourceBank: method === 'bank_transfer' ? sourceBank : null,
      accountNumber: method === 'bank_transfer' ? accountNumber : null,
      transactionReference: method === 'bank_transfer' ? transactionReference : null,
      checkNumber: method === 'check' ? checkNumber : null,
      checkIssuerName: method === 'check' ? checkIssuerName : null,
      bankName: method === 'check' ? bankName : null,
      purpose,
      referenceNumber,
      status: 'pending',
      riskScore: fraudAnalysis.riskScore,
      fraudStatus: fraudAnalysis.status
    });

    await deposit.save();

    // Add to fraud detection history
    addTransactionToHistory({
      userId,
      amount,
      type: 'deposit',
      timestamp: new Date(),
      location: 'bank_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      riskScore: fraudAnalysis.riskScore
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      deposit: {
        id: deposit._id,
        referenceNumber: deposit.referenceNumber,
        amount: deposit.amount,
        method: deposit.method,
        status: deposit.status,
        riskScore: deposit.riskScore,
        fraudStatus: deposit.fraudStatus,
        createdAt: deposit.createdAt,
        sourceBank: deposit.sourceBank,
        accountNumber: deposit.accountNumber,
        checkNumber: deposit.checkNumber,
        checkIssuerName: deposit.checkIssuerName,
        bankName: deposit.bankName,
        purpose: deposit.purpose
      },
      fraudAnalysis: {
        riskScore: fraudAnalysis.riskScore,
        status: fraudAnalysis.status,
        reason: fraudAnalysis.reason
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit request', details: error.message });
  }
}

export async function getUserDeposits(req, res) {
  try {
    const userId = req.user._id;

    const deposits = await Deposit.find({ userId })
      .populate('accountId', 'accountNumber balance')
      .sort({ createdAt: -1 });

    res.json({ deposits });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposits', details: error.message });
  }
}

export async function getDepositById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deposit = await Deposit.findOne({ _id: id, userId })
      .populate('accountId', 'accountNumber balance')
      .populate('approvedBy', 'name email');

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    res.json({ deposit });
  } catch (error) {
    console.error('Error fetching deposit:', error);
    res.status(500).json({ error: 'Failed to fetch deposit', details: error.message });
  }
}

// ============ WITHDRAWAL FUNCTIONS ============

export async function createWithdrawalRequest(req, res) {
  try {
    const { accountId, amount, method, destinationBank, destinationAccountNumber, recipientName, purpose } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (amount < 500) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹500' });
    }

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found or does not belong to you' });
    }

    // Check balance
    if (account.balance < amount) {
      return res.status(400).json({ error: `Insufficient balance. Available: ₹${account.balance}` });
    }

    // Validate required destination fields
    if (!destinationBank) {
      return res.status(400).json({ error: 'Destination bank is required' });
    }
    if (!destinationAccountNumber) {
      return res.status(400).json({ error: 'Destination account number is required' });
    }
    if (!recipientName) {
      return res.status(400).json({ error: 'Recipient name is required' });
    }

    // Generate reference number
    const referenceNumber = `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Perform fraud detection
    const fraudAnalysis = await detectFraud({
      userId,
      amount,
      type: 'withdrawal',
      location: 'bank_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    });

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      accountId,
      userId,
      amount,
      method,
      destinationBank,
      destinationAccountNumber,
      recipientName,
      purpose: purpose || null,
      referenceNumber,
      status: 'pending',
      riskScore: fraudAnalysis.riskScore,
      fraudStatus: fraudAnalysis.status
    });

    await withdrawal.save();

    // Add to fraud detection history
    addTransactionToHistory({
      userId,
      amount,
      type: 'withdrawal',
      timestamp: new Date(),
      location: 'bank_transfer',
      deviceId: req.headers['user-agent'] || 'unknown',
      riskScore: fraudAnalysis.riskScore
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        referenceNumber: withdrawal.referenceNumber,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        fraudStatus: withdrawal.fraudStatus,
        riskScore: withdrawal.riskScore
      },
      fraudAnalysis: {
        riskScore: fraudAnalysis.riskScore,
        status: fraudAnalysis.status,
        reason: fraudAnalysis.reason
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request', details: error.message });
  }
}

export async function getUserWithdrawals(req, res) {
  try {
    const userId = req.user._id;

    const withdrawals = await Withdrawal.find({ userId })
      .populate('accountId', 'accountNumber balance')
      .sort({ createdAt: -1 });

    res.json({ withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals', details: error.message });
  }
}

export async function getWithdrawalById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const withdrawal = await Withdrawal.findOne({ _id: id, userId })
      .populate('accountId', 'accountNumber balance')
      .populate('approvedBy', 'name email');

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    res.json({ withdrawal });
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal', details: error.message });
  }
}
