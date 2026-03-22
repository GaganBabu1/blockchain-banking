# Blockchain Banking API Documentation

Complete REST API endpoints for the Blockchain Banking System.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require:

```
Authorization: Bearer {JWT_TOKEN}
```

JWT tokens are obtained via login and valid for 7 days.

---

## 1. Authentication Endpoints (`/auth`)

### Register User
**POST** `/auth/register`

Create a new user account.

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User
**POST** `/auth/login`

Authenticate user and get JWT token.

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Admin Login
**POST** `/auth/admin-login`

Authenticate admin user (isAdmin must be true in database).

```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

---

## 2. Account Endpoints (`/account`)

### Get Account Balance
**GET** `/account/balance`

Get current account balance.

**Response (200):**
```json
{
  "success": true,
  "balance": 5000,
  "currency": "INR"
}
```

### Get Account Details
**GET** `/account/details`

Get full account information.

**Response (200):**
```json
{
  "success": true,
  "account": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACC001",
    "accountType": "Savings",
    "balance": 5000,
    "walletBlockchainBalance": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Balance Trend
**POST** `/account/balance-trend`

Get account balance over specified number of days (for chart visualization).

**Request Body:**
```json
{
  "days": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "day": "2024-01-15",
      "balance": 5000
    },
    {
      "day": "2024-01-16",
      "balance": 5500
    },
    {
      "day": "2024-01-17",
      "balance": 4800
    }
  ]
}
```

---

## 3. Transaction Endpoints (`/transactions`)

### Deposit Money
**POST** `/transactions/deposit`

Record a deposit transaction.

```json
{
  "amount": 1000,
  "description": "Salary deposit"
}
```

**Response (201):**
```json
{
  "success": true,
  "transaction": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "type": "deposit",
    "amount": 1000,
    "status": "completed",
    "createdAt": "2024-01-17T15:45:00Z"
  }
}
```

### Withdraw Money
**POST** `/transactions/withdraw`

Record a withdrawal transaction.

```json
{
  "amount": 500,
  "description": "ATM withdrawal"
}
```

**Response (201):** Similar to deposit

### Get Transaction History
**GET** `/transactions?limit=10&skip=0`

Get user's transaction history.

**Response (200):**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "type": "deposit",
      "amount": 1000,
      "status": "completed",
      "createdAt": "2024-01-17T15:45:00Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "skip": 0
}
```

---

## 4. Spending Analytics Endpoints (`/spending-analytics`)

### Get Spending by Category
**GET** `/spending-analytics/categories?period=month`

Get spending breakdown by category (for dashboard charts).

**Query Parameters:**
- `period`: `week`, `month`, `quarter`, `year` (default: `month`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "category": "groceries",
      "amount": 2500,
      "percentage": 25
    },
    {
      "category": "utilities",
      "amount": 1500,
      "percentage": 15
    },
    {
      "category": "entertainment",
      "amount": 1000,
      "percentage": 10
    }
  ],
  "totalSpending": 10000,
  "period": "month"
}
```

### Get Spending Trends
**GET** `/spending-analytics/trends?days=30`

