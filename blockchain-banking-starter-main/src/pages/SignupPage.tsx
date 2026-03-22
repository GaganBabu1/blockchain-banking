/*
 * SignupPage.tsx
 * User registration page with name, email, and password fields.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!name || !email || !accountNumber || !pin || !confirmPin) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      setLoading(false);
      return;
    }

    if (accountNumber.length < 4) {
      setError('Account number must be at least 4 characters');
      setLoading(false);
      return;
    }

    // Attempt signup
    const result = await signup(name, email, accountNumber, pin);
    setLoading(false);

    if (result) {
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError('Signup failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="main-content">
        <div className="form-container">
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2>Account Created Successfully!</h2>
            <p>Welcome to Blockchain Banking! Your account has been created. You'll be redirected to login shortly.</p>
            <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '24px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#10b981', fontWeight: '600' }}>
                Redirecting to login page...
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content auth-modern">
      <div className="form-container">
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Create Account</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '8px' }}>Join thousands of users in the blockchain revolution</p>
          </div>
          
          {error && (
            <div className="message message-error" style={{ marginBottom: '20px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />

            <Input
              label="Account Number"
              type="text"
              name="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Choose your account number (e.g., ACC12345)"
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
              placeholder="Enter 6 digits only (0-9)"
              required
              maxLength={6}
            />

            <Input
              label="Confirm PIN"
              type="password"
              name="confirmPin"
              value={confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setConfirmPin(value);
              }}
              placeholder="Confirm your 6-digit PIN"
              required
              maxLength={6}
            />

            <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem', color: '#3b82f6' }}>
              PIN must be exactly 6 digits (like a debit card PIN). Account number must be at least 4 characters.
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '24px', fontSize: '1rem', fontWeight: '700' }}
            >
              {loading ? 'Creating Account...' : 'Create My Account'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Already have an account? 
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600', marginLeft: '6px' }}>Login here</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SignupPage;
