/*
 * LoginPage.tsx
 * User login page with email and password fields.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function LoginPage() {
  const [accountNumber, setAccountNumber] = useState('ACC001');
  const [pin, setPin] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!accountNumber || !pin) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      setLoading(false);
      return;
    }

    // Attempt login
    const success = await login(accountNumber, pin);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid account number or PIN. Please try again.');
    }
  };

  return (
    <div className="main-content auth-modern">
      <div className="form-container">
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Welcome Back</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '8px' }}>Login to your account to continue</p>
          </div>
          
          {error && (
            <div className="message message-error" style={{ marginBottom: '20px' }}>{error}</div>
          )}

          {/* Demo Credentials Info */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: '#3b82f6'
          }}>
            <strong style={{ fontSize: '0.95rem' }}>✨ Demo Credentials (Pre-filled):</strong>
            <p style={{ margin: '8px 0 4px 0' }}>🏦 Account Number: <code style={{ fontFamily: 'monospace', fontWeight: '600' }}>ACC001</code></p>
            <p style={{ margin: '4px 0' }}>PIN: <code style={{ fontFamily: 'monospace', fontWeight: '600' }}>123456</code></p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Account Number"
              type="text"
              name="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter your account number"
              required
            />

            <Input
              label="6-Digit PIN"
              type="password"
              name="pin"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(value);
              }}
              placeholder="Enter 6-digit PIN"
              required
              maxLength={6}
            />

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '24px', fontSize: '1rem', fontWeight: '700' }}
            >
              {loading ? 'Logging in...' : 'Login to Account'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Don't have an account? 
              <Link to="/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600', marginLeft: '6px' }}>Sign up free</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
