/**
 * Spending Analytics Controller
 * Handles HTTP requests for spending analytics API
 */

import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { 
  analyzeSpendingPatterns, 
  getSpendingInsights,
  getSpendingAnalyticsStats 
} from '../services/spendingAnalyticsService.js';

/**
 * POST /api/spending/analyze
 * Analyze user spending patterns
 */
export const analyzeUserSpending = async (req, res) => {
  try {
    const userId = req.user.id;
    const { daysBack = 90 } = req.body;

    // Calculate date range
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get user transactions
    const deposits = await Deposit.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    // Combine and annotate transactions
    const allTransactions = [
      ...deposits.map(d => ({ ...d, type: 'deposit', description: `Deposit - ${d.method}` })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal', description: `Withdrawal - ${w.method}` }))
    ];

    // Analyze spending
    const analysis = await analyzeSpendingPatterns(allTransactions);

    if (!analysis.success) {
      return res.status(500).json(analysis);
    }

    // Get insights
    const insights = getSpendingInsights(analysis);

    res.json({
      success: true,
      message: 'Spending analysis completed',
      daysAnalyzed: daysBack,
      analysis: analysis.spendingAnalysis,
      insights
    });
  } catch (error) {
    console.error('❌ Error analyzing spending:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/spending/summary
 * Get spending summary
 */
export const getSpendingSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get transactions
    const deposits = await Deposit.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const totalIncome = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalExpenses = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = ((netBalance / totalIncome) * 100).toFixed(1);

    res.json({
      success: true,
      period: `Last ${daysBack} days`,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        savingsRate: `${savingsRate}%`,
        incomeTransactions: deposits.length,
        expenseTransactions: withdrawals.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting spending summary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/spending/insights
 * Get spending insights
 */
export const getSpendingAdvice = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get last 3 months transactions
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deposits = await Deposit.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const allTransactions = [
      ...deposits.map(d => ({ ...d, type: 'deposit' })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
    ];

    const analysis = await analyzeSpendingPatterns(allTransactions);
    const insights = getSpendingInsights(analysis);

    // Generate personalized advice
    const advice = [];

    if (analysis.spendingAnalysis) {
      const { categoryAnalysis, budgetRecommendations } = analysis.spendingAnalysis;

      // Top category advice
      const topCategory = Object.entries(categoryAnalysis)[0];
      if (topCategory && parseFloat(topCategory[1].percentage) > 30) {
        advice.push({
          priority: 'High',
          advice: `Your ${topCategory[0]} spending is quite high. Try to reduce it by 10-15%.`,
          impact: `Could save ₹${Math.round(topCategory[1].total * 0.15)} per month`
        });
      }

      // Budget recommendations
      budgetRecommendations.recommendations.slice(0, 3).forEach(rec => {
        advice.push({
          priority: rec.priority,
          advice: rec.message,
          impact: rec.suggestedReduction
        });
      });
    }

    res.json({
      success: true,
      insights,
      advice: advice.length > 0 ? advice : [{ advice: 'Your spending looks good! Keep it up.' }]
    });
  } catch (error) {
    console.error('❌ Error getting spending advice:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/spending/categories
 * Get spending by category
 */
export const getSpendingByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;

    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get user's account
    const { Account } = await import('../models/Account.js');
    const account = await Account.findOne({ userId });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Query ALL transactions regardless of status for REAL data
    const { Transfer } = await import('../models/Transfer.js');
    
    const deposits = await Deposit.find({ 
      accountId: account._id, 
      createdAt: { $gte: startDate }
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      accountId: account._id, 
      createdAt: { $gte: startDate }
    }).lean();

    const transfers = await Transfer.find({
      $or: [
        { fromAccountId: account._id },
        { toAccountId: account._id }
      ],
      createdAt: { $gte: startDate }
    }).lean();

    // Categorize spending by transaction purpose
    const categoryMap = {};

    // Add deposits (income)
    deposits.forEach(d => {
      const purpose = d.purpose || 'Deposits';
      if (!categoryMap[purpose]) {
        categoryMap[purpose] = { name: purpose, amount: 0, count: 0, type: 'income' };
      }
      categoryMap[purpose].amount += d.amount;
      categoryMap[purpose].count += 1;
    });

    // Add withdrawals (spending)
    withdrawals.forEach(w => {
      const purpose = w.purpose || 'Withdrawals';
      if (!categoryMap[purpose]) {
        categoryMap[purpose] = { name: purpose, amount: 0, count: 0, type: 'expense' };
      }
      categoryMap[purpose].amount += w.amount;
      categoryMap[purpose].count += 1;
    });

    // Add transfers (spending if outgoing, income if incoming)
    transfers.forEach(t => {
      const purpose = t.purpose || 'Transfers';
      const isOutgoing = t.fromAccountId?.toString() === account._id.toString();
      
      if (!categoryMap[purpose]) {
        categoryMap[purpose] = { name: purpose, amount: 0, count: 0, type: isOutgoing ? 'expense' : 'income' };
      }
      categoryMap[purpose].amount += t.amount;
      categoryMap[purpose].count += 1;
    });

    // Convert to array format and sort by amount descending
    const categories = Object.values(categoryMap)
      .map(cat => ({
        name: cat.name,
        value: cat.amount,
        amount: cat.amount,
        count: cat.count,
        type: cat.type
      }))
      .sort((a, b) => b.amount - a.amount);

    // If no transactions, return default categories with zero values
    const finalCategories = categories.length > 0 ? categories : [
      { name: 'Salary', value: 0, amount: 0, count: 0, type: 'income' },
      { name: 'Shopping', value: 0, amount: 0, count: 0, type: 'expense' },
      { name: 'Food', value: 0, amount: 0, count: 0, type: 'expense' },
      { name: 'Transport', value: 0, amount: 0, count: 0, type: 'expense' },
      { name: 'Utilities', value: 0, amount: 0, count: 0, type: 'expense' },
      { name: 'Other', value: 0, amount: 0, count: 0, type: 'expense' }
    ];

    const totalIncome = categories.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0);
    const totalExpense = categories.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0);

    res.json({
      success: true,
      period: `Last ${daysBack} days`,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      categories: finalCategories
    });
  } catch (error) {
    console.error('❌ Error getting category spending:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/spending/trends
 * Get spending trends over time
 */
export const getSpendingTrends = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get last 6 months
    const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const deposits = await Deposit.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const allTransactions = [
      ...deposits.map(d => ({ ...d, type: 'deposit' })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
    ];

    const analysis = await analyzeSpendingPatterns(allTransactions);

    if (!analysis.success) {
      return res.status(500).json(analysis);
    }

    const { trends } = analysis.spendingAnalysis;

    res.json({
      success: true,
      period: 'Last 6 months',
      trends: {
        trend: trends.trend,
        percentageChange: trends.percentageChange,
        recommendation: trends.recommendation,
        previousAverage: trends.previousAverage,
        currentAverage: trends.currentAverage
      }
    });
  } catch (error) {
    console.error('❌ Error getting trends:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/admin/spending/stats
 * Get spending analytics model statistics (Admin only)
 */
export const getSpendingAnalyticsModelStats = async (req, res) => {
  try {
    const stats = getSpendingAnalyticsStats();

    res.json({
      success: true,
      modelStats: stats
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
 * POST /api/spending/budget-plan
 * Get personalized budget plan
 */
export const createBudgetPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid monthly income'
      });
    }

    // Get last 90 days transactions
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deposits = await Deposit.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const withdrawals = await Withdrawal.find({ 
      userId, 
      createdAt: { $gte: startDate },
      status: 'Completed'
    }).lean();

    const allTransactions = [
      ...deposits.map(d => ({ ...d, type: 'deposit' })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
    ];

    const analysis = await analyzeSpendingPatterns(allTransactions);

    if (!analysis.success) {
      return res.status(500).json(analysis);
    }

    const { budgetRecommendations } = analysis.spendingAnalysis;

    // Create personalized budget
    const budget = {
      monthlyIncome,
      allocations: {
        'Essential (Food, Utilities, Transport)': Math.round(monthlyIncome * 0.50),
        'Healthcare & Insurance': Math.round(monthlyIncome * 0.10),
        'Entertainment & Dining': Math.round(monthlyIncome * 0.15),
        'Shopping & Others': Math.round(monthlyIncome * 0.15),
        'Savings': Math.round(monthlyIncome * 0.10)
      },
      recommendations: budgetRecommendations.recommendations,
      topCategories: budgetRecommendations.topSpendingCategories,
      savingsGoal: Math.round(monthlyIncome * 0.10)
    };

    res.json({
      success: true,
      budgetPlan: budget
    });
  } catch (error) {
    console.error('❌ Error creating budget plan:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
