import express from 'express';
import { getDashboardStats, getDailyTransactionSummary, getKycBreakdown, getAllUsers, exportUsers, generateReport, getAllTransactions, getPendingTransactions, approveTransaction, rejectTransaction, getPendingDeposits, approveDeposit, rejectDeposit, getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from '../controllers/adminController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { getBlockchainLedger, getBlockchainStats, verifyTransaction } from '../services/blockchainService.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(protect, adminProtect);

router.get('/stats', getDashboardStats);
router.get('/analytics/daily-summary', getDailyTransactionSummary);
router.get('/analytics/kyc-breakdown', getKycBreakdown);
router.get('/users', getAllUsers);
router.get('/users/export/csv', exportUsers);
router.get('/report', generateReport);
router.get('/transactions', getAllTransactions);
router.get('/transactions/pending', getPendingTransactions);
router.post('/transactions/:transactionId/approve', approveTransaction);
router.post('/transactions/:transactionId/reject', rejectTransaction);

// Deposit routes
router.get('/deposits/pending', getPendingDeposits);
router.post('/deposits/:depositId/approve', approveDeposit);
router.post('/deposits/:depositId/reject', rejectDeposit);

// Withdrawal routes
router.get('/withdrawals/pending', getPendingWithdrawals);
router.post('/withdrawals/:withdrawalId/approve', approveWithdrawal);
router.post('/withdrawals/:withdrawalId/reject', rejectWithdrawal);

// Blockchain routes
router.get('/blockchain/ledger', (req, res) => {
  try {
    const ledger = getBlockchainLedger();
    res.status(200).json({
      success: true,
      totalBlocks: ledger.length,
      ledger: ledger
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/blockchain/stats', (req, res) => {
  try {
    const stats = getBlockchainStats();
    res.status(200).json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/blockchain/verify/:blockNumber', (req, res) => {
  try {
    const { blockNumber } = req.params;
    const result = verifyTransaction(parseInt(blockNumber));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
