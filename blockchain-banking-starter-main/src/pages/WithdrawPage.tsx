/*
 * WithdrawPage.tsx
 * Page for users to withdraw funds from their account with 2-step PIN verification.
 */

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createWithdrawalRequest, getUserAccounts } from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function WithdrawPage() {
  const { isLoggedIn } = useAuth();
  
  // Step 1: Verification
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null);
  
  // Step 2: Withdrawal Details
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [destinationBank, setDestinationBank] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

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

      // In production, you'd send accountNumber + PIN to backend for verification
      // For now, just verify account exists and PIN format is correct
      setVerificationLoading(false);
      setIsVerified(true);
      setVerifiedAccount(matchedAccount);
    } catch (err: any) {
      setVerificationLoading(false);
      setVerificationError('Failed to verify account');
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setLoading(true);

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setWithdrawError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (numAmount < 500) {
      setWithdrawError('Minimum withdrawal amount is ₹500');
      setLoading(false);
      return;
    }

    // Validate destination fields
    if (!destinationBank.trim()) {
      setWithdrawError('Please select destination bank');
      setLoading(false);
      return;
    }
    if (!destinationAccountNumber.trim()) {
      setWithdrawError('Please enter destination account number');
      setLoading(false);
      return;
    }
    if (!recipientName.trim()) {
      setWithdrawError('Please enter recipient name');
      setLoading(false);
      return;
    }

    // Check balance
    if (verifiedAccount.balance < numAmount) {
      setWithdrawError(`Insufficient balance. Available: ₹${verifiedAccount.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const response = await createWithdrawalRequest({
        accountId: verifiedAccount._id,
        amount: numAmount,
        method,
        destinationBank,
        destinationAccountNumber,
        recipientName,
        purpose: purpose || undefined,
      });
      
      setLoading(false);
      setSuccess(true);
      setReference(response.withdrawal.referenceNumber);
    } catch (err: any) {
      setLoading(false);
      setWithdrawError(err.message || 'Failed to submit withdrawal request');
    }
  };

  if (success) {
    return (
      <div className="main-content">
        <div className="form-container">
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2>Withdrawal Request Submitted!</h2>
            <p>Your withdrawal request has been received and is awaiting admin approval. You can track it using the reference number below.</p>
            <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>Reference Number</p>
                <p style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>{reference}</p>
                <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '16px', paddingTop: '16px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>Amount To Withdraw</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>₹{parseFloat(amount).toLocaleString()}</p>
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
              }}>
                Make Another Withdrawal
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
        <h1>💸 Withdraw Funds</h1>
        <p>Transfer money to your bank account securely</p>
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
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: '0' }}>Step 2: Withdrawal Details</h3>
              </div>
            </div>

            {/* Account Info Display */}
            <Card style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Your Account</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{verifiedAccount?.accountNumber}</p>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: '8px 0 0 0' }}>Available Balance: ₹{verifiedAccount?.balance.toLocaleString()}</p>
            </Card>

            {withdrawError && (
              <div className="message message-error" style={{ marginBottom: '20px' }}>{withdrawError}</div>
            )}

            <form onSubmit={handleSubmitWithdrawal}>
              <Input
                label="Withdrawal Amount (₹) *"
                type="number"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (minimum ₹500)"
                required
              />

              <div className="form-group">
                <label className="form-label">Destination Bank *</label>
                <select
                  value={destinationBank}
                  onChange={(e) => setDestinationBank(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Select Bank --</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="Axis">Axis Bank</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="PNB">Punjab National Bank</option>
                  <option value="BoB">Bank of Baroda</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Destination Account Number *"
                type="text"
                name="destinationAccountNumber"
                value={destinationAccountNumber}
                onChange={(e) => setDestinationAccountNumber(e.target.value)}
                placeholder="e.g., 1234567890123456"
                required
              />

              <Input
                label="Recipient Name *"
                type="text"
                name="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g., John Doe"
                required
              />

              <Input
                label="Purpose (Optional)"
                type="text"
                name="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Personal Savings, Business Funds"
              />

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
                  {loading ? '⏳ Processing...' : '✓ Request Withdrawal'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>

      <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
        <h3 style={{ marginBottom: '16px', color: '#3b82f6', fontWeight: '700' }}>ℹ️ Withdrawal Information</h3>
        <ul style={{ color: '#475569', paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li><strong>Minimum withdrawal:</strong> ₹500</li>
          <li><strong>Withdrawal method:</strong> Bank Transfer only</li>
          <li><strong>Processing time:</strong> Admin approval required (1-24 hours)</li>
          <li><strong>No charges:</strong> Free withdrawals for all customers</li>
          <li><strong>Reference number:</strong> Track your withdrawal status with the reference number</li>
          <li><strong>Security:</strong> All withdrawals are fraud-checked before processing</li>
        </ul>
      </Card>
    </div>
  );
}

export default WithdrawPage;
