/**
 * Spending Analytics Routes
 * Real ML-based spending analytics API endpoints
 */

import express from 'express';
import {
  analyzeUserSpending,
  getSpendingSummary,
  getSpendingAdvice,
  getSpendingByCategory,
  getSpendingTrends,
  getSpendingAnalyticsModelStats,
  createBudgetPlan
} from '../controllers/spendingAnalyticsController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// User endpoints
router.post('/analyze', protect, analyzeUserSpending);
router.get('/summary', protect, getSpendingSummary);
router.get('/insights', protect, getSpendingAdvice);
router.get('/categories', protect, getSpendingByCategory);
router.get('/trends', protect, getSpendingTrends);
router.post('/budget-plan', protect, createBudgetPlan);

// Admin endpoints
router.get('/stats', protect, adminProtect, getSpendingAnalyticsModelStats);

export default router;
