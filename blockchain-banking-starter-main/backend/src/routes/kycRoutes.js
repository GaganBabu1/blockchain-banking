import express from 'express';
import { submitKYC, getKYCStatus, getPendingKYC, updateKYCStatus, getAllKycRequests } from '../controllers/kycController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import uploadKycDocument from '../middleware/uploadMiddleware.js';

const router = express.Router();

// User KYC routes
router.post('/submit', protect, uploadKycDocument, submitKYC);
router.get('/status', protect, getKYCStatus);

// Admin KYC routes
router.get('/admin/pending', protect, adminProtect, getPendingKYC);
router.get('/admin/all', protect, adminProtect, getAllKycRequests);
router.put('/admin/:kycId', protect, adminProtect, updateKYCStatus);

export default router;