Get spending trends over time.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "amount": 500
    },
    {
      "date": "2024-01-16",
      "amount": 750
    }
  ]
}
```

---

## 5. Fraud Detection Endpoints (`/fraud`)

### Analyze Transaction
**POST** `/fraud/analyze`

Check if a transaction is suspicious.

```json
{
  "amount": 50000,
  "recipient": "ACC002",
  "description": "Large transfer"
}
```

**Response (200):**
```json
{
  "success": true,
  "riskScore": 0.45,
  "isSuspicious": false,
  "factors": [
    {
      "factor": "amount",
      "score": 0.8,
      "reason": "Unusually high"
    },
    {
      "factor": "frequency",
      "score": 0.3,
      "reason": "Normal activity"
    }
  ]
}
```

### Get Fraud Statistics
**GET** `/fraud/stats`

Get fraud detection model statistics and feature importance.

**Response (200):**
```json
{
  "success": true,
  "accuracy": 0.962,
  "featureImportance": [
    {
      "feature": "Amount",
      "importance": 0.95,
      "name": "Transaction Amount"
    },
    {
      "feature": "Frequency",
      "importance": 0.87,
      "name": "Transaction Frequency"
    },
    {
      "feature": "Time",
      "importance": 0.72,
      "name": "Transaction Time"
    },
    {
      "feature": "Device",
      "importance": 0.68,
      "name": "Device Information"
    },
    {
      "feature": "Location",
      "importance": 0.61,
      "name": "Transaction Location"
    }
  ],
  "fraudAlerts": 3,
  "blockedTransactions": 1
}
```

---

## 6. Credit Scoring Endpoints (`/credit`)

### Get Credit Score
**GET** `/credit/score`

Get user's credit score based on ML analysis.

**Response (200):**
```json
{
  "success": true,
  "score": 725,
  "maxScore": 1000,
  "grade": "Good",
  "factors": [
    {
      "factor": "Income",
      "score": 0.85,
      "impact": "positive"
    },
    {
      "factor": "Debt Ratio",
      "score": 0.65,
      "impact": "negative"
    }
  ]
}
```

### Get Credit Analysis
**GET** `/credit/analysis`

Detailed credit analysis with recommendations.

**Response (200):**
```json
{
  "success": true,
  "analysis": {
    "score": 725,
    "grade": "Good",
    "factors": [
      {
        "name": "Income",
        "score": 0.85,
        "weight": 0.2
      },
      {
        "name": "Debt Ratio",
        "score": 0.65,
        "weight": 0.25
      },
      {
        "name": "Payment History",
        "score": 0.9,
        "weight": 0.3
      },
      {
        "name": "Age",
        "score": 0.7,
        "weight": 0.1
      },
      {
        "name": "Loan Activity",
        "score": 0.8,
        "weight": 0.1
      },
      {
        "name": "Account Activity",
        "score": 0.75,
        "weight": 0.05
      }
    ]
  }
}
```

---

## 7. Admin Endpoints (`/admin`)

### Get Daily Transaction Summary
**GET** `/admin/analytics/daily-summary`

Get transaction summary for the last 7 days (for admin dashboard chart).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "day": "Monday",
      "deposits": 25000,
      "withdrawals": 15000
    },
    {
      "day": "Tuesday",
      "deposits": 30000,
      "withdrawals": 20000
    }
  ],
  "totalDeposits": 175000,
  "totalWithdrawals": 120000
}
```

### Get Admin Statistics
**GET** `/admin/stats`

Get comprehensive admin statistics.

**Response (200):**
```json
{
  "success": true,
  "totalUsers": 150,
  "totalAccounts": 150,
  "kycPending": 45,
  "kycApproved": 100,
  "kycRejected": 5,
  "totalDeposits": 2500000,
  "totalWithdrawals": 1800000,
  "activeUsers": 75
}
```

### Get KYC Requests
**GET** `/admin/kyc-requests?status=pending`

Get KYC verification requests.

