const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractText } = require('../controllers/ocrController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup — store uploaded files in /uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `ocr_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are accepted.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/ocr/extract
 * Upload an identity document image (field: document) → returns OCR text + structured data
 */
router.post('/extract', upload.single('document'), extractText);

module.exports = router;
