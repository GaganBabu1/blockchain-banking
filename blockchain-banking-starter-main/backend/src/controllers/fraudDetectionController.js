import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { User } from '../models/User.js';
import {
  detectFraud,
  trainFraudModel,
  getFraudModelStats,
  addTransactionToHistory,
  getFraudStats
} from '../services/fraudDetectionService.js';

/**
 * Analyze a transaction for fraud risk
 */
export async function analyzeTransaction(req, res) {
  try {
    const { amount, type, location, deviceId } = req.body;
    const userId = req.user._id;

    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Amount and type are required'
      });
    }

    // Create transaction object
    const transaction = {
      userId,
      amount,
      type, // 'deposit', 'withdrawal', 'transfer'
      location: location || 'unknown',
      deviceId: deviceId || 'unknown',
      timestamp: new Date()
    };

    // Run fraud detection
    const fraudAnalysis = await detectFraud(transaction);

    // Add to history for continuous learning
    addTransactionToHistory({
      ...transaction,
      riskScore: fraudAnalysis.riskScore
    });

    res.status(200).json({
      success: true,
      message: 'Fraud analysis complete',
      analysis: fraudAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get fraud detection model statistics
 */
export async function getModelStats(req, res) {
  try {
    const stats = getFraudModelStats();

    // Calculate fraud stats from database
    const { Deposit } = await import('../models/Deposit.js');
    const { Withdrawal } = await import('../models/Withdrawal.js');

    // Get all transactions
    const deposits = await Deposit.find();
    const withdrawals = await Withdrawal.find();
    const allTransactions = [...deposits, ...withdrawals];

    // Count flagged (≥70% risk)
    const flaggedCount = allTransactions.filter(t => t.riskScore >= 0.7).length;
    // Count under review (50-70% risk)
    const underReviewCount = allTransactions.filter(t => t.riskScore >= 0.5 && t.riskScore < 0.7).length;

    const fraudStats = {
      totalTransactions: allTransactions.length,
      flaggedCount: flaggedCount,
      underReviewCount: underReviewCount,
      fraudRate: ((flaggedCount / allTransactions.length) * 100).toFixed(1) + '%',
      avgRiskScore: (
        allTransactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / allTransactions.length
      ).toFixed(2)
    };

    // Feature importance data for visualization
    const featureImportance = [
      { name: 'Transaction Amount', importance: 95, feature: 'amount' },
      { name: 'Transaction Frequency', importance: 87, feature: 'frequency' },
      { name: 'Time of Transaction', importance: 72, feature: 'time' },
      { name: 'Device Information', importance: 68, feature: 'device' },
      { name: 'Location Data', importance: 61, feature: 'location' }
    ];

    res.status(200).json({
      success: true,
      accuracy: stats.accuracy,
      featureImportance,
      modelStats: stats,
      fraudStats: fraudStats,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Train fraud model on historical transactions
 */
export async function trainModel(req, res) {
  try {
    // Fetch all deposits and withdrawals from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deposits = await Deposit.find({ createdAt: { $gte: ninetyDaysAgo } });
    const withdrawals = await Withdrawal.find({ createdAt: { $gte: ninetyDaysAgo } });

    // Convert to transaction format
    const transactions = [
      ...deposits.map(d => ({
        userId: d.userId,
        amount: d.amount,
        type: 'deposit',
        timestamp: d.createdAt,
        location: 'bank_transfer',
        deviceId: 'system',
        riskScore: 0.1
      })),
      ...withdrawals.map(w => ({
        userId: w.userId,
        amount: w.amount,
        type: 'withdrawal',
        timestamp: w.createdAt,
        location: 'bank_transfer',
        deviceId: 'system',
        riskScore: 0.1
      }))
    ];

    // Train model
    const result = await trainFraudModel(transactions);

    res.status(200).json({
      success: true,
      message: 'Fraud model trained successfully',
      samplesUsed: transactions.length,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get flagged suspicious transactions (admin only)
 */
export async function getSuspiciousTransactions(req, res) {
  try {
    const { minRiskScore = 0.7, limit = 20 } = req.query;

    // Fetch recent suspicious deposits
    const suspiciousDeposits = await Deposit.find({
      riskScore: { $gte: parseFloat(minRiskScore) }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Fetch recent suspicious withdrawals
    const suspiciousWithdrawals = await Withdrawal.find({
      riskScore: { $gte: parseFloat(minRiskScore) }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Combine and sort
    const suspicious = [
      ...suspiciousDeposits.map(d => ({
        _id: d._id,
        type: 'deposit',
        userId: d.userId,
        amount: d.amount,
        riskScore: d.riskScore,
        timestamp: d.createdAt,
        status: d.status
      })),
      ...suspiciousWithdrawals.map(w => ({
        _id: w._id,
        type: 'withdrawal',
        userId: w.userId,
        amount: w.amount,
        riskScore: w.riskScore,
        timestamp: w.createdAt,
        status: w.status
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: suspicious.length,
      transactions: suspicious.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get fraud analysis for specific user
 */
export async function getUserFraudProfile(req, res) {
  try {
    const { userId } = req.params;

    // Get user's transactions
    const deposits = await Deposit.find({ userId });
    const withdrawals = await Withdrawal.find({ userId });

    // Calculate statistics
    const allTransactions = [...deposits, ...withdrawals];
    const avgAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0) / allTransactions.length || 0;
    const totalTransactions = allTransactions.length;
    const flaggedCount = allTransactions.filter(t => t.riskScore > 0.7).length;
    const avgRiskScore =
      allTransactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / totalTransactions || 0;

    res.status(200).json({
      success: true,
      userId,
      profile: {
        totalTransactions,
        flaggedCount,
        flagRate: ((flaggedCount / totalTransactions) * 100).toFixed(1) + '%',
        avgAmount: avgAmount.toFixed(2),
        avgRiskScore: avgRiskScore.toFixed(2),
        riskLevel: avgRiskScore > 0.7 ? 'High' : avgRiskScore > 0.4 ? 'Medium' : 'Low'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
