import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
}

export async function adminProtect(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Admin access denied' });
  }
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
}
