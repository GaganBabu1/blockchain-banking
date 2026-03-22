import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Transfer', 'Payment'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  description: String,
  blockchainHash: String,
  blockchainConfirmed: {
    type: Boolean,
    default: false
  },
  fee: {
    type: Number,
    default: 0
  },
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Generate transaction ID before saving
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.transactionId = `TXN${timestamp.slice(-10)}${random}`;
  }
  next();
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
