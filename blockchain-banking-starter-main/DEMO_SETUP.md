# Demo Setup Guide

Complete instructions for setting up and running the Blockchain Banking demo.

## ⚡ Quick Start (5 Minutes)

### 1. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed:admin    # Create admin account
npm run seed:user     # Create demo user
npm run dev          # Start server
```

### 3. Setup Frontend
```bash
cd ..
npm install
npm run dev
```

### 4. Access the App
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

---

## Demo Accounts

Two accounts are created by the seeding scripts:

### 👤 Regular User Account

**Account Type**: Regular Banking User
**Email**: `user@example.com`
**PIN/Password**: `123456`
**Account Number**: `ACC001`
**Starting Balance**: ₹5,000
**KYC Status**: Not submitted

**Use for:**
- Testing user login & dashboard
- Deposit/withdrawal transactions
- KYC submission
- Viewing transaction history
- Fraud detection analysis

### 👨‍💼 Admin Account

**Account Type**: Bank Administrator
**Email**: `admin@example.com`
**Password**: `Admin@123`
**Account Number**: `ADMIN001`
**Balance**: ₹0 (Admin account)
**KYC Status**: Approved

**Use for:**
- Admin login
- KYC request management (approve/reject)
- View all users & transactions
- Analytics & statistics
- Blockchain ledger verification
- Fraud monitoring dashboard

---

## Setup Process Details

### Option 1: Automatic Seeding (Recommended)

The seed scripts automatically create demo accounts:

```bash
# In backend directory
npm run seed:admin    # Creates admin@example.com
npm run seed:user     # Creates user@example.com
```

**What Gets Created:**

1. **User Account** (in MongoDB Users collection)
   ```javascript
   {
     name: "John Doe",
     email: "user@example.com",
     password: "123456" (hashed),
     isAdmin: false,
     isVerified: true
   }
   ```

2. **Banking Account** (in MongoDB Accounts collection)
   ```javascript
   {
     userId: <generated_id>,
     accountNumber: "ACC001",
     accountType: "Savings",
     balance: 5000
   }
   ```

3. **KYC Record** (in MongoDB KYC collection)
   ```javascript
   {
     userId: <generated_id>,
     status: "not_submitted"
   }
   ```

**Similar process for admin account with:**
- `isAdmin: true`
- `accountNumber: "ADMIN001"`
- `KYC status: "approved"`

### Option 2: Manual Database Setup

If you prefer to create accounts manually:

1. **Connect to MongoDB**
   ```bash
   mongosh  # or mongo
   use blockchain-bank
   ```

2. **Create User Account**
   ```javascript
   db.users.insertOne({
     name: "John Doe",
     email: "user@example.com",
     password: "$2b$10$...", // Must be bcrypt hashed
     isAdmin: false,
     isVerified: true,
     createdAt: new Date()
   })
   ```

3. **Create Account**
   ```javascript
   db.accounts.insertOne({
     userId: ObjectId("..."), // Use the _id from user
     accountNumber: "ACC001",
     accountType: "Savings",
     balance: 5000,
     createdAt: new Date()
   })
   ```

4. **Create KYC**
   ```javascript
   db.kyc.insertOne({
     userId: ObjectId("..."),
     status: "not_submitted"
   })
   ```

---

## Environment Configuration

Create `.env` file in backend directory:

```env
# ==================
# DATABASE
# ==================
MONGODB_URI=mongodb://localhost:27017/blockchain-bank
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-bank

# ==================
# SERVER
# ==================
PORT=5000
NODE_ENV=development

# ==================
# JWT
# ==================
JWT_SECRET=your-very-secret-key-change-this-in-production
JWT_EXPIRE=7d

# ==================
# EMAIL (Optional)
# ==================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@blockchain-bank.com

# ==================
# FRONTEND
# ==================
FRONTEND_URL=http://localhost:5173

# ==================
# BLOCKCHAIN
# ==================
BLOCKCHAIN_MODE=demo
# BLOCKCHAIN_MODE=ethereum  (for future production)
```

### Email Configuration

To enable email notifications:

1. **Gmail Setup**
   - Enable 2-factor authentication
   - Generate app password: https://myaccount.google.com/apppasswords
   - Use app password in `SMTP_PASS`

2. **Other Providers**
   - SendGrid: `SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey`
   - AWS SES: Configure in code
   - Mailgun: Configure in code

---

## Database Schema

The seeding scripts create these collections:

### 1. Users Collection
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  isAdmin: Boolean,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Accounts Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  accountNumber: String (unique),
  accountType: String ("Savings", "Current"),
  balance: Number,
  walletBlockchainBalance: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. KYC Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  status: String ("not_submitted", "pending", "approved", "rejected"),
  documentType: String,
  documentNumber: String,
  submittedAt: Date,
  approvedAt: Date
}
```

### 4. Deposits Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  accountId: ObjectId (ref: Account),
  amount: Number,
  status: String ("pending", "completed", "failed"),
  description: String,
  createdAt: Date
}
```

### 5. Withdrawals Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  accountId: ObjectId (ref: Account),
  amount: Number,
  status: String ("pending", "completed", "failed"),
  description: String,
  createdAt: Date
}
```

---

## Testing Demo Workflows

### Workflow 1: User Signup & Login

1. **Go to Landing Page**
   - URL: http://localhost:5173/

2. **Click "Sign Up"**
   - Create new account with any email
   - Password: any 4+ characters

3. **Login with Demo Credentials**
   - Email: `user@example.com`
   - PIN: `123456`

