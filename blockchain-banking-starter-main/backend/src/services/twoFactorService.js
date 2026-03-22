import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate 2FA secret and QR code for user
 * @param {string} userEmail - User email for the secret
 * @returns {Promise<{secret: string, qrCodeUrl: string}>}
 */
export async function generateTwoFactorSecret(userEmail) {
  try {
    const secret = speakeasy.generateSecret({
      name: `Blockchain Banking (${userEmail})`,
      issuer: 'Blockchain Banking System',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32
    };
  } catch (error) {
    throw new Error(`Failed to generate 2FA secret: ${error.message}`);
  }
}

/**
 * Verify 2FA token
 * @param {string} secret - The user's 2FA secret
 * @param {string} token - The 6-digit code to verify
 * @returns {boolean} - True if token is valid
 */
export function verifyTwoFactorToken(secret, token) {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time windows (30 seconds each) for timing issues
    });

    return verified;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 * @returns {string[]} - Array of backup codes
 */
export function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()
      .padEnd(8, '0');
    codes.push(code);
  }
  return codes;
}

/**
 * Verify and consume backup code
 * @param {string[]} backupCodes - User's backup codes
 * @param {string} code - Code to verify
 * @returns {{valid: boolean, remainingCodes: string[]}}
 */
export function verifyBackupCode(backupCodes, code) {
  const index = backupCodes.indexOf(code.toUpperCase());
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes };
  }

  // Remove the used code
  const remainingCodes = backupCodes.filter((_, i) => i !== index);
  
  return { valid: true, remainingCodes };
}

export default {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateBackupCodes,
  verifyBackupCode
};
