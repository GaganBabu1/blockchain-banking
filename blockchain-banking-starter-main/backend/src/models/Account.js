import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Checking', 'Investment'],
    default: 'Savings'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  },
  blockchainBalance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate account number before saving
accountSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.accountNumber = `ACC${timestamp.slice(-8)}${random}`;
  }
  next();
});

export const Account = mongoose.model('Account', accountSchema);
