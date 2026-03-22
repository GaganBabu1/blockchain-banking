/*
 * AdminTransactionPanel.tsx
 * Component for admins to view and manage pending transactions.
 * Shows deposits/withdrawals waiting for approval.
 */

import React, { useState, useEffect } from 'react';
import { fetchPendingTransactions, approveTransaction, rejectTransaction } from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import '../../styles/global.css';

interface PendingTransaction {
  _id: string;
  transactionId: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  fromAccountId?: {
    accountNumber: string;
  };
  toAccountId?: {
    accountNumber: string;
  };
}

function AdminTransactionPanel() {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    setLoading(true);
    const data = await fetchPendingTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const handleApprove = async (transactionId: string) => {
    setApproving(transactionId);
    const result = await approveTransaction(transactionId);
    setApproving(null);
    
    if (result) {
      setSuccess(`Transaction ${transactionId} approved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      loadPendingTransactions();
    } else {
      setError('Failed to approve transaction');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRejectClick = (transactionId: string) => {
    setRejectingId(transactionId);
    setRejectionReason('');
  };

  const handleRejectSubmit = async (transactionId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setRejecting(transactionId);
    const result = await rejectTransaction(transactionId, rejectionReason);
    setRejecting(null);
    
    if (result) {
      setSuccess(`Transaction ${transactionId} rejected successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setRejectingId(null);
      loadPendingTransactions();
    } else {
      setError('Failed to reject transaction');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#64748b' }}>Loading pending transactions...</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: '700' }}>
            Pending Transactions
          </h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.9rem' }}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8'
          }}>
            <p style={{ fontSize: '1rem', margin: '0' }}>✅ No pending transactions</p>
            <p style={{ fontSize: '0.85rem', margin: '8px 0 0 0' }}>All transactions have been processed</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                  background: 'rgba(59, 130, 246, 0.05)'
                }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Transaction ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr
                    key={txn._id}
                    style={{
                      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                      background: rejectingId === txn.transactionId ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500', fontFamily: 'monospace' }}>
                      {txn.transactionId}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: txn.type === 'Deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: txn.type === 'Deposit' ? '#047857' : '#dc2626'
                      }}>
                        {txn.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem' }}>
                      {formatDate(txn.createdAt)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {rejectingId === txn.transactionId ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          alignItems: 'stretch'
                        }}>
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            style={{
                              padding: '6px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              variant="secondary"
                              onClick={() => setRejectingId(null)}
                              style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleRejectSubmit(txn.transactionId)}
                              disabled={rejecting === txn.transactionId}
                              style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem', background: '#dc2626' }}
                            >
                              {rejecting === txn.transactionId ? 'Rejecting...' : 'Confirm'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Button
                            variant="primary"
                            onClick={() => handleApprove(txn.transactionId)}
                            disabled={approving === txn.transactionId}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              background: '#10b981',
                              minWidth: '80px'
                            }}
                          >
                            {approving === txn.transactionId ? '...' : '✓ Approve'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleRejectClick(txn.transactionId)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              minWidth: '80px'
                            }}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdminTransactionPanel;
