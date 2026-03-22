import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads/kyc';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: kyc_userId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kyc_${req.user._id}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter to validate file type and size
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  // Allowed extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileMime = file.mimetype;

  // Check MIME type
  if (!allowedMimes.includes(fileMime)) {
    return cb(new Error(`Invalid file type: ${fileMime}. Only PDF, JPG, and PNG files are allowed.`), false);
  }

  // Check file extension
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error(`Invalid file extension: ${fileExtension}. Only .pdf, .jpg, .jpeg, .png are allowed.`), false);
  }

  // File is valid
  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware to handle upload errors
export const uploadKycDocument = (req, res, next) => {
  const singleUpload = upload.single('document');
  
  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle multer errors
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // Handle custom errors from fileFilter
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

export default uploadKycDocument;
