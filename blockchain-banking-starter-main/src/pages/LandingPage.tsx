/*
 * LandingPage.tsx
 * The home page that users see when they first visit the application.
 * Showcases the key features of the blockchain banking system.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

function LandingPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/login');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="landing-hero">
        <h1>Decentralized Blockchain Bank</h1>
        <h2>The future of banking is secure, transparent, and revolutionary</h2>
        <div className="hero-desc">Experience next-generation financial freedom with blockchain technology and AI-powered insights</div>
        <div className="hero-cta">
          <Button variant="primary" onClick={handleGetStarted}>Get Started Free</Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="main-content">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Why Choose Us?</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', letterSpacing: '0.3px' }}>Experience the most secure and innovative banking platform</p>
        </div>
        <div className="landing-features">
          <Card className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Bank-Grade Security</h3>
            <p>Military-grade encryption with distributed ledger technology ensures your funds are always protected</p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">Analytics Dashboard</div>
            <h3>Full Transparency</h3>
            <p>Every transaction recorded on blockchain. Complete auditability and traceability for peace of mind</p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">Fast Transactions</div>
            <h3>Lightning Fast</h3>
            <p>Instant global transfers with minimal fees. Send money anywhere, anytime, instantly</p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">Global Access</div>
            <h3>Decentralized</h3>
            <p>No single point of failure. Your assets distributed across secure blockchain networks</p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">Mobile Ready</div>
            <h3>Easy to Use</h3>
            <p>Beautiful, intuitive interface designed for everyone. From beginners to experts</p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">Secure</div>
            <h3>Verified & Compliant</h3>
            <p>Full KYC verification. Regulatory compliant with streamlined verification process</p>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="cta">
          <h2>Ready to Transform Your Banking?</h2>
          <p>Join thousands of users who've already switched to the future of finance with our blockchain banking system</p>
          <Button variant="primary" onClick={() => navigate('/signup')}>Create Free Account Today</Button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
