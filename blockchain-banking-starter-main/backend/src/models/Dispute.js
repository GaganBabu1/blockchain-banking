import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deposit',
      default: null,
    },
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Withdrawal',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['incorrect_amount', 'unauthorized', 'duplicate', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    resolution: {
      type: String,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Dispute = mongoose.model('Dispute', disputeSchema);
export default Dispute;
