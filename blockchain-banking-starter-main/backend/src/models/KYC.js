import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  documentType: {
    type: String,
    enum: ['aadhar', 'pan', 'passport', 'license'],
    sparse: true
  },
  documentNumber: {
    type: String,
    sparse: true
  },
  documentImageUrl: String,
  documentFileName: String,
  documentFileSize: Number,
  documentMimeType: String,
  status: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  submittedAt: Date,
  verifiedAt: Date,
  rejectionReason: String,
  monthlyLimit: {
    type: Number,
    default: 500000
  },
  dailyLimit: {
    type: Number,
    default: 50000
  },
  monthlySpent: {
    type: Number,
    default: 0
  },
  dailySpent: {
    type: Number,
    default: 0
  },
  verificationNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const KYC = mongoose.model('KYC', kycSchema);
