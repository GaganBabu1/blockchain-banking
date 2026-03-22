# Backend Structure (To Be Implemented)

This document outlines the backend folder structure that should be created separately from the frontend. Since Lovable is a frontend-only platform, the backend needs to be set up in a separate Node.js project.

## Folder Structure

```
backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
│
└── src/
    ├── server.js              # Express app entry point
    │
    ├── config/
    │   └── db.js              # MongoDB connection setup
    │
    ├── models/
    │   ├── User.js            # User model (name, email, password, role)
    │   ├── Kyc.js             # KYC model (userId, status, documents)
    │   ├── Transaction.js     # Transaction model (type, amount, status)
    │   └── Account.js         # Account model (userId, balances)
    │
    ├── routes/
    │   ├── authRoutes.js      # /api/auth/* routes
    │   ├── userRoutes.js      # /api/user/* routes
    │   ├── kycRoutes.js       # /api/kyc/* routes
    │   ├── transactionRoutes.js  # /api/transactions/* routes
    │   └── adminRoutes.js     # /api/admin/* routes
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── kycController.js
    │   ├── transactionController.js
    │   └── adminController.js
    │
    ├── middlewares/
    │   └── authMiddleware.js  # JWT verification middleware
    │
    └── utils/
        └── logger.js          # Logging utility
```

## package.json Template

```json
{
  "name": "blockchain-bank-backend",
  "version": "1.0.0",
  "description": "Backend API for Blockchain Banking System",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

## .env.example

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blockchain-bank
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## server.js Template

```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blockchain Bank API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## config/db.js Template

```javascript
// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## Model Templates

### User.js
```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### Kyc.js
```javascript
// src/models/Kyc.js
const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  documentType: { type: String, required: true },
  documentNumber: { type: String, required: true },
  documentFile: { type: String },
  status: { 
    type: String, 
    enum: ['not_submitted', 'pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('Kyc', kycSchema);
```

### Transaction.js
```javascript
// src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  reference: { type: String, unique: true },
  destination: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
```

## Getting Started with Backend

1. Create a new folder for the backend:
```bash
mkdir blockchain-bank-backend
cd blockchain-bank-backend
```

2. Initialize npm and install dependencies:
```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

3. Create the folder structure as shown above

4. Create `.env` file from `.env.example`

5. Start MongoDB locally or use MongoDB Atlas

6. Run the server:
```bash
npm run dev
```

## Connecting Frontend to Backend

Update the `src/services/api.ts` file in the frontend to use actual API calls:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// ... similar updates for other functions
```
