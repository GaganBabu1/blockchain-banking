import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

let transporter;

export async function initEmailService() {
  try {
    transporter = nodemailer.createTransport({
      service: config.emailService,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword
      }
    });
    console.log('✅ Email service initialized');
  } catch (error) {
    console.error('❌ Email service error:', error.message);
  }
}

export async function sendVerificationEmail(email, name, token) {
  try {
    const verificationUrl = `${config.frontendUrl}/verify?token=${token}`;
    
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Email Verification - Blockchain Banking',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>Thank you for registering with Blockchain Banking.</p>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
    } else {
      console.log(`[DEMO] Verification link would be sent to ${email}: ${verificationUrl}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendTransactionConfirmation(email, name, amount, type) {
  try {
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: `Transaction Confirmation - Blockchain Banking`,
      html: `
        <h2>Transaction Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your ${type} of ₹${amount} has been completed successfully.</p>
        <p>Thank you for using Blockchain Banking!</p>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Transaction confirmation sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendKYCStatusEmail(email, name, status, reason = '') {
  try {
    let message = '';
    if (status === 'approved') {
      message = 'Your KYC has been approved! You can now access all features.';
    } else if (status === 'rejected') {
      message = `Your KYC has been rejected. Reason: ${reason}`;
    }

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: `KYC Status Update - Blockchain Banking`,
      html: `
        <h2>KYC Status Update</h2>
        <p>Hi ${name},</p>
        <p>${message}</p>
        <p>Blockchain Banking Team</p>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ KYC status email sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendDepositNotification(email, name, amount, referenceNumber, status) {
  try {
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const statusText = status === 'approved' ? 'APPROVED ✅' : 'REJECTED ❌';

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: `Deposit ${statusText} - Blockchain Banking`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h2>Deposit ${statusText}</h2>
            <p>Dear ${name},</p>
            <p>Your deposit request has been ${status}.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Reference Number:</strong> ${referenceNumber}</p>
              <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
            </div>
            <p>You can track your deposit status in your account dashboard.</p>
            <p>Thank you for banking with us!</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Deposit ${status} email sent to ${email}`);
    } else {
      console.log(`[DEMO] Deposit ${status} email would be sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendWithdrawalNotification(email, name, amount, referenceNumber, status) {
  try {
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const statusText = status === 'approved' ? 'APPROVED ✅' : 'REJECTED ❌';

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: `Withdrawal ${statusText} - Blockchain Banking`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h2>Withdrawal ${statusText}</h2>
            <p>Dear ${name},</p>
            <p>Your withdrawal request has been ${status}.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Reference Number:</strong> ${referenceNumber}</p>
              <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
            </div>
            <p>The funds will be transferred to your destination account shortly.</p>
            <p>Thank you for banking with us!</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Withdrawal ${status} email sent to ${email}`);
    } else {
      console.log(`[DEMO] Withdrawal ${status} email would be sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendAccountSuspensionNotice(email, name, reason, suspendedUntil) {
  try {
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Account Suspension Notice - Blockchain Banking',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <h2 style="color: #ef4444;">Account Suspension Notice</h2>
            <p>Dear ${name},</p>
            <p>Your account has been suspended due to the following reason:</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #ef4444;">
              <p><strong>${reason}</strong></p>
            </div>
            ${suspendedUntil ? `<p><strong>Suspension Period:</strong> Until ${new Date(suspendedUntil).toLocaleDateString()}</p>` : '<p><strong>Suspension:</strong> Permanent</p>'}
            <p>If you believe this is a mistake, please contact our support team immediately.</p>
            <p style="color: #666; font-size: 12px;">Blockchain Banking Support</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Suspension notice sent to ${email}`);
    } else {
      console.log(`[DEMO] Suspension notice would be sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}

export async function sendDisputeResolutionNotice(email, name, disputeId, resolution, refundAmount) {
  try {
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Dispute Resolution - Blockchain Banking',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h2>Dispute Resolved ✅</h2>
            <p>Dear ${name},</p>
            <p>Your dispute has been reviewed and resolved by our team.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Dispute ID:</strong> ${disputeId}</p>
              <p><strong>Resolution:</strong> ${resolution}</p>
              ${refundAmount > 0 ? `<p><strong>Refund Amount:</strong> ₹${refundAmount.toLocaleString()}</p>` : ''}
            </div>
            <p>Thank you for bringing this to our attention. We appreciate your patience.</p>
            <p>Thank you for banking with us!</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Dispute resolution email sent to ${email}`);
    } else {
      console.log(`[DEMO] Dispute resolution email would be sent to ${email}`);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }
}
