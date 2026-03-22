/*
 * BalanceSummary.tsx
 * Displays user's fiat and token balances in card format.
 * Auto-refreshes every 10 seconds and provides manual refresh button.
 */

import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import { fetchBalances, UserBalance } from '../../services/api';

function BalanceSummary() {
  const [balances, setBalances] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch balances
  const loadBalances = async () => {
    try {
      setIsRefreshing(true);
      const data = await fetchBalances();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    loadBalances();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadBalances();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-grid">
        <Card className="balance-card">
          <p>Loading balances...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* Fiat Balance Card */}
      <Card className="balance-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="balance-label">Fiat Balance (Off-chain)</p>
            <p className="balance-amount">
              ₹{balances?.fiatBalance.toLocaleString() || '0'}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {balances?.currency || 'INR'}
            </p>
          </div>
          <button
            onClick={loadBalances}
            disabled={isRefreshing}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              backgroundColor: isRefreshing ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.6 : 1,
            }}
            title="Refresh balance immediately"
          >
            {isRefreshing ? '⟳' : '↻'}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default BalanceSummary;
