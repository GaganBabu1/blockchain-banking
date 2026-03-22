import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  transferId: {
    type: String,
    unique: true,
    sparse: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  recipientPhone: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  description: String,
  purpose: {
    type: String,
    enum: ['Personal', 'Business', 'Loan', 'Salary', 'Rent', 'Other'],
    default: 'Personal'
  },
  rejectionReason: String,
  adminNotes: String,
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  fraudStatus: {
    type: String,
    enum: ['cleared', 'under_review', 'flagged'],
    default: 'cleared'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, { timestamps: true });

// Generate transfer ID before saving
transferSchema.pre('save', async function(next) {
  if (!this.transferId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.transferId = `TRF${timestamp.slice(-10)}${random}`;
  }
  next();
});

export const Transfer = mongoose.model('Transfer', transferSchema);
