/*
 * TransactionsHistoryPage.tsx
 * Displays a complete list of all user transactions with fraud analysis.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTransactions, Transaction } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface ExtendedTransaction extends Transaction {
  riskScore?: number;
  fraudStatus?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  toAccountNumber?: string;
  referenceNumber?: string;
  purpose?: string;
}

type FilterType = 'all' | 'deposit' | 'withdraw' | 'transfer';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed';

function TransactionsHistoryPage() {
  const { isLoggedIn } = useAuth();
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions()
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Filter transactions based on all filters
  const filteredTransactions = transactions.filter(t => {
    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    
    // Status filter
    if (statusFilter !== 'all') {
      const status = t.status?.toLowerCase() || '';
      if (statusFilter === 'completed' && status !== 'completed') return false;
      if (statusFilter === 'pending' && status !== 'pending') return false;
      if (statusFilter === 'approved' && status !== 'approved') return false;
      if (statusFilter === 'rejected' && status !== 'rejected') return false;
    }
    
    return true;
  });

  const getRiskColor = (score?: number) => {
    if (!score) return '#64748b';
    if (score < 30) return '#10b981'; // Green
    if (score < 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskLabel = (score?: number) => {
    if (!score) return 'Low Risk';
    if (score < 30) return '🟢 Low Risk';
    if (score < 60) return '🟡 Medium Risk';
    return '🔴 High Risk';
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed' || s === 'approved') return '#10b981';
    if (s === 'pending') return '#f59e0b';
    if (s === 'rejected') return '#ef4444';
    return '#64748b';
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'deposit': return '📥';
      case 'withdraw': return '📤';
      case 'transfer': return '💸';
      default: return '📊';
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 48 }}>
      <div className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1>📋 Transaction History</h1>
        <p>View all your transactions with fraud analysis</p>
      </div>

      <Card>
        {/* Filters Section */}
        <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e293b', fontWeight: '700' }}>🔍 Filters</h3>
          
          {/* Type Filter */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>
              Transaction Type
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'deposit', 'withdraw', 'transfer'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as FilterType)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: typeFilter === type ? '#3b82f6' : '#f1f5f9',
                    color: typeFilter === type ? 'white' : '#475569',
                    fontWeight: typeFilter === type ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {type === 'all' ? '📊 All Types' : type === 'deposit' ? '📥 Deposits' : type === 'withdraw' ? '📤 Withdrawals' : '💸 Transfers'}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'approved', 'rejected', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as StatusFilter)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: statusFilter === status ? '#3b82f6' : '#f1f5f9',
                    color: statusFilter === status ? 'white' : '#475569',
                    fontWeight: statusFilter === status ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>


        </div>

        {/* Transactions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b' }}>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>No transactions found matching your filters</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction._id}
                onClick={() => setExpandedId(expandedId === transaction._id ? null : transaction._id)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: expandedId === transaction._id ? '#f8fafc' : 'white',
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${getRiskColor(transaction.riskScore)}`
                }}
              >
                {/* Transaction Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{getTypeIcon(transaction.type)}</span>
                      <div>
                        <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                          {transaction.type === 'deposit' ? '✅ Deposit' : transaction.type === 'withdraw' ? '💳 Withdrawal' : '💸 Transfer'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800', color: transaction.type === 'deposit' ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                      {transaction.type === 'deposit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: getStatusColor(transaction.status)
                    }}>
                      {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Risk Badge */}
                {transaction.riskScore !== undefined && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Risk Assessment</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: getRiskColor(transaction.riskScore),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '0.7rem'
                        }}>
                          {transaction.riskScore}
                        </div>
                        <span style={{ color: getRiskColor(transaction.riskScore), fontWeight: '600', fontSize: '0.9rem' }}>
                          {getRiskLabel(transaction.riskScore)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable Details */}
                {expandedId === transaction._id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {transaction.referenceNumber && (
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Reference Number</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{transaction.referenceNumber}</p>
                        </div>
                      )}

                      {transaction.purpose && (
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Purpose</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{transaction.purpose}</p>
                        </div>
                      )}

                      {transaction.type === 'transfer' && transaction.recipientName && (
                        <>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Recipient</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{transaction.recipientName}</p>
                          </div>
                          {transaction.toAccountNumber && (
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Account Number</p>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{transaction.toAccountNumber}</p>
                            </div>
                          )}
                          {transaction.recipientPhone && (
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Phone</p>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{transaction.recipientPhone}</p>
                            </div>
                          )}
                          {transaction.recipientEmail && (
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Email</p>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{transaction.recipientEmail}</p>
                            </div>
                          )}
                        </>
                      )}

                      {transaction.fraudStatus && (
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Fraud Status</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: transaction.fraudStatus === 'cleared' ? '#10b981' : transaction.fraudStatus === 'under_review' ? '#f59e0b' : '#ef4444' }}>
                            {transaction.fraudStatus === 'cleared' ? '✓ Cleared' : transaction.fraudStatus === 'under_review' ? '⏳ Under Review' : '⚠️ Flagged'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e293b', fontWeight: '700' }}>📊 Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Deposits</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>₹{transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Withdrawals</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>₹{transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Transfers</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#3b82f6' }}>₹{transactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Total Transactions</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#a855f7' }}>{filteredTransactions.length}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Fraud Flagged</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>{transactions.filter(t => t.fraudStatus === 'flagged').length}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Under Review</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>{transactions.filter(t => t.fraudStatus === 'under_review').length}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default TransactionsHistoryPage;
