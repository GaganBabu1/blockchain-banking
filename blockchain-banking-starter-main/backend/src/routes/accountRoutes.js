import express from 'express';
import { getAccount, deposit, withdraw, getTransactions, getBalance, getBalanceTrend, getUserAccounts } from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All account routes require authentication
router.use(protect);

router.get('/', getAccount);
router.get('/balance', getBalance);
router.post('/balance-trend', getBalanceTrend);
router.get('/transactions', getTransactions);
router.get('/my-accounts', getUserAccounts);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

export default router;
