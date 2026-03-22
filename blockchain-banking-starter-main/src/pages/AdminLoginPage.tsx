/*
 * AdminLoginPage.tsx
 * Admin login page with separate authentication.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function AdminLoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { adminLogin, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already admin
  if (isAdmin) {
    navigate('/admin/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const success = await adminLogin(email, password);
    setLoading(false);

    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin credentials. Please check your email and password.');
    }
  };

  return (
    <div className="main-content auth-modern">
      <div className="form-container">
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>🔐</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Admin Access</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px' }}>Restricted to authorized personnel only</p>
          </div>
          
          {error && (
            <div className="message message-error" style={{ marginBottom: '20px' }}>{error}</div>
          )}

          {/* Admin Demo Credentials Info */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: '#dc2626'
          }}>
            <strong style={{ fontSize: '0.95rem' }}>Admin Demo Credentials (Pre-filled):</strong>
            <p style={{ margin: '8px 0 4px 0' }}>📧 Email: <code style={{ fontFamily: 'monospace', fontWeight: '600' }}>admin@example.com</code></p>
            <p style={{ margin: '4px 0' }}>Password: <code style={{ fontFamily: 'monospace', fontWeight: '600' }}>Admin@123</code></p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Admin Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button 
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '24px', fontSize: '1rem', fontWeight: '700' }}
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>Back to Home</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminLoginPage;
