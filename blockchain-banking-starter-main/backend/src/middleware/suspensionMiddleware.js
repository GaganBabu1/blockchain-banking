import { UserSuspension } from '../models/UserSuspension.js';

/**
 * Middleware to check if user is suspended
 * If suspended, blocks transaction-related operations
 */
export async function checkUserSuspension(req, res, next) {
  try {
    const userId = req.user._id;

    const suspension = await UserSuspension.findOne({ userId });
    
    if (suspension && suspension.isSuspended) {
      // Check if suspension has expired (for temporary suspensions)
      if (suspension.suspendedUntil && new Date() > suspension.suspendedUntil) {
        // Suspension expired, automatically unsuspend
        suspension.isSuspended = false;
        suspension.unsuspendedAt = new Date();
        await suspension.save();
        return next();
      }

      // User is still suspended
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended',
        details: {
          reason: suspension.reason,
          severity: suspension.severity,
          suspendedSince: suspension.suspendedAt,
          suspendedUntil: suspension.suspendedUntil,
          notes: suspension.notes
        }
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
