# 🧪 Complete Application Testing Guide

Comprehensive testing procedures for both User and Admin sides of the Blockchain Banking application.

---

## 📋 Prerequisites

Before starting tests, ensure:
- ✅ MongoDB is running
- ✅ Backend seed scripts executed (admin, user, demo data)
- ✅ Backend server running: `npm run dev` (port 5000)
- ✅ Frontend server running: `npm run dev` (port 5173)
- ✅ Blockchain persistence enabled

**Test URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs
- Swagger UI: http://localhost:5000/api-docs

---

## 👤 SECTION 1: USER SIDE TESTING

### Test 1.1: User Landing Page
**Path:** `http://localhost:5173/`

**Tests:**
- [ ] Page loads without errors
- [ ] Navigation menu visible (Login, Signup, etc.)
- [ ] Features overview section displays
- [ ] "Get Started" button works
- [ ] Footer visible with links

**Expected:** Professional landing page with banking features highlighted

---

### Test 1.2: User Signup
**Path:** `http://localhost:5173/signup`

**Tests:**
- [ ] Signup form loads
- [ ] Name input accepts text
- [ ] Email input validates format
- [ ] Password fields with strength indicator
- [ ] Submit button works
- [ ] Creates new user account

**Try:**
```
Name: John Test
Email: john.test@example.com
Password: TestPass123
```

**Expected:** Account created, redirected to login or dashboard

---

### Test 1.3: User Login
**Path:** `http://localhost:5173/login`

**Tests:**
- [ ] Login form loads
- [ ] Email field accepts input
- [ ] Password field masks input
- [ ] Remember checkbox functional
- [ ] Submit button

**Login with demo credentials:**
```
Email: user@example.com
PIN/Password: 123456
```

**Expected:** Successfully logged in, redirected to dashboard

---

### Test 1.4: User Dashboard
**Path:** `http://localhost:5173/dashboard` (after login)

**Tests:**
- [ ] Dashboard loads
- [ ] Account balance displays: **₹98,300**
- [ ] Balance summary card visible
- [ ] Welcome message shows user name
- [ ] Logout button present

**Charts & Visualizations:**
- [ ] **Balance Trend Chart** - Line chart showing 30-day balance history
- [ ] **Spending by Category** - Bar chart with categories (groceries, utilities, etc.)
- [ ] **Recent Transactions** - Table with last 5-10 transactions

**Expected:** Dashboard with real data from seeded transactions

---

### Test 1.5: Transaction History
**Path:** `http://localhost:5173/transactions`

**Tests:**
- [ ] Transaction list loads
- [ ] Shows **13 total transactions** (5 deposits + 6 withdrawals + 2 transfers)
- [ ] Transactions display with:
  - [ ] Type (Deposit/Withdrawal/Transfer)
  - [ ] Amount
  - [ ] Date/Time
  - [ ] Status (Completed)
  - [ ] Description

**Filter & Search:**
- [ ] Filter by type (deposits, withdrawals)
- [ ] Sort by date
- [ ] Search by description

**Sample transactions visible:**
```
✓ Deposit: ₹50,000 (HDFC Bank Direct Deposit - Salary)
✓ Withdrawal: ₹5,000 (ATM - HDFC Bank)
✓ Transfer: ₹5,000 (Payment for services)
```

**Expected:** Complete transaction history with real data

---

### Test 1.6: Deposit Functionality
**Path:** `http://localhost:5173/deposit`

**Tests:**
- [ ] Deposit form loads
- [ ] Amount input accepts numbers
- [ ] Method dropdown shows options:
  - [ ] Bank Transfer
  - [ ] Direct Deposit
  - [ ] Check
  - [ ] Wire
  - [ ] Cash
- [ ] Description field works
- [ ] Submit button processes

**Try:**
```
Amount: 1000
Method: Bank Transfer
Description: Test Deposit
```

**Expected:** Deposit recorded in transaction history

