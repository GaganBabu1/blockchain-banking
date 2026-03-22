/*
 * api.ts
 * Central place for all API calls.
 * Connects to the Express.js backend.
 */

const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem('authToken');
}

// Helper for API requests
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`Network Error: Could not connect to ${url}`);
      console.error('Make sure the backend is running on http://localhost:5000');
      throw new Error('Backend server is not accessible. Please ensure the backend is running on http://localhost:5000');
    }
    throw error;
  }
}

// Types
export interface Transaction {
  _id?: string;
  id?: string;
  date: string;
  createdAt?: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'approved' | 'rejected';
  reference: string;
  referenceNumber?: string;
  riskScore?: number;
  fraudStatus?: 'cleared' | 'under_review' | 'flagged';
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  toAccountNumber?: string;
  purpose?: string;
}

export interface KycData {
  fullName: string;
  address: string;
  documentType: string;
  documentNumber: string;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
}

export interface UserBalance {
  fiatBalance: number;
  tokenBalance: number;
  currency: string;
}

export interface KycRequest {
  id: string;
  userName: string;
  email: string;
  documentType: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Dummy data store (simulates database) - for fallback only
let transactions: Transaction[] = [
  { id: '1', date: '2024-01-15', type: 'deposit', amount: 5000, currency: 'INR', status: 'completed', reference: 'DEP001' },
  { id: '2', date: '2024-01-14', type: 'withdraw', amount: 1000, currency: 'INR', status: 'completed', reference: 'WTH001' },
];

let kycStatus: KycData['status'] = 'not_submitted';
let kycRequests: KycRequest[] = [];

// API Functions

// User Registration
export async function registerUser(name: string, email: string, accountNumber: string, password: string, confirmPassword: string) {
  try {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, accountNumber, password, confirmPassword }),
    });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// User Login (Account Number + PIN)
export async function loginUser(accountNumber: string, password: string) {
  try {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, password }),
    });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Admin Login (Email + Password)
export async function adminLoginUser(email: string, password: string) {
  try {
    const response = await apiCall('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    return await apiCall('/auth/me');
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

// Update User Profile
export async function updateUserProfile(data: any) {
  try {
    return await apiCall('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (error) {
    throw error;
  }
}

// Fetch user balances
export async function fetchBalances(): Promise<UserBalance> {
  try {
    const response = await apiCall('/account/balance');
    return {
      fiatBalance: response.balance || 0,
      tokenBalance: 0,
      currency: response.currency || 'INR'
    };
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return { fiatBalance: 0, tokenBalance: 0, currency: 'INR' };
  }
}

// Fetch all transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    // Fetch from combined endpoint that returns deposits, withdrawals, and transfers
    const response = await apiCall('/account/transactions');
    
    // Map backend response to frontend Transaction type
    const transactions = (response.transactions || []).map((t: any) => ({
      _id: t._id || t.transactionId,
      id: t.transactionId,
      date: new Date(t.createdAt).toISOString().split('T')[0],
      createdAt: t.createdAt,
      type: (t.type?.toLowerCase() || 'deposit') as 'deposit' | 'withdraw' | 'transfer',
      amount: t.amount,
      currency: 'INR',
      status: t.status?.toLowerCase() || 'pending',
      reference: t.transactionId,
      referenceNumber: t.referenceNumber || t.transactionId,
      riskScore: t.riskScore || 0,
      fraudStatus: t.fraudStatus || 'cleared',
      recipientName: t.recipientName,
      recipientPhone: t.recipientPhone,
      recipientEmail: t.recipientEmail,
      toAccountNumber: t.toAccountNumber,
      purpose: t.purpose
    }));

    // Sort by date (newest first)
    transactions.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return dateB - dateA;
    });

    return transactions;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

// Fetch recent transactions (last 5) - Show all statuses
export async function fetchRecentTransactions(): Promise<Transaction[]> {
  const txns = await fetchTransactions();
  // Show all transactions: pending, completed, rejected, approved
  return txns.slice(0, 5);
}

// Create a deposit
export async function createDeposit(amount: number, currency: string): Promise<Transaction> {
  try {
    const response = await apiCall('/account/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, description: 'Money Deposit' }),
    });
    return {
      id: response.transaction.transactionId,
      date: new Date(response.transaction.createdAt).toISOString().split('T')[0],
      type: 'deposit',
      amount: response.transaction.amount,
      currency,
      status: 'completed',
      reference: response.transaction.transactionId
    };
  } catch (error) {
    throw error;
  }
}

// Create a withdrawal
export async function createWithdrawal(amount: number, destination: string): Promise<Transaction> {
  try {
    const response = await apiCall('/account/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, description: `Withdrawal to ${destination}` }),
    });
    return {
      id: response.transaction.transactionId,
      date: new Date(response.transaction.createdAt).toISOString().split('T')[0],
      type: 'withdraw',
      amount: response.transaction.amount,
      currency: 'INR',
      status: 'completed',
      reference: response.transaction.transactionId
    };
  } catch (error) {
    throw error;
  }
}

