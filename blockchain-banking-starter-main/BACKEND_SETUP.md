# Backend Setup & Quick Start

Your complete Node.js/MongoDB backend is ready! Here's how to get it running:

## Prerequisites

1. **Node.js 18+** installed on your system
2. **MongoDB** running locally or MongoDB Atlas cloud URL
3. **npm** or **yarn** package manager

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs all required packages:
- express.js - Web framework
- mongoose - MongoDB ORM
- bcryptjs - Password hashing
- jsonwebtoken - JWT auth
- nodemailer - Email service
- web3/ethers - Blockchain integration
- cors - Cross-origin requests
- dotenv - Environment variables

### 2. Configure Environment Variables

The `.env` file is already created with default values. For production, update:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/blockchain-banking
# or use MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain-banking

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-change-this

# Email (Gmail with App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Blockchain (optional for demo)
BLOCKCHAIN_RPC=http://localhost:8545
PRIVATE_KEY=your-private-key

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

### 3. Start MongoDB

If running MongoDB locally:
```bash
mongod
```

Or update `.env` with your MongoDB Atlas connection string.

### 4. Start the Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start at: **http://localhost:5000**

You should see:
```
╔════════════════════════════════════════════════════════════╗
║     BLOCKCHAIN BANKING - BACKEND SERVER STARTED           ║
║     Server running at: http://localhost:5000              ║
║     MongoDB: Connected                                    ║
║     Blockchain: Initialized                               ║
║     Email Service: Ready                                  ║
╚════════════════════════════════════════════════════════════╝
```

## Frontend Connection

Your frontend is already configured to use the backend at `http://localhost:5000`.

To run the full stack:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Both will run and communicate automatically!

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get Balance (use token from login)
```bash
curl -X GET http://localhost:5000/api/account/balance \
  -H "Authorization: Bearer <your-token>"
```

### 4. Deposit Money
```bash
curl -X POST http://localhost:5000/api/account/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "amount": 5000,
    "description": "Initial deposit"
  }'
```

### 5. Submit KYC
```bash
curl -X POST http://localhost:5000/api/kyc/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "documentType": "Aadhar",
    "documentNumber": "123456789012",
    "documentImageUrl": "https://example.com/doc.jpg"
  }'
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/me` - Update profile (protected)

### Account
- `GET /api/account` - Get account details (protected)
- `GET /api/account/balance` - Get balance (protected)
- `GET /api/account/transactions` - Get transactions (protected)
- `POST /api/account/deposit` - Deposit money (protected)
- `POST /api/account/withdraw` - Withdraw money (protected)

### KYC
- `POST /api/kyc/submit` - Submit KYC (protected)
- `GET /api/kyc/status` - Get KYC status (protected)
- `GET /api/kyc/admin/pending` - Get pending KYC (admin only)
- `PUT /api/kyc/admin/:kycId` - Update KYC status (admin only)

### Admin
- `GET /api/admin/stats` - Dashboard stats (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/export/csv` - Export users CSV (admin only)
- `GET /api/admin/report` - Generate report (admin only)
- `GET /api/admin/transactions` - Get all transactions (admin only)

## Database Structure

Automatically created collections:

1. **users** - User accounts
   - name, email, password (hashed), phone, address, etc.
   - isAdmin, isVerified flags

2. **accounts** - Bank accounts
   - userId, accountNumber, balance
   - accountType (Savings/Checking/Investment)
   - walletAddress for blockchain

3. **transactions** - Transaction history
   - transactionId, fromAccountId, toAccountId
   - amount, type, status
   - blockchainHash for blockchain records

4. **kycs** - KYC verification records
   - userId, documentType, documentNumber
   - status (not_submitted/pending/approved/rejected)
   - limits and verification info

5. **adminusers** - Admin accounts (optional)
   - email, password, role
   - lastLogin, loginAttempts tracking

## Features Included

✅ **User Management**
- Registration with email validation
- Secure login with JWT
- Profile updates
- Password hashing with bcryptjs

✅ **Account Operations**
- Create account on registration
- Check balance
- Deposit money
- Withdraw money
- Transaction history

✅ **KYC System**
- Submit KYC documents
- Admin KYC verification
- Status tracking
- Monthly/daily limits

✅ **Admin Dashboard**
- View all users
- Monitor statistics
- Export user data as CSV
- Generate system reports
- Manage KYC approvals

✅ **Blockchain Integration**
- Record transactions on blockchain (optional)
- Wallet integration ready
- Smart contract support ready

✅ **Email Notifications**
- Verification emails
- Transaction confirmations
- KYC status updates

## Troubleshooting

### "MongoDB connection error"
- Ensure MongoDB is running
- Check MONGO_URI in .env
- For MongoDB Atlas, use correct username/password

### "Port 5000 already in use"
- Change PORT in .env
- Or kill the process: `lsof -ti:5000 | xargs kill`

### "CORS error from frontend"
- Ensure backend is running on :5000
- Check FRONTEND_URL in backend .env matches your frontend

### "Email not sending"
- For Gmail: Use App Passwords (not regular password)
- Generate at: https://myaccount.google.com/apppasswords

## Production Deployment

1. **Change JWT_SECRET** in .env to a random long string
2. **Use MongoDB Atlas** instead of local MongoDB
3. **Use production email service** (SendGrid, AWS SES)
4. **Set NODE_ENV=production**
5. **Deploy to Heroku, AWS, or DigitalOcean**

## Next Steps

1. ✅ Backend is fully ready
2. ✅ Frontend connected to backend
3. You can now:
   - Run both frontend and backend
   - Test all features
   - Deploy to production
   - Add blockchain features

Good luck with your college exam! 🚀
