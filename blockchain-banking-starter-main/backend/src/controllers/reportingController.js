import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { User } from '../models/User.js';

// Generate account statement
export async function generateAccountStatement(req, res) {
  try {
    const userId = req.user._id;
    const { startDate, endDate, format } = req.query;

    const account = await Account.findOne({ userId }).populate('userId', 'name email');
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Fetch transactions
    const query = { toAccountId: account._id };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    const deposits = await Deposit.find({
      accountId: account._id,
      status: 'approved',
      createdAt: query.createdAt || {}
    });

    const withdrawals = await Withdrawal.find({
      accountId: account._id,
      status: 'approved',
      createdAt: query.createdAt || {}
    });

    const statement = {
      accountNumber: account.accountNumber,
      accountHolder: account.userId.name,
      email: account.userId.email,
      balance: account.balance,
      accountType: account.accountType,
      statementDate: new Date(),
      startDate: startDate || null,
      endDate: endDate || null,
      transactions,
      deposits,
      withdrawals,
      totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0),
      totalWithdrawals: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      depositCount: deposits.length,
      withdrawalCount: withdrawals.length,
      summary: {
        totalTransactions: transactions.length,
        totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0),
        totalWithdrawals: withdrawals.reduce((sum, w) => sum + w.amount, 0),
        depositCount: deposits.length,
        withdrawalCount: withdrawals.length
      }
    };

    if (format === 'pdf') {
      // For PDF, return HTML that can be converted
      res.status(200).json({ success: true, format: 'json', statement });
    } else {
      res.status(200).json({ success: true, format: 'json', statement });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get transaction history
export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find({ toAccountId: account._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({ toAccountId: account._id });

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin: Get all user transactions (report)
export async function getAllUserTransactionsReport(req, res) {
  try {
    const { userId, startDate, endDate } = req.query;

    const query = {};
    if (userId) {
      const account = await Account.findOne({ userId });
      if (account) query.toAccountId = account._id;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('toAccountId', 'accountNumber balance')
      .sort({ createdAt: -1 });

    const deposits = await Deposit.find(
      startDate || endDate ? { createdAt: query.createdAt || {} } : {}
    ).populate('userId', 'name email').populate('accountId', 'accountNumber');

    const withdrawals = await Withdrawal.find(
      startDate || endDate ? { createdAt: query.createdAt || {} } : {}
    ).populate('userId', 'name email').populate('accountId', 'accountNumber');

    const report = {
      generatedAt: new Date(),
      startDate: startDate || null,
      endDate: endDate || null,
      summary: {
        totalTransactions: transactions.length,
        totalDeposits: deposits.length,
        totalWithdrawals: withdrawals.length,
        totalDepositAmount: deposits.reduce((sum, d) => sum + d.amount, 0),
        totalWithdrawalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      },
      transactions,
      deposits,
      withdrawals
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Export transactions to CSV
export async function exportTransactionsCSV(req, res) {
  try {
    const userId = req.user._id;
    const account = await Account.findOne({ userId });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const transactions = await Transaction.find({ toAccountId: account._id }).sort({ createdAt: -1 });

    // Generate CSV
    let csv = 'Date,Type,Amount,Status,Reference\n';
    transactions.forEach(t => {
      csv += `"${t.createdAt}","${t.type}","${t.amount}","${t.status}","${t.transactionId}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin: Dashboard report
export async function getDashboardReport(req, res) {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalDeposits = await Deposit.countDocuments({ status: 'approved' });
    const totalWithdrawals = await Withdrawal.countDocuments({ status: 'approved' });
    
    const depositAmount = await Deposit.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const withdrawalAmount = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const depositsPending = pendingDeposits;
    const depositsApproved = totalDeposits;
    const depositsRejected = await Deposit.countDocuments({ status: 'rejected' });
    const withdrawalsPending = pendingWithdrawals;
    const withdrawalsApproved = totalWithdrawals;
    const withdrawalsRejected = await Withdrawal.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      report: {
        date: new Date(),
        totalUsers,
        totalDeposits: depositAmount[0]?.total || 0,
        totalWithdrawals: withdrawalAmount[0]?.total || 0,
        pendingTransactions: pendingDeposits + pendingWithdrawals,
        depositsPending,
        depositsApproved,
        depositsRejected,
        withdrawalsPending,
        withdrawalsApproved,
        withdrawalsRejected,
        users: {
          total: totalUsers
        },
        deposits: {
          total: totalDeposits,
          pending: pendingDeposits,
          totalAmount: depositAmount[0]?.total || 0
        },
        withdrawals: {
          total: totalWithdrawals,
          pending: pendingWithdrawals,
          totalAmount: withdrawalAmount[0]?.total || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
