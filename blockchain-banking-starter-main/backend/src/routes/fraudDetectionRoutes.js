import express from 'express';
import {
  analyzeTransaction,
  getModelStats,
  trainModel,
  getSuspiciousTransactions,
  getUserFraudProfile
} from '../controllers/fraudDetectionController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (protected)
router.post('/analyze', protect, analyzeTransaction);
router.get('/stats', protect, getModelStats);

// Admin routes
router.post('/train', protect, adminProtect, trainModel);
router.get('/suspicious', protect, adminProtect, getSuspiciousTransactions);
router.get('/profile/:userId', protect, adminProtect, getUserFraudProfile);

export default router;