---

### Test 1.7: Withdrawal Functionality
**Path:** `http://localhost:5173/withdraw`

**Tests:**
- [ ] Withdrawal form loads
- [ ] Amount input functional
- [ ] Method dropdown shows:
  - [ ] Bank Transfer
  - [ ] Check
  - [ ] Wire
  - [ ] ATM
- [ ] Destination field works
- [ ] Submit button processes

**Try:**
```
Amount: 500
Method: ATM
Destination: HDFC Bank
```

**Expected:** Withdrawal recorded and balance decreases

---

### Test 1.8: KYC Verification
**Path:** `http://localhost:5173/kyc`

**Tests:**
- [ ] KYC page loads
- [ ] Current status shows: **✓ Approved** (from seeded data)
- [ ] KYC details display:
  - [ ] Submission date
  - [ ] Approval date
  - [ ] Status badge
- [ ] Documents/approval proof visible

**Expected:** Shows approved KYC status

---

### Test 1.9: Fraud Detection Page
**Path:** `http://localhost:5173/fraud-detection`

**Tests:**
- [ ] Page loads
- [ ] **Feature Importance Chart** displays:
  - [ ] Amount: 95%
  - [ ] Frequency: 87%
  - [ ] Time: 72%
  - [ ] Device: 68%
  - [ ] Location: 61%
- [ ] Fraud analysis form functional
- [ ] Risk score calculation works

**Try Analyze:**
```
Amount: 50000
Recipient: Any account
Description: Large withdrawal
```

**Expected:** Shows fraud analysis with risk score

---

### Test 1.10: Credit Scoring Page
**Path:** `http://localhost:5173/credit-scoring`

**Tests:**
- [ ] Page loads
- [ ] **Credit Score Chart** displays 6 factors:
  - [ ] Income
  - [ ] Debt Ratio
  - [ ] Payment History
  - [ ] Age
  - [ ] Loan Activity
  - [ ] Account Activity
- [ ] Score out of 1000 displays
- [ ] Grade shows (Excellent, Good, Fair, Poor)

**Expected:** Shows credit analysis with 6-factor breakdown

---

### Test 1.11: Spending Analysis Page
**Path:** `http://localhost:5173/spending-analysis`

**Tests:**
- [ ] Page loads
- [ ] **Spending by Category** chart shows:
  - [ ] Groceries
  - [ ] Utilities
  - [ ] Entertainment
  - [ ] Shopping
  - [ ] Dining
- [ ] **Trends Chart** shows daily spending
- [ ] Period selector works (week, month, quarter)
- [ ] Total spending calculated

**Expected:** Detailed spending breakdown from transaction data

---

### Test 1.12: AI Insights Page
**Path:** `http://localhost:5173/ai-insights`

**Tests:**
- [ ] Page loads
- [ ] AI-powered insights display
- [ ] Recommendations shown
- [ ] Charts and analysis visible

**Expected:** AI-generated financial insights

---

### Test 1.13: AI Chatbot
**Path:** `http://localhost:5173/chatbot`

**Tests:**
- [ ] Chatbot window opens
- [ ] Input message field works
- [ ] Send button functional
- [ ] Bot responds to messages
- [ ] Chat history displays

**Try:**
```
Message: "What is my account balance?"
Message: "Show me my recent transactions"
Message: "How is my credit score?"
```

**Expected:** Chatbot responds with relevant information

---

## 👨‍💼 SECTION 2: ADMIN SIDE TESTING

### Test 2.1: Admin Landing Page
**Path:** `http://localhost:5173/admin/login`

**Tests:**
- [ ] Admin login page loads
- [ ] Email field accepts input
- [ ] Password field works
- [ ] Submit button functional

**Login with admin credentials:**
```
Email: admin@example.com
Password: Admin@123
```

**Expected:** Admin logged in, redirected to admin dashboard

---

