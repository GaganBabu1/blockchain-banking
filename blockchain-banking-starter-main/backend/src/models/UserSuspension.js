import mongoose from 'mongoose';

const userSuspensionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['warning', 'temporary', 'permanent'],
      default: 'temporary',
    },
    isSuspended: {
      type: Boolean,
      default: true,
    },
    suspendedAt: {
      type: Date,
      default: Date.now,
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unsuspendedAt: {
      type: Date,
      default: null,
    },
    unsuspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    reason_detail: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const UserSuspension = mongoose.model('UserSuspension', userSuspensionSchema);
export default UserSuspension;
