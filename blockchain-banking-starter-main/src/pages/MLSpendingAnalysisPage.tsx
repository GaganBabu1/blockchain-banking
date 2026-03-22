/*
 * MLSpendingAnalysisPage.tsx
 * Real ML-powered spending analysis using pattern detection and trend analysis.
 * Integrated with REAL ML backend API for actual spending analysis.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../services/api';

function MLSpendingAnalysisPage() {
  const { isLoggedIn, user } = useAuth();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const dataGeneratedRef = useRef(false);

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Load spending analysis on mount and when period changes
  useEffect(() => {
    loadSpendingAnalysis();
  }, [selectedPeriod]);

  const loadSpendingAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get summary
      const summaryRes = await api.get(`/spending/summary?period=${selectedPeriod}`);
      setSummary(summaryRes.summary);

      // Get insights
      const insightsRes = await api.get('/spending/insights');
      setInsights(insightsRes.insights);

      // Get full analysis
      const analysisRes = await api.post('/spending/analyze', { daysBack: parseInt(selectedPeriod) });
      if (analysisRes.success) {
        setAnalysis(analysisRes.analysis);
        dataGeneratedRef.current = true; // Mark success
      }
    } catch (err: any) {
      console.log('No spending data yet');
      // Only try to generate data once per mount
      if (!dataGeneratedRef.current) {
        console.log('Auto-generating sample data...');
        dataGeneratedRef.current = true; // Mark that we tried
        try {
          const genRes = await api.post('/credit/generate-sample-data');
          if (genRes.success) {
            // Retry after a delay
            setTimeout(() => {
              loadSpendingAnalysis();
            }, 1200);
            return;
          }
        } catch (genErr) {
          console.error('Could not generate data:', genErr);
        }
      }
      setError('Unable to load spending data');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      await loadSpendingAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="main-content ml-modern">
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 Spending Analytics</h1>
        <p>AI-powered analysis of your spending patterns and trends</p>
      </div>

      {/* Period Selector */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ marginRight: '10px' }}>
          Analysis Period:
        </label>
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
        </select>
        
        <Button 
          onClick={runAnalysis}
          disabled={isAnalyzing}
          style={{ marginLeft: '10px' }}
        >
          {isAnalyzing ? '⏳ Analyzing...' : '🔄 Refresh Analysis'}
        </Button>
      </div>

      {/* Spending Summary */}
      {!loading && summary && (
        <Card title="💰 Spending Summary">
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>Total Income</span>
              <span style={{ color: '#22c55e' }}>
                +₹{summary.totalIncome.toLocaleString()}
              </span>
            </div>
            <div className="breakdown-item">
              <span>Total Expenses</span>
              <span style={{ color: '#ef4444' }}>
                -₹{summary.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="breakdown-item">
              <span>Net Balance</span>
              <span style={{ color: summary.netBalance >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                ₹{summary.netBalance.toLocaleString()}
              </span>
            </div>
            <div className="breakdown-item">
              <span>Savings Rate</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {summary.savingsRate}%
              </span>
            </div>
            <div className="breakdown-item">
              <span>Transactions</span>
              <span>{summary.incomeTransactions + summary.expenseTransactions} total</span>
            </div>
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      {!loading && analysis && analysis.categoryAnalysis && (
        <Card title="📈 Spending by Category">
          <div className="breakdown-list">
            {Object.entries(analysis.categoryAnalysis).map(([category, data]: any) => (
              <div key={category} className="breakdown-item">
                <span>{category}</span>
                <div style={{ textAlign: 'right' }}>
                  <div>₹{data.total.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {data.percentage}% • {data.transactions} transactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Spending Patterns */}
      {!loading && analysis && analysis.patterns && (
        <Card title="📊 Spending Patterns">
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>Daily Average</span>
              <span>₹{Number(analysis.patterns.dailyAverage).toLocaleString()}</span>
            </div>
            <div className="breakdown-item">
              <span>Weekly Average</span>
              <span>₹{Number(analysis.patterns.weeklyAverage).toLocaleString()}</span>
            </div>
            <div className="breakdown-item">
              <span>Monthly Average</span>
              <span>₹{Number(analysis.patterns.monthlyAverage).toLocaleString()}</span>
            </div>
            <div className="breakdown-item">
              <span>Peak Spending Day</span>
              <span>{analysis.patterns.peakDay}</span>
            </div>
            <div className="breakdown-item">
              <span>Peak Spending Time</span>
              <span>{analysis.patterns.peakTime}</span>
            </div>
            <div className="breakdown-item">
              <span>Analysis Period</span>
              <span>{analysis.patterns.totalDaysAnalyzed} days</span>
            </div>
          </div>
        </Card>
      )}

      {/* Spending Trends */}
      {!loading && analysis && analysis.trends && (
        <Card title="📈 Spending Trends">
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>Trend</span>
              <span>{analysis.trends.trend}</span>
            </div>
            <div className="breakdown-item">
              <span>Change</span>
              <span 
                style={{ 
                  color: analysis.trends.percentageChange > 0 ? '#ef4444' : '#22c55e',
                  fontWeight: 'bold' 
                }}
              >
                {analysis.trends.percentageChange > 0 ? '+' : ''}{analysis.trends.percentageChange}%
              </span>
            </div>
            <div className="breakdown-item">
              <span>Previous Period Average</span>
              <span>₹{Number(analysis.trends.previousAverage).toLocaleString()}</span>
            </div>
            <div className="breakdown-item">
              <span>Current Period Average</span>
              <span>₹{Number(analysis.trends.currentAverage).toLocaleString()}</span>
            </div>
          </div>
          <p style={{ marginTop: '15px', fontStyle: 'italic', color: '#666' }}>
            💡 {analysis.trends.recommendation}
          </p>
        </Card>
      )}

      {/* Anomalies Detected */}
      {!loading && analysis && analysis.anomalies && analysis.anomalies.length > 0 && (
        <Card title="⚠️ Unusual Spending Detected">
          <div className="breakdown-list">
            {analysis.anomalies.map((anomaly: any, idx: number) => (
              <div key={idx} className="breakdown-item">
                <span>{anomaly.transaction}</span>
                <div style={{ textAlign: 'right' }}>
                  <div>₹{anomaly.amount.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {anomaly.type} ({anomaly.severity} severity)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Budget Recommendations */}
      {!loading && analysis && analysis.budgetRecommendations && (
        <Card title="💡 Personalized Budget Recommendations">
          {analysis.budgetRecommendations.recommendations.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: '0' }}>
              {analysis.budgetRecommendations.recommendations.map((rec: any, idx: number) => (
                <li 
                  key={idx} 
                  style={{ 
                    padding: '12px', 
                    marginBottom: '10px',
                    backgroundColor: rec.priority === 'High' ? '#fee2e2' : '#fef3c7',
                    borderLeft: `4px solid ${rec.priority === 'High' ? '#ef4444' : '#f59e0b'}`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {rec.category} ({rec.priority} Priority)
                  </div>
                  <div>{rec.message}</div>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    {rec.suggestedReduction}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>✅ Your spending is balanced! No major concerns detected.</p>
          )}
        </Card>
      )}

      {/* Insights */}
      {!loading && insights && insights.length > 0 && (
        <Card title="🎯 AI-Generated Insights">
          <div style={{ display: 'grid', gap: '15px' }}>
            {insights.map((insight: any, idx: number) => (
              <div 
                key={idx} 
                style={{
                  padding: '15px',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {insight.emoji} {insight.type}
                </div>
                <div>{insight.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div style={{ color: '#666', padding: '10px' }}>
            <p><strong>Note:</strong> {error}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default MLSpendingAnalysisPage;