### Test 2.2: Admin Dashboard
**Path:** `http://localhost:5173/admin/dashboard`

**Tests:**
- [ ] Dashboard loads with admin data
- [ ] **Key Statistics Display:**
  - [ ] Total Users: Shows count
  - [ ] Total Accounts: Shows count
  - [ ] KYC Pending: Shows pending count
  - [ ] KYC Approved: Shows approved count
  - [ ] Total Deposits: ₹130,000
  - [ ] Total Withdrawals: ₹29,200
  - [ ] Active Users: Shows count

**Charts:**
- [ ] **Daily Transaction Summary** - 7-day trend chart
  - [ ] Shows deposits vs withdrawals by day
  - [ ] Data aggregated from transaction history
- [ ] **KYC Status** - Pie chart
  - [ ] Approved: percentage
  - [ ] Pending: percentage
  - [ ] Rejected: percentage
- [ ] **User Growth** - Line chart

**Expected:** Admin sees complete system overview

---

### Test 2.3: Admin Analytics & Reports
**Path:** `http://localhost:5173/admin/dashboard` (Analytics section)

**Tests:**
- [ ] Revenue metrics display
- [ ] User engagement stats
- [ ] Transaction volume charts
- [ ] Growth trends visible
- [ ] Export options available

**Expected:** Comprehensive analytics dashboard

---

### Test 2.4: KYC Management
**Path:** `http://localhost:5173/admin/dashboard` (KYC section)

**Tests:**
- [ ] KYC requests list loads
- [ ] Shows pending KYC submissions
- [ ] Each request shows:
  - [ ] User name
  - [ ] Email
  - [ ] Submission date
  - [ ] Status

**For newly created users (from Test 1.2):**
- [ ] Can see their pending KYC
- [ ] Can view details
- [ ] Can approve KYC
- [ ] Can reject with remarks
- [ ] Can view documents

**Try Actions:**
- [ ] Click "View Details"
- [ ] Click "Approve"
- [ ] Add remarks: "Documents verified"
- [ ] Click confirm

**Expected:** KYC approval updates, user sees approved status

---

### Test 2.5: User Management
**Path:** `http://localhost:5173/admin/dashboard` (Users section)

**Tests:**
- [ ] User list displays all users
- [ ] Shows user:
  - [ ] Name
  - [ ] Email
  - [ ] Account status
  - [ ] KYC status
  - [ ] Registration date
- [ ] Can search users
- [ ] Can filter by status
- [ ] View user details
- [ ] Can view user transactions

**Try:**
- [ ] Search for "user@example.com"
- [ ] Should show demo user with 13 transactions
- [ ] Can see account balance: ₹98,300

**Expected:** All users and their details visible

---

### Test 2.6: Transaction Monitoring
**Path:** Admin dashboard (Transactions section)

**Tests:**
- [ ] All transactions visible (13 total)
- [ ] Sort by date, amount, type
- [ ] Filter by status
- [ ] View transaction details:
  - [ ] From/To accounts
  - [ ] Amount
  - [ ] Date/Time
  - [ ] Status
  - [ ] Description
- [ ] View blockchain verification (if recorded)

**Expected:** Complete transaction audit trail

---

### Test 2.7: Fraud Monitoring
**Path:** Admin fraud/security section

**Tests:**
- [ ] Flagged transactions display
- [ ] Fraud alerts visible
- [ ] Blocked transactions show
- [ ] Risk scores for each transaction
- [ ] Feature importance analysis shows:
  - [ ] Amount
  - [ ] Frequency
  - [ ] Time
  - [ ] Device
  - [ ] Location

**Expected:** Real-time fraud monitoring dashboard

---

### Test 2.8: Blockchain Ledger (Admin)
**Path:** Admin dashboard (Blockchain section)

**Tests:**
- [ ] Blockchain stats display:
  - [ ] Total blocks
  - [ ] Total transactions
  - [ ] Ledger size
  - [ ] Mode: **PERSISTENT (MongoDB)**
