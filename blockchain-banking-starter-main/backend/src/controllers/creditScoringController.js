/**
 * Credit Scoring Controller
 * Handles HTTP requests for credit scoring API
 */

import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { 
  calculateCreditScore, 
  analyzeCreditTrend,
  getCreditScoringStats 
} from '../services/creditScoringService.js';

/**
 * POST /api/credit/calculate
 * Calculate credit score for a user
 */
export const calculateUserCreditScore = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user accounts
    const accounts = await Account.find({ userId }).lean();
    const accountAge = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 365.25));

    // Get transaction data
    const deposits = await Deposit.find({ userId }).lean();
    const withdrawals = await Withdrawal.find({ userId }).lean();
    const allTransactions = [...deposits, ...withdrawals];

    // Calculate financial metrics
    const monthlyIncome = calculateMonthlyIncome(deposits);
    const monthlyExpenses = calculateMonthlyExpenses(withdrawals);
    const existingLoans = accounts.filter(a => a.loanBalance > 0).length;
    const transactionCount = allTransactions.length;
    const totalTransactionAmount = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate payment metrics
    const paymentsOnTime = deposits.filter(d => d.status === 'completed').length;
    const defaultCount = deposits.filter(d => d.status === 'rejected').length;

    // Prepare user data for scoring
    const userData = {
      monthlyIncome,
      monthlyExpenses,
      existingLoans,
      accountAge,
      transactionCount,
      paymentsOnTime,
      defaultCount,
      totalTransactionAmount
    };

    // Calculate credit score
    const creditAnalysis = await calculateCreditScore(userData);

    if (!creditAnalysis.success) {
      return res.status(500).json(creditAnalysis);
    }

    // Store previous score for trend analysis
    const previousScore = user.creditScore || 600;
    const trendAnalysis = analyzeCreditTrend(previousScore, creditAnalysis.creditScore);

    // Update user credit score in database
    await User.findByIdAndUpdate(userId, {
      creditScore: creditAnalysis.creditScore,
      creditGrade: creditAnalysis.grade,
      updatedAt: new Date()
    });

    // Send response
    res.json({
      success: true,
      message: 'Credit score calculated',
      creditAnalysis: {
        ...creditAnalysis,
        lastUpdated: new Date()
      },
      trendAnalysis,
      userData: {
        monthlyIncome,
        monthlyExpenses,
        accountAge,
        transactionCount
      }
    });
  } catch (error) {
    console.error('❌ Error calculating credit score:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/credit/generate-sample-data
 * Generate sample transaction data for a user with no transactions
 */
export const generateSampleData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get or create account
    let account = await Account.findOne({ userId }).lean();
    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'No account found for this user'
      });
    }

    // Sample deposits
    const deposits = [
      { amount: 15000, purpose: 'Salary' },
      { amount: 25000, purpose: 'Bonus' },
      { amount: 10000, purpose: 'Refund' },
      { amount: 20000, purpose: 'Investment Return' },
      { amount: 12000, purpose: 'Freelance Income' },
    ];

    // Sample withdrawals
    const withdrawals = [
      { amount: 5000, purpose: 'Groceries' },
      { amount: 3000, purpose: 'Utilities' },
      { amount: 2000, purpose: 'Entertainment' },
      { amount: 4000, purpose: 'Bills' },
    ];

    const now = Date.now();
    let depositCount = 0;
    let withdrawalCount = 0;

    // Add deposits
    for (let i = 0; i < deposits.length; i++) {
      const sample = deposits[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));

      const refNumber = `DEP-${userId}-${Date.now()}-${i}`;

      await Deposit.create({
        accountId: account._id,
        userId,
        amount: sample.amount,
        method: 'bank_transfer',
        sourceBank: ['HDFC', 'ICICI', 'Axis', 'SBI'][i % 4],
        purpose: sample.purpose,
        referenceNumber: refNumber,
        sourceDetails: `From ${['HDFC', 'ICICI', 'Axis', 'SBI'][i % 4]} Bank`,
        status: 'completed',
        fraudStatus: 'Cleared',
        createdAt,
        updatedAt: createdAt,
      });
      depositCount++;
    }

    // Add withdrawals
    for (let i = 0; i < withdrawals.length; i++) {
      const sample = withdrawals[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));

      const refNumber = `WD-${userId}-${Date.now()}-${i}`;

      await Withdrawal.create({
        accountId: account._id,
        userId,
        amount: sample.amount,
        method: 'bank_transfer',
        destinationBank: ['HDFC', 'ICICI', 'Axis', 'SBI'][i % 4],
        purpose: sample.purpose,
        referenceNumber: refNumber,
        destinationDetails: `To ${['HDFC', 'ICICI', 'Axis', 'SBI'][i % 4]} Bank`,
        status: 'processed',
        createdAt,
        updatedAt: createdAt,
      });
      withdrawalCount++;
    }

    res.json({
      success: true,
      message: `Sample data generated: ${depositCount} deposits and ${withdrawalCount} withdrawals`,
      depositCount,
      withdrawalCount
    });
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/credit/score
 * Get current credit score for user
 */
