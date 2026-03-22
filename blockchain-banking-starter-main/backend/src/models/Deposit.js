import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
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
      min: 100,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'check'],
      required: true,
    },
    // Bank Transfer Fields
    sourceBank: {
      type: String, // e.g., HDFC, ICICI, Axis, SBI
      default: null,
    },
    accountNumber: {
      type: String, // Account number from source bank
      default: null,
    },
    transactionReference: {
      type: String, // Optional UTR or reference from source bank
      default: null,
    },
    // Check Fields
    checkNumber: {
      type: String,
      default: null,
    },
    checkIssuerName: {
      type: String, // Name of person/company who issued the check
      default: null,
    },
    bankName: {
      type: String, // Bank that issued the check
      default: null,
    },
    // General Fields
    purpose: {
      type: String, // e.g., "Salary", "Refund", "Investment"
      default: null,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    sourceDetails: {
      type: String, // e.g., "From HDFC Bank account 1234567890" or "Check #12345"
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
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

export const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;