- [ ] Can view blockchain ledger
- [ ] Each block shows:
  - [ ] Block number
  - [ ] Hash (SHA-256)
  - [ ] Timestamp
  - [ ] Transaction data
- [ ] Can verify block integrity:
  - [ ] Click "Verify"
  - [ ] Shows hash comparison
  - [ ] Confirms "Block integrity confirmed ✅"

**Expected:** Full blockchain transparency with verification

---

### Test 2.9: Admin Settings
**Path:** Admin settings page

**Tests:**
- [ ] Settings page loads
- [ ] Can update:
  - [ ] Email preferences
  - [ ] Notification settings
  - [ ] Security settings
- [ ] Two-factor authentication option
- [ ] Audit log visible

**Expected:** Settings and configuration options

---

### Test 2.10: Admin Logout
**Path:** Admin dashboard

**Tests:**
- [ ] Click logout button
- [ ] Redirected to login
- [ ] Session cleared
- [ ] Cannot access dashboard without re-login

**Expected:** Secure logout

---

## 🔌 SECTION 3: API TESTING

### Test 3.1: API Documentation
**URL:** `http://localhost:5000/api-docs`

**Tests:**
- [ ] Swagger UI loads
- [ ] All 50+ endpoints listed
- [ ] Can expand endpoints
- [ ] Request/response examples visible

**Expected:** Complete API documentation in Swagger

---

### Test 3.2: Health Check
**Endpoint:** `GET http://localhost:5000/api/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

- [ ] Returns 200 OK
- [ ] Message confirms running

---

### Test 3.3: User Authentication APIs
**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

- [ ] Returns JWT token
- [ ] Token valid for 7 days
- [ ] Can use token for authenticated requests

---

### Test 3.4: Account Balance API
**Endpoint:** `GET http://localhost:5000/api/account/balance`
**Headers:** `Authorization: Bearer {JWT_TOKEN}`

**Expected Response:**
```json
{
  "success": true,
  "balance": 98300,
  "currency": "INR"
}
```

- [ ] Returns correct balance: **₹98,300**

---

### Test 3.5: Transaction History API
**Endpoint:** `GET http://localhost:5000/api/transactions?limit=10`
**Headers:** `Authorization: Bearer {JWT_TOKEN}`

**Expected:** Returns array with 13 transactions
- [ ] Includes deposits
- [ ] Includes withdrawals
- [ ] Includes transfers
- [ ] Each has amount, date, status

---

### Test 3.6: Daily Transaction Summary (Admin)
**Endpoint:** `GET http://localhost:5000/api/admin/analytics/daily-summary`
**Headers:** `Authorization: Bearer {ADMIN_JWT_TOKEN}`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "day": "Monday", "deposits": 50000, "withdrawals": 5000 },
    { "day": "Tuesday", "deposits": 0, "withdrawals": 2000 },
    ...
  ]
}
```

- [ ] Returns 7-day summary
- [ ] Numbers match seeded data

---

### Test 3.7: Fraud Detection API
**Endpoint:** `GET http://localhost:5000/api/fraud/stats`
**Headers:** `Authorization: Bearer {JWT_TOKEN}`

**Expected Response:**
```json
{
  "success": true,
  "accuracy": 0.962,
  "featureImportance": [
    { "feature": "Amount", "importance": 0.95 },
    { "feature": "Frequency", "importance": 0.87 },
    ...
  ]
}
```

- [ ] Returns 96.2% accuracy
- [ ] Shows 5 feature importances

---

### Test 3.8: Credit Scoring API
**Endpoint:** `GET http://localhost:5000/api/credit/score`
**Headers:** `Authorization: Bearer {JWT_TOKEN}`

**Expected Response:**
```json
{
  "success": true,
  "score": 725,
  "maxScore": 1000,
  "grade": "Good",
  "factors": [...]
}
```