// Submit KYC
export async function submitKyc(data: Omit<KycData, 'status'>) {
  try {
    const response = await apiCall('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify({
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentImageUrl: ''
      }),
    });
    return { success: true, status: 'pending' as const };
  } catch (error) {
    throw error;
  }
}

// Get KYC status
export async function getKycStatus(): Promise<KycData['status']> {
  try {
    const response = await apiCall('/kyc/status');
    return response.kyc.status.toLowerCase() as KycData['status'];
  } catch (error) {
    console.error('Failed to fetch KYC status:', error);
    return 'not_submitted';
  }
}

// Admin: Fetch KYC requests
export async function fetchKycRequests(): Promise<KycRequest[]> {
  try {
    const response = await apiCall('/kyc/admin/all');
    return response.kycRequests.map((k: any) => ({
      id: k.id,
      userName: k.userName,
      email: k.email,
      documentType: k.documentType,
      submittedDate: k.submittedDate,
      status: k.status
    }));
  } catch (error) {
    console.error('Failed to fetch KYC requests:', error);
    return [];
  }
}

// Admin: Update KYC status
export async function updateKycStatus(requestId: string, action: 'approved' | 'rejected'): Promise<boolean> {
  try {
    await apiCall(`/kyc/admin/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: action, rejectionReason: 'Document verification failed' }),
    });
    return true;
  } catch (error) {
    console.error('Failed to update KYC status:', error);
    return false;
  }
}

// Admin: Fetch stats
export async function fetchAdminStats() {
  try {
    const response = await apiCall('/admin/stats');
    return response.stats;
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return { totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0 };
  }
}

// Admin: Export users as CSV
export async function exportUsersCSV() {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/admin/users/export/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const csv = await response.text();
    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    return true;
  } catch (error) {
    console.error('Failed to export users:', error);
    return false;
  }
}

// Admin: Generate report
export async function generateReport() {
  try {
    const response = await apiCall('/admin/report');
    return response.report;
  } catch (error) {
    console.error('Failed to generate report:', error);
    return null;
  }
}

// Admin: Fetch pending transactions
export async function fetchPendingTransactions() {
  try {
    const response = await apiCall('/admin/transactions/pending');
    return response.transactions || [];
  } catch (error) {
    console.error('Failed to fetch pending transactions:', error);
    return [];
  }
}

// Admin: Approve transaction
export async function approveTransaction(transactionId: string) {
  try {
    const response = await apiCall(`/admin/transactions/${transactionId}/approve`, {
      method: 'POST'
    });
    return response.success;
  } catch (error) {
    console.error('Failed to approve transaction:', error);
    return false;
  }
}

// Admin: Reject transaction
export async function rejectTransaction(transactionId: string, rejectionReason: string) {
  try {
    const response = await apiCall(`/admin/transactions/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
    return response.success;
  } catch (error) {
    console.error('Failed to reject transaction:', error);
    return false;
  }
}

// Admin: Get pending deposits
export async function fetchPendingDeposits() {
  try {
    const response = await apiCall('/admin/deposits/pending');
    return response.deposits || [];
  } catch (error) {
    console.error('Failed to fetch pending deposits:', error);
    return [];
  }
}

// Admin: Approve deposit
export async function approveDeposit(depositId: string, notes?: string) {
  try {
    const response = await apiCall(`/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' })
    });
    return response.success;
  } catch (error) {
    console.error('Failed to approve deposit:', error);
    throw error;
  }
}

// Admin: Reject deposit
export async function rejectDeposit(depositId: string, rejectionReason: string) {
  try {
    const response = await apiCall(`/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
    return response.success;
  } catch (error) {
    console.error('Failed to reject deposit:', error);
    throw error;
  }
}

// Transfers: Initiate transfer
export async function initiateTransfer(amount: number, toAccountNumber: string, purpose: string, description: string, recipientPhone: string, recipientEmail: string): Promise<any> {
  try {
    const response = await apiCall('/transfers', {
      method: 'POST',
      body: JSON.stringify({ toAccountNumber, amount, purpose, description, recipientPhone, recipientEmail })
    });
    return {
      referenceNumber: response.transfer.referenceNumber,
      success: true,
      transfer: response.transfer
    };
  } catch (error) {
    console.error('Failed to initiate transfer:', error);
    throw error;
  }
}

// Transfers: Get user transfers
export async function fetchUserTransfers() {
  try {
    const response = await apiCall('/transfers/my-transfers');
    return response.transfers || [];
  } catch (error) {
    console.error('Failed to fetch transfers:', error);
    return [];
  }
}

// Transfers: Search accounts
export async function searchUsersForTransfer(query: string) {
  try {
    const response = await apiCall(`/transfers/search-users?query=${encodeURIComponent(query)}`);
    return response.accounts || [];
  } catch (error) {
    console.error('Failed to search accounts:', error);
    return [];
  }
}

// Admin: Get pending transfers
export async function fetchPendingTransfers() {
  try {
    const response = await apiCall('/transfers/pending');
    return response.transfers || [];
  } catch (error) {
    console.error('Failed to fetch pending transfers:', error);
    return [];
  }
}

// Admin: Approve transfer
export async function approveTransferAdmin(transferId: string, adminNotes?: string) {
  try {
    const response = await apiCall(`/transfers/${transferId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes })
    });
    return response.success;
  } catch (error) {
    console.error('Failed to approve transfer:', error);
    return false;
  }
}

// Admin: Reject transfer
export async function rejectTransferAdmin(transferId: string, rejectionReason: string) {
  try {
    const response = await apiCall(`/transfers/${transferId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
    return response.success;
  } catch (error) {
    console.error('Failed to reject transfer:', error);
    return false;
  }
}

// ============ DEPOSITS & WITHDRAWALS ============

// Get user's accounts
export async function getUserAccounts() {
  try {
    return await apiCall('/account/my-accounts');
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    throw error;
  }
}

// Create deposit request
export async function createDepositRequest(data: {
  accountId: string;
  amount: number;
  method: string;
  sourceBank?: string;
  accountNumber?: string;
  transactionReference?: string;
  checkNumber?: string;
  checkIssuerName?: string;
  bankName?: string;
  purpose?: string;
}) {
  try {
    return await apiCall('/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to create deposit request:', error);
    throw error;
  }
}

// Get user's deposits
export async function getUserDeposits() {
  try {
    return await apiCall('/deposits');
  } catch (error) {
    console.error('Failed to fetch deposits:', error);
    return { deposits: [] };
  }
}

// Create withdrawal request
export async function createWithdrawalRequest(data: {
  accountId: string;
  amount: number;
  method: string;
  destinationBank: string;
  destinationAccountNumber: string;
  recipientName: string;
  purpose?: string;
}) {
  try {
    return await apiCall('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to create withdrawal request:', error);
    throw error;
  }
}

// Get user's withdrawals
export async function getUserWithdrawals() {
  try {
    return await apiCall('/withdrawals');
  } catch (error) {
    console.error('Failed to fetch withdrawals:', error);
    return { withdrawals: [] };
  }
}

// Admin: Get pending deposits
export async function getPendingDeposits() {
  try {
    return await apiCall('/admin/deposits/pending');
  } catch (error) {
    console.error('Failed to fetch pending deposits:', error);
    return { deposits: [] };
  }
}

// Admin: Approve deposit
export async function approveDepositAdmin(depositId: string, notes?: string) {
  try {
    return await apiCall(`/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.error('Failed to approve deposit:', error);
    throw error;
  }
}

// Admin: Reject deposit
export async function rejectDepositAdmin(depositId: string, rejectionReason: string) {
  try {
    return await apiCall(`/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  } catch (error) {
    console.error('Failed to reject deposit:', error);
    throw error;
  }
}

// Admin: Get pending withdrawals
export async function getPendingWithdrawals() {
  try {
    return await apiCall('/admin/withdrawals/pending');
  } catch (error) {
    console.error('Failed to fetch pending withdrawals:', error);
    return { withdrawals: [] };
  }
}

// Admin: Approve withdrawal
export async function approveWithdrawalAdmin(withdrawalId: string, notes?: string) {
  try {
    return await apiCall(`/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.error('Failed to approve withdrawal:', error);
    throw error;
  }
}

// Admin: Reject withdrawal
export async function rejectWithdrawalAdmin(withdrawalId: string, rejectionReason: string) {
  try {
    return await apiCall(`/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  } catch (error) {
    console.error('Failed to reject withdrawal:', error);
    throw error;
  }
}

// ============ DISPUTE MANAGEMENT ============

// Admin: Get all disputes
export async function getAllDisputes() {
  try {
    return await apiCall(`/admin/disputes`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get disputes:', error);
    throw error;
  }
}

// Admin: Get open disputes
export async function getOpenDisputes() {
  try {
    return await apiCall(`/admin/disputes/open`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get open disputes:', error);
    throw error;
  }
}

// Admin: Resolve dispute
export async function resolveDispute(disputeId: string, resolution: string, refundAmount?: number, notes?: string) {
  try {
    return await apiCall(`/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, refundAmount, notes }),
    });
  } catch (error) {
    console.error('Failed to resolve dispute:', error);
    throw error;
  }
}

// Admin: Assign dispute to staff
export async function assignDispute(disputeId: string, assignedToId: string) {
  try {
    return await apiCall(`/admin/disputes/${disputeId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToId }),
    });
  } catch (error) {
    console.error('Failed to assign dispute:', error);
    throw error;
  }
}

// ============ USER SUSPENSION ============

// Admin: Get all suspended users
export async function getSuspendedUsers() {
  try {
    return await apiCall(`/admin/suspensions`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get suspended users:', error);
    throw error;
  }
}

// Admin: Suspend user
export async function suspendUser(userId: string, reason: string, severity?: string, suspendUntil?: string, notes?: string) {
  try {
    return await apiCall(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, severity, suspendUntil, notes }),
    });
  } catch (error) {
    console.error('Failed to suspend user:', error);
    throw error;
  }
}

// Admin: Unsuspend user
export async function unsuspendUser(userId: string, notes?: string) {
  try {
    return await apiCall(`/admin/users/${userId}/unsuspend`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.error('Failed to unsuspend user:', error);
    throw error;
  }
}

// ============ REPORTING ============

// User: Get account statement
export async function getAccountStatement(startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return await apiCall(`/user/statement${params.toString() ? '?' + params.toString() : ''}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get account statement:', error);
    throw error;
  }
}

// User: Get transaction history
export async function getTransactionHistory(page?: number, limit?: number) {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    return await apiCall(`/user/transactions${params.toString() ? '?' + params.toString() : ''}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    throw error;
  }
}

// User: Export transactions as CSV
export async function exportTransactionsCSV(startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `${API_URL}/user/transactions/export${params.toString() ? '?' + params.toString() : ''}`;
    const token = getToken();
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Failed to export transactions');
    }
    return response.blob();
  } catch (error) {
    console.error('Failed to export transactions:', error);
    throw error;
  }
}

// Admin: Get all user transactions report
export async function getAllUserTransactionsReport(userId?: string, startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return await apiCall(`/admin/transactions/report${params.toString() ? '?' + params.toString() : ''}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get transactions report:', error);
    throw error;
  }
}

// Admin: Get dashboard report
export async function getDashboardReport() {
  try {
    return await apiCall(`/admin/dashboard/report`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Failed to get dashboard report:', error);
    throw error;
  }
}

// ============ CHART DATA (Live Data) ============

// Admin: Get daily transaction summary (last 7 days)
export async function getDailyTransactionSummary() {
  try {
    const response = await apiCall('/admin/analytics/daily-summary');
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch daily transaction summary:', error);
    return [];
  }
}

// Admin: Get KYC status breakdown
export async function getKycBreakdown() {
  try {
    const response = await apiCall('/admin/analytics/kyc-breakdown');
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch KYC breakdown:', error);
    return [];
  }
}


// User: Get spending by category
export async function getSpendingByCategory(period: number = 30) {
  try {
    const response = await apiCall(`/spending/categories?period=${period}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch spending by category:', error);
    return { categories: [] };
  }
}

// User: Get account balance trend
export async function getAccountBalanceTrend(days: number = 30) {
  try {
    const response = await apiCall('/account/balance-trend', {
      method: 'POST',
      body: JSON.stringify({ days })
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch balance trend:', error);
    return { trend: [] };
  }
}

// Fraud Detection: Get feature importance
export async function getFraudDetectionFeatureImportance() {
  try {
    const response = await apiCall('/fraud/stats');
    return response.featureImportance || [];
  } catch (error) {
    console.error('Failed to fetch feature importance:', error);
    return [];
  }
}

// Export api object for use in other components
export const api = {
  get: async (endpoint: string, options?: any) => {
    return apiCall(endpoint, { ...options, method: 'GET' });
  },
  post: async (endpoint: string, data?: any, options?: any) => {
    return apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  put: async (endpoint: string, data?: any, options?: any) => {
    return apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (endpoint: string, options?: any) => {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
  },
};
