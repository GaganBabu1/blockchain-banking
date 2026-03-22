import express from 'express';
import { 
  initiateTransfer, 
  getUserTransfers, 
  searchUsers,
  getPendingTransfers,
  approveTransfer,
  rejectTransfer
} from '../controllers/transferController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { checkUserSuspension } from '../middleware/suspensionMiddleware.js';

const router = express.Router();

// Protected routes - user transfers
router.post('/', protect, checkUserSuspension, initiateTransfer);
router.get('/my-transfers', protect, getUserTransfers);
router.get('/search-users', protect, searchUsers);

// Admin routes - approve/reject transfers
router.get('/pending', protect, adminProtect, getPendingTransfers);
router.post('/:transferId/approve', protect, adminProtect, approveTransfer);
router.post('/:transferId/reject', protect, adminProtect, rejectTransfer);

export default router;
