/*
 * TransferPage.tsx
 * Page for users to transfer money to other users with 2-step PIN verification.
 */

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initiateTransfer, searchUsersForTransfer, getUserAccounts } from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

interface Account {
  _id: string;
  accountNumber: string;
  holderName: string;
}

function TransferPage() {
  const { isLoggedIn } = useAuth();
  
  // Step 1: Verification
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null);
  
  // Step 2: Transfer Details
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Personal');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [transferError, setTransferError] = useState('');

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationLoading(true);

    // Validation
    if (!accountNumber.trim()) {
      setVerificationError('Please enter your account number');
      setVerificationLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setVerificationError('PIN must be exactly 6 digits');
      setVerificationLoading(false);
      return;
    }

    try {
      const response = await getUserAccounts();
      const accounts = response.accounts || [];
      const matchedAccount = accounts.find((acc: any) => acc.accountNumber === accountNumber);

      if (!matchedAccount) {
        setVerificationError('Account not found');
        setVerificationLoading(false);
        return;
      }

      setVerificationLoading(false);
      setIsVerified(true);
      setVerifiedAccount(matchedAccount);
    } catch (err: any) {
      setVerificationLoading(false);
      setVerificationError('Failed to verify account');
    }
  };

  // Search for recipients
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await searchUsersForTransfer(query);
      setSearchResults(results);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const selectRecipient = (account: Account) => {
    setRecipientAccountNumber(account.accountNumber);
    setRecipientName(account.holderName);
    setSearchResults([]);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setLoading(true);

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setTransferError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (numAmount < 100) {
      setTransferError('Minimum transfer amount is ₹100');
      setLoading(false);
      return;
    }

    // Validate recipient fields
    if (!recipientAccountNumber.trim()) {
      setTransferError('Please select a recipient');
      setLoading(false);
      return;
    }
    if (!recipientPhone.trim() || !/^\d{10}$/.test(recipientPhone)) {
      setTransferError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }
    if (!recipientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setTransferError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Check balance
    if (verifiedAccount.balance < numAmount) {
      setTransferError(`Insufficient balance. Available: ₹${verifiedAccount.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const response = await initiateTransfer(
        numAmount,
        recipientAccountNumber,
        purpose,
        description,
        recipientPhone,
        recipientEmail
      );
      
      setLoading(false);
      setSuccess(true);
      setReference(response.referenceNumber);
    } catch (err: any) {
      setLoading(false);
      setTransferError(err.message || 'Failed to submit transfer request');
    }
  };

  if (success) {
    return (
      <div className="main-content">
        <div className="form-container">
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2>Transfer Request Submitted!</h2>
            <p>Your transfer request has been sent and is awaiting admin approval. The recipient will receive the funds once approved.</p>
            <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>Reference Number</p>
                <p style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>{reference}</p>
                <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '16px', paddingTop: '16px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>Transfer Amount</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>₹{parseFloat(amount).toLocaleString()}</p>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '12px', marginBottom: '4px' }}>To</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{recipientName} ({recipientAccountNumber})</p>
                </div>
              </div>
            </Card>
            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => {
                setSuccess(false);
                setAmount('');
                setIsVerified(false);
                setAccountNumber('');
                setPin('');
                setRecipientAccountNumber('');
                setRecipientName('');
                setRecipientPhone('');
                setRecipientEmail('');
              }}>
                Make Another Transfer
              </Button>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="primary">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content withdraw-modern" style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 48 }}>
      <div className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1>💸 Transfer Money</h1>
        <p>Send money to another user securely</p>
      </div>

      <Card>
        {!isVerified ? (
          <>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Step 1: Verify Your Account</h3>
            {verificationError && (
              <div className="message message-error" style={{ marginBottom: '20px' }}>{verificationError}</div>
            )}

            <form onSubmit={handleVerifyAccount}>
              <Input
                label="Account Number"
                type="text"
                name="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g., ACC001"
                required
              />

              <Input
                label="PIN (6 Digits)"
                type="password"
                name="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                required
              />

              <Button
                type="submit"
                variant="primary"
                disabled={verificationLoading}
                style={{ width: '100%', marginTop: '24px', fontSize: '1rem', fontWeight: '700' }}
              >
                {verificationLoading ? '⏳ Verifying...' : '✓ Verify Account'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#10b981', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>✓</div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: '0' }}>Step 2: Transfer Details</h3>
              </div>
            </div>

            {/* Account Info Display */}
            <Card style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Your Account</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{verifiedAccount?.accountNumber}</p>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: '8px 0 0 0' }}>Available Balance: ₹{verifiedAccount?.balance.toLocaleString()}</p>
            </Card>

            {transferError && (
              <div className="message message-error" style={{ marginBottom: '20px' }}>{transferError}</div>
            )}

            <form onSubmit={handleSubmitTransfer}>
              {/* Recipient Search */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                  Search Recipient *
                </label>
                <Input
                  type="text"
                  placeholder="Search by account number or name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                />
                {showSuggestions && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {searchResults.map(account => (
                      <div
                        key={account._id}
                        onClick={() => selectRecipient(account)}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: 'white',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{account.holderName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Account: {account.accountNumber}</div>
                      </div>
                    ))}
                  </div>
                )}
                {recipientAccountNumber && (
                  <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#10b981' }}>✓ Recipient selected: {recipientName}</p>
                )}
              </div>

              {/* Recipient Phone */}
              <Input
                label="Recipient Phone Number *"
                type="tel"
                name="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g., 9876543210"
                maxLength="10"
                required
              />

              {/* Recipient Email */}
              <Input
                label="Recipient Email *"
                type="email"
                name="recipientEmail"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g., john@example.com"
                required
              />

              {/* Amount */}
              <Input
                label="Transfer Amount (₹) *"
                type="number"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (minimum ₹100)"
                required
              />

              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="form-select"
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Loan">Loan</option>
                  <option value="Salary">Salary</option>
                  <option value="Rent">Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add a note for the recipient..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsVerified(false);
                    setAccountNumber('');
                    setPin('');
                  }}
                  style={{ flex: 1 }}
                >
                  ← Go Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  style={{ flex: 1, fontSize: '1rem', fontWeight: '700' }}
                >
                  {loading ? '⏳ Processing...' : '✓ Transfer Money'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>

      <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
        <h3 style={{ marginBottom: '16px', color: '#3b82f6', fontWeight: '700' }}>ℹ️ Transfer Information</h3>
        <ul style={{ color: '#475569', paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li><strong>Minimum transfer:</strong> ₹100</li>
          <li><strong>All transfers require admin approval</strong> before funds are sent</li>
          <li><strong>Funds deducted only after approval</strong> - rejection returns money to your account</li>
          <li><strong>Recipient validation:</strong> Phone and email verified for safety</li>
          <li><strong>Reference number:</strong> Track your transfer with the reference number</li>
          <li><strong>Security:</strong> All transfers are fraud-checked before processing</li>
        </ul>
      </Card>
    </div>
  );
}

export default TransferPage;
