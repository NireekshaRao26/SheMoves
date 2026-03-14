const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const User = require('../models/User');
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
            address: extractedData.address || '',
            gender: extractedData.gender || '',
            fatherName: extractedData.fatherName || '',
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

        // Automatically update the user's profile with newly extracted data if they don't have it
        try {
            const user = await User.findById(req.user.userId);
            if (user) {
                let profileUpdated = false;
                if (!user.profile) user.profile = {};

                // Only overwrite if the profile field is empty but we extracted something
                if (mappedData.dob && !user.profile.dob) { user.profile.dob = mappedData.dob; profileUpdated = true; }
                if (mappedData.gender && !user.profile.gender) { user.profile.gender = mappedData.gender; profileUpdated = true; }
                if (mappedData.address && !user.profile.address) { user.profile.address = mappedData.address; profileUpdated = true; }
                if (mappedData.fatherName && !user.profile.fatherName) { user.profile.fatherName = mappedData.fatherName; profileUpdated = true; }
                
                if (extractedData.aadhaarNumber && !user.profile.aadhaarNumber) { user.profile.aadhaarNumber = extractedData.aadhaarNumber; profileUpdated = true; }
                if (extractedData.panNumber && !user.profile.panNumber) { user.profile.panNumber = extractedData.panNumber; profileUpdated = true; }
                
                // If name is found but user.name was generic, maybe update user name?
                // Currently keeping it simple and just updating 'profile'
                
                if (profileUpdated) {
                    await user.save();
                    console.log('User profile auto-updated from document upload');
                }
            }
        } catch (profileErr) {
            console.error('Error auto-updating user profile:', profileErr);
            // Non-fatal error, let the upload succeed
        }

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
