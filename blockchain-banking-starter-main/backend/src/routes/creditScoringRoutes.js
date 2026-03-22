/**
 * Credit Scoring Routes
 * Real ML-based credit scoring API endpoints
 */

import express from 'express';
import {
  calculateUserCreditScore,
  generateSampleData,
  getUserCreditScore,
  getImprovementPlan,
  checkLoanEligibility,
  getCreditScoringModelStats,
  getCreditLeaderboard
} from '../controllers/creditScoringController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// User endpoints
router.post('/calculate', protect, calculateUserCreditScore);
router.post('/generate-sample-data', protect, generateSampleData);
router.get('/score', protect, getUserCreditScore);
router.post('/improve-plan', protect, getImprovementPlan);
router.get('/loan-eligibility', protect, checkLoanEligibility);

// Admin endpoints
router.get('/stats', protect, adminProtect, getCreditScoringModelStats);
router.get('/leaderboard', protect, adminProtect, getCreditLeaderboard);

export default router;
