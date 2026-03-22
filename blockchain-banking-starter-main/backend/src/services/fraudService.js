// Fraud Detection and Prevention Service

// Simple fraud detection algorithm
// In production, this would integrate with ML models and real-time monitoring
export async function detectFraud({ userId, amount, type, location, deviceId, timestamp }) {
  try {
    let riskScore = 0;
    let fraudStatus = 'cleared';

    // Check transaction amount (high amounts increase risk)
    if (amount > 100000) {
      riskScore += 40; // High-value transaction
    } else if (amount > 50000) {
      riskScore += 25;
    } else if (amount > 20000) {
      riskScore += 10;
    }

    // Check transaction type risk
    const typeRiskMap = {
      'transfer': 15,
      'withdrawal': 20,
      'deposit': 5,
      'payment': 25
    };
    riskScore += typeRiskMap[type] || 0;

    // Check location consistency
    if (location === 'internal_transfer') {
      riskScore += 0; // Internal transfers are safer
    } else if (location === 'international') {
      riskScore += 30;
    } else if (location === 'high_risk_country') {
      riskScore += 50;
    }

    // Simulate checking transaction frequency
    // In production: query user's recent transaction history
    const userTransactionCount = await getRecentTransactionCount(userId);
    if (userTransactionCount > 10) {
      riskScore += 15; // Multiple transactions in short timeframe
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine fraud status based on risk score
    if (riskScore >= 75) {
      fraudStatus = 'flagged';
    } else if (riskScore >= 50) {
      fraudStatus = 'under_review';
    } else {
      fraudStatus = 'cleared';
    }

    return {
      riskScore,
      status: fraudStatus,
      timestamp,
      deviceId
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    // Default to conservative approach if detection fails
    return {
      riskScore: 30,
      status: 'under_review',
      timestamp,
      deviceId
    };
  }
}

// Track transaction history for user
const transactionHistory = new Map(); // In production: use a database

export async function addTransactionToHistory({ userId, amount, type, timestamp, location, deviceId, riskScore }) {
  try {
    const userHistory = transactionHistory.get(userId) || [];
    
    const transaction = {
      amount,
      type,
      timestamp,
      location,
      deviceId,
      riskScore,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    userHistory.push(transaction);

    // Keep only recent transactions (last 100)
    if (userHistory.length > 100) {
      userHistory.shift();
    }

    transactionHistory.set(userId, userHistory);

    return {
      success: true,
      transactionId: transaction.id,
      message: 'Transaction added to history'
    };
  } catch (error) {
    console.error('Error adding transaction to history:', error);
    return {
      success: false,
      message: 'Failed to record transaction'
    };
  }
}

// Get recent transaction count for a user
async function getRecentTransactionCount(userId) {
  try {
    const userHistory = transactionHistory.get(userId) || [];
    
    // Count transactions in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTransactions = userHistory.filter(t => new Date(t.timestamp) > oneHourAgo);

    return recentTransactions.length;
  } catch (error) {
    console.error('Error getting transaction count:', error);
    return 0;
  }
}

// Get user's fraud risk profile
export async function getUserFraudProfile(userId) {
  try {
    const userHistory = transactionHistory.get(userId) || [];
    
    if (userHistory.length === 0) {
      return {
        userId,
        totalTransactions: 0,
        averageRiskScore: 0,
        highRiskCount: 0,
        lastTransaction: null,
        profile: 'low_risk'
      };
    }

    const averageRiskScore = userHistory.reduce((sum, t) => sum + t.riskScore, 0) / userHistory.length;
    const highRiskCount = userHistory.filter(t => t.riskScore >= 50).length;

    let profile = 'low_risk';
    if (averageRiskScore >= 60) {
      profile = 'high_risk';
    } else if (averageRiskScore >= 40) {
      profile = 'medium_risk';
    }

    return {
      userId,
      totalTransactions: userHistory.length,
      averageRiskScore: Math.round(averageRiskScore),
      highRiskCount,
      lastTransaction: userHistory[userHistory.length - 1],
      profile
    };
  } catch (error) {
    console.error('Error getting fraud profile:', error);
    return {
      userId,
      totalTransactions: 0,
      averageRiskScore: 0,
      highRiskCount: 0,
      lastTransaction: null,
      profile: 'unknown'
    };
  }
}

// Clear transaction history (for admin/testing)
export async function clearTransactionHistory(userId) {
  try {
    transactionHistory.delete(userId);
    return {
      success: true,
      message: 'Transaction history cleared'
    };
  } catch (error) {
    console.error('Error clearing history:', error);
    return {
      success: false,
      message: 'Failed to clear history'
    };
  }
}
