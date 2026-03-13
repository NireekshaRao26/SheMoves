const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const { processImage } = require('../services/ocrService');

const router = express.Router();

// Multer Setup
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/upload
router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { documentType } = req.body;
        const fileUrl = req.file.path;

        console.log(`Processing ${documentType} document: ${fileUrl}`);

        // Use Tesseract.js OCR for extraction
        const { rawText, extractedData } = await processImage(fileUrl);

        // Map OCR extractedData to the Document model schema
        const mappedData = {
            name: extractedData.name || '',
            dob: extractedData.dateOfBirth || '',
            documentNumber: extractedData.aadhaarNumber || extractedData.panNumber || '',
            address: '',
            gender: '',
            fatherName: '',
            rawText
        };

        console.log('Extracted document data:', mappedData);

        const documentRecord = new Document({
            user: req.user.userId,
            documentType,
            fileUrl,
            extractedData: mappedData
        });

        await documentRecord.save();

        res.status(201).json({
            message: 'Document uploaded and analyzed successfully',
            document: documentRecord
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ message: 'Server error during upload/OCR' });
    }
});

// GET /api/upload (Get user documents)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: 'Server error retrieving documents' });
    }
});

module.exports = router;
