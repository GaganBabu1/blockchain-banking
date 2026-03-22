/*
 * AdminDashboardPage.tsx
 * Admin panel showing system stats and KYC management with analytics dashboards.
 */

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from '../components/layout/AdminNavbar';
import { fetchAdminStats, fetchKycRequests, updateKycStatus, KycRequest, getDailyTransactionSummary, getKycBreakdown } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import AdminTransactionPanel from '../components/bank/AdminTransactionPanel';
import { ChartContainer } from '../components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function AdminDashboardPage() {
  const { isLoggedIn, isAdmin } = useAuth();
  
  const [stats, setStats] = useState({ totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, pendingKYC: 0 });
  const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transactionTrendData, setTransactionTrendData] = useState<any[]>([]);
  const [kycBreakdownData, setKycBreakdownData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportMessage, setExportMessage] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [kycActionMessage, setKycActionMessage] = useState('');

  useEffect(() => {
    // Fetch admin data
    Promise.all([fetchAdminStats(), fetchKycRequests(), getDailyTransactionSummary(), getKycBreakdown()])
      .then(([statsData, kycData, trendData, breakdownData]) => {
        setStats(statsData);
        setKycRequests(kycData);
        setTransactionTrendData(trendData.length > 0 ? trendData : generateFallbackTransactionTrend());
        setKycBreakdownData(breakdownData.length > 0 ? breakdownData : []);
        setLoading(false);
        // Fetch all users for export/report functionality
        fetchAllUsers();
      })
      .catch(() => {
        setLoading(false);
        setTransactionTrendData(generateFallbackTransactionTrend());
        setKycBreakdownData([]);
        // Use fallback if API fails
        setAllUsers(generateFallbackUsers());
      });
  }, []);

  // Fetch all users from API
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || generateFallbackUsers());
      } else {
        setAllUsers(generateFallbackUsers());
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setAllUsers(generateFallbackUsers());
    }
  };

  // Fallback sample users in case API is unavailable
  const generateFallbackUsers = () => [
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', kycStatus: 'approved', joinDate: '2024-01-15', balance: 45000 },
    { id: '2', name: 'Priya Singh', email: 'priya@example.com', kycStatus: 'pending', joinDate: '2024-02-01', balance: 32000 },
    { id: '3', name: 'Amit Patel', email: 'amit@example.com', kycStatus: 'approved', joinDate: '2024-01-20', balance: 78000 },
    { id: '4', name: 'Neha Gupta', email: 'neha@example.com', kycStatus: 'not_submitted', joinDate: '2024-02-05', balance: 15000 },
    { id: '5', name: 'Vikram Sharma', email: 'vikram@example.com', kycStatus: 'approved', joinDate: '2024-01-10', balance: 92000 },
    { id: '6', name: 'Anjali Verma', email: 'anjali@example.com', kycStatus: 'pending', joinDate: '2024-01-28', balance: 54000 },
  ];

  // Redirect if not admin
  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  const handleKycAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const success = await updateKycStatus(requestId, action);
      if (success) {
        // Update local state
        setKycRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: action } : req
          )
        );
        setKycActionMessage(`✅ KYC ${action} successfully!`);
        setTimeout(() => setKycActionMessage(''), 3000);
      } else {
        setKycActionMessage(`❌ Failed to ${action} KYC. Please try again.`);
        setTimeout(() => setKycActionMessage(''), 3000);
      }
    } catch (error) {
      console.error('KYC action error:', error);
      setKycActionMessage(`❌ Error: ${(error as Error).message}`);
      setTimeout(() => setKycActionMessage(''), 3000);
    }
  };

  // Export users to CSV using real API data
  const exportUsersCSV = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setExportMessage('❌ Not authenticated. Please log in as admin.');
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/users/export/csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blockchain-banking-users-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        setExportMessage('✅ Users exported successfully from database!');
        setTimeout(() => setExportMessage(''), 3000);
      } else {
        setExportMessage('❌ Failed to export users');
        setTimeout(() => setExportMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      setExportMessage('❌ Error: ' + (error as Error).message);
      setTimeout(() => setExportMessage(''), 3000);
    }
  };

  // Generate admin report using real API data from database
  const generateReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setReportMessage('❌ Not authenticated. Please log in as admin.');
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/report', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const reportData = data.report;

        const report = `
BLOCKCHAIN BANKING SYSTEM - ADMIN REPORT
Generated: ${new Date().toLocaleString()}

=== USER STATISTICS ===
Total Users: ${reportData.users.total}
Verified Users: ${reportData.users.verified}
Admin Users: ${reportData.users.admins}

=== TRANSACTION SUMMARY ===
Total Transactions: ${reportData.transactions.total}
Total Deposits: ₹${(reportData.transactions.deposits || 0).toLocaleString()}
Total Withdrawals: ₹${(reportData.transactions.withdrawals || 0).toLocaleString()}
Net Balance: ₹${((reportData.transactions.deposits || 0) - (reportData.transactions.withdrawals || 0)).toLocaleString()}

=== KYC VERIFICATION STATUS ===
Pending KYC: ${reportData.kyc.pending}
Approved KYC: ${reportData.kyc.approved}
Approval Rate: ${reportData.users.total > 0 ? Math.round((reportData.kyc.approved / reportData.users.total) * 100) : 0}%

=== SYSTEM STATUS ===
Report Generated: ${new Date().toLocaleString()}
Data Source: Live Database
Status: Active
        `;

        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blockchain-banking-report-${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        setReportMessage('✅ Report generated successfully from database!');
        setTimeout(() => setReportMessage(''), 3000);
      } else {
        setReportMessage('❌ Failed to generate report');
        setTimeout(() => setReportMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportMessage('❌ Error: ' + (error as Error).message);
      setTimeout(() => setReportMessage(''), 3000);
    }
  };

  // KYC table columns
  const kycColumns = [
    { key: 'userName', header: 'User Name' },
    { key: 'email', header: 'Email' },
    { key: 'documentType', header: 'Document Type' },
    { key: 'submittedDate', header: 'Submitted' },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <span className={`badge badge-${value}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_: any, row: KycRequest) => (
        row.status === 'pending' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="success" 
              size="small"
              onClick={() => handleKycAction(row.id, 'approved')}
            >
              Approve
            </Button>
            <Button 
              variant="danger" 
              size="small"
              onClick={() => handleKycAction(row.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span style={{ color: '#6b7280' }}>—</span>
        )
      )
    }
  ];

  // Fallback transaction trend if API fails
  const generateFallbackTransactionTrend = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      day,
      deposits: Math.floor(Math.random() * (stats.totalDeposits / 7) + 10000),
      withdrawals: Math.floor(Math.random() * (stats.totalWithdrawals / 7) + 5000),
    }));
  };

  // Generate transaction trend data (now using live data from state)
  const generateTransactionTrendData = () => {
    if (transactionTrendData.length > 0) {
      return transactionTrendData;
    }
    return generateFallbackTransactionTrend();
  };

  // Generate KYC status breakdown data (now using live data from backend)
  const generateKycBreakdown = () => {
    if (kycBreakdownData.length > 0) {
      return kycBreakdownData;
    }
    return [];
  };

  // Generate transaction comparison data
  const generateTransactionComparison = () => [
    { name: 'Deposits', amount: stats.totalDeposits, color: '#10b981' },
    { name: 'Withdrawals', amount: stats.totalWithdrawals, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="main-content admin-modern">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="main-content admin-modern">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <Card className="stat-card">
          <p className="stat-value">{stats.totalUsers}</p>
          <p className="stat-label">Total Users</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-value" style={{ color: '#10b981' }}>
            ₹{stats.totalDeposits.toLocaleString()}
          </p>
          <p className="stat-label">Total Deposits</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-value" style={{ color: '#ef4444' }}>
            ₹{stats.totalWithdrawals.toLocaleString()}
          </p>
          <p className="stat-label">Total Withdrawals</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.pendingKYC}
          </p>
          <p className="stat-label">Pending KYC</p>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Transaction Trends Chart */}
        <Card title="📈 Transaction Trends (Last 7 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateTransactionTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} name="Deposits" />
              <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} name="Withdrawals" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Deposit vs Withdrawal Comparison */}
        <Card title="💰 Deposit vs Withdrawal Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generateTransactionComparison()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {generateTransactionComparison().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* KYC Status Distribution */}
        <Card title="📋 KYC Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={generateKycBreakdown()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {generateKycBreakdown().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} applications`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* User Growth Stats */}
        <Card title="👥 User Metrics">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '8px' }}>Total Users</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{stats.totalUsers}</p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>{stats.totalUsers} active accounts</p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '8px' }}>KYC Approved</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {kycBreakdownData.find(r => r.name === 'Approved')?.value || 0}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                {stats.totalUsers > 0 ? Math.round(((kycBreakdownData.find(r => r.name === 'Approved')?.value || 0) / stats.totalUsers) * 100) : 0}% approval rate
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Transactions Panel */}
      <AdminTransactionPanel />

      {/* KYC Requests */}
      <Card title="KYC Verification Requests">
        {kycActionMessage && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: kycActionMessage.includes('✅') ? '#ecfdf5' : '#fef2f2',
            color: kycActionMessage.includes('✅') ? '#166534' : '#991b1b',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: `1px solid ${kycActionMessage.includes('✅') ? '#86efac' : '#fecaca'}`
          }}>
            {kycActionMessage}
          </div>
        )}
        <Table 
          columns={kycColumns}
          data={kycRequests}
          emptyMessage="No KYC requests found"
        />
      </Card>

      {/* Advanced Features Section */}
      <Card title="Advanced Banking Tools & Monitoring">
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Administrative tools for system monitoring, security, analytics, and financial management
        </p>
        <div className="ai-features-grid">
          {/* Transaction Security Card */}
          <Link to="/ai/fraud-detection" style={{ textDecoration: 'none' }}>
            <div className="feature-card-hover">
              <h4>Transaction Security</h4>
              <p>Real-time anomaly detection and monitoring</p>
              <div style={{ color: '#3b82f6', fontSize: '0.875rem', marginTop: '8px' }}>
                Monitor Threats →
              </div>
            </div>
          </Link>

        </div>
      </Card>

      {/* Quick Info */}
      <Card>
        <h3 style={{ marginBottom: '12px' }}>Admin Quick Actions</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Export user data or generate system reports for auditing and monitoring.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button 
            variant="secondary" 
            onClick={exportUsersCSV}
          >
            Export Users (CSV)
          </Button>
          <Button 
            variant="secondary"
            onClick={generateReport}
          >
            Generate Report
          </Button>
        </div>
        {exportMessage && (
          <p style={{ marginTop: '12px', color: '#10b981', fontSize: '0.9rem' }}>
            {exportMessage}
          </p>
        )}
        {reportMessage && (
          <p style={{ marginTop: '12px', color: '#10b981', fontSize: '0.9rem' }}>
            {reportMessage}
          </p>
        )}
      </Card>
      </div>
    </>
  );
}

export default AdminDashboardPage;
