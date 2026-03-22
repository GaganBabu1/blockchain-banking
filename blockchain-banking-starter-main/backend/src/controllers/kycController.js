import { KYC } from '../models/KYC.js';
import { User } from '../models/User.js';

// Submit KYC
export async function submitKYC(req, res) {
  try {
    const { documentType, documentNumber } = req.body;

    // Validate required fields
    if (!documentType || !documentNumber) {
      return res.status(400).json({ success: false, message: 'Please provide document type and number' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file' });
    }

    const kyc = await KYC.findOne({ userId: req.user._id });

    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    // Store file path instead of URL
    const filePath = `/uploads/kyc/${req.file.filename}`;

    kyc.documentType = documentType;
    kyc.documentNumber = documentNumber;
    kyc.documentImageUrl = filePath; // Store file path
    kyc.documentFileName = req.file.originalname;
    kyc.documentFileSize = req.file.size;
    kyc.documentMimeType = req.file.mimetype;
    kyc.status = 'pending';
    kyc.submittedAt = new Date();

    await kyc.save();

    // Sync User kycStatus
    await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending' });

    res.status(200).json({
      success: true,
      message: 'KYC and document submitted successfully. It will be verified soon.',
      kyc: {
        status: kyc.status,
        documentType: kyc.documentType,
        documentFileName: req.file.originalname,
        submittedAt: kyc.submittedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get KYC status
export async function getKYCStatus(req, res) {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id });

    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    res.status(200).json({
      success: true,
      kyc: {
        status: kyc.status,
        documentType: kyc.documentType,
        documentNumber: kyc.documentNumber,
        submittedAt: kyc.submittedAt,
        verifiedAt: kyc.verifiedAt,
        monthlyLimit: kyc.monthlyLimit,
        dailyLimit: kyc.dailyLimit,
        rejectionReason: kyc.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all pending KYC requests (Admin)
export async function getPendingKYC(req, res) {
  try {
    const { User } = await import('../models/User.js');
    
    const kycRequests = await KYC.find({ status: 'pending' }).sort({ submittedAt: -1 });

    // Enrich with user data without population to avoid schema issues
    const enrichedKYC = await Promise.all(
      kycRequests.map(async (k) => {
        const user = await User.findById(k.userId).select('name email phone');
        return {
          kycId: k._id,
          userId: k.userId,
          user: {
            id: user?._id,
            name: user?.name || 'Unknown',
            email: user?.email || 'N/A',
            phone: user?.phone || 'N/A'
          },
          documentType: k.documentType,
          documentNumber: k.documentNumber,
          status: k.status,
          submittedAt: k.submittedAt
        };
      })
    );

    // Return as array for test compatibility, or wrapped for API compatibility
    res.status(200).json(enrichedKYC);
  } catch (error) {
    console.error('KYC Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update KYC status (Admin)
export async function updateKYCStatus(req, res) {
  try {
    const { kycId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const kyc = await KYC.findByIdAndUpdate(
      kycId,
      {
        status,
        verifiedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : null
      },
      { new: true }
    );

    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    // Sync User kycStatus
    await User.findByIdAndUpdate(kyc.userId, { kycStatus: status });

    res.status(200).json({
      success: true,
      message: `KYC ${status} successfully`,
      kyc: {
        status: kyc.status,
        verifiedAt: kyc.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all KYC requests (pending and submitted) for admin dashboard
export async function getAllKycRequests(req, res) {
  try {
    // Get all non-admin users with their KYC status, excluding 'not_submitted'
    const users = await User.find({ 
      isAdmin: false,
      kycStatus: { $ne: 'not_submitted' }  // Exclude users who haven't submitted
    }).select('name email kycStatus createdAt');

    // Map to KYC request format for display
    const kycRequests = users.map(user => ({
      id: user._id.toString(),
      kycId: user._id.toString(),
      userName: user.name,
      email: user.email,
      status: user.kycStatus,
      submittedDate: new Date(user.createdAt).toISOString().split('T')[0],
      documentType: 'Submitted'
    }));

    res.status(200).json({
      success: true,
      kycRequests: kycRequests
    });
  } catch (error) {
    console.error('Error getting KYC requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

