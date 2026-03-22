import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 500,
    },
    method: {
      type: String,
      enum: ['bank_transfer'],
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    destinationBank: {
      type: String, // e.g., "HDFC", "ICICI", "Axis"
      default: null,
    },
    destinationAccountNumber: {
      type: String, // Recipient's account number
      default: null,
    },
    recipientName: {
      type: String, // Full name of the recipient
      default: null,
    },
    purpose: {
      type: String, // e.g., "Personal", "Business", "Bills", "Refund"
      default: null,
    },
    destinationDetails: {
      type: String, // Legacy field for compatibility
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    processedDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    fraudStatus: {
      type: String,
      enum: ['Cleared', 'Under Review', 'Flagged'],
      default: 'Cleared'
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
