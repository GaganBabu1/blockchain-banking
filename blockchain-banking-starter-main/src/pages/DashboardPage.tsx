/*
 * DashboardPage.tsx
 * Main user dashboard showing balances, recent transactions, and quick actions.
 */

import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BalanceSummary from '../components/bank/BalanceSummary';
import RecentTransactions from '../components/bank/RecentTransactions';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSpendingByCategory, getAccountBalanceTrend } from '../services/api';

function DashboardPage() {
  const { isLoggedIn, user, isAdmin } = useAuth();
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [accountBalance, setAccountBalance] = useState<any[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch spending by category (REAL DATA from actual transactions)
        const spendingData = await getSpendingByCategory(30);
        const formattedSpending = (spendingData.categories || []).length > 0 
          ? (spendingData.categories || []).map((cat: any) => ({
              name: cat.name || 'Other',
              amount: cat.amount || 0,
              value: cat.value || 0,
              type: cat.type || 'expense',
              color: cat.type === 'income' ? '#10b981' : ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)]
            }))
          : [];
        setTransactionData(formattedSpending);

        // Fetch account balance trend (REAL DATA calculated from transactions)
        const balanceData = await getAccountBalanceTrend(30);
        const formattedBalance = (balanceData.trend || []).length > 0
          ? (balanceData.trend || []).map((item: any) => ({
              day: item.day || item.date || 'Day',
              balance: item.balance || 0
            }))
          : [];
        setAccountBalance(formattedBalance);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fallbacks won't be needed since we have REAL data from backend
        setTransactionData([]);
        setAccountBalance([]);
      }
    };

    fetchChartData();
  }, [user?.account?.balance]);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Redirect admin to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <div className="main-content dashboard-modern">
      {/* Welcome Header */}
      <div className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1>👋 Welcome back, {user?.name}!</h1>
        <p>Here's an overview of your account performance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, marginBottom: 40 }}>
        {/* Balance Summary */}
        <div>
          <BalanceSummary />
        </div>

        {/* Quick Actions */}
        <div>
          <Card style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#3b82f6', marginBottom: '24px' }}>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <Link to="/deposit" style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ width: '100%' }}>Deposit Funds</Button>
              </Link>
              <Link to="/withdraw" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%' }}>Withdraw Funds</Button>
              </Link>
              <Link to="/kyc" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%' }}>📄 Complete KYC</Button>
              </Link>
              <Link to="/transactions" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ width: '100%' }}>View Transactions</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ marginBottom: 40 }}>
        <RecentTransactions />
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Account Balance Trend */}
        <Card title="📈 Account Balance Trend (Last 30 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accountBalance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `₹${Math.round(value).toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Spending Breakdown */}
        <Card title="💳 Spending Breakdown by Category">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `₹${Math.round(value).toLocaleString()}`}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {transactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Analytics Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Credit Scoring Card */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', borderLeft: '4px solid #a855f7' }}>
          <div>
            <h4 style={{ marginBottom: '10px', color: '#0f172a', fontWeight: '700' }}>📊 Your Credit Score</h4>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '15px' }}>
              Check your ML-based credit score and loan eligibility
            </p>
            <Link to="/credit-scoring" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="small">View Score →</Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Security Banner */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '2.2rem' }}>Security Status</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '6px', color: '#0f172a', fontWeight: '700' }}>Enhance Your Account Security</h4>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Complete your identity verification to unlock higher transaction limits and access all premium features
            </p>
          </div>
          <Link to="/kyc" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
            <Button variant="primary" size="small">Verify Now</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
