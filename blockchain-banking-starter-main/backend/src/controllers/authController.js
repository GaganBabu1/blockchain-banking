import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { KYC } from '../models/KYC.js';
import { generateToken } from '../utils/jwt.js';
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateBackupCodes,
  verifyBackupCode
} from '../services/twoFactorService.js';

// Register user
export async function register(req, res) {
  try {
    const { name, email, accountNumber, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !accountNumber || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'PINs do not match' });
    }

    if (!/^\d{6}$/.test(password)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits' });
    }

    if (accountNumber.length < 4) {
      return res.status(400).json({ success: false, message: 'Account number must be at least 4 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if account number is already taken
    const existingAccount = await Account.findOne({ accountNumber });
    if (existingAccount) {
      return res.status(400).json({ success: false, message: 'Account number already exists' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: true, // Auto-verify for demo
      kycStatus: 'not_submitted' // Default KYC status
    });

    // Create account for user with provided account number
    try {
      await Account.create({
        userId: user._id,
        accountNumber: accountNumber,
        accountType: 'Savings',
        balance: 0
      });
      console.log('Account created for user:', user._id);
    } catch (accountError) {
      console.error('Account creation error:', accountError.message);
      // Still continue, don't fail the registration
    }

    // Create KYC record
    try {
      await KYC.create({
        userId: user._id,
        status: 'not_submitted'
      });
      console.log('KYC created for user:', user._id);
    } catch (kycError) {
      console.error('KYC creation error:', kycError.message);
      // Still continue, don't fail the registration
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Login user
export async function login(req, res) {
  try {
    const { accountNumber, password } = req.body;

    // Validation
    if (!accountNumber || !password) {
      return res.status(400).json({ success: false, message: 'Please provide account number and PIN' });
    }

    // Find account by account number and get user
    const account = await Account.findOne({ accountNumber });
    if (!account) {
      console.log(`Login failed: Account not found with number ${accountNumber}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get user by account's userId
    const user = await User.findById(account.userId).select('+password');
    if (!user) {
      console.log(`Login failed: User not found for account ${accountNumber}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password (PIN)
    const isMatch = await user.matchPassword(password);
    console.log(`Login attempt for account ${accountNumber}: password match = ${isMatch}, isAdmin = ${user.isAdmin}`);
    if (!isMatch) {
      console.log(`Login failed: PIN mismatch for account ${accountNumber}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: '2FA required',
        twoFactorRequired: true,
        userId: user._id,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Admin Login (Email + Password)
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isAdmin) {
      console.log(`Admin login failed: User not found or not admin with email ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    console.log(`Admin login attempt for ${email}: password match = ${isMatch}`);
    if (!isMatch) {
      console.log(`Admin login failed: Password mismatch for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      role: 'admin',
      user: {
        id: user._id,
        name: user.name,
        role: 'admin',
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get current user
export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('accounts');
    
    const account = await Account.findOne({ userId: user._id });
    const kyc = await KYC.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        account: account ? {
          accountNumber: account.accountNumber,
          balance: account.balance,
          accountType: account.accountType
        } : null,
        kyc: kyc ? {
          status: kyc.status,
          documentType: kyc.documentType,
          monthlyLimit: kyc.monthlyLimit,
          dailyLimit: kyc.dailyLimit
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update user profile
export async function updateProfile(req, res) {
  try {
    const { name, phone, address, dateOfBirth, gender } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        phone: phone || req.user.phone,
        address: address || req.user.address,
        dateOfBirth: dateOfBirth || req.user.dateOfBirth,
        gender: gender || req.user.gender
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============ TWO-FACTOR AUTHENTICATION ============

// Setup 2FA - Generate QR code
export async function setupTwoFactor(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 2FA secret and QR code
    const { secret, qrCodeUrl, manualEntryKey } = await generateTwoFactorSecret(user.email);

    // Store temporary secret (not yet verified)
    user.twoFactorSetupPending = true;
    user.twoFactorTempSecret = secret;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA setup initiated. Scan the QR code and enter the 6-digit code to confirm.',
      qrCodeUrl,
      manualEntryKey,
      setupId: userId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify 2FA setup - Confirm with 6-digit code
export async function confirmTwoFactor(req, res) {
  try {
    const userId = req.user._id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide the 6-digit code' });
    }

    const user = await User.findById(userId);

    if (!user || !user.twoFactorSetupPending || !user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: '2FA setup not initiated' });
    }

    // Verify the code
    const isValid = verifyTwoFactorToken(user.twoFactorTempSecret, code);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA and store secret
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorSetupPending = false;
    user.twoFactorTempSecret = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully. Save your backup codes in a secure location.',
      backupCodes,
      warning: 'If you lose access to your authenticator app, you will need these backup codes to regain access.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Disable 2FA
export async function disableTwoFactor(req, res) {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required to disable 2FA' });
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA has been disabled. Your account is now less secure.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify 2FA code during login
export async function verifyTwoFactorLogin(req, res) {
  try {
    const { userId, code, useBackupCode } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'User ID and code required' });
    }

    const user = await User.findById(userId);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    let isValid = false;

    if (useBackupCode) {
      // Verify backup code
      const { valid, remainingCodes } = verifyBackupCode(user.twoFactorBackupCodes, code);
      if (valid) {
        user.twoFactorBackupCodes = remainingCodes;
        await user.save();
        isValid = true;
      }
    } else {
      // Verify TOTP code
      isValid = verifyTwoFactorToken(user.twoFactorSecret, code);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    // Generate login token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: '2FA verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