- [ ] Returns credit score
- [ ] Shows grade (Excellent, Good, Fair, Poor)

---

### Test 3.9: Blockchain Record API
**Endpoint:** `POST http://localhost:5000/api/blockchain/record-transaction`
**Headers:** `Authorization: Bearer {JWT_TOKEN}`

**Request:**
```json
{
  "from": "ACC001",
  "to": "ACC002",
  "amount": 1000,
  "txType": "transfer",
  "details": { "narration": "Test" }
}
```

**Expected Response:**
```json
{
  "success": true,
  "blockchainHash": "...",
  "blockNumber": 1,
  "persistent": true,
  "message": "Transaction recorded at block 1 (persisted)"
}
```

- [ ] Records on blockchain
- [ ] Returns SHA-256 hash
- [ ] Data persisted to MongoDB

---

### Test 3.10: Blockchain Ledger API
**Endpoint:** `GET http://localhost:5000/api/blockchain/ledger`
**Headers:** `Authorization: Bearer {ADMIN_JWT_TOKEN}`

**Expected:** Returns full blockchain ledger with all blocks
- [ ] Contains all recorded transactions
- [ ] Each block has hash and timestamp
- [ ] Data persistent across server restarts

---

## 📊 SECTION 4: DATA INTEGRITY TESTS

### Test 4.1: Balance Calculation
**Tests:**
- [ ] Calculate: Starting balance + Deposits - Withdrawals - Transfers
- [ ] Expected: 5000 + 130000 - 29200 - 7500 = 98,300
- [ ] Verify dashboard balance matches: **✓ 98,300**

---

### Test 4.2: Transaction Count
**Tests:**
- [ ] Deposits: 5
- [ ] Withdrawals: 6
- [ ] Transfers: 2
- [ ] **Total: 13 transactions** ✓

---

### Test 4.3: Database Verification
**Tests:**
- [ ] All collections populated:
  - [ ] Users: ≥2 (demo + admin)
  - [ ] Accounts: ≥2
  - [ ] Deposits: 5
  - [ ] Withdrawals: 6
  - [ ] Transfers: 2
  - [ ] KYC: ≥2
- [ ] No orphaned records
- [ ] Foreign key relationships intact

---

### Test 4.4: Blockchain Integrity (MongoDB)
**Tests:**
- [ ] Blockchain ledger stored in MongoDB
- [ ] Mode: **PERSISTENT (MongoDB)**
- [ ] Data survives server restart
- [ ] Can query ledger from DB

**To verify:**
1. Record a blockchain transaction
2. Restart backend server
3. Query ledger - transaction still there ✓

---

## ✅ SECTION 5: PERMISSION & SECURITY TESTS

### Test 5.1: Authentication Required
**Tests:**
- [ ] Cannot access dashboard without login
- [ ] Cannot access admin without admin token
- [ ] Invalid token rejected
- [ ] Expired token requires re-login

---

### Test 5.2: Authorization (User)
**Tests:**
- [ ] Regular user cannot access admin panel
- [ ] Can only see own transactions
- [ ] Cannot modify other users' data
- [ ] Cannot process KYC approvals

---

### Test 5.3: Authorization (Admin)
**Tests:**
- [ ] Admin can view all users
- [ ] Admin can approve/reject KYC
- [ ] Admin can view system analytics
- [ ] Admin can access blockchain ledger
- [ ] Admin cannot login as regular user account (should deny)

---

## 🔄 SECTION 6: WORKFLOW TESTS

### Test 6.1: Complete User Signup-to-Dashboard Workflow
1. [ ] Sign up with new email
2. [ ] Verify account created
3. [ ] Login with new credentials
4. [ ] See dashboard
5. [ ] Submit KYC (see Test 1.8)
6. [ ] Admin approves KYC (see Test 2.4)
7. [ ] User sees approved status

---

