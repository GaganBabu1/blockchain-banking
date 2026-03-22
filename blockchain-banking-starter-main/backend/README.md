# Blockchain Banking - Backend

Express.js + MongoDB backend for the Blockchain Banking System.

## Features

- User authentication with JWT
- Account management (deposits, withdrawals, transfers)
- Transaction history tracking
- KYC verification system
- Admin dashboard with analytics
- Blockchain integration (Ethereum)
- Email notifications
- RESTful API

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blockchain-banking
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
BLOCKCHAIN_RPC=http://localhost:8545
FRONTEND_URL=http://localhost:8080
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/me` - Update profile (protected)

### Account
- `GET /api/account` - Get account details (protected)
- `GET /api/account/balance` - Get current balance (protected)
- `GET /api/account/transactions` - Get transaction history (protected)
- `POST /api/account/deposit` - Deposit money (protected)
- `POST /api/account/withdraw` - Withdraw money (protected)

### KYC
- `POST /api/kyc/submit` - Submit KYC (protected)
- `GET /api/kyc/status` - Get KYC status (protected)
- `GET /api/kyc/admin/pending` - Get pending KYC (admin)
- `PUT /api/kyc/admin/:kycId` - Update KYC status (admin)

### Admin
- `GET /api/admin/stats` - Dashboard statistics (admin)
- `GET /api/admin/users` - All users (admin)
- `GET /api/admin/users/export/csv` - Export users as CSV (admin)
- `GET /api/admin/report` - Generate system report (admin)
- `GET /api/admin/transactions` - All transactions (admin)

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and app config
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic (blockchain, email)
│   ├── utils/          # Utility functions
│   └── index.js        # Entry point
├── package.json
├── .env                # Environment variables
└── README.md
```

## Database Models

- **User** - User accounts with authentication
- **Account** - Bank accounts linked to users
- **Transaction** - Transaction history
- **KYC** - Know Your Customer verification
- **AdminUser** - Admin user accounts

## Authentication

All protected routes require JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

All API responses follow this format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}
}
```

## Development Notes

- Uses ES6 modules (type: "module" in package.json)
- Passwords are hashed with bcryptjs
- JWT tokens expire after 7 days
- CORS enabled for frontend development
- Blockchain integration uses ethers.js

## License

MIT
