/*
 * RecentTransactions.tsx
 * Shows a list of the user's most recent transactions with all statuses.
 */

import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import { fetchRecentTransactions, Transaction } from '../../services/api';

// Status badge styling
const getStatusStyle = (status: string) => {
  const styles: {[key: string]: {bg: string, text: string, border: string}} = {
    'pending': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'approved': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'completed': { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    'rejected': { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  };
  return styles[status] || styles['pending'];
};

function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions()
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card title="Recent Transactions">
        <p>Loading transactions...</p>
      </Card>
    );
  }

  return (
    <Card title="Recent Transactions">
      {transactions.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No transactions yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.map((tx) => {
            const statusStyle = getStatusStyle(tx.status);
            return (
              <div
                key={tx.id || tx._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <p style={{ fontWeight: '500' }}>
                    {tx.type === 'deposit' ? '↓ Deposit' : tx.type === 'transfer' ? '↔ Transfer' : '↑ Withdraw'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {tx.date} • {tx.reference}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontWeight: '600', 
                    color: tx.type === 'deposit' || tx.type === 'transfer' ? '#10b981' : '#ef4444' 
                  }}>
                    {tx.type === 'deposit' ? '+' : tx.type === 'transfer' ? '↔' : '-'}₹{tx.amount.toLocaleString()}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                    textTransform: 'capitalize'
                  }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default RecentTransactions;
