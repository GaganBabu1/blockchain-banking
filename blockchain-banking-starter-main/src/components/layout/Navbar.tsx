/*
 * Navbar.tsx
 * Navigation bar component shown at the top of the application.
 * Shows different links based on login state.
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if a link is active
  const isActive = (path: string) => location.pathname === path;

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const path = location.pathname;
    if (path === '/' || path === '/login' || path === '/signup') {
      navigate('/');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="navbar">
      <a href="#" className="navbar-brand" style={{ fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '1px' }} onClick={handleBrandClick}>
        Neo Bank
      </a>
      
      <ul className="navbar-links">

        {/* Show these links only when user is logged in (not admin) */}
        {isLoggedIn && !isAdmin && (
          <>
            <li>
              <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/kyc" className={isActive('/kyc') ? 'active' : ''}>
                KYC
              </Link>
            </li>
            <li>
              <Link to="/deposit" className={isActive('/deposit') ? 'active' : ''}>
                Deposit
              </Link>
            </li>
            <li>
              <Link to="/withdraw" className={isActive('/withdraw') ? 'active' : ''}>
                Withdraw
              </Link>
            </li>
            <li>
              <Link to="/transfer" className={isActive('/transfer') ? 'active' : ''}>
                Transfer
              </Link>
            </li>
            <li>
              <Link to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
                Transactions
              </Link>
            </li>
            <li>
              <Link to="/credit-scoring" className={isActive('/credit-scoring') ? 'active' : ''}>
                Credit Score
              </Link>
            </li>
          </>
        )}

        {/* Show admin dashboard link for admin users */}
        {isAdmin && (
          <li>
            <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'active' : ''}>
              Admin Panel
            </Link>
          </li>
        )}

        {/* Auth links */}
        {!isLoggedIn ? (
          <>
            <li>
              <Link to="/login" className={isActive('/login') ? 'active' : ''}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className={isActive('/signup') ? 'active' : ''}>
                Sign Up
              </Link>
            </li>
          </>
        ) : (
          <li>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d1d5db',
                cursor: 'pointer',
                padding: '8px 16px',
                fontSize: '1rem'
              }}
            >
              Logout ({user?.name})
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