**Query Parameters:**
- `status`: `pending`, `approved`, `rejected`

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439011",
      "userName": "John Doe",
      "email": "john@example.com",
      "status": "pending",
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45
}
```

### Approve KYC
**PUT** `/admin/kyc/:id`

Approve or reject KYC request.

```json
{
  "status": "approved",
  "remarks": "Documents verified"
}
```

---

## 8. Blockchain Endpoints (`/blockchain`)

### Record Transaction
**POST** `/blockchain/record-transaction`

Record a transaction on the blockchain ledger.

```json
{
  "from": "ACC001",
  "to": "ACC002",
  "amount": 5000,
  "txType": "transfer",
  "details": {
    "narration": "Payment for services"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "blockchainHash": "3e4a7c8f9f2d1b5e6c8a9d0f1e2c3b4a5e6f7g8h9i0j1k2l3m4n5o6p7q8r",
  "blockNumber": 15,
  "timestamp": "2024-01-17T15:45:00Z",
  "confirmed": true,
  "message": "Transaction recorded at block 15"
}
```

### Verify Transaction
**GET** `/blockchain/verify/:blockNumber`

Verify a specific block's integrity.

**Response (200):**
```json
{
  "success": true,
  "verified": true,
  "block": {
    "blockNumber": 15,
    "hash": "3e4a7c8f9f2d1b5e6c8a9d0f1e2c3b4a5e6f7g8h9i0j1k2l3m4n5o6p7q8r",
    "timestamp": "2024-01-17T15:45:00Z"
  },
  "message": "Block integrity confirmed ✅"
}
```

### Get Blockchain Ledger
**GET** `/blockchain/ledger`

Get all blocks in the blockchain.

**Response (200):**
```json
{
  "success": true,
  "ledger": [
    {
      "blockNumber": 1,
      "hash": "...",
      "timestamp": "2024-01-17T10:00:00Z",
      "data": {
        "from": "ACC001",
        "to": "ACC002",
        "amount": 1000,
        "type": "transfer"
      }
    }
  ]
}
```

### Get Blockchain Stats
**GET** `/blockchain/stats`

Get blockchain statistics.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalBlocks": 127,
    "totalTransactions": 127,
    "ledgerSize": "45230 bytes",
    "mode": "DEMO (In-Memory)",
    "persistent": false,
    "description": "Demo blockchain - data lost on server restart"
  }
}
```

---

## 9. KYC Endpoints (`/kyc`)

### Submit KYC
**POST** `/kyc/submit`

Submit KYC documents.

```json
{
  "documentType": "aadhar",
  "documentNumber": "123456789012",
  "fullName": "John Doe",
  "dob": "1990-01-15",
  "address": "123 Main St, City"
}
```

### Get KYC Status
**GET** `/kyc/status`

Get current KYC status.

**Response (200):**
```json
{
  "success": true,
  "status": "approved",
  "submittedAt": "2024-01-15T10:30:00Z",
  "approvedAt": "2024-01-16T14:22:00Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (Missing/Invalid fields)
- `401`: Unauthorized (Missing/Invalid token)
- `403`: Forbidden (Not authorized for this action)
- `404`: Not Found
- `500`: Server Error

---

## Rate Limiting

To prevent abuse, the API implements rate limiting:
- **Regular Users**: 100 requests per hour
- **Admin Users**: 1000 requests per hour

Rate limit headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1705503600
```

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Get Account Balance (with token)
curl -X GET http://localhost:5000/api/account/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the collection from `/backend/postman-collection.json`
2. Set environment variable: `BASE_URL=http://localhost:5000/api`
3. Run requests in sequence (Register → Login → Account → Transactions)

### Using REST Client (VS Code)

Create `requests.rest` file:
```rest
@baseUrl = http://localhost:5000/api

### Register
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

---

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:5000/api-docs
```

Use Swagger UI to test all endpoints directly from the browser.

---

## Support & Troubleshooting

**Issue: "Unauthorized" (401)**
- Ensure token is included in Authorization header
- Check token expiration (token valid for 7 days)
- Login again to get a fresh token

**Issue: "Not Found" (404)**
- Check resource ID exists in database
- Verify correct endpoint path

**Issue: "Server Error" (500)**
- Check MongoDB connection
- Check server logs for details
- Ensure all environment variables are set

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2024 | Initial release with 50+ endpoints |
| 1.1 | Jan 2024 | Added blockchain, fraud detection, credit scoring |
| 1.2 | Jan 2024 | Added spending analytics & chart endpoints |

---

**Last Updated**: January 2024
**API Status**: Active & Tested ✅
