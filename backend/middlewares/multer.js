import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.memoryStorage();

// Enhanced file filter with strict validation
const fileFilter = (req, file, cb) => {
    // Allowed MIME types
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
    ];

    // Allowed extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Double-check: MIME type AND extension must match
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        // Additional check: ensure extension matches MIME type
        const isImageMime = file.mimetype.startsWith('image/');
        const isImageExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        const isPdfMime = file.mimetype === 'application/pdf';
        const isPdfExt = ext === '.pdf';
        
        if ((isImageMime && isImageExt) || (isPdfMime && isPdfExt)) {
            cb(null, true);
        } else {
            cb(new Error('File extension does not match MIME type. Possible attack detected.'), false);
        }
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP images and PDF files are allowed.'), false);
    }
};

// Separate limits for images and documents
const imageLimits = {
    fileSize: 5 * 1024 * 1024, // 5MB for images
    files: 1
};

const documentLimits = {
    fileSize: 10 * 1024 * 1024, // 10MB for PDFs (resumes)
    files: 1
};

const multiDocumentLimits = {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files at once
};

// Configure multer with enhanced security
const imageUpload = multer({
    storage,
    limits: imageLimits,
    fileFilter
});

const documentUpload = multer({
    storage,
    limits: documentLimits,
    fileFilter
});

const multiDocumentUpload = multer({
    storage,
    limits: multiDocumentLimits,
    fileFilter
});

// Generate secure random filename
export const generateSecureFilename = (originalname) => {
    const ext = path.extname(originalname);
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${randomName}${ext}`;
};

// Single file upload for images (profile photos, company logos)
export const singleUpload = imageUpload.single("file");

// Single file upload for documents (resumes, PDFs)
export const singleDocumentUpload = documentUpload.single("file");

// Multiple file upload for verification documents (GST, PAN, etc.)
export const multipleUpload = multiDocumentUpload.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'registrationCertificate', maxCount: 1 }
]);

// Export the document upload instance for flexible usage
export const upload = documentUpload;