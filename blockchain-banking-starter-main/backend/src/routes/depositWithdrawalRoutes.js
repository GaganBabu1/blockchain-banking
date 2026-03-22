import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkUserSuspension } from '../middleware/suspensionMiddleware.js';
import {
  createDepositRequest,
  getUserDeposits,
  getDepositById,
  createWithdrawalRequest,
  getUserWithdrawals,
  getWithdrawalById
} from '../controllers/transactionController.js';

const router = express.Router();

// ============ DEPOSIT ROUTES ============

// Create deposit request
router.post('/deposits', protect, checkUserSuspension, createDepositRequest);

// Get user's deposits
router.get('/deposits', protect, getUserDeposits);

// Get specific deposit
router.get('/deposits/:id', protect, getDepositById);

// ============ WITHDRAWAL ROUTES ============

// Create withdrawal request
router.post('/withdrawals', protect, checkUserSuspension, createWithdrawalRequest);

// Get user's withdrawals
router.get('/withdrawals', protect, getUserWithdrawals);

// Get specific withdrawal
router.get('/withdrawals/:id', protect, getWithdrawalById);

export default router;
