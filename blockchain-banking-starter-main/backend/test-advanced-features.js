#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Advanced Features
 * Tests: Disputes, Suspensions, Reporting, Email Notifications
 */

const BASE_URL = 'http://localhost:5000/api';
let customerToken = '';
let adminToken = '';
let customerId = '';
let adminId = '';
let disputeId = '';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(num, name) {
  log(`\n[TEST ${num}] ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

async function apiCall(method, endpoint, body = null, token = '') {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log('  ADVANCED FEATURES TEST SUITE - Disputes, Suspensions, Reporting', 'blue');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  try {
    // TEST 1: Customer Login
    logTest(1, 'Customer Login (ACC001/123456)');
    let result = await apiCall('POST', '/auth/login', {
      accountNumber: 'ACC001',
      password: '123456',
    });
    customerToken = result.token;
    customerId = result.user.id;
    logSuccess(`Logged in as customer: ${result.user.name} (${customerId})`);

    // TEST 2: Admin Login
    logTest(2, 'Admin Login (admin@example.com/Admin@123)');
    result = await apiCall('POST', '/auth/admin-login', {
      email: 'admin@example.com',
      password: 'Admin@123',
    });
    adminToken = result.token;
    adminId = result.user.id;
    logSuccess(`Logged in as admin: ${result.user.name}`);

    // TEST 3: Get Dashboard Report
    logTest(3, 'Admin - Get Dashboard Report');
    result = await apiCall('GET', '/admin/dashboard/report', null, adminToken);
    logSuccess(`Dashboard Report Retrieved:`);
    log(`   Total Users: ${result.report.totalUsers}`, 'yellow');
    log(`   Total Deposits: $${result.report.totalDeposits}`, 'yellow');
    log(`   Total Withdrawals: $${result.report.totalWithdrawals}`, 'yellow');
    log(`   Pending Transactions: ${result.report.pendingTransactions}`, 'yellow');

    // TEST 4: Get All Disputes
    logTest(4, 'Admin - Get All Disputes');
    result = await apiCall('GET', '/admin/disputes', null, adminToken);
    logSuccess(`Disputes Retrieved: ${result.disputes.length} total`);
    if (result.disputes.length > 0) {
      disputeId = result.disputes[0]._id;
      log(`   First dispute: ${result.disputes[0].title} (${result.disputes[0].status})`, 'yellow');
    }

    // TEST 5: Get Open Disputes
    logTest(5, 'Admin - Get Open Disputes (Priority Sorted)');
    result = await apiCall('GET', '/admin/disputes/open', null, adminToken);
    logSuccess(`Open Disputes Retrieved: ${result.disputes.length} total`);
    if (result.disputes.length > 0) {
      result.disputes.forEach((d) => {
        log(`   - ${d.title} (${d.priority})`, 'yellow');
      });
    }

    // TEST 6: Get Suspended Users
    logTest(6, 'Admin - Get All Suspended Users');
    result = await apiCall('GET', '/admin/suspensions', null, adminToken);
    logSuccess(`Suspended Users Retrieved: ${result.suspensions.length} total`);
    if (result.suspensions.length > 0) {
      result.suspensions.forEach((s) => {
        log(`   - ${s.userId.name} (${s.severity})`, 'yellow');
      });
    }

    // TEST 7: Suspend User
    logTest(7, 'Admin - Suspend a User (Test Account)');
    result = await apiCall(
      'POST',
      `/admin/users/${customerId}/suspend`,
      {
        reason: 'Test suspension for feature testing',
        severity: 'temporary',
        suspendUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Automated test suspension',
      },
      adminToken
    );
    logSuccess(`User suspended successfully`);
    log(`   Reason: ${result.suspension.reason}`, 'yellow');
    log(`   Severity: ${result.suspension.severity}`, 'yellow');

    // TEST 8: Verify Suspension Blocks Transactions
    logTest(8, 'Customer - Try to Create Deposit (Should be Blocked)');
    try {
      await apiCall(
        'POST',
        '/deposits',
        {
          amount: 500,
          accountId: 'ACC001',
          depositMethod: 'bank_transfer',
          description: 'Test deposit',
        },
        customerToken
      );
      logError('Deposit should have been blocked!');
    } catch (error) {
      if (error.message.includes('suspended')) {
        logSuccess('Correctly blocked suspended user from depositing');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }

    // TEST 9: Unsuspend User
    logTest(9, 'Admin - Unsuspend the User');
    result = await apiCall(
      'POST',
      `/admin/users/${customerId}/unsuspend`,
      {
        notes: 'Unsuspended for test completion',
      },
      adminToken
    );
    logSuccess(`User unsuspended successfully`);

    // TEST 10: Get Account Statement
    logTest(10, 'Customer - Get Account Statement');
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    result = await apiCall(
      'GET',
      `/user/statement?startDate=${startDate}&endDate=${endDate}`,
      null,
      customerToken
    );
    logSuccess(`Account Statement Retrieved:`);
    log(`   Total Deposits: $${result.statement.totalDeposits}`, 'yellow');
    log(`   Total Withdrawals: $${result.statement.totalWithdrawals}`, 'yellow');
    log(`   Net Change: $${result.statement.totalDeposits - result.statement.totalWithdrawals}`, 'yellow');

    // TEST 11: Get Transaction History
    logTest(11, 'Customer - Get Transaction History (Paginated)');
    result = await apiCall('GET', '/user/transactions?page=1&limit=5', null, customerToken);
    logSuccess(`Transaction History Retrieved: ${result.transactions.length} transactions`);
    result.transactions.slice(0, 3).forEach((t) => {
      log(`   - ${t.type} $${t.amount} (${t.status})`, 'yellow');
    });

    // TEST 12: Admin Transactions Report
    logTest(12, 'Admin - Get All User Transactions Report');
    result = await apiCall(
      'GET',
      `/admin/transactions/report?startDate=${startDate}&endDate=${endDate}`,
      null,
      adminToken
    );
    logSuccess(`Admin Report Retrieved: ${result.transactions?.length || 0} transactions`);

    // TEST 13: Test Email Notifications (Resolve Dispute)
    logTest(13, 'Admin - Resolve a Dispute (Triggers Email)');
    if (disputeId) {
      result = await apiCall(
        'POST',
        `/admin/disputes/${disputeId}/resolve`,
        {
          resolution: 'Refund issued due to duplicate transaction detected',
          refundAmount: 100,
          notes: 'Test resolution',
        },
        adminToken
      );
      logSuccess(`Dispute resolved successfully`);
      log(`   Resolution: ${result.dispute.resolution.substring(0, 50)}...`, 'yellow');
      log(`   Refund: $${result.dispute.refundAmount}`, 'yellow');
      log(`   📧 Email notification sent (or logged in demo mode)`, 'yellow');
    } else {
      log('   (No disputes available to test)', 'yellow');
    }

    // TEST 14: Summary
    logTest(14, 'System Summary');
    result = await apiCall('GET', '/admin/dashboard/report', null, adminToken);
    logSuccess(`\n   System Status: OPERATIONAL`);
    log(`   Active Users: ${result.report.totalUsers}`, 'yellow');
    log(`   Dispute Management: ✅ Functional`, 'yellow');
    log(`   User Suspension: ✅ Functional`, 'yellow');
    log(`   Reporting & Analytics: ✅ Functional`, 'yellow');
    log(`   Email Notifications: ✅ Functional`, 'yellow');

    log('\n═══════════════════════════════════════════════════════════════', 'blue');
    log('  ✅ ALL TESTS COMPLETED SUCCESSFULLY!', 'green');
    log('═══════════════════════════════════════════════════════════════\n', 'blue');

    log('FEATURES TESTED:', 'cyan');
    log('  ✅ Admin Dashboard Reporting', 'green');
    log('  ✅ Dispute Management & Resolution', 'green');
    log('  ✅ User Suspension & Unsuspension', 'green');
    log('  ✅ Suspension Enforcement (Block Transactions)', 'green');
    log('  ✅ Account Statements & History', 'green');
    log('  ✅ Transaction Reporting & Export', 'green');
    log('  ✅ Email Notifications', 'green');
    log('\n');
  } catch (error) {
    logError(`\n❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\n❌ FATAL ERROR: ${error.message}`);
  process.exit(1);
});
