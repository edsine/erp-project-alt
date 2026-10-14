const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip'
  ];

  // Some browsers send zip files as application/octet-stream, so also allow by extension
  const isZip = path.extname(file.originalname).toLowerCase() === '.zip';

  if (allowedTypes.includes(file.mimetype) || isZip) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, XLS, JPG, PNG, TXT, and ZIP files are allowed.'), false);
  }
};

// Wrap a multer handler so upload errors return a 400 JSON response
// instead of falling through to Express's default 500 HTML error page
const withErrorHandling = (handler) => (req, res, next) => {
  handler(req, res, (err) => {
    if (!err) return next();
    const message = err instanceof multer.MulterError
      ? (err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 500MB.' : err.message)
      : err.message;
    return res.status(400).json({ success: false, message });
  });
};

// Create separate upload configurations
const uploadSingle = withErrorHandling(multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
}).single('file'));  // For single file upload

const uploadMultiple = withErrorHandling(multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
}).array('files'));  // For multiple file uploads - note the field name 'files'

module.exports = {
  uploadSingle,
  uploadMultiple
};