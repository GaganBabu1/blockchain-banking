import express from 'express';
import { protect, adminProtect } from '../middleware/auth.js';
import {
  getAllDisputes,
  getOpenDisputes,
  resolveDispute,
  assignDispute,
  suspendUser,
  unsuspendUser,
  getSuspendedUsers,
} from '../controllers/adminController.js';

const router = express.Router();

// ============ DISPUTE ROUTES ============

// Get all disputes (Admin only)
router.get('/admin/disputes', protect, adminProtect, async (req, res) => {
  try {
    await getAllDisputes(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get open/investigating disputes (Admin only)
router.get('/admin/disputes/open', protect, adminProtect, async (req, res) => {
  try {
    await getOpenDisputes(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resolve a dispute (Admin only)
router.post('/admin/disputes/:id/resolve', protect, adminProtect, async (req, res) => {
  try {
    await resolveDispute(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign dispute to admin staff (Admin only)
router.post('/admin/disputes/:id/assign', protect, adminProtect, async (req, res) => {
  try {
    await assignDispute(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ USER SUSPENSION ROUTES ============

// Get all suspended users (Admin only)
router.get('/admin/suspensions', protect, adminProtect, async (req, res) => {
  try {
    await getSuspendedUsers(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Suspend a user (Admin only)
router.post('/admin/users/:userId/suspend', protect, adminProtect, async (req, res) => {
  try {
    await suspendUser(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unsuspend a user (Admin only)
router.post('/admin/users/:userId/unsuspend', protect, adminProtect, async (req, res) => {
  try {
    await unsuspendUser(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
