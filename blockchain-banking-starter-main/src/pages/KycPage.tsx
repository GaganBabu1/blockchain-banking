/*
 * KycPage.tsx
 * KYC (Know Your Customer) verification form.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitKyc, getKycStatus } from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import KycStatusBadge from '../components/bank/KycStatusBadge';

function KycPage() {
  const { isLoggedIn } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current KYC status on mount
  useEffect(() => {
    getKycStatus().then(status => setKycStatus(status));
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validation
    if (!fullName || !address || !documentType || !documentNumber) {
      setMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!documentFile) {
      setMessage('Please upload a document file');
      setLoading(false);
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);
    formData.append('document', documentFile);

    // Submit KYC with file
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      setLoading(false);

      if (data.success) {
        setKycStatus(data.kyc.status);
        setMessage('✅ KYC and document submitted successfully! Your documents are under review.');
        // Reset form
        setFullName('');
        setAddress('');
        setDocumentType('');
        setDocumentNumber('');
        setDocumentFile(null);
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setLoading(false);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Failed to submit KYC'}`);
    }
  };

  return (
    <div className="main-content kyc-modern" style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 48 }}>
      <div className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1>📄 KYC Verification</h1>
        <p>Complete identity verification to unlock premium features</p>
      </div>

      {/* Current Status */}
      <Card style={{ marginBottom: 28, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' }}>Current Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '1.6rem' }}>
                {kycStatus === 'approved' && '✅'}
                {kycStatus === 'pending' && 'PENDING'}
                {kycStatus === 'rejected' && '❌'}
                {kycStatus === 'not_submitted' && '📋'}
              </div>
              <div>
                <p style={{ fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' }}>{kycStatus.replace('_', ' ')}</p>
                <KycStatusBadge status={kycStatus} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KYC Form */}
      <Card>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Verification Information</h3>
        {message && (
          <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`} style={{ marginBottom: '20px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Address"
            type="text"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your residential address"
            required
          />

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select
              name="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select document type</option>
              <option value="aadhar">🎫 Aadhar Card</option>
              <option value="pan">🏛️ PAN Card</option>
              <option value="passport">Passport</option>
              <option value="license">Driver's License</option>
            </select>
          </div>

          <Input
            label="Document Number"
            type="text"
            name="documentNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter your document number"
            required
          />

          <div className="form-group">
            <label className="form-label">Upload Document</label>
            <input
              type="file"
              name="documentFile"
              onChange={handleFileChange}
              className="form-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '24px', fontSize: '1rem', fontWeight: '700' }}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </form>
      </Card>

      {/* Benefits Card */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)', marginTop: 28 }}>
        <h3 style={{ marginBottom: '16px', color: '#8b5cf6', fontWeight: '700' }}>Benefits of KYC Verification</h3>
        <ul style={{ color: '#475569', paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li><strong>Higher transaction limits:</strong> Withdraw up to ₹10,00,000</li>
          <li><strong>No withdrawal fees:</strong> Zero charges on all transactions</li>
          <li><strong>Priority support:</strong> 24/7 customer support</li>
          <li><strong>Advanced features:</strong> Access to AI tools and premium services</li>
          <li><strong>Better rates:</strong> Exclusive interest rates and benefits</li>
        </ul>
      </Card>
    </div>
  );
}

export default KycPage;
