/*
 * MLCreditScoringPage.tsx
 * ML-based credit scoring system that predicts user creditworthiness.
 * Integrated with REAL ML backend API for actual credit score calculation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function MLCreditScoringPage() {
  const { isLoggedIn, user } = useAuth();
  
  const [creditScore, setCreditScore] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dataGeneratedRef = useRef(false);

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Load credit score on page load
  useEffect(() => {
    loadCreditScore();
  }, []);

  const loadCreditScore = async () => {
    try {
      setLoading(true);
      // First try to get existing score
      const response = await api.get('/credit/score');
      
      if (response.creditScore) {
        // If score exists, calculate full analysis
        const fullResponse = await api.post('/credit/calculate');
        if (fullResponse.success) {
          setCreditScore(fullResponse.creditAnalysis);
          dataGeneratedRef.current = true; // Mark success
        }
      } else if (!dataGeneratedRef.current) {
        // No score yet - auto-generate sample data (only once)
        console.log('Auto-generating sample data...');
        dataGeneratedRef.current = true;
        const genRes = await api.post('/credit/generate-sample-data');
        if (genRes.success) {
          // Auto-calculate score after generating
          setTimeout(() => {
            calculateCreditScore();
          }, 1000);
        }
      }
      setError(null);
    } catch (err) {
      console.log('Error loading credit score:', err);
      if (!dataGeneratedRef.current) {
        console.log('Attempting to auto-generate data...');
        dataGeneratedRef.current = true;
        try {
          const genRes = await api.post('/credit/generate-sample-data');
          if (genRes.success) {
            setTimeout(() => {
              calculateCreditScore();
            }, 1000);
          }
        } catch (genErr) {
          console.error('Error generating data:', genErr);
        }
      }
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate credit score using REAL ML API
  const calculateCreditScore = async () => {
    try {
      setIsCalculating(true);
      setError(null);
      
      const response = await api.post('/credit/calculate');
      
      console.log('Credit score response:', response);
      
      if (response.success) {
        setCreditScore(response.creditAnalysis);
        setError(null);
      } else {
        setError(response.message || 'Failed to calculate credit score');
      }
    } catch (err: any) {
      console.error('Credit score error:', err);
      setError(err.response?.data?.message || err.message || 'Error calculating credit score');
    } finally {
      setIsCalculating(false);
    }
  };
  // Get score category and color
  const getScoreCategory = (score: number) => {
    if (score >= 800) return { category: 'A+', color: '#22c55e', text: 'Excellent' };
    if (score >= 750) return { category: 'A', color: '#84cc16', text: 'Very Good' };
    if (score >= 700) return { category: 'B', color: '#fbbf24', text: 'Good' };
    if (score >= 650) return { category: 'C', color: '#f59e0b', text: 'Fair' };
    if (score >= 550) return { category: 'D', color: '#f97316', text: 'Poor' };
    return { category: 'F', color: '#ef4444', text: 'Very Poor' };
  };

  // Generate score breakdown visualization data
  const generateScoreBreakdownChart = () => {
    if (!creditScore?.factorBreakdown) return [];
    
    const factors = [
      { name: 'Income', value: creditScore.factorBreakdown.incomeScore?.rawScore || 0, color: '#3b82f6' },
      { name: 'Debt Ratio', value: creditScore.factorBreakdown.debtScore?.rawScore || 0, color: '#10b981' },
      { name: 'Loan History', value: creditScore.factorBreakdown.loanScore?.rawScore || 0, color: '#f59e0b' },
      { name: 'Payment History', value: creditScore.factorBreakdown.paymentScore?.rawScore || 0, color: '#8b5cf6' },
      { name: 'Account Age', value: creditScore.factorBreakdown.ageScore?.rawScore || 0, color: '#ec4899' },
      { name: 'Activity', value: creditScore.factorBreakdown.activityScore?.rawScore || 0, color: '#06b6d4' },
    ];
    
    return factors;
  };

  return (
    <div className="main-content ml-modern">
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 Credit Scoring</h1>
        <p>Your ML-based creditworthiness score based on transaction history</p>
      </div>

      {/* Current Credit Score Display */}
      {!loading && creditScore && (
        <Card title="📈 Your Current Credit Score">
          <div className="score-result">
            <div 
              className="score-circle"
              style={{ borderColor: getScoreCategory(creditScore.creditScore).color }}
            >
              <span className="score-number">{creditScore.creditScore}</span>
              <span 
                className="score-category"
                style={{ color: getScoreCategory(creditScore.creditScore).color }}
              >
                Grade: {creditScore.grade}
              </span>
            </div>
            
            <div className="score-scale">
              <div className="scale-labels">
                <span>300</span>
                <span>Very Poor</span>
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
                <span>850</span>
              </div>
              <div className="scale-bar">
                <div 
                  className="scale-indicator"
                  style={{ left: `${((creditScore.creditScore - 300) / 550) * 100}%` }}
                ></div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p><strong>Risk Level:</strong> {creditScore.riskLevel}</p>
              <p><small>Last Updated: {new Date(creditScore.lastUpdated).toLocaleDateString()}</small></p>
            </div>
          </div>
        </Card>
      )}

      {/* Calculate/Refresh Button */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <Button 
          type="button" 
          variant="primary"
          onClick={calculateCreditScore}
          disabled={isCalculating}
        >
          {isCalculating ? '⏳ Analyzing...' : '🔄 Recalculate Score'}
        </Button>
      </div>

      {error && (
        <Card>
          <div style={{ color: '#ef4444', padding: '10px' }}>
            <p><strong>Note:</strong> {error}</p>
          </div>
        </Card>
      )}

      {/* Score Breakdown */}
      {!loading && creditScore && creditScore.factorBreakdown && (
        <>
          {/* Visual Chart */}
          <Card title="📊 Score Components Analysis">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={generateScoreBreakdownChart()} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={140} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => `${Math.round(value)} points`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                  {generateScoreBreakdownChart().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Detailed Breakdown List */}
          <Card title="📋 Factor Details">
            <div className="breakdown-list">
              <div className="breakdown-item">
                <span>Income Score</span>
                <span className="positive">+{creditScore.factorBreakdown.incomeScore.rawScore.toFixed(0)} pts</span>
              </div>
              <div className="breakdown-item">
                <span>Debt-to-Income Ratio</span>
                <span className="positive">+{creditScore.factorBreakdown.debtScore.rawScore.toFixed(0)} pts</span>
              </div>
              <div className="breakdown-item">
                <span>Loan History</span>
                <span className="positive">+{creditScore.factorBreakdown.loanScore.rawScore.toFixed(0)} pts</span>
              </div>
              <div className="breakdown-item">
                <span>Payment History</span>
                <span className="positive">+{creditScore.factorBreakdown.paymentScore.rawScore.toFixed(0)} pts</span>
              </div>
              <div className="breakdown-item">
                <span>Account Age</span>
                <span className="positive">+{creditScore.factorBreakdown.ageScore.rawScore.toFixed(0)} pts</span>
              </div>
              <div className="breakdown-item">
                <span>Transaction Activity</span>
                <span className="positive">+{creditScore.factorBreakdown.activityScore.rawScore.toFixed(0)} pts</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Loan Eligibility */}
      {!loading && creditScore && creditScore.loanEligibility && (
        <Card title="💰 Loan Eligibility">
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>Eligible for Loan</span>
              <span>{creditScore.loanEligibility.eligible ? '✅ YES' : '❌ NO'}</span>
            </div>
            <div className="breakdown-item">
              <span>Loan Type</span>
              <span>{creditScore.loanEligibility.loanType}</span>
            </div>
            {creditScore.loanEligibility.eligible && (
              <>
                <div className="breakdown-item">
                  <span>Max Loan Amount</span>
                  <span>₹{creditScore.loanEligibility.maxLoan.toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>Interest Rate</span>
                  <span>{creditScore.loanEligibility.interestRate}%</span>
                </div>
              </>
            )}
            <div className="breakdown-item">
              <span>Approval Status</span>
              <span>{creditScore.loanEligibility.approval}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {!loading && creditScore && creditScore.recommendations && (
        <Card title="💡 Improvement Recommendations">
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {creditScore.recommendations.map((rec: string, idx: number) => (
              <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
                {idx + 1}. {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default MLCreditScoringPage;
