/*
 * AdminNavbar.tsx
 * Admin navigation bar showing all admin pages with links and logout.
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Check if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar" style={{ backgroundColor: '#1f2937', borderBottom: '2px solid #374151' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 20px' }}>
        {/* Brand */}
        <Link to="/admin/dashboard" style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '1px', color: '#f0f9ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔐</span>
          Admin Panel
        </Link>

        {/* Admin Links */}
        <ul className="navbar-links" style={{ marginLeft: 'auto', display: 'flex', gap: '1px' }}>
          <li style={{ marginRight: '0' }}>
            <Link 
              to="/admin/dashboard" 
              className={isActive('/admin/dashboard') ? 'active' : ''} 
              style={{
                display: 'block',
                padding: '12px 16px',
                color: isActive('/admin/dashboard') ? '#10b981' : '#d1d5db',
                textDecoration: 'none',
                borderBottom: isActive('/admin/dashboard') ? '3px solid #10b981' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📊 Dashboard
            </Link>
          </li>
          <li style={{ marginRight: '0' }}>
            <Link 
              to="/admin/deposits" 
              className={isActive('/admin/deposits') ? 'active' : ''} 
              style={{
                display: 'block',
                padding: '12px 16px',
                color: isActive('/admin/deposits') ? '#10b981' : '#d1d5db',
                textDecoration: 'none',
                borderBottom: isActive('/admin/deposits') ? '3px solid #10b981' : 'none',
                transition: 'all 0.2s'
              }}
            >
              💰 Deposits
            </Link>
          </li>
          <li style={{ marginRight: '0' }}>
            <Link 
              to="/admin/withdrawals" 
              className={isActive('/admin/withdrawals') ? 'active' : ''}
              style={{
                display: 'block',
                padding: '12px 16px',
                color: isActive('/admin/withdrawals') ? '#10b981' : '#d1d5db',
                textDecoration: 'none',
                borderBottom: isActive('/admin/withdrawals') ? '3px solid #10b981' : 'none',
                transition: 'all 0.2s'
              }}
            >
              💸 Withdrawals
            </Link>
          </li>
          <li style={{ marginRight: '0' }}>
            <Link 
              to="/admin/transfers" 
              className={isActive('/admin/transfers') ? 'active' : ''}
              style={{
                display: 'block',
                padding: '12px 16px',
                color: isActive('/admin/transfers') ? '#10b981' : '#d1d5db',
                textDecoration: 'none',
                borderBottom: isActive('/admin/transfers') ? '3px solid #10b981' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔄 Transfers
            </Link>
          </li>

          {/* User Info and Logout */}
          <li style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #4b5563', paddingLeft: '12px' }}>
            <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
              👤 {user?.name || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 14px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default AdminNavbar;