export const getUserCreditScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      creditScore: user.creditScore || null,
      creditGrade: user.creditGrade || null,
      lastUpdated: user.updatedAt,
      message: user.creditScore ? 'Credit score retrieved' : 'No credit score calculated yet'
    });
  } catch (error) {
    console.error('❌ Error getting credit score:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/credit/improve-plan
 * Get personalized improvement plan
 */
export const getImprovementPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.creditScore) {
      return res.status(400).json({
        success: false,
        message: 'Calculate credit score first'
      });
    }

    const accounts = await Account.find({ userId }).lean();
    const deposits = await Deposit.find({ userId }).lean();
    const withdrawals = await Withdrawal.find({ userId }).lean();

    const plan = {
      currentScore: user.creditScore,
      currentGrade: user.creditGrade,
      targetScore: 750,
      estimatedTimeframe: '6-12 months',
      actionItems: generateActionItems(
        user.creditScore,
        deposits,
        withdrawals,
        accounts
      ),
      milestones: generateMilestones(user.creditScore),
      progressTracking: {
        checkedAt: new Date(),
        frequency: 'Monthly',
        nextScheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    };

    res.json({
      success: true,
      improvementPlan: plan
    });
  } catch (error) {
    console.error('❌ Error getting improvement plan:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/credit/loan-eligibility
 * Check loan eligibility
 */
export const checkLoanEligibility = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.creditScore) {
      return res.status(400).json({
        success: false,
        message: 'Calculate credit score first using /api/credit/calculate',
        requiresCalculation: true
      });
    }

    const accounts = await Account.find({ userId }).lean();
    
    // Get eligibility based on score
    let eligibility = {
      eligible: true,
      score: user.creditScore,
      grade: user.creditGrade
    };

    if (user.creditScore >= 750) {
      eligibility = {
        ...eligibility,
        maxLoan: 1000000,
        interestRate: 5.5,
        loanType: 'Premium',
        approval: 'Fast-track (24 hours)',
        conditions: []
      };
    } else if (user.creditScore >= 700) {
      eligibility = {
        ...eligibility,
        maxLoan: 500000,
        interestRate: 7.5,
        loanType: 'Standard',
        approval: 'Standard (3-5 days)',
        conditions: ['No recent defaults', 'Stable income required']
      };
    } else if (user.creditScore >= 650) {
      eligibility = {
        ...eligibility,
        maxLoan: 250000,
        interestRate: 9.5,
        loanType: 'Basic',
        approval: 'Requires verification (5-7 days)',
        conditions: ['Additional documentation required', 'Co-signer may be required']
      };
    } else {
      eligibility = {
        ...eligibility,
        eligible: false,
        maxLoan: 0,
        interestRate: null,
        loanType: 'Not Available',
        approval: 'Not recommended',
        conditions: ['Build credit score above 650', 'Reduce existing debts', 'Maintain stable income']
      };
    }

    res.json({
      success: true,
      loanEligibility: eligibility,
      accounts: accounts.length,
      accountsWithLoans: accounts.filter(a => a.loanBalance > 0).length
    });
  } catch (error) {
    console.error('❌ Error checking loan eligibility:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/admin/credit/stats
 * Get credit scoring model statistics (Admin only)
 */
export const getCreditScoringModelStats = async (req, res) => {
  try {
    const stats = getCreditScoringStats();

    // Get database statistics
    const users = await User.countDocuments();
    const scoredUsers = await User.countDocuments({ creditScore: { $exists: true, $ne: null } });
    const avgScore = await User.aggregate([
      { $match: { creditScore: { $exists: true, $ne: null } } },
      { $group: { _id: null, average: { $avg: '$creditScore' } } }
    ]);

    res.json({
      success: true,
      modelStats: stats,
      databaseStats: {
        totalUsers: users,
        usersScoredCount: scoredUsers,
        averageScore: avgScore[0]?.average.toFixed(1) || 'N/A',
        scoringCoverage: ((scoredUsers / users) * 100).toFixed(1) + '%'
      }
    });
  } catch (error) {
    console.error('❌ Error getting model stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/admin/credit/leaderboard
 * Get top users by credit score (Admin only)
 */
export const getCreditLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topUsers = await User
      .find({ creditScore: { $exists: true, $ne: null } })
      .select('username email creditScore creditGrade -_id')
      .sort({ creditScore: -1 })
      .limit(limit)
      .lean();

    const bottomUsers = await User
      .find({ creditScore: { $exists: true, $ne: null } })
      .select('username email creditScore creditGrade -_id')
      .sort({ creditScore: 1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      leaderboard: {
        top: topUsers.map((u, i) => ({ rank: i + 1, ...u })),
        bottom: bottomUsers.map((u, i) => ({ rank: i + 1, ...u }))
      }
    });
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Helper: Calculate monthly income
 */
function calculateMonthlyIncome(deposits) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDeposits = deposits.filter(d => new Date(d.createdAt) >= thirtyDaysAgo);
  return recentDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
}

/**
 * Helper: Calculate monthly expenses
 */
function calculateMonthlyExpenses(withdrawals) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentWithdrawals = withdrawals.filter(w => new Date(w.createdAt) >= thirtyDaysAgo);
  return recentWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
}

/**
 * Helper: Generate action items
 */
function generateActionItems(creditScore, deposits, withdrawals, accounts) {
  const items = [];

  if (creditScore < 700) {
    items.push('Make all payments on time for next 6 months');
  }

  if (withdrawals.length === 0) {
    items.push('Establish regular payment patterns');
  }

  items.push('Keep credit utilization below 30%');
  items.push('Avoid opening multiple new accounts');
  items.push('Monitor credit reports regularly');

  return items;
}

/**
 * Helper: Generate milestones
 */
function generateMilestones(creditScore) {
  const currentGrade = getCreditGradeFromScore(creditScore);
  const milestones = [];

  const gradeProgression = ['F', 'D', 'C', 'B', 'A', 'A+'];
  const currentIndex = gradeProgression.indexOf(currentGrade);

  for (let i = currentIndex + 1; i < gradeProgression.length; i++) {
    const targetScore = getScoreFromGrade(gradeProgression[i]);
    milestones.push({
      grade: gradeProgression[i],
      targetScore,
      currentProgress: ((creditScore / targetScore) * 100).toFixed(1) + '%'
    });
  }

  return milestones;
}

/**
 * Helper: Get grade from score
 */
function getCreditGradeFromScore(score) {
  if (score >= 800) return 'A+';
  if (score >= 750) return 'A';
  if (score >= 700) return 'B';
  if (score >= 650) return 'C';
  if (score >= 550) return 'D';
  return 'F';
}

/**
 * Helper: Get score from grade
 */
function getScoreFromGrade(grade) {
  const gradeScores = {
    'A+': 800,
    'A': 750,
    'B': 700,
    'C': 650,
    'D': 550,
    'F': 300
  };
  return gradeScores[grade] || 600;
}
