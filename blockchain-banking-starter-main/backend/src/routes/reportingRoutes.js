import express from 'express';
import { protect, adminProtect } from '../middleware/auth.js';
import {
  generateAccountStatement,
  getTransactionHistory,
  getAllUserTransactionsReport,
  exportTransactionsCSV,
  getDashboardReport,
} from '../controllers/reportingController.js';

const router = express.Router();

// ============ CUSTOMER REPORTING ROUTES ============

// Get user account statement (Customer only)
router.get('/user/statement', protect, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    req.params.userId = req.user._id;
    req.query.startDate = startDate;
    req.query.endDate = endDate;
    await generateAccountStatement(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transaction history with pagination (Customer only)
router.get('/user/transactions', protect, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    req.params.userId = req.user._id;
    req.query.page = page;
    req.query.limit = limit;
    await getTransactionHistory(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export user transactions as CSV (Customer only)
router.get('/user/transactions/export', protect, async (req, res) => {
  try {
    req.params.userId = req.user._id;
    await exportTransactionsCSV(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN REPORTING ROUTES ============

// Get all user transactions report (Admin only)
router.get('/admin/transactions/report', protect, adminProtect, async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    req.query.userId = userId;
    req.query.startDate = startDate;
    req.query.endDate = endDate;
    await getAllUserTransactionsReport(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dashboard analytics report (Admin only)
router.get('/admin/dashboard/report', protect, adminProtect, async (req, res) => {
  try {
    await getDashboardReport(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
