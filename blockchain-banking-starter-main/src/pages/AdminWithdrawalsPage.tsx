/*
 * AdminWithdrawalsPage.tsx
 * Admin interface for managing pending withdrawal requests.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from '../components/layout/AdminNavbar';
import { getPendingWithdrawals, approveWithdrawalAdmin, rejectWithdrawalAdmin } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function AdminWithdrawalsPage() {
  const { user, isLoggedIn } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  if (!isLoggedIn || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchPendingWithdrawals();
  }, [statusFilter]);

  const fetchPendingWithdrawals = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/admin/withdrawals/pending?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    setActionError('');
    setActionLoading(true);

    try {
      await approveWithdrawalAdmin(selectedWithdrawal._id, approvalNotes);
      setSuccessMessage('Withdrawal approved successfully!');
      setSelectedWithdrawal(null);
      setApprovalNotes('');
      setTimeout(() => {
        setSuccessMessage('');
        fetchPendingWithdrawals();
      }, 2000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    if (!rejectionReason.trim()) {
      setActionError('Please provide a rejection reason');
      return;
    }

    setActionError('');
    setActionLoading(true);

    try {
      await rejectWithdrawalAdmin(selectedWithdrawal._id, rejectionReason);
      setSuccessMessage('Withdrawal rejected successfully!');
      setSelectedWithdrawal(null);
      setRejectionReason('');
      setTimeout(() => {
        setSuccessMessage('');
        fetchPendingWithdrawals();
      }, 2000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748b' }}>Loading pending withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1>💳 Manage Withdrawals</h1>
        <p>Review and approve/reject withdrawal requests</p>
      </div>

      {!selectedWithdrawal && (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontWeight: '600', color: '#475569' }}>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#1f2937'
            }}
          >
            <option value="pending">⏳ Pending</option>
            <option value="approved">✓ Approved</option>
            <option value="rejected">✗ Rejected</option>
            <option value="processed">✅ Processed</option>
            <option value="all">📋 All</option>
          </select>
        </div>
      )}

      {selectedWithdrawal ? (
        // Detail View
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <Card style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>Withdrawal Details</h3>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Reference Number</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedWithdrawal.referenceNumber}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Amount</p>
                <p style={{ fontSize: '1.3rem', fontWeight: '700', color: '#dc2626' }}>₹{selectedWithdrawal.amount.toLocaleString()}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Status</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f59e0b', textTransform: 'capitalize' }}>{selectedWithdrawal.status}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Requested Date</p>
                <p style={{ fontSize: '0.95rem', color: '#475569' }}>{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
              </div>
            </Card>

            <Card style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#7c3aed', marginBottom: '20px' }}>Banking Information</h3>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Destination Bank</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{selectedWithdrawal.destinationBank}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Destination Account Number</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedWithdrawal.destinationAccountNumber}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Recipient Name</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{selectedWithdrawal.recipientName}</p>
              </div>

              {selectedWithdrawal.purpose && (
                <div style={{ marginBottom: '0' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Purpose</p>
                  <p style={{ fontSize: '0.95rem', color: '#475569' }}>{selectedWithdrawal.purpose}</p>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6', marginBottom: '20px' }}>User Information</h3>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>User Name</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{selectedWithdrawal.userId?.name || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Email</p>
                <p style={{ fontSize: '0.95rem', color: '#475569' }}>{selectedWithdrawal.userId?.email || 'N/A'}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Account Number</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedWithdrawal.accountId?.accountNumber || 'N/A'}</p>
              </div>
            </Card>

            <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(229, 231, 235, 0.5) 0%, rgba(243, 244, 246, 0.5) 100%)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>Fraud Analysis</h3>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Risk Score</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedWithdrawal.riskScore * 10}%`,
                        height: '100%',
                        background: selectedWithdrawal.riskScore > 70 ? '#dc2626' : selectedWithdrawal.riskScore > 40 ? '#f59e0b' : '#10b981',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedWithdrawal.riskScore}%</span>
                </div>
              </div>

              <div style={{ marginBottom: '0' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Status</p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    background: selectedWithdrawal.fraudStatus === 'cleared' ? '#dcfce7' : selectedWithdrawal.fraudStatus === 'under_review' ? '#fef3c7' : '#fee2e2',
                    color: selectedWithdrawal.fraudStatus === 'cleared' ? '#166534' : selectedWithdrawal.fraudStatus === 'under_review' ? '#92400e' : '#991b1b',
                  }}
                >
                  {selectedWithdrawal.fraudStatus === 'under_review' ? '🔍 Under Review' : selectedWithdrawal.fraudStatus === 'cleared' ? '✓ Cleared' : '⚠️ Flagged'}
                </span>
              </div>
            </Card>

            {successMessage && (
              <Card style={{ background: '#dcfce7', border: '1px solid #16a34a', marginBottom: '24px' }}>
                <p style={{ color: '#166534', fontWeight: '600', margin: '0' }}>✓ {successMessage}</p>
              </Card>
            )}

            {actionError && (
              <Card style={{ background: '#fee2e2', border: '1px solid #dc2626', marginBottom: '24px' }}>
                <p style={{ color: '#991b1b', fontWeight: '600', margin: '0' }}>✕ {actionError}</p>
              </Card>
            )}

            <Card style={{ background: '#eff6ff', border: '1px solid #3b82f6', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6', marginBottom: '16px' }}>Approval</h3>
              <textarea
                placeholder="Optional approval notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={actionLoading}
                style={{ width: '100%' }}
              >
                {actionLoading ? '⏳ Processing...' : '✓ Approve Withdrawal'}
              </Button>
            </Card>

            <Card style={{ background: '#fef2f2', border: '1px solid #dc2626' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc2626', marginBottom: '16px' }}>Rejection</h3>
              <textarea
                placeholder="Required: Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #dc2626',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <Button
                variant="secondary"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                style={{ width: '100%', background: '#dc2626', color: 'white', borderColor: '#dc2626' }}
              >
                {actionLoading ? '⏳ Processing...' : '✕ Reject Withdrawal'}
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        // List View
        <div>
          <Card style={{ marginBottom: 8 }}>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
              Showing {withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''} • Filter: {statusFilter === 'all' ? 'All Withdrawals' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </p>
          </Card>

          {withdrawals.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No withdrawals found with status: {statusFilter}</p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {withdrawals.map((withdrawal: any) => (
                <Card key={withdrawal._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>
                      {withdrawal.userId?.name || 'Unknown User'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 8px 0' }}>
                      {withdrawal.userId?.email || 'N/A'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
                      <span>
                        <strong>Account:</strong> {withdrawal.accountId?.accountNumber || 'N/A'}
                      </span>
                      <span>
                        <strong>Method:</strong> {withdrawal.destinationBank}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginRight: '16px' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: '#dc2626', margin: '0 0 4px 0' }}>
                      ₹{withdrawal.amount.toLocaleString()}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: withdrawal.status === 'pending' ? '#fef3c7' : 
                                    withdrawal.status === 'approved' ? '#d1fae5' : 
                                    withdrawal.status === 'rejected' ? '#fee2e2' : 
                                    withdrawal.status === 'processed' ? '#d1fae5' : '#f3f4f6',
                        color: withdrawal.status === 'pending' ? '#854d0e' : 
                               withdrawal.status === 'approved' ? '#166534' : 
                               withdrawal.status === 'rejected' ? '#991b1b' : 
                               withdrawal.status === 'processed' ? '#166534' : '#374151',
                      }}
                    >
                      {withdrawal.status === 'pending' ? '⏳ Pending' : 
                       withdrawal.status === 'approved' ? '✓ Approved' : 
                       withdrawal.status === 'rejected' ? '✗ Rejected' : 
                       withdrawal.status === 'processed' ? '✅ Processed' : withdrawal.status}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                    style={{ marginLeft: '12px' }}
                  >
                    Review →
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedWithdrawal && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedWithdrawal(null);
              setApprovalNotes('');
              setRejectionReason('');
              setActionError('');
            }}
          >
            ← Back to List
          </Button>
        </div>
      )}
      </div>
    </>
  );
}

export default AdminWithdrawalsPage;
