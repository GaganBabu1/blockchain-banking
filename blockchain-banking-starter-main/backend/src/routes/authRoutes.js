import express from 'express';
import {
  register,
  login,
  adminLogin,
  getCurrentUser,
  updateProfile,
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/2fa/verify', verifyTwoFactorLogin);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateProfile);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/confirm', protect, confirmTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

export default router;