### Test 6.2: Complete Admin KYC Approval Workflow
1. [ ] Admin login
2. [ ] Go to KYC section
3. [ ] See pending request
4. [ ] Click view details
5. [ ] Review information
6. [ ] Click approve
7. [ ] Add remarks
8. [ ] User receives approval
9. [ ] Dashboard updates

---

### Test 6.3: Fraud Detection Workflow
1. [ ] User makes large transaction
2. [ ] System analyzes fraud risk
3. [ ] Shows risk score
4. [ ] Blockchain records if approved
5. [ ] Admin sees in monitoring dashboard

---

## 🎯 SECTION 7: PERFORMANCE TESTS

### Test 7.1: Page Load Times
- [ ] Landing page: < 2 seconds
- [ ] Dashboard: < 3 seconds
- [ ] Transaction history: < 2 seconds
- [ ] Admin dashboard: < 3 seconds

### Test 7.2: API Response Times
- [ ] Login: < 500ms
- [ ] Get balance: < 200ms
- [ ] Transaction history: < 500ms
- [ ] Analytics: < 1000ms

### Test 7.3: Chart Rendering
- [ ] Charts load with data
- [ ] Interactive features work
- [ ] Responsive on different screen sizes

---

## 📋 FINAL CHECKLIST

**Core Features:**
- [ ] User registration & login
- [ ] Dashboard with charts & real data
- [ ] Transaction history (deposits, withdrawals, transfers)
- [ ] KYC submission & approval workflow
- [ ] Fraud detection with ML
- [ ] Credit scoring with ML
- [ ] Spending analytics
- [ ] Blockchain transaction recording & verification
- [ ] Admin panel with full control
- [ ] 50+ API endpoints working

**Data:**
- [ ] 13 demo transactions loaded
- [ ] Demo account balance: ₹98,300
- [ ] Admin account functional
- [ ] All users visible to admin
- [ ] Data persists across restarts

**Security:**
- [ ] Authentication working (JWT)
- [ ] Authorization enforced (user vs admin)
- [ ] KYC approval workflow
- [ ] Blockchain integrity verified

**Advanced Features:**
- [ ] Blockchain persistence (MongoDB)
- [ ] ML fraud detection (96.2% accuracy)
- [ ] ML credit scoring (96.2% accuracy)
- [ ] AI chatbot functional
- [ ] Email notifications ready
- [ ] Swagger API docs available

---

## 🐛 Common Issues & Solutions

**Issue: Dashboard shows no data**
- Solution: Verify `npm run seed:demo` completed
- Check MongoDB is running
- Verify API endpoints returning data

**Issue: Charts not loading**
- Solution: Check browser console for errors
- Verify API endpoints in `/api-docs`
- Check network tab in DevTools

**Issue: Login fails**
- Solution: Verify user created with seed script
- Check email/password case-sensitive
- Clear browser cache

**Issue: Admin can't see users**
- Solution: Verify admin JWT token used
- Check `adminProtect` middleware applied
- Verify user has `isAdmin: true`

**Issue: KYC not updating**
- Solution: Verify MongoDB connection
- Check KYC model schema
- Verify admin approval endpoint working

**Issue: Blockchain data lost on restart**
- Solution: Verify persistence enabled in `index.js`
- Check `initBlockchain(true)` parameter
- Verify `blockchainServiceWithPersistence.js` imported

---

## 🎉 Success Criteria

✅ **All tests pass when:**
- Landing page loads
- Users can signup & login
- Dashboard shows real transaction data
- All 13 transactions visible in history
- Charts display with real data
- KYC workflow complete (submit → approve)
- Admin sees all users & transactions
- Blockchain records & persists transactions
- Fraud detection analyzes transactions
- Credit scoring calculates correctly
- 50+ API endpoints functional
- All role-based permissions enforced

**Your system is PRODUCTION READY when all sections pass! 🚀**

---

**Testing Date:** February 26, 2026
**Version:** 1.0
**Status:** Comprehensive Test Suite Ready
