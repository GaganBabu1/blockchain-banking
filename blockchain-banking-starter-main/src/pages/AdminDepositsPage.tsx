/*
 * AdminDepositsPage.tsx
 * Admin page for managing pending deposits.
 * Shows all deposit details and allows approval/rejection.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from '../components/layout/AdminNavbar';
import { fetchPendingDeposits, approveDeposit, rejectDeposit } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function AdminDepositsPage() {
  const { isLoggedIn, isAdmin } = useAuth();
  
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      loadDeposits();
    }
  }, [isLoggedIn, isAdmin, statusFilter]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      // Fetch deposits with status filter
      const response = await fetch(`http://localhost:5000/api/admin/deposits/pending?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setDeposits(data.deposits || []);
    } catch (err) {
      console.error('Error loading deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: any) => {
    if (!window.confirm(`Approve deposit of ₹${deposit.amount.toLocaleString()}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await approveDeposit(deposit._id, approvalNotes);
      setMessage('✅ Deposit approved successfully');
      setMessageType('success');
      setSelectedDeposit(null);
      setApprovalNotes('');
      loadDeposits();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (deposit: any) => {
    if (!rejectionReason.trim()) {
      setMessage('❌ Please provide a rejection reason');
      setMessageType('error');
      return;
    }

    if (!window.confirm(`Reject deposit of ₹${deposit.amount.toLocaleString()}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await rejectDeposit(deposit._id, rejectionReason);
      setMessage('✅ Deposit rejected successfully');
      setMessageType('success');
      setSelectedDeposit(null);
      setRejectionReason('');
      loadDeposits();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading deposits...</p>
      </div>
    );
  }

  if (selectedDeposit) {
    return (
      <div className="main-content" style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 48 }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>💰 Deposit Details</h1>
          <Button variant="secondary" onClick={() => setSelectedDeposit(null)}>
            ← Back
          </Button>
        </div>

        {message && (
          <Card style={{
            background: messageType === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${messageType === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            marginBottom: 24
          }}>
            <p style={{ margin: 0, color: messageType === 'success' ? '#065f46' : '#7f1d1d' }}>
              {message}
            </p>
          </Card>
        )}

        <Card>
          {/* Basic Deposit Info */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937' }}>Deposit Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.95rem', color: '#4b5563' }}>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Reference Number</p>
                <p style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{selectedDeposit.referenceNumber}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Amount</p>
                <p style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>₹{selectedDeposit.amount.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Account</p>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.accountId?.accountNumber}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>User</p>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.userId?.name}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Email</p>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.userId?.email}</p>
              </div>
              <div>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Date</p>
                <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{new Date(selectedDeposit.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Method-Specific Details */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937' }}>
              {selectedDeposit.method === 'bank_transfer' ? '🏦 Bank Transfer Details' : '📄 Check Details'}
            </h3>

            {selectedDeposit.method === 'bank_transfer' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.95rem', color: '#4b5563' }}>
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Source Bank</p>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.sourceBank || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Account Number</p>
                  <p style={{ margin: '4px 0', fontFamily: 'monospace', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.accountNumber}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Transaction Reference (Optional)</p>
                  <p style={{ margin: '4px 0', fontFamily: 'monospace', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.transactionReference || 'Not provided'}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.95rem', color: '#4b5563' }}>
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Check Number</p>
                  <p style={{ margin: '4px 0', fontFamily: 'monospace', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.checkNumber}</p>
                </div>
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Issuer Name</p>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.checkIssuerName}</p>
                </div>
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Bank</p>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.bankName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Purpose and Fraud Analysis */}
          {(selectedDeposit.purpose || selectedDeposit.riskScore !== undefined) && (
            <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
              {selectedDeposit.purpose && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Purpose</p>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#1f2937' }}>{selectedDeposit.purpose}</p>
                </div>
              )}
              {selectedDeposit.riskScore !== undefined && (
                <div>
                  <p style={{ margin: '4px 0', fontWeight: '600', color: '#6b7280' }}>Risk Score</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <div style={{
                      width: 200,
                      height: 8,
                      background: '#e5e7eb',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${selectedDeposit.riskScore * 100}%`,
                        height: '100%',
                        background: selectedDeposit.riskScore > 0.7 ? '#ef4444' : selectedDeposit.riskScore > 0.4 ? '#f59e0b' : '#10b981'
                      }} />
                    </div>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{(selectedDeposit.riskScore * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ margin: '8px 0 4px 0', fontWeight: '600', color: '#6b7280' }}>Status: {selectedDeposit.fraudStatus}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - Only show for pending deposits */}
          {selectedDeposit.status === 'pending' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1f2937' }}>Admin Action</h3>

              {/* Approve Section */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, color: '#166534', fontSize: '1rem' }}>✓ Approve Deposit</h4>
                <Input
                  label="Notes (Optional)"
                  type="text"
                  placeholder="Add approval notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedDeposit)}
                  disabled={actionLoading}
                  style={{ width: '100%', marginTop: 12, background: '#10b981' }}
                >
                  {actionLoading ? 'Processing...' : 'Approve Deposit'}
                </Button>
              </div>

              {/* Reject Section */}
              <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8 }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, color: '#991b1b', fontSize: '1rem' }}>✗ Reject Deposit</h4>
                <Input
                  label="Rejection Reason *"
                  type="text"
                  placeholder="Explain why rejecting this deposit..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
                <Button
                  variant="primary"
                  onClick={() => handleReject(selectedDeposit)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{ width: '100%', marginTop: 12, background: '#ef4444' }}
                >
                  {actionLoading ? 'Processing...' : 'Reject Deposit'}
                </Button>
              </div>
            </div>
          )}

          {/* Status Display for Non-Pending */}
          {selectedDeposit.status !== 'pending' && (
            <Card style={{
              background: selectedDeposit.status === 'approved' ? '#d1fae5' : selectedDeposit.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
              border: `1px solid ${selectedDeposit.status === 'approved' ? '#6ee7b7' : selectedDeposit.status === 'rejected' ? '#fca5a5' : '#d1d5db'}`
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>
                {selectedDeposit.status === 'approved' ? '✅ Approved' : selectedDeposit.status === 'rejected' ? '❌ Rejected' : '✓ Completed'}
              </h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                Status: {selectedDeposit.status.charAt(0).toUpperCase() + selectedDeposit.status.slice(1)}
                {selectedDeposit.approvalDate && ` on ${new Date(selectedDeposit.approvalDate).toLocaleDateString()}`}
              </p>
              {selectedDeposit.rejectionReason && (
                <p style={{ margin: '8px 0 0 0', color: '#7f1d1d', fontSize: '0.9rem' }}>
                  Reason: {selectedDeposit.rejectionReason}
                </p>
              )}
            </Card>
          )}
        </Card>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="main-content" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 48 }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>💰 Deposits</h1>
          <p style={{ color: '#6b7280', marginBottom: 0 }}>View all deposits and their status</p>
        </div>
        <div>
          <label style={{ marginRight: '10px', fontWeight: '600' }}>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="pending">⏳ Pending</option>
            <option value="approved">✓ Approved</option>
            <option value="rejected">✗ Rejected</option>
            <option value="completed">✅ Completed</option>
            <option value="all">📋 All</option>
          </select>
        </div>
      </div>

      {deposits.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: '600', margin: '0 0 8px 0' }}>✓ All Caught Up!</p>
            <p style={{ color: '#6b7280', margin: 0 }}>No pending deposits to review</p>
          </div>
        </Card>
      ) : (
        <div>
          <Card style={{ marginBottom: 8 }}>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
              Showing {deposits.length} deposit{deposits.length !== 1 ? 's' : ''} • Filter: {statusFilter === 'all' ? 'All Deposits' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </p>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deposits.map((deposit) => (
              <Card key={deposit._id} style={{ cursor: 'pointer' }}>
                <div
                  onClick={() => setSelectedDeposit(deposit)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h4 style={{ margin: 0, color: '#1f2937', fontWeight: '600' }}>
                        {deposit.userId?.name}
                      </h4>
                      <span style={{
                        background: deposit.fraudStatus === 'Cleared' ? '#d1fae5' : '#fee2e2',
                        color: deposit.fraudStatus === 'Cleared' ? '#065f46' : '#991b1b',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {deposit.fraudStatus}
                      </span>
                      <span style={{
                        background: deposit.status === 'pending' ? '#fef3c7' : 
                                   deposit.status === 'approved' ? '#d1fae5' : 
                                   deposit.status === 'rejected' ? '#fee2e2' : 
                                   deposit.status === 'completed' ? '#c7f0d8' : '#f3f4f6',
                        color: deposit.status === 'pending' ? '#854d0e' : 
                               deposit.status === 'approved' ? '#065f46' : 
                               deposit.status === 'rejected' ? '#991b1b' : 
                               deposit.status === 'completed' ? '#166534' : '#374151',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginLeft: 8
                      }}>
                        {deposit.status === 'pending' ? '⏳ Pending' : 
                         deposit.status === 'approved' ? '✓ Approved' : 
                         deposit.status === 'rejected' ? '✗ Rejected' : 
                         deposit.status === 'completed' ? '✅ Completed' : 'Unknown'}
                      </span>
                    </div>
                    <div style={{ display: 'matrix', gap: 24, color: '#6b7280', fontSize: '0.9rem' }}>
                      <p style={{ margin: '4px 0' }}>
                        📧 {deposit.userId?.email}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        🏦 {deposit.accountId?.accountNumber}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        💳 {deposit.method === 'bank_transfer' ? `Bank Transfer from ${deposit.sourceBank}` : `Check #${deposit.checkNumber}`}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        📅 {new Date(deposit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 150 }}>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#10b981' }}>
                      ₹{deposit.amount.toLocaleString()}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDeposit(deposit);
                      }}
                      style={{ marginTop: 8, fontSize: '0.85rem' }}
                    >
                      Review →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default AdminDepositsPage;