4. **View Dashboard**
   - See balance: ₹5,000
   - View charts with real data
   - Check spending by category

### Workflow 2: KYC Submission

1. **Login as User**
   - Email: `user@example.com`
   - PIN: `123456`

2. **Go to KYC Page**
   - Navigate to: http://localhost:5173/kyc

3. **Submit KYC**
   - Fill form with any details
   - Click Submit
   - Should show "Pending" status

4. **Login as Admin**
   - Email: `admin@example.com`
   - Password: `Admin@123`

5. **Approve KYC**
   - Go to Admin Dashboard
   - Find user's KYC request
   - Click Approve

6. **User Should See Approved Status**
   - Login as user again
   - KYC page shows "Approved"

### Workflow 3: Transactions

1. **Deposit Money**
   - Go to Deposit page
   - Enter amount (e.g., ₹1,000)
   - Click Deposit
   - Should see transaction in history

2. **Withdraw Money**
   - Go to Withdraw page
   - Enter amount (e.g., ₹500)
   - Click Withdraw
   - Balance should decrease

3. **View Transaction History**
   - Go to Transactions page
   - All deposits/withdrawals visible
   - Click for details

### Workflow 4: Fraud Detection

1. **Go to Fraud Detection Page**
   - URL: http://localhost:5173/fraud-detection

2. **View Feature Importance**
   - See 5 factors affecting fraud detection:
     - Amount (95% importance)
     - Frequency (87%)
     - Time (72%)
     - Device (68%)
     - Location (61%)

3. **Analyze Sample Transaction**
   - Check if transaction is suspicious
   - View risk scores

### Workflow 5: Credit Scoring

1. **Go to Credit Scoring Page**
   - URL: http://localhost:5173/credit-scoring

2. **View Score**
   - See credit score (0-1000)
   - View 6 factors analyzed

3. **View Grade**
   - Score 700+: Excellent
   - Score 600-699: Good
   - Score 500-599: Fair
   - Below 500: Poor

---

## Blockchain Demo Features

### View Blockchain Ledger

**Admin Dashboard** shows blockchain stats:
- Total blocks recorded
- Total transactions
- Ledger size

### Test Blockchain Recording

Every transaction automatically records on blockchain:

1. **Make a deposit**
   - User deposits ₹1,000
   - System records on blockchain
   - Hash generated with SHA-256

2. **Verify in Admin**
   - Admin can view blockchain ledger
   - See all transaction hashes
   - Verify block integrity

3. **Check Ledger**
   - API: `GET /api/blockchain/ledger`
   - Shows all recorded blocks
   - Each block has SHA-256 hash

### Blockchain Limitations (Demo Mode)

⚠️ **Know Before Testing:**

- **In-Memory Storage**: Data lost when server restarts
- **Single Node**: Not distributed like real blockchain
- **SHA-256 Only**: Not connected to Ethereum/Polygon
- **For Education**: Good for learning blockchain concepts

**To Persist Data:**
1. Add MongoDB storage layer
2. Implement blockchain state collection
3. Load ledger from DB on startup
4. See Task 5 for implementation

---

## API Testing

### Using Swagger UI

1. Go to: http://localhost:5000/api-docs
2. Try different endpoints
3. Test authentication with JWT token

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123456"
  }'

# Get account balance (use token from login)
curl -X GET http://localhost:5000/api/account/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import collection: `backend/postman-collection.json`
2. Set environment: `BASE_URL=http://localhost:5000/api`
3. Run requests in sequence

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Ensure MongoDB is running
2. Check connection string in `.env`
3. Verify database credentials
4. For Atlas: Add IP to whitelist

```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017"
```

### Issue: "Admin/User not found when logging in"

**Solution:**
1. Run seed scripts:
   ```bash
   npm run seed:admin
   npm run seed:user
   ```
2. Check database has users:
   ```bash
   mongosh
   use blockchain-bank
   db.users.find()
   ```

### Issue: "Invalid JWT token"

**Solution:**
1. Get fresh token by logging in again
2. Ensure Authorization header format:
   ```
   Authorization: Bearer <token>
   ```
3. Check token not expired

### Issue: "Charts showing mock data instead of real data"

**Solution:**
1. Ensure backend is running: `npm run dev`
2. Check API endpoints are working: `http://localhost:5000/api/admin/analytics/daily-summary`
3. Verify database has transactions
4. Check browser console for API errors

### Issue: "Blockchain data lost after restart"

**This is expected in demo mode.** To persist blockchain data:
1. Implement MongoDB blockchain storage (Task 5)
2. Or use localStorage on frontend
3. Or use Redis cache

---

## Next Steps

After testing the demo:

1. **Customize Demo Data**
   - Edit seed scripts to change amounts
   - Create multiple test accounts
   - Add sample transactions

2. **Configure Production**
   - Change JWT_SECRET
   - Use strong passwords
   - Enable HTTPS
   - Configure email properly

3. **Extend Features**
   - Connect to real blockchain
   - Add persistence layer
   - Implement more ML models
   - Add file uploads

4. **Deploy**
   - Deploy backend to Heroku/AWS
   - Deploy frontend to Vercel/Netlify
   - Set environment variables
   - Configure database on cloud

---

## Support

**Documentation Files:**
- [README.md](./README.md) - Project overview
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) - Backend architecture

**Need Help?**
- Check error logs in terminal
- Review API documentation
- Check database state with MongoDB Compass
- Test endpoints with Swagger UI

**Version**: 1.0
**Last Updated**: January 2024
